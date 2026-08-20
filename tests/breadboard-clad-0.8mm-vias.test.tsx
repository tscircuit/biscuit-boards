import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import { BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS } from "../lib/BiscuitBoard"
import {
  BREADBOARD_CLAD_HEIGHT,
  BREADBOARD_CLAD_WIDTH,
  BREADBOARD_COLUMN_COUNT,
  BREADBOARD_MOUNTING_HOLE_DIAMETER,
  BREADBOARD_TERMINAL_HEADER_POSITIONS,
} from "../lib/breadboard-clad"
import {
  BREADBOARD_08MM_BOTTOM_BANK_ROWS,
  BREADBOARD_08MM_BREAKOUT_LANE_SPACING,
  BREADBOARD_08MM_BREAKOUT_TRACE_WIDTH,
  BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET,
  BREADBOARD_08MM_CORNER_VIA_ARM_WIDTH,
  BREADBOARD_08MM_CORNER_VIA_ARM_X_INNER_OFFSET,
  BREADBOARD_08MM_CORNER_VIA_LONG_SIDE_COLUMNS,
  BREADBOARD_08MM_CORNER_VIA_SPACING,
  BREADBOARD_08MM_CORNER_VIA_X_INNER_OFFSET,
  BREADBOARD_08MM_CORNER_VIA_X_OUTWARD_SHIFT,
  BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET,
  BREADBOARD_08MM_CORNER_VIA_Y_OUTER_OFFSET,
  BREADBOARD_08MM_EDGE_HUG_COLUMN_COUNT,
  BREADBOARD_08MM_EDGE_HUG_Y_SHIFT,
  BREADBOARD_08MM_MIN_VIA_EDGE_SPACING,
  BREADBOARD_08MM_ROW_BREAKOUTS,
  BREADBOARD_08MM_ROW_CONNECTIONS,
  BREADBOARD_08MM_ROW_TRACE_WIDTH,
  BREADBOARD_08MM_TOP_BANK_ROWS,
  BREADBOARD_08MM_TOP_RIGHT_LONG_SIDE_COLUMNS,
  BREADBOARD_08MM_VIA_BREAKOUT_LENGTH,
  BREADBOARD_08MM_VIA_HOLE_DIAMETER,
  BREADBOARD_08MM_VIA_PAD_DIAMETER,
  BREADBOARD_08MM_VIA_POSITIONS,
  BreadboardClad08mmVias,
} from "../lib/breadboard-clad-0.8mm-vias"

const coordinateTolerance = 1e-6
const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

const getPointToSegmentDistance = (
  point: { x: number; y: number },
  start: { x: number; y: number },
  end: { x: number; y: number },
) => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  const projection =
    lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((point.x - start.x) * dx + (point.y - start.y) * dy) /
              lengthSquared,
          ),
        )
  return Math.hypot(
    point.x - (start.x + projection * dx),
    point.y - (start.y + projection * dy),
  )
}

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

test("places edge-hugging 0.8 mm via grids with inward woven escapes", async () => {
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
  expect(vias).toHaveLength(50)
  expect(vias).toHaveLength(BREADBOARD_08MM_VIA_POSITIONS.length)
  expect(new Set(vias.map(pointKey))).toEqual(
    new Set(BREADBOARD_08MM_VIA_POSITIONS.map(pointKey)),
  )
  expect(
    vias.every(
      (via) =>
        via.hole_diameter === BREADBOARD_08MM_VIA_HOLE_DIAMETER &&
        via.outer_diameter === BREADBOARD_08MM_VIA_PAD_DIAMETER &&
        via.pcb_trace_id !== undefined &&
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
    const longSideColumns =
      corner === "top_right"
        ? BREADBOARD_08MM_TOP_RIGHT_LONG_SIDE_COLUMNS
        : BREADBOARD_08MM_CORNER_VIA_LONG_SIDE_COLUMNS
    expect(cornerVias).toHaveLength(longSideColumns * 2 + 2)
    expect(cornerVias.filter((via) => via.arm === "horizontal")).toHaveLength(
      longSideColumns * 2,
    )
    expect(cornerVias.filter((via) => via.arm === "vertical")).toHaveLength(2)
    expect(new Set(cornerVias.map((via) => via.x))).toHaveLength(
      longSideColumns,
    )
    expect(
      cornerVias.some(
        (via) =>
          via.topBreakout.style === "woven" ||
          via.bottomBreakout.style === "woven",
      ),
    ).toBe(true)
    expect(
      cornerVias.some(
        (via) =>
          via.topBreakout.style === "direct" ||
          via.bottomBreakout.style === "direct",
      ),
    ).toBe(true)

    const xSign = corner.includes("left") ? -1 : 1
    const ySign = corner.includes("bottom") ? -1 : 1
    const xOutwardShift =
      xSign === -1 || ySign === -1
        ? BREADBOARD_08MM_CORNER_VIA_X_OUTWARD_SHIFT
        : 0
    const localInnerX =
      BREADBOARD_08MM_CORNER_VIA_X_INNER_OFFSET + xOutwardShift
    const edgeHugVias = cornerVias.filter(
      (via) =>
        via.arm === "horizontal" &&
        (via.x * xSign - localInnerX) / BREADBOARD_08MM_CORNER_VIA_SPACING <
          BREADBOARD_08MM_EDGE_HUG_COLUMN_COUNT,
    )
    expect(edgeHugVias).toHaveLength(4)
    expect(
      edgeHugVias.every(
        (via) =>
          via.y * ySign >=
          BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET +
            BREADBOARD_08MM_EDGE_HUG_Y_SHIFT,
      ),
    ).toBe(true)

    for (const via of cornerVias) {
      const localX = via.x * xSign
      const localY = via.y * ySign
      const columnIndex = Math.round(
        (localX - localInnerX) / BREADBOARD_08MM_CORNER_VIA_SPACING,
      )
      expect(localX).toBeGreaterThanOrEqual(
        BREADBOARD_08MM_CORNER_VIA_X_INNER_OFFSET + xOutwardShift,
      )
      expect(localX).toBeLessThanOrEqual(
        BREADBOARD_08MM_CORNER_VIA_X_INNER_OFFSET +
          xOutwardShift +
          (longSideColumns - 1) * BREADBOARD_08MM_CORNER_VIA_SPACING,
      )
      expect(localY).toBeGreaterThanOrEqual(
        BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET,
      )
      expect(localY).toBeLessThanOrEqual(
        BREADBOARD_08MM_CORNER_VIA_Y_OUTER_OFFSET,
      )
      if (via.arm === "horizontal") {
        const yShift =
          columnIndex < BREADBOARD_08MM_EDGE_HUG_COLUMN_COUNT
            ? BREADBOARD_08MM_EDGE_HUG_Y_SHIFT
            : 0
        expect([
          BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET + yShift,
          BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET +
            BREADBOARD_08MM_CORNER_VIA_ARM_WIDTH +
            yShift,
        ]).toContain(localY)
      } else {
        expect(localY).toBe(BREADBOARD_08MM_CORNER_VIA_Y_OUTER_OFFSET)
        expect(localX).toBeGreaterThanOrEqual(
          BREADBOARD_08MM_CORNER_VIA_ARM_X_INNER_OFFSET + xOutwardShift,
        )
        expect(localX).toBeLessThanOrEqual(
          BREADBOARD_08MM_CORNER_VIA_ARM_X_INNER_OFFSET +
            xOutwardShift +
            BREADBOARD_08MM_CORNER_VIA_ARM_WIDTH,
        )
      }

      const expectedTopOpenAreaEdge =
        localX - localInnerX <
        localY - BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET
          ? "toward_board_center"
          : "toward_breadboard_rows"
      expect(via.topBreakout.openAreaEdge).toBe(expectedTopOpenAreaEdge)
      expect(via.bottomBreakout.openAreaEdge).toBe(
        expectedTopOpenAreaEdge === "toward_board_center"
          ? "toward_breadboard_rows"
          : "toward_board_center",
      )

      for (const breakout of [via.topBreakout, via.bottomBreakout]) {
        const localEnd = {
          x: breakout.end.x * xSign,
          y: breakout.end.y * ySign,
        }
        expect(breakout.route.length === 0).toBe(breakout.style === "direct")
        if (breakout.openAreaEdge === "toward_board_center") {
          expect(localEnd.x).toBe(
            localInnerX - BREADBOARD_08MM_VIA_BREAKOUT_LENGTH,
          )
          expect(localEnd.x).toBeLessThan(localX)
        } else {
          expect(localEnd.y).toBe(
            BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET -
              BREADBOARD_08MM_VIA_BREAKOUT_LENGTH,
          )
          expect(localEnd.y).toBeLessThan(localY)
        }
      }
    }
  }

  expect(
    new Set(
      BREADBOARD_08MM_VIA_POSITIONS.map((via) => pointKey(via.topBreakout.end)),
    ),
  ).toHaveLength(BREADBOARD_08MM_VIA_POSITIONS.length)
  expect(
    new Set(
      BREADBOARD_08MM_VIA_POSITIONS.map((via) =>
        pointKey(via.bottomBreakout.end),
      ),
    ),
  ).toHaveLength(BREADBOARD_08MM_VIA_POSITIONS.length)

  for (const via of BREADBOARD_08MM_VIA_POSITIONS) {
    for (const breakout of [via.topBreakout, via.bottomBreakout]) {
      const route = [via, ...breakout.route, breakout.end]
      const minimumMountingHoleClearance = Math.min(
        ...BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS.flatMap((hole) =>
          route
            .slice(0, -1)
            .map(
              (point, index) =>
                getPointToSegmentDistance(hole, point, route[index + 1]!) -
                BREADBOARD_MOUNTING_HOLE_DIAMETER / 2 -
                BREADBOARD_08MM_BREAKOUT_TRACE_WIDTH / 2,
            ),
        ),
      )
      expect(minimumMountingHoleClearance).toBeGreaterThanOrEqual(
        0.1 - coordinateTolerance,
      )
    }
  }

  for (const hole of BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS) {
    expect(
      BREADBOARD_08MM_VIA_POSITIONS.some(
        (via) =>
          Math.abs(via.y - (hole.y - Math.sign(hole.y) * 3)) <
            coordinateTolerance &&
          Math.abs(via.x - hole.x) <= 1 + coordinateTolerance,
      ),
    ).toBe(true)
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
  expect(BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET).toBe(0.8)
  expect(BREADBOARD_08MM_BREAKOUT_LANE_SPACING).toBe(0.4)
  expect(BREADBOARD_08MM_EDGE_HUG_COLUMN_COUNT).toBe(2)
  expect(BREADBOARD_08MM_EDGE_HUG_Y_SHIFT).toBe(3)
  expect(BREADBOARD_08MM_VIA_BREAKOUT_LENGTH).toBe(1)
  expect(minimumPadEdgeSpacing).toBeGreaterThanOrEqual(
    BREADBOARD_08MM_MIN_VIA_EDGE_SPACING - coordinateTolerance,
  )
  expect(minimumDrillEdgeSpacing).toBeGreaterThanOrEqual(
    BREADBOARD_08MM_MIN_VIA_EDGE_SPACING - coordinateTolerance,
  )

  expect(
    vias.every((via) => {
      const pcbTrace =
        via.pcb_trace_id === undefined
          ? undefined
          : traces.find((trace) => trace.pcb_trace_id === via.pcb_trace_id)
      const sourceTrace =
        pcbTrace?.source_trace_id === undefined
          ? undefined
          : sourceTracesById.get(pcbTrace.source_trace_id)
      return (
        sourceTrace?.connected_source_port_ids.every(
          (sourcePortId) => !terminalPortIds.has(sourcePortId),
        ) === true
      )
    }),
  ).toBe(true)

  const viasByPosition = new Map(vias.map((via) => [pointKey(via), via]))
  for (const viaPosition of BREADBOARD_08MM_VIA_POSITIONS) {
    const pcbVia = viasByPosition.get(pointKey(viaPosition))!
    const trace = traces.find(
      (trace) => trace.pcb_trace_id === pcbVia.pcb_trace_id,
    )!
    const topWirePointKeys = new Set(
      trace.route.flatMap((point) =>
        point.route_type === "wire" && point.layer === "top"
          ? [pointKey(point)]
          : [],
      ),
    )
    const bottomWirePointKeys = new Set(
      trace.route.flatMap((point) =>
        point.route_type === "wire" && point.layer === "bottom"
          ? [pointKey(point)]
          : [],
      ),
    )
    expect(
      trace.route.some(
        (point) =>
          point.route_type === "via" &&
          pointKey(point) === pointKey(viaPosition),
      ),
    ).toBe(true)
    expect(topWirePointKeys.has(pointKey(viaPosition.topBreakout.end))).toBe(
      true,
    )
    expect(
      bottomWirePointKeys.has(pointKey(viaPosition.bottomBreakout.end)),
    ).toBe(true)
    expect(
      viaPosition.topBreakout.route.every((point) =>
        topWirePointKeys.has(pointKey(point)),
      ),
    ).toBe(true)
    expect(
      viaPosition.bottomBreakout.route.every((point) =>
        bottomWirePointKeys.has(pointKey(point)),
      ),
    ).toBe(true)
  }
  expect(errorsAndWarnings).toEqual([])
}, 60_000)

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
  const viaTraceIds = new Set(
    circuitJson.flatMap((element) =>
      element.type === "pcb_via" && element.pcb_trace_id !== undefined
        ? [element.pcb_trace_id]
        : [],
    ),
  )
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
    traces.every((trace) => {
      const expectedWidth = viaTraceIds.has(trace.pcb_trace_id)
        ? BREADBOARD_08MM_BREAKOUT_TRACE_WIDTH
        : BREADBOARD_08MM_ROW_TRACE_WIDTH
      return trace.route
        .filter((point) => point.route_type === "wire")
        .every((point) => point.width === expectedWidth)
    }),
  ).toBe(true)
}, 60_000)
