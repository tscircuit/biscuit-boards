import { generateBiscuitBoardHypergraph } from "@tscircuit/biscuit-board-autorouter"
import { Circuit, type SimpleRouteJson } from "@tscircuit/core"
import {
  BOOSTERPACK_SWD_RESERVED_ROUTING_OBSTACLES,
  Stm32c071DisplayBoosterPackClad,
} from "../examples/stm32c071-display-boosterpack"
import {
  BOOSTERPACK_CLAD_HEIGHT,
  BOOSTERPACK_CLAD_VIA_POSITIONS,
  BOOSTERPACK_CLAD_WIDTH,
} from "../lib/BoosterPackClad"
import { createPrefabricatedViaAutorouter } from "../lib/create-prefabricated-via-autorouter"

const routeOrder = (process.env.ROUTE_ORDER ?? "signal_longest_first") as
  | "input"
  | "longest_first"
  | "shortest_first"
  | "signal_longest_first"
const routeSwdAndBulk = process.env.ROUTE_SWD_AND_BULK !== "0"

const options = {
  gridClearance: Number(process.env.GRID_CLEARANCE ?? 0.125),
  gridPitch: Number(process.env.GRID_PITCH ?? 1),
  maxBlockersPerSearch: Number(process.env.MAX_BLOCKERS ?? 128),
  maxRipsPerRoute: Number(process.env.MAX_RIPS_PER_ROUTE ?? 1_000),
  maxSearchStates: 2_000_000,
  maxTotalRips: Number(process.env.MAX_TOTAL_RIPS ?? 10_000),
  routeOrder,
}

let capturedInput: SimpleRouteJson | undefined
const autorouter = createPrefabricatedViaAutorouter({
  width: BOOSTERPACK_CLAD_WIDTH,
  height: BOOSTERPACK_CLAD_HEIGHT,
  edgeClearance: 0.2,
  options,
  minimumTraceWidth: 0.2,
  nominalTraceWidth: 0.3,
  reservedObstacles: routeSwdAndBulk
    ? BOOSTERPACK_SWD_RESERVED_ROUTING_OBSTACLES
    : [],
})
const route = autorouter.algorithmFn
if (!route) throw new Error("Expected a local autorouter algorithm")
autorouter.algorithmFn = async (input) => {
  capturedInput = input
  return route(input)
}

const circuit = new Circuit()
circuit.add(
  <Stm32c071DisplayBoosterPackClad
    autorouter={autorouter}
    routeSwdAndBulk={routeSwdAndBulk}
  />,
)
await circuit.renderUntilSettled()

if (!capturedInput) throw new Error("Autorouter input was not captured")
const prepared = generateBiscuitBoardHypergraph(capturedInput, options)
const output = circuit.getCircuitJson()
const routedTraces = output.filter((element) => element.type === "pcb_trace")
const usedViaPositions = new Set(
  routedTraces.flatMap((trace) =>
    trace.route
      .filter((point) => point.route_type === "via")
      .map((point) => `${point.x.toFixed(3)},${point.y.toFixed(3)}`),
  ),
)
const errors = output
  .filter((element) => element.type.endsWith("error"))
  .map((element) => ({
    type: element.type,
    message: "message" in element ? element.message : undefined,
  }))
const failedRouteId = errors
  .flatMap((error) => error.message?.match(/"([^"]+)"/)?.[1] ?? [])
  .at(0)
const failedDemand = prepared.demands.find(
  (demand) => demand.routeId === failedRouteId,
)
const failedConnection = capturedInput.connections.find(
  (connection) =>
    connection.name === failedRouteId ||
    connection.name === failedRouteId?.split(":")[0],
)
const failedConnectionSegments = capturedInput.connections.filter(
  (connection) =>
    failedRouteId !== undefined &&
    connection.name.startsWith(failedRouteId.split(":")[0]!),
)
const describeAdjacency = (nodeIndex: number | undefined) =>
  nodeIndex === undefined
    ? []
    : prepared.adjacency[nodeIndex]!.map(({ edgeId, toNode }) => ({
        edgeId,
        kind: prepared.edges[edgeId]!.kind,
        blockers:
          prepared.edges[edgeId]!.kind === "trace"
            ? prepared.edges[edgeId]!.blockingObstacleIndexes
            : [],
        to: prepared.nodes[toNode],
      })).slice(0, 8)
const failedBlockerIndexes = failedDemand
  ? new Set(
      [failedDemand.sourceNode, failedDemand.targetNode].flatMap((nodeIndex) =>
        prepared.adjacency[nodeIndex]!.flatMap(({ edgeId }) =>
          prepared.edges[edgeId]!.kind === "trace"
            ? prepared.edges[edgeId]!.blockingObstacleIndexes
            : [],
        ),
      ),
    )
  : new Set<number>()

console.log(
  JSON.stringify(
    {
      board: {
        width: BOOSTERPACK_CLAD_WIDTH,
        height: BOOSTERPACK_CLAD_HEIGHT,
      },
      routeSwdAndBulk,
      routeOrder,
      candidateViaCount: BOOSTERPACK_CLAD_VIA_POSITIONS.length,
      usedViaCount: usedViaPositions.size,
      usedViaPositions: [...usedViaPositions].sort(),
      errors,
      reservedSwdRoutes: routedTraces
        .filter(
          (trace) =>
            trace.source_trace_id === "source_trace_26" ||
            trace.source_trace_id === "source_trace_27",
        )
        .map((trace) => ({
          sourceTraceId: trace.source_trace_id,
          route: trace.route,
        })),
      graph: {
        nodes: prepared.nodes.length,
        edges: prepared.edges.length,
        failedDemandAdjacency: failedDemand
          ? {
              source: describeAdjacency(failedDemand.sourceNode),
              target: describeAdjacency(failedDemand.targetNode),
            }
          : undefined,
        failedConnection,
        failedConnectionSegments,
        failedBlockers: [...failedBlockerIndexes].map((index) => ({
          index,
          obstacle: capturedInput!.obstacles[index],
        })),
        demandCount: prepared.demands.length,
      },
    },
    null,
    2,
  ),
)
