import type { SimpleRouteJson } from "@tscircuit/core"
import type { AutorouterConfig } from "@tscircuit/props"
import {
  BiscuitBoardAutorouter,
  type BiscuitBoardAutorouterOptions,
  createBiscuitBoardAutorouter,
} from "./biscuit-board-autorouter"

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
    const maximumTraceWidth = Math.max(
      input.minTraceWidth,
      input.nominalTraceWidth ?? 0,
      minimumTraceWidth ?? 0,
      nominalTraceWidth,
      ...input.connections.map(
        (connection) => connection.width ?? input.minTraceWidth,
      ),
    )

    return new BiscuitBoardAutorouter(
      {
        ...input,
        minTraceWidth: Math.max(input.minTraceWidth, minimumTraceWidth ?? 0),
        nominalTraceWidth: Math.max(
          input.nominalTraceWidth ?? 0,
          nominalTraceWidth,
          minimumTraceWidth ?? 0,
        ),
        connections: input.connections.map((connection) => {
          const width = Math.max(
            connection.width ?? input.minTraceWidth,
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
        obstacles: [...input.obstacles, ...reservedObstacles],
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
