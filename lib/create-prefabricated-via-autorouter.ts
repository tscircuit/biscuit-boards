import type { SimpleRouteJson } from "@tscircuit/core"
import type { AutorouterConfig } from "@tscircuit/props"
import {
  BiscuitBoardAutorouter,
  type BiscuitBoardAutorouterOptions,
  createBiscuitBoardAutorouter,
} from "./biscuit-board-autorouter"

const ROUTER_COORDINATE_SCALE = 1e6
const ROUTER_COORDINATE_EPSILON = 1e-7

const normalizeCoordinate = (value: number) =>
  Math.round(value * ROUTER_COORDINATE_SCALE) / ROUTER_COORDINATE_SCALE

const normalizePoint = <T extends { x: number; y: number }>(point: T): T => {
  const x = normalizeCoordinate(point.x)
  const y = normalizeCoordinate(point.y)
  if (
    Math.abs(x - point.x) <= ROUTER_COORDINATE_EPSILON &&
    Math.abs(y - point.y) <= ROUTER_COORDINATE_EPSILON
  ) {
    return point
  }
  return { ...point, x, y }
}

/**
 * The Biscuit Board router keys graph nodes at six decimal places. Normalize
 * electrical terminals to that same precision before graph construction so
 * imported footprints with sub-micron coordinate noise remain recognizable as
 * terminals inside their pads. Obstacle geometry stays untouched so existing
 * routing channels and clearance calculations retain their original precision.
 */
const normalizeRouterTerminalCoordinates = (
  input: SimpleRouteJson,
): SimpleRouteJson => {
  let inputChanged = false
  const connections = input.connections.map((connection) => {
    const pointsToConnect = connection.pointsToConnect.map(normalizePoint)
    if (
      pointsToConnect.every(
        (point, pointIndex) => point === connection.pointsToConnect[pointIndex],
      )
    ) {
      return connection
    }
    inputChanged = true
    return { ...connection, pointsToConnect }
  })
  return inputChanged ? { ...input, connections } : input
}

export interface PrefabricatedViaAutorouterConfig {
  width: number
  height: number
  edgeClearance: number
  options?: BiscuitBoardAutorouterOptions
  minimumTraceWidth?: number
  nominalTraceWidth: number
  reservedObstacles?: SimpleRouteJson["obstacles"]
}

/**
 * Builds the board-bounded autorouter configuration shared by prefabricated
 * clads. Layer changes are still restricted to net-assignable vias by the
 * BiscuitBoard autorouter; this helper only supplies the board-specific bounds
 * and trace-width policy.
 */
export const createPrefabricatedViaAutorouter = ({
  width,
  height,
  edgeClearance,
  options,
  minimumTraceWidth,
  nominalTraceWidth,
  reservedObstacles = [],
}: PrefabricatedViaAutorouterConfig): AutorouterConfig => ({
  ...createBiscuitBoardAutorouter(options),
  algorithmFn: async (input: SimpleRouteJson) => {
    const normalizedInput = normalizeRouterTerminalCoordinates(input)
    const maximumTraceWidth = Math.max(
      normalizedInput.minTraceWidth,
      normalizedInput.nominalTraceWidth ?? 0,
      minimumTraceWidth ?? 0,
      nominalTraceWidth,
      ...normalizedInput.connections.map(
        (connection) => connection.width ?? normalizedInput.minTraceWidth,
      ),
    )

    return new BiscuitBoardAutorouter(
      {
        ...normalizedInput,
        minTraceWidth: Math.max(
          normalizedInput.minTraceWidth,
          minimumTraceWidth ?? 0,
        ),
        nominalTraceWidth: Math.max(
          normalizedInput.nominalTraceWidth ?? 0,
          nominalTraceWidth,
          minimumTraceWidth ?? 0,
        ),
        connections: normalizedInput.connections.map((connection) => {
          const width = Math.max(
            connection.width ?? normalizedInput.minTraceWidth,
            minimumTraceWidth ?? 0,
          )
          return {
            ...connection,
            width,
            nominalTraceWidth: Math.max(
              connection.nominalTraceWidth ?? 0,
              nominalTraceWidth,
              width,
            ),
          }
        }),
        obstacles: [...normalizedInput.obstacles, ...reservedObstacles],
        // The clad DRC measures clearance from the copper edge, while this
        // router bound constrains trace centerlines.
        minBoardEdgeClearance: edgeClearance + maximumTraceWidth / 2,
        bounds: {
          minX: -width / 2,
          maxX: width / 2,
          minY: -height / 2,
          maxY: height / 2,
        },
      },
      options,
    )
  },
})
