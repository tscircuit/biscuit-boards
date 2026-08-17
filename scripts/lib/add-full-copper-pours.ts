import type {
  CircuitJson,
  PcbBoard,
  PcbCopperPourBRep,
  Point,
} from "circuit-json"

const getBoardOutline = (pcbBoard: PcbBoard): Point[] => {
  if (pcbBoard.outline && pcbBoard.outline.length >= 3) {
    return pcbBoard.outline
  }
  if (pcbBoard.width === undefined || pcbBoard.height === undefined) {
    throw new Error(`PCB board has no usable outline: ${pcbBoard.pcb_board_id}`)
  }

  return [
    {
      x: pcbBoard.center.x - pcbBoard.width / 2,
      y: pcbBoard.center.y - pcbBoard.height / 2,
    },
    {
      x: pcbBoard.center.x + pcbBoard.width / 2,
      y: pcbBoard.center.y - pcbBoard.height / 2,
    },
    {
      x: pcbBoard.center.x + pcbBoard.width / 2,
      y: pcbBoard.center.y + pcbBoard.height / 2,
    },
    {
      x: pcbBoard.center.x - pcbBoard.width / 2,
      y: pcbBoard.center.y + pcbBoard.height / 2,
    },
  ]
}

export const addFullCopperPours = (circuitJson: CircuitJson): CircuitJson => {
  const pcbBoards = circuitJson.filter(
    (element): element is PcbBoard => element.type === "pcb_board",
  )
  if (pcbBoards.length === 0) {
    throw new Error("Circuit contains no PCB boards")
  }

  const fabricationCircuitJson: CircuitJson = circuitJson.filter(
    (element) => element.type !== "pcb_copper_pour",
  )
  for (const pcbBoard of pcbBoards) {
    const boardOutline = getBoardOutline(pcbBoard)
    for (const layer of ["top", "bottom"] as const) {
      const copperPour: PcbCopperPourBRep = {
        type: "pcb_copper_pour",
        pcb_copper_pour_id: `postprocessed_${pcbBoard.pcb_board_id}_${layer}`,
        shape: "brep",
        layer,
        brep_shape: {
          outer_ring: { vertices: boardOutline },
          inner_rings: [],
        },
        source_net_id: "source_net_postprocessed_copper_clad",
        covered_with_solder_mask: false,
      }
      fabricationCircuitJson.push(copperPour)
    }
  }

  return fabricationCircuitJson
}
