import type {
  AnyCircuitElement,
  CircuitJson,
  PcbBoard,
  SourceBoard,
  SourceGroup,
} from "circuit-json"

export interface IndividualBoardCircuit {
  circuitJson: CircuitJson
  fileStem: string
  title: string
}

const getStringProperty = (element: AnyCircuitElement, key: string) => {
  const value = (element as unknown as Record<string, unknown>)[key]
  return typeof value === "string" ? value : undefined
}

const slugify = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

const getDescendantGroups = (
  sourceGroups: SourceGroup[],
  rootSourceGroupId: string,
) => {
  const sourceGroupIds = new Set([rootSourceGroupId])
  let foundDescendant = true

  while (foundDescendant) {
    foundDescendant = false
    for (const sourceGroup of sourceGroups) {
      if (
        sourceGroup.parent_source_group_id &&
        sourceGroupIds.has(sourceGroup.parent_source_group_id) &&
        !sourceGroupIds.has(sourceGroup.source_group_id)
      ) {
        sourceGroupIds.add(sourceGroup.source_group_id)
        foundDescendant = true
      }
    }
  }

  return sourceGroups.filter((sourceGroup) =>
    sourceGroupIds.has(sourceGroup.source_group_id),
  )
}

/**
 * Separates the PCB content belonging to each board from a panel circuit.
 * Panel routing primitives are deliberately left out because they do not
 * belong to any board subcircuit.
 */
export const extractIndividualBoardCircuits = (
  circuitJson: CircuitJson,
): IndividualBoardCircuit[] => {
  const pcbBoards = circuitJson.filter(
    (element): element is PcbBoard => element.type === "pcb_board",
  )
  const sourceBoards = circuitJson.filter(
    (element): element is SourceBoard => element.type === "source_board",
  )
  const sourceGroups = circuitJson.filter(
    (element): element is SourceGroup => element.type === "source_group",
  )
  const sourceBoardsById = new Map(
    sourceBoards.map((sourceBoard) => [
      sourceBoard.source_board_id,
      sourceBoard,
    ]),
  )
  const sourceGroupsById = new Map(
    sourceGroups.map((sourceGroup) => [
      sourceGroup.source_group_id,
      sourceGroup,
    ]),
  )
  const indexWidth = Math.max(2, String(pcbBoards.length).length)

  return pcbBoards.map((pcbBoard, index) => {
    const sourceBoardId = getStringProperty(pcbBoard, "source_board_id")
    const sourceBoard = sourceBoardId
      ? sourceBoardsById.get(sourceBoardId)
      : undefined
    const rootSourceGroup = sourceBoard
      ? sourceGroupsById.get(sourceBoard.source_group_id)
      : undefined
    const descendantGroups = rootSourceGroup
      ? getDescendantGroups(sourceGroups, rootSourceGroup.source_group_id)
      : []
    const sourceGroupIds = new Set(
      descendantGroups.map((sourceGroup) => sourceGroup.source_group_id),
    )
    const subcircuitIds = new Set(
      descendantGroups.flatMap((sourceGroup) =>
        sourceGroup.subcircuit_id ? [sourceGroup.subcircuit_id] : [],
      ),
    )
    const title =
      sourceBoard?.title ?? rootSourceGroup?.name ?? pcbBoard.pcb_board_id
    const safeTitle =
      slugify(title) || slugify(pcbBoard.pcb_board_id) || "board"
    const fileStem = `${String(index + 1).padStart(indexWidth, "0")}-${safeTitle}`

    const boardCircuitJson = circuitJson.filter((element) => {
      if (element.type === "pcb_board") {
        return element.pcb_board_id === pcbBoard.pcb_board_id
      }
      if (element.type === "source_board") {
        return element.source_board_id === sourceBoard?.source_board_id
      }
      if (element.type === "pcb_panel") return false

      const sourceGroupId = getStringProperty(element, "source_group_id")
      const subcircuitId = getStringProperty(element, "subcircuit_id")
      return (
        (sourceGroupId !== undefined && sourceGroupIds.has(sourceGroupId)) ||
        (subcircuitId !== undefined && subcircuitIds.has(subcircuitId))
      )
    })

    return { circuitJson: boardCircuitJson, fileStem, title }
  })
}
