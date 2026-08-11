import type { CircuitJson, PcbTrace, PcbVia } from "circuit-json"
import { convertCircuitJsonToLbrn } from "circuit-json-to-lbrn"
import {
  CutSetting,
  type LightBurnBaseElement,
  type LightBurnProject,
  ShapeBase,
  ShapeGroup,
  type SplitLightBurnProjectFile,
  splitLightBurnProjectByCutSetting,
} from "lbrnts"
import { createLensDistortedLightBurnProject } from "./lightburn-lens-distortion"

export const BISCUIT_BOARD_LIGHTBURN_COPPER_MARGIN_MM = 0.5

const LIGHTBURN_LAYER_INDEX = {
  topCopper: 0,
  throughBoard: 2,
  topPads: 3,
  topCopperAblation: 6,
} as const

const VIA_POSITION_EPSILON_MM = 0.001

export interface BiscuitBoardLightburnOptions {
  /** Width of the copper-ablation band outside routed top copper. */
  copperAblationMargin?: number
}

export interface BiscuitBoardLightburnArtifacts {
  fabricationCircuitJson: CircuitJson
  project: LightBurnProject
  lensDistortionProject: LightBurnProject
  layerFiles: SplitLightBurnProjectFile[]
}

const getUsedViaOwners = (circuitJson: CircuitJson) => {
  const vias = circuitJson.filter(
    (element): element is PcbVia => element.type === "pcb_via",
  )
  const traces = circuitJson.filter(
    (element): element is PcbTrace => element.type === "pcb_trace",
  )
  const viaIds = new Set(vias.map((via) => via.pcb_via_id))
  const owners = new Map<string, string>()

  for (const trace of traces) {
    const connectedIds =
      (trace as PcbTrace & { connectsTo?: string[] }).connectsTo ?? []

    for (const connectedId of connectedIds) {
      if (viaIds.has(connectedId)) owners.set(connectedId, trace.pcb_trace_id)
    }

    for (const routePoint of trace.route) {
      if (routePoint.route_type !== "via") continue

      const matchingVia = vias.find(
        (via) =>
          Math.abs(via.x - routePoint.x) <= VIA_POSITION_EPSILON_MM &&
          Math.abs(via.y - routePoint.y) <= VIA_POSITION_EPSILON_MM,
      )
      if (matchingVia) owners.set(matchingVia.pcb_via_id, trace.pcb_trace_id)
    }
  }

  return owners
}

const neutralizePlatedHoleDrills = (
  element: CircuitJson[number],
): CircuitJson[number] => {
  const platedHole = { ...element } as CircuitJson[number] &
    Record<string, unknown>

  for (const field of [
    "hole_diameter",
    "hole_width",
    "hole_height",
    "drill_diameter",
  ]) {
    if (field in platedHole) platedHole[field] = 0
  }

  return platedHole
}

/**
 * Produces fabrication input that cannot ask LightBurn to drill or cut holes.
 * Unused prefabricated vias are omitted; used vias remain as solid copper pads
 * associated with their routed trace so the surrounding copper is ablated.
 */
export const prepareCircuitJsonForBiscuitBoardLightburn = (
  circuitJson: CircuitJson,
): CircuitJson => {
  const usedViaOwners = getUsedViaOwners(circuitJson)

  return circuitJson.flatMap((element): CircuitJson => {
    if (element.type === "pcb_hole" || element.type === "pcb_cutout") return []

    if (element.type === "pcb_via") {
      const ownerTraceId = usedViaOwners.get(element.pcb_via_id)
      if (!ownerTraceId) return []

      return [
        {
          ...element,
          hole_diameter: 0,
          pcb_trace_id: ownerTraceId,
        },
      ]
    }

    if (element.type === "pcb_plated_hole") {
      return [neutralizePlatedHoleDrills(element)]
    }

    return [element]
  })
}

const removeCutLayerFromChildren = (
  children: LightBurnBaseElement[],
  cutIndex: number,
): LightBurnBaseElement[] =>
  children.flatMap((child) => {
    if (child instanceof CutSetting && child.index === cutIndex) return []

    if (child instanceof ShapeGroup) {
      if (child.cutIndex === cutIndex) return []
      child.children = removeCutLayerFromChildren(child.children, cutIndex)
      return child.children.length > 0 ? [child] : []
    }

    if (child instanceof ShapeBase && child.cutIndex === cutIndex) return []
    return [child]
  })

const stripThroughBoardOperations = (project: LightBurnProject) => {
  project.children = removeCutLayerFromChildren(
    project.children,
    LIGHTBURN_LAYER_INDEX.throughBoard,
  )
}

const renameFabricationLayers = (project: LightBurnProject) => {
  for (const child of project.children) {
    if (!(child instanceof CutSetting)) continue

    if (child.index === LIGHTBURN_LAYER_INDEX.topCopper) {
      child.name = "Ablate Top Copper Outline"
    }
    if (child.index === LIGHTBURN_LAYER_INDEX.topPads) {
      child.name = "Ablate Top Pads"
    }
    if (child.index === LIGHTBURN_LAYER_INDEX.topCopperAblation) {
      child.name = "Ablate Around Top Copper"
    }
  }
}

const getBoardOrigin = (circuitJson: CircuitJson) => {
  const board = circuitJson.find((element) => element.type === "pcb_board")
  if (!board || board.width === undefined || board.height === undefined) {
    return undefined
  }

  return {
    x: board.width / 2 - board.center.x,
    y: board.height / 2 - board.center.y,
  }
}

export const createBiscuitBoardLightburnArtifacts = async (
  circuitJson: CircuitJson,
  options: BiscuitBoardLightburnOptions = {},
): Promise<BiscuitBoardLightburnArtifacts> => {
  const copperAblationMargin =
    options.copperAblationMargin ?? BISCUIT_BOARD_LIGHTBURN_COPPER_MARGIN_MM
  if (copperAblationMargin < 0) {
    throw new Error("copperAblationMargin must be zero or greater")
  }

  const fabricationCircuitJson =
    prepareCircuitJsonForBiscuitBoardLightburn(circuitJson)
  const boardOrigin = getBoardOrigin(fabricationCircuitJson)
  const project = await convertCircuitJsonToLbrn(fabricationCircuitJson, {
    includeLayers: ["top"],
    includeCopper: true,
    includeSoldermask: true,
    includeCopperCutFill: true,
    copperCutFillMargin: copperAblationMargin,
    clipCopperCutFillToBoardOutline: true,
    includeHolePunch: false,
    includeSoldermaskAblation: false,
    includeSoldermaskCure: false,
    includeOxidationCleaningLayer: false,
    includeSilkscreen: false,
    traceMargin: 0,
    origin: boardOrigin,
  })

  stripThroughBoardOperations(project)
  renameFabricationLayers(project)

  const lensDistortionProject = createLensDistortedLightBurnProject(
    project,
    boardOrigin ?? { x: 0, y: 0 },
  )

  const layerFiles = splitLightBurnProjectByCutSetting(project).filter(
    (file) => file.shapeCount > 0,
  )

  return {
    fabricationCircuitJson,
    project,
    lensDistortionProject,
    layerFiles,
  }
}
