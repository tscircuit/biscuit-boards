import {
  AutoroutingPipelineSolver8,
  type SimpleRouteJson as CapacitySimpleRouteJson,
} from "@tscircuit/capacity-autorouter"
import type {
  AutorouterCompleteEvent,
  AutorouterErrorEvent,
  AutorouterProgressEvent,
  GenericLocalAutorouter,
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "@tscircuit/core"
import type { AutorouterConfig } from "@tscircuit/props"

type EventHandlers = {
  complete: Array<(event: AutorouterCompleteEvent) => void>
  error: Array<(event: AutorouterErrorEvent) => void>
  progress: Array<(event: AutorouterProgressEvent) => void>
}

export interface BiscuitBoardAutorouterOptions {
  effort?: number
}

/**
 * Adapts the standalone capacity autorouter's fixed-via Pipeline 8 to
 * tscircuit's local `algorithmFn` contract.
 *
 * Pipeline 8 treats every multi-layer obstacle marked `netIsAssignable` as a
 * prefabricated via. Its hypergraph pathing stage uses rip-and-replace and its
 * output validator rejects layer changes anywhere except those fixed vias.
 */
export class BiscuitBoardAutorouter implements GenericLocalAutorouter {
  isRouting = false
  readonly solver: AutoroutingPipelineSolver8

  private traces?: SimplifiedPcbTrace[]
  private readonly handlers: EventHandlers = {
    complete: [],
    error: [],
    progress: [],
  }

  constructor(
    public readonly input: SimpleRouteJson,
    options: BiscuitBoardAutorouterOptions = {},
  ) {
    this.solver = new AutoroutingPipelineSolver8(
      input as CapacitySimpleRouteJson,
      {
        effort: options.effort ?? 2,
        cacheProvider: null,
      },
    )
  }

  solveSync(): SimplifiedPcbTrace[] {
    if (this.traces) return this.traces

    this.solver.solve()
    if (this.solver.failed) {
      throw new Error(this.solver.error ?? "BiscuitBoard autorouting failed")
    }

    this.traces =
      this.solver.getOutputSimplifiedPcbTraces() as SimplifiedPcbTrace[]
    return this.traces
  }

  getOutputSimpleRouteJson(): SimpleRouteJson | undefined {
    if (!this.traces) return undefined
    return {
      ...this.input,
      traces: this.traces,
    }
  }

  start(): void {
    if (this.isRouting) return
    this.isRouting = true

    queueMicrotask(() => {
      if (!this.isRouting) return
      try {
        const traces = this.solveSync()
        for (const handler of this.handlers.complete) {
          handler({ type: "complete", traces })
        }
      } catch (cause) {
        const error = cause instanceof Error ? cause : new Error(String(cause))
        for (const handler of this.handlers.error) {
          handler({ type: "error", error })
        }
      } finally {
        this.isRouting = false
      }
    })
  }

  stop(): void {
    this.isRouting = false
  }

  on(
    event: "complete",
    callback: (event: AutorouterCompleteEvent) => void,
  ): void
  on(event: "error", callback: (event: AutorouterErrorEvent) => void): void
  on(
    event: "progress",
    callback: (event: AutorouterProgressEvent) => void,
  ): void
  on(
    event: "complete" | "error" | "progress",
    callback:
      | ((event: AutorouterCompleteEvent) => void)
      | ((event: AutorouterErrorEvent) => void)
      | ((event: AutorouterProgressEvent) => void),
  ): void {
    if (event === "complete") {
      this.handlers.complete.push(
        callback as (event: AutorouterCompleteEvent) => void,
      )
    } else if (event === "error") {
      this.handlers.error.push(
        callback as (event: AutorouterErrorEvent) => void,
      )
    } else {
      this.handlers.progress.push(
        callback as (event: AutorouterProgressEvent) => void,
      )
    }
  }
}

export const createBiscuitBoardAutorouter = (
  options: BiscuitBoardAutorouterOptions = {},
): AutorouterConfig => ({
  local: true,
  groupMode: "subcircuit",
  algorithmFn: async (input: SimpleRouteJson) =>
    new BiscuitBoardAutorouter(input, options),
})
