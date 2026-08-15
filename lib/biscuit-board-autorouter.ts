import { createBiscuitBoardAutorouter as createBundledBiscuitBoardAutorouter } from "@tscircuit/biscuit-board-autorouter"
import type { AutorouterConfig } from "@tscircuit/props"

export {
  BiscuitBoardAutorouter,
  BiscuitBoardRoutingPipelineSolver,
} from "@tscircuit/biscuit-board-autorouter"

export interface BiscuitBoardAutorouterOptions {
  routeOrder?:
    | "adaptive"
    | "longest_first"
    | "shortest_first"
    | "signal_longest_first"
    | "input"
  gridPitch?: number
  gridClearance?: number
  respectObstacleRotationInGraph?: boolean
  viaTransitionCost?: number
  ripCost?: number
  crossingCost?: number
  historyIncrement?: number
  maxBlockersPerSearch?: number
  maxRipsPerRoute?: number
  maxTotalRips?: number
  maxSearchStates?: number
  expansionsPerStep?: number
  expandTraces?: boolean
}

export const createBiscuitBoardAutorouter = (
  options: BiscuitBoardAutorouterOptions = {},
): AutorouterConfig => createBundledBiscuitBoardAutorouter(options)
