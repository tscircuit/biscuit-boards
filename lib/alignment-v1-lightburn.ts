import type { CircuitJson } from "circuit-json"
import {
  CutSetting,
  LightBurnProject,
  ShapePath,
  type SplitLightBurnProjectFile,
  splitLightBurnProjectByCutSetting,
} from "lbrnts"

const TOOLING_LAYER_INDEX = 30
const VIA_POINTS_LAYER_INDEX = 6
const POINT_RADIUS_MM = 0.08
const CIRCLE_SEGMENTS = 16

export const ALIGNMENT_V1_LIGHTBURN_SVG_OPTIONS = {
  margin: 2,
  width: 1400,
  height: 900,
  defaultStrokeWidth: 0.25,
} as const

interface Point {
  x: number
  y: number
}

const TOOLING_VIAS: readonly Point[] = [
  { x: -31.5, y: -21.5 },
  { x: -31.5, y: 21.5 },
  { x: 32.5, y: 22 },
  { x: 32.5, y: -22 },
  { x: 26.75, y: 23.5 },
]

const pointsMatch = (first: Point, second: Point) =>
  first.x === second.x && first.y === second.y

const pointIsIn = (point: Point, positions: readonly Point[]) =>
  positions.some((position) => pointsMatch(point, position))

export interface AlignmentV1LightBurnArtifacts {
  project: LightBurnProject
  layerFiles: SplitLightBurnProjectFile[]
  toolingPoints: Point[]
  viaPoints: Point[]
}

const getBoardOrigin = (circuitJson: CircuitJson): Point => {
  const board = circuitJson.find((element) => element.type === "pcb_board")
  if (!board || board.width === undefined || board.height === undefined) {
    throw new Error("alignment_v1 Circuit JSON must contain a sized PCB board")
  }

  return {
    x: board.width / 2 - board.center.x,
    y: board.height / 2 - board.center.y,
  }
}

const createPointMark = ({
  point,
  origin,
  cutIndex,
}: {
  point: Point
  origin: Point
  cutIndex: number
}) => {
  const verts = Array.from({ length: CIRCLE_SEGMENTS }, (_, index) => {
    const angle = (index / CIRCLE_SEGMENTS) * Math.PI * 2
    return {
      x: point.x + origin.x + Math.cos(angle) * POINT_RADIUS_MM,
      y: point.y + origin.y + Math.sin(angle) * POINT_RADIUS_MM,
    }
  })

  return new ShapePath({
    cutIndex,
    verts,
    prims: verts.map(() => ({ type: 0 })),
    isClosed: true,
  })
}

export const createAlignmentV1LightBurnArtifacts = (
  circuitJson: CircuitJson,
): AlignmentV1LightBurnArtifacts => {
  const origin = getBoardOrigin(circuitJson)
  const allViaPoints = circuitJson
    .filter((element) => element.type === "pcb_via")
    .map(({ x, y }) => ({ x, y }))
  const toolingPoints = allViaPoints.filter((point) =>
    pointIsIn(point, TOOLING_VIAS),
  )
  const viaPoints = allViaPoints.filter(
    (point) => !pointIsIn(point, TOOLING_VIAS),
  )

  if (toolingPoints.length !== 5) {
    throw new Error(
      `alignment_v1 LightBurn export requires 5 tooling points; found ${toolingPoints.length}`,
    )
  }

  const project = new LightBurnProject({
    appVersion: "1.7.03",
    formatVersion: "1",
    children: [
      new CutSetting({
        type: "Tool",
        index: TOOLING_LAYER_INDEX,
        name: "T1",
      }),
      new CutSetting({
        type: "Cut",
        index: VIA_POINTS_LAYER_INDEX,
        name: "Via Points",
        speed: 20,
        numPasses: 1,
        frequency: 20_000,
        qPulseWidth: 1,
      }),
      ...toolingPoints.map((point) =>
        createPointMark({ point, origin, cutIndex: TOOLING_LAYER_INDEX }),
      ),
      ...viaPoints.map((point) =>
        createPointMark({ point, origin, cutIndex: VIA_POINTS_LAYER_INDEX }),
      ),
    ],
  })
  const layerFiles = splitLightBurnProjectByCutSetting(project).filter(
    (file) => file.shapeCount > 0,
  )

  return { project, layerFiles, toolingPoints, viaPoints }
}
