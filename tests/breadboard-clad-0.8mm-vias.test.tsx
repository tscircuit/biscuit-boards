import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import {
  BREADBOARD_CLAD_HEIGHT,
  BREADBOARD_CLAD_WIDTH,
  BREADBOARD_COLUMN_COUNT,
  BREADBOARD_TERMINAL_HEADER_POSITIONS,
} from "../lib/breadboard-clad"
import {
  BREADBOARD_08MM_BOTTOM_BANK_ROWS,
  BREADBOARD_08MM_BREAKOUT_TRACE_WIDTH,
  BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET,
  BREADBOARD_08MM_CORNER_VIA_ARM_WIDTH,
  BREADBOARD_08MM_CORNER_VIA_SPACING,
  BREADBOARD_08MM_CORNER_VIA_X_INNER_OFFSET,
  BREADBOARD_08MM_CORNER_VIA_X_OUTER_OFFSET,
  BREADBOARD_08MM_CORNER_VIA_X_OUTWARD_SHIFT,
  BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET,
  BREADBOARD_08MM_CORNER_VIA_Y_OUTER_OFFSET,
  BREADBOARD_08MM_MIN_VIA_EDGE_SPACING,
  BREADBOARD_08MM_ROW_BREAKOUTS,
  BREADBOARD_08MM_ROW_CONNECTIONS,
  BREADBOARD_08MM_TOP_BANK_ROWS,
  BREADBOARD_08MM_VIA_HOLE_DIAMETER,
  BREADBOARD_08MM_VIA_PAD_DIAMETER,
  BREADBOARD_08MM_VIA_POSITIONS,
  BreadboardClad08mmVias,
} from "../lib/breadboard-clad-0.8mm-vias"

const coordinateTolerance = 1e-6
const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

const getMinimumEdgeSpacing = (
  points: Array<{ x: number; y: number }>,
  diameter: number,
) => {
  let minimum = Number.POSITIVE_INFINITY
  for (const [index, point] of points.entries()) {
    for (const other of points.slice(index + 1)) {
      minimum = Math.min(
        minimum,
        Math.hypot(point.x - other.x, point.y - other.y) - diameter,
      )
    }
  }
  return minimum
}

const renderedBreadboardCircuitJson = (async () => {
  const circuit = new Circuit()
  circuit.add(<BreadboardClad08mmVias />)
  await circuit.renderUntilSettled()
  return circuit.getCircuitJson()
})()

test("places separately broken-out 0.8 mm vias in four woven L fields", async () => {
  const circuitJson = await renderedBreadboardCircuitJson
  const board = circuitJson.find((element) => element.type === "pcb_board")
  const platedHoles = circuitJson.filter(
    (element) => element.type === "pcb_plated_hole",
  )
  const vias = circuitJson.filter((element) => element.type === "pcb_via")
  const traces = circuitJson.filter((element) => element.type === "pcb_trace")
  const terminalComponentIds = new Set(
    circuitJson.flatMap((element) =>
      element.type === "source_component" && element.name === "J_TERMINALS"
        ? [element.source_component_id]
        : [],
    ),
  )
  const terminalPortIds = new Set(
    circuitJson.flatMap((element) =>
      element.type === "source_port" &&
      element.source_component_id !== undefined &&
      terminalComponentIds.has(element.source_component_id)
        ? [element.source_port_id]
        : [],
    ),
  )
  const sourceTracesById = new Map(
    circuitJson.flatMap((element) =>
      element.type === "source_trace"
        ? [[element.source_trace_id, element] as const]
        : [],
    ),
  )
  const errorsAndWarnings = circuitJson.filter(
    (element) =>
      element.type.endsWith("error") || element.type.endsWith("warning"),
  )

  expect(board).toMatchObject({
    width: BREADBOARD_CLAD_WIDTH,
    height: BREADBOARD_CLAD_HEIGHT,
    num_layers: 2,
    min_via_hole_diameter: BREADBOARD_08MM_VIA_HOLE_DIAMETER,
    min_via_pad_diameter: BREADBOARD_08MM_VIA_PAD_DIAMETER,
    min_via_hole_edge_to_via_hole_edge_clearance:
      BREADBOARD_08MM_MIN_VIA_EDGE_SPACING,
  })
  expect(platedHoles).toHaveLength(BREADBOARD_TERMINAL_HEADER_POSITIONS.length)
  expect(vias).toHaveLength(32)
  expect(vias).toHaveLength(BREADBOARD_08MM_VIA_POSITIONS.length)
  expect(new Set(vias.map(pointKey))).toEqual(
    new Set(BREADBOARD_08MM_VIA_POSITIONS.map(pointKey)),
  )
  expect(
    vias.every(
      (via) =>
        via.hole_diameter === BREADBOARD_08MM_VIA_HOLE_DIAMETER &&
        via.outer_diameter === BREADBOARD_08MM_VIA_PAD_DIAMETER &&
        via.source_trace_id !== undefined &&
        Math.abs(via.x) >= BREADBOARD_08MM_CORNER_VIA_X_INNER_OFFSET &&
        Math.abs(via.y) >= BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET,
    ),
  ).toBe(true)

  for (const corner of [
    "top_left",
    "top_right",
    "bottom_left",
    "bottom_right",
  ] as const) {
    const cornerVias = BREADBOARD_08MM_VIA_POSITIONS.filter(
      (via) => via.corner === corner,
    )
    expect(cornerVias).toHaveLength(8)
    expect(cornerVias.filter((via) => via.arm === "horizontal")).toHaveLength(6)
    expect(cornerVias.filter((via) => via.arm === "vertical")).toHaveLength(2)
    expect(
      cornerVias.filter((via) => via.breakoutStyle === "woven"),
    ).toHaveLength(4)
    expect(
      cornerVias.filter((via) => via.breakoutStyle === "direct"),
    ).toHaveLength(4)

    const xSign = corner.includes("left") ? -1 : 1
    const ySign = corner.includes("bottom") ? -1 : 1
    const xOutwardShift =
      xSign === -1 || ySign === -1
        ? BREADBOARD_08MM_CORNER_VIA_X_OUTWARD_SHIFT
        : 0

    for (const via of cornerVias) {
      const localX = via.x * xSign
      const localY = via.y * ySign
      expect(localX).toBeGreaterThanOrEqual(
        BREADBOARD_08MM_CORNER_VIA_X_INNER_OFFSET + xOutwardShift,
      )
      expect(localX).toBeLessThanOrEqual(
        BREADBOARD_08MM_CORNER_VIA_X_OUTER_OFFSET + xOutwardShift,
      )
      expect(localY).toBeGreaterThanOrEqual(
        BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET,
      )
      expect(localY).toBeLessThanOrEqual(
        BREADBOARD_08MM_CORNER_VIA_Y_OUTER_OFFSET,
      )
      expect(
        localX <=
          BREADBOARD_08MM_CORNER_VIA_X_INNER_OFFSET +
            xOutwardShift +
            BREADBOARD_08MM_CORNER_VIA_ARM_WIDTH +
            coordinateTolerance ||
          localY <=
            BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET +
              BREADBOARD_08MM_CORNER_VIA_ARM_WIDTH +
              coordinateTolerance,
      ).toBe(true)

      if (via.breakoutStyle === "woven") {
        const weavePoint = via.breakoutRoute[0]!
        expect(weavePoint.x * xSign - localX).toBe(
          BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET,
        )
        expect(weavePoint.y * ySign - localY).toBe(
          BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET,
        )
      }
    }
  }

  const minimumPadEdgeSpacing = getMinimumEdgeSpacing(
    vias,
    BREADBOARD_08MM_VIA_PAD_DIAMETER,
  )
  const minimumDrillEdgeSpacing = getMinimumEdgeSpacing(
    vias,
    BREADBOARD_08MM_VIA_HOLE_DIAMETER,
  )
  expect(BREADBOARD_08MM_CORNER_VIA_SPACING).toBe(3)
  expect(BREADBOARD_08MM_CORNER_VIA_ARM_WIDTH).toBe(3)
  expect(BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET).toBe(
    BREADBOARD_08MM_CORNER_VIA_SPACING / 2,
  )
  expect(minimumPadEdgeSpacing).toBeGreaterThanOrEqual(
    BREADBOARD_08MM_MIN_VIA_EDGE_SPACING - coordinateTolerance,
  )
  expect(minimumDrillEdgeSpacing).toBeGreaterThanOrEqual(
    BREADBOARD_08MM_MIN_VIA_EDGE_SPACING - coordinateTolerance,
  )

  expect(
    vias.every((via) => {
      const sourceTrace =
        via.source_trace_id === undefined
          ? undefined
          : sourceTracesById.get(via.source_trace_id)
      return (
        sourceTrace?.connected_source_port_ids.every(
          (sourcePortId) => !terminalPortIds.has(sourcePortId),
        ) === true
      )
    }),
  ).toBe(true)

  const traceEndpointPairs = traces.flatMap((trace) => {
    const wirePoints = trace.route.filter(
      (point) => point.route_type === "wire",
    )
    return wirePoints.length === 0
      ? []
      : [new Set([pointKey(wirePoints[0]!), pointKey(wirePoints.at(-1)!)])]
  })
  const tracePointSets = traces.flatMap((trace) => {
    const wirePoints = trace.route.filter(
      (point) => point.route_type === "wire",
    )
    return wirePoints.length === 0
      ? []
      : [new Set(wirePoints.map((point) => pointKey(point)))]
  })
  expect(
    BREADBOARD_08MM_VIA_POSITIONS.every((via) =>
      traceEndpointPairs.some(
        (endpoints) =>
          endpoints.has(pointKey(via)) &&
          endpoints.has(pointKey(via.breakoutEnd)),
      ),
    ),
  ).toBe(true)
  expect(
    BREADBOARD_08MM_VIA_POSITIONS.every((via) =>
      tracePointSets.some(
        (points) =>
          points.has(pointKey(via)) &&
          points.has(pointKey(via.breakoutEnd)) &&
          via.breakoutRoute.every((point) => points.has(pointKey(point))),
      ),
    ),
  ).toBe(true)
  expect(
    BREADBOARD_08MM_VIA_POSITIONS.filter(
      (via) => via.breakoutStyle === "woven",
    ).every((via) => via.breakoutRoute.length === 1),
  ).toBe(true)
  expect(
    BREADBOARD_08MM_VIA_POSITIONS.filter(
      (via) => via.breakoutStyle === "direct",
    ).every((via) => via.breakoutRoute.length === 0),
  ).toBe(true)

  const headerPositionKeys = new Set(
    BREADBOARD_TERMINAL_HEADER_POSITIONS.map(pointKey),
  )
  expect(
    BREADBOARD_08MM_VIA_POSITIONS.every((via) =>
      traceEndpointPairs
        .filter((endpoints) => endpoints.has(pointKey(via)))
        .every((endpoints) =>
          [...endpoints].every((endpoint) => !headerPositionKeys.has(endpoint)),
        ),
    ),
  ).toBe(true)
  expect(errorsAndWarnings).toEqual([])
}, 30_000)

test("connects every five-socket strip and breaks both ends out with traces", async () => {
  expect(BREADBOARD_08MM_TOP_BANK_ROWS).toEqual(["A", "B", "C", "D", "E"])
  expect(BREADBOARD_08MM_BOTTOM_BANK_ROWS).toEqual(["F", "G", "H", "I", "J"])
  expect(BREADBOARD_08MM_ROW_CONNECTIONS).toHaveLength(
    BREADBOARD_COLUMN_COUNT * 8,
  )
  expect(BREADBOARD_08MM_ROW_BREAKOUTS).toHaveLength(
    BREADBOARD_COLUMN_COUNT * 4,
  )

  for (let column = 1; column <= BREADBOARD_COLUMN_COUNT; column++) {
    const connections = BREADBOARD_08MM_ROW_CONNECTIONS.filter(
      (connection) => connection.column === column,
    ).map(({ from, to }) => `${from}-${to}`)
    expect(connections).toEqual([
      `A${column}-B${column}`,
      `B${column}-C${column}`,
      `C${column}-D${column}`,
      `D${column}-E${column}`,
      `F${column}-G${column}`,
      `G${column}-H${column}`,
      `H${column}-I${column}`,
      `I${column}-J${column}`,
    ])

    expect(
      BREADBOARD_08MM_ROW_BREAKOUTS.filter(
        (breakout) => breakout.column === column,
      ).map((breakout) => breakout.terminalLabel),
    ).toEqual([`A${column}`, `E${column}`, `F${column}`, `J${column}`])
  }

  const circuitJson = await renderedBreadboardCircuitJson
  const traces = circuitJson.filter((element) => element.type === "pcb_trace")
  const traceSegments = traces.flatMap((trace) => {
    const wirePoints = trace.route.filter(
      (point) => point.route_type === "wire",
    )
    return wirePoints
      .slice(0, -1)
      .map(
        (point, index) =>
          new Set([pointKey(point), pointKey(wirePoints[index + 1]!)]),
      )
  })

  expect(
    BREADBOARD_08MM_ROW_BREAKOUTS.every((breakout) =>
      traceSegments.some(
        (endpoints) =>
          endpoints.has(pointKey(breakout.start)) &&
          endpoints.has(pointKey(breakout.end)),
      ),
    ),
  ).toBe(true)
  const terminalPositions = new Map(
    BREADBOARD_TERMINAL_HEADER_POSITIONS.map((position) => [
      position.label,
      position,
    ]),
  )
  expect(
    BREADBOARD_08MM_ROW_CONNECTIONS.every((connection) =>
      traceSegments.some(
        (endpoints) =>
          endpoints.has(pointKey(terminalPositions.get(connection.from)!)) &&
          endpoints.has(pointKey(terminalPositions.get(connection.to)!)),
      ),
    ),
  ).toBe(true)
  expect(
    traces.every((trace) =>
      trace.route
        .filter((point) => point.route_type === "wire")
        .every((point) => point.width === BREADBOARD_08MM_BREAKOUT_TRACE_WIDTH),
    ),
  ).toBe(true)
}, 30_000)
