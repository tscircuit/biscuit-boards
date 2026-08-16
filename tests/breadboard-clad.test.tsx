import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import {
  BREADBOARD_CLAD_HEIGHT,
  BREADBOARD_CLAD_VIA_HOLE_DIAMETER,
  BREADBOARD_CLAD_VIA_PAD_DIAMETER,
  BREADBOARD_CLAD_VIA_POSITIONS,
  BREADBOARD_CLAD_VIA_ROW_YS,
  BREADBOARD_CLAD_WIDTH,
  BREADBOARD_COLUMN_COUNT,
  BREADBOARD_COLUMN_XS,
  BREADBOARD_CORNER_VIA_ARM_WIDTH,
  BREADBOARD_CORNER_VIA_POSITIONS,
  BREADBOARD_CORNER_VIA_SPACING,
  BREADBOARD_CORNER_VIA_X_INNER_OFFSET,
  BREADBOARD_CORNER_VIA_X_OUTER_OFFSET,
  BREADBOARD_CORNER_VIA_X_OUTWARD_SHIFT,
  BREADBOARD_CORNER_VIA_Y_INNER_OFFSET,
  BREADBOARD_CORNER_VIA_Y_OUTER_OFFSET,
  BREADBOARD_HEADER_HOLE_DIAMETER,
  BREADBOARD_HEADER_PAD_DIAMETER,
  BREADBOARD_TERMINAL_HEADER_POSITIONS,
  BreadboardClad,
} from "../lib/breadboard-clad"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

test("creates an individually routable breadboard socket grid", async () => {
  const circuit = new Circuit()
  circuit.add(<BreadboardClad routingDisabled markHeadersNoConnect />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const board = circuitJson.find((element) => element.type === "pcb_board")
  const platedHoles = circuitJson.filter(
    (element) => element.type === "pcb_plated_hole",
  )
  const vias = circuitJson.filter((element) => element.type === "pcb_via")
  const headerSourceComponentIds = new Set(
    circuitJson.flatMap((element) =>
      element.type === "source_component" && element.name.startsWith("J_")
        ? [element.source_component_id]
        : [],
    ),
  )
  const headerSourcePorts = circuitJson.flatMap((element) =>
    element.type === "source_port" &&
    element.source_component_id !== undefined &&
    headerSourceComponentIds.has(element.source_component_id)
      ? [element]
      : [],
  )
  const errorsAndWarnings = circuitJson.filter(
    (element) =>
      element.type.endsWith("error") || element.type.endsWith("warning"),
  )
  expect(board).toMatchObject({
    width: BREADBOARD_CLAD_WIDTH,
    height: BREADBOARD_CLAD_HEIGHT,
    num_layers: 2,
  })
  expect(BREADBOARD_TERMINAL_HEADER_POSITIONS).toHaveLength(
    BREADBOARD_COLUMN_COUNT * 10,
  )
  expect(platedHoles).toHaveLength(BREADBOARD_TERMINAL_HEADER_POSITIONS.length)
  expect(new Set(platedHoles.map(pointKey))).toEqual(
    new Set(BREADBOARD_TERMINAL_HEADER_POSITIONS.map(pointKey)),
  )
  expect(
    platedHoles.every(
      (hole) =>
        "hole_diameter" in hole &&
        hole.hole_diameter === BREADBOARD_HEADER_HOLE_DIAMETER &&
        (("outer_diameter" in hole &&
          hole.outer_diameter === BREADBOARD_HEADER_PAD_DIAMETER) ||
          ("rect_pad_width" in hole &&
            "rect_pad_height" in hole &&
            hole.rect_pad_width === BREADBOARD_HEADER_PAD_DIAMETER &&
            hole.rect_pad_height === BREADBOARD_HEADER_PAD_DIAMETER)),
    ),
  ).toBe(true)
  expect(headerSourcePorts).toHaveLength(
    BREADBOARD_TERMINAL_HEADER_POSITIONS.length,
  )
  expect(headerSourcePorts.every((port) => port.do_not_connect)).toBe(true)

  expect(vias).toHaveLength(BREADBOARD_CLAD_VIA_POSITIONS.length)
  expect(vias).toHaveLength(
    BREADBOARD_COLUMN_COUNT * BREADBOARD_CLAD_VIA_ROW_YS.length +
      BREADBOARD_CORNER_VIA_POSITIONS.length,
  )
  expect(new Set(vias.map(pointKey))).toEqual(
    new Set(BREADBOARD_CLAD_VIA_POSITIONS.map(pointKey)),
  )
  expect(
    vias.every(
      (via) =>
        via.hole_diameter === BREADBOARD_CLAD_VIA_HOLE_DIAMETER &&
        via.outer_diameter === BREADBOARD_CLAD_VIA_PAD_DIAMETER,
    ),
  ).toBe(true)
  for (const rowY of BREADBOARD_CLAD_VIA_ROW_YS) {
    expect(
      vias.filter(
        (via) => via.y === rowY && BREADBOARD_COLUMN_XS.includes(via.x),
      ),
    ).toHaveLength(BREADBOARD_COLUMN_COUNT)
  }
  expect(errorsAndWarnings).toEqual([])
})

test("places two-via-wide L-shaped fields in every corner", () => {
  expect(BREADBOARD_CORNER_VIA_SPACING).toBe(1.3)
  expect(BREADBOARD_CORNER_VIA_ARM_WIDTH).toBe(1.3)
  expect(BREADBOARD_CORNER_VIA_X_OUTWARD_SHIFT).toBe(2.6)
  expect(BREADBOARD_CORNER_VIA_POSITIONS).toHaveLength(64)

  for (const xSign of [-1, 1] as const) {
    for (const ySign of [-1, 1] as const) {
      const cornerVias = BREADBOARD_CORNER_VIA_POSITIONS.filter(
        ({ x, y }) => Math.sign(x) === xSign && Math.sign(y) === ySign,
      )
      expect(cornerVias).toHaveLength(16)

      for (const via of cornerVias) {
        const localX = via.x * xSign
        const localY = via.y * ySign
        const xOutwardShift =
          xSign === -1 || ySign === -1
            ? BREADBOARD_CORNER_VIA_X_OUTWARD_SHIFT
            : 0
        expect(localX).toBeGreaterThanOrEqual(
          BREADBOARD_CORNER_VIA_X_INNER_OFFSET + xOutwardShift,
        )
        expect(localX).toBeLessThanOrEqual(
          BREADBOARD_CORNER_VIA_X_OUTER_OFFSET + xOutwardShift,
        )
        expect(localY).toBeGreaterThanOrEqual(
          BREADBOARD_CORNER_VIA_Y_INNER_OFFSET,
        )
        expect(localY).toBeLessThanOrEqual(BREADBOARD_CORNER_VIA_Y_OUTER_OFFSET)
        expect(
          localX <=
            BREADBOARD_CORNER_VIA_X_INNER_OFFSET +
              xOutwardShift +
              BREADBOARD_CORNER_VIA_ARM_WIDTH ||
            localY <=
              BREADBOARD_CORNER_VIA_Y_INNER_OFFSET +
                BREADBOARD_CORNER_VIA_ARM_WIDTH,
        ).toBe(true)
      }
    }
  }
})

test("routes crossing socket nets without non-prefabricated vias", async () => {
  const circuit = new Circuit()
  circuit.add(
    <BreadboardClad markHeadersNoConnect>
      <trace
        name="CROSSING_ONE"
        from=".J_TERMINALS > .A1"
        to=".J_TERMINALS > .J21"
      />
      <trace
        name="CROSSING_TWO"
        from=".J_TERMINALS > .A21"
        to=".J_TERMINALS > .J1"
      />
    </BreadboardClad>,
  )
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const traces = circuitJson.filter((element) => element.type === "pcb_trace")
  const routedVias = traces.flatMap((trace) =>
    trace.route.filter((point) => point.route_type === "via"),
  )
  const allowedViaPositions = new Set(
    BREADBOARD_CLAD_VIA_POSITIONS.map(pointKey),
  )
  const errorsAndWarnings = circuitJson.filter(
    (element) =>
      element.type.endsWith("error") || element.type.endsWith("warning"),
  )

  expect(traces).toHaveLength(2)
  expect(
    routedVias.every((via) => allowedViaPositions.has(pointKey(via))),
  ).toBe(true)
  expect(errorsAndWarnings).toEqual([])
}, 30_000)
