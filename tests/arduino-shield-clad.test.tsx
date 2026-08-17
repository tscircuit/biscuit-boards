import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import {
  ARDUINO_SHIELD_CLAD_HEIGHT,
  ARDUINO_SHIELD_CLAD_VIA_HOLE_DIAMETER,
  ARDUINO_SHIELD_CLAD_VIA_OUTER_DIAMETER,
  ARDUINO_SHIELD_CLAD_VIA_POSITIONS,
  ARDUINO_SHIELD_CLAD_VIA_SPACING,
  ARDUINO_SHIELD_CLAD_WIDTH,
  ARDUINO_SHIELD_CONNECTOR_OFFSET_X,
  ARDUINO_SHIELD_HEADER_PLACEMENTS,
  ARDUINO_SHIELD_MOUNTING_HOLE_DIAMETER,
  ARDUINO_SHIELD_MOUNTING_HOLE_POSITIONS,
  ArduinoShieldClad,
} from "../lib/ArduinoShieldClad"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

const EXPECTED_UNO_HEADER_PAD_POSITIONS = [
  ...[-8.89, -6.35, -3.81, -1.27, 1.27, 3.81, 6.35, 8.89].map((x) => ({
    x,
    y: -24.13,
  })),
  ...[13.97, 16.51, 19.05, 21.59, 24.13, 26.67].map((x) => ({
    x,
    y: -24.13,
  })),
  ...[
    -18.034, -15.494, -12.954, -10.414, -7.874, -5.334, -2.794, -0.254, 2.286,
    4.826, 8.89, 11.43, 13.97, 16.51, 19.05, 21.59, 24.13, 26.67,
  ].map((x) => ({ x, y: 24.13 })),
  ...[-1.27, 1.27, 3.81].flatMap((y) =>
    [26.797, 29.337].map((x) => ({ x, y })),
  ),
]

test("uses the UNO R3 connector and BiscuitBoard mounting-hole geometry", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoShieldClad routingDisabled markHeadersNoConnect />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const board = circuitJson.find((element) => element.type === "pcb_board")
  const platedHoles = circuitJson.filter(
    (element) => element.type === "pcb_plated_hole",
  )
  const mountingHoles = circuitJson.filter(
    (element) => element.type === "pcb_hole",
  )
  const vias = circuitJson.filter((element) => element.type === "pcb_via")
  const errorsAndWarnings = circuitJson.filter(
    (element) =>
      element.type.endsWith("error") || element.type.endsWith("warning"),
  )
  const headerNames = new Set([
    "J_POWER",
    "J_ANALOG",
    "J_DIGITAL_0_7",
    "J_DIGITAL_8_13",
    "J_ICSP",
  ])
  const headerIds = new Set(
    circuitJson.flatMap((element) =>
      element.type === "source_component" && headerNames.has(element.name)
        ? [element.source_component_id]
        : [],
    ),
  )
  const headerPortIds = circuitJson.flatMap((element) =>
    element.type === "source_port" &&
    element.source_component_id !== undefined &&
    headerIds.has(element.source_component_id)
      ? [element.source_port_id]
      : [],
  )
  const doNotConnectHeaderPortIds = circuitJson.flatMap((element) =>
    element.type === "source_port" &&
    element.source_component_id !== undefined &&
    headerIds.has(element.source_component_id) &&
    element.do_not_connect
      ? [element.source_port_id]
      : [],
  )

  expect(board).toMatchObject({
    width: ARDUINO_SHIELD_CLAD_WIDTH,
    height: ARDUINO_SHIELD_CLAD_HEIGHT,
    num_layers: 2,
  })
  expect(mountingHoles).toHaveLength(5)
  expect(new Set(mountingHoles.map(pointKey))).toEqual(
    new Set(ARDUINO_SHIELD_MOUNTING_HOLE_POSITIONS.map(pointKey)),
  )
  expect(
    mountingHoles.every(
      (hole) =>
        hole.hole_shape === "circle" &&
        hole.hole_diameter === ARDUINO_SHIELD_MOUNTING_HOLE_DIAMETER,
    ),
  ).toBe(true)
  expect(platedHoles).toHaveLength(38)
  expect(new Set(platedHoles.map(pointKey))).toEqual(
    new Set(EXPECTED_UNO_HEADER_PAD_POSITIONS.map(pointKey)),
  )
  expect(headerIds.size).toBe(5)
  expect(headerPortIds).toHaveLength(38)
  expect(doNotConnectHeaderPortIds).toHaveLength(38)
  expect(vias).toHaveLength(ARDUINO_SHIELD_CLAD_VIA_POSITIONS.length)
  expect(vias).toHaveLength(226)
  expect(
    vias.every(
      (via) => via.hole_diameter === ARDUINO_SHIELD_CLAD_VIA_HOLE_DIAMETER,
    ),
  ).toBe(true)
  expect(
    vias.every(
      (via) => via.outer_diameter === ARDUINO_SHIELD_CLAD_VIA_OUTER_DIAMETER,
    ),
  ).toBe(true)
  expect(new Set(vias.map(pointKey))).toEqual(
    new Set(ARDUINO_SHIELD_CLAD_VIA_POSITIONS.map(pointKey)),
  )
  expect(errorsAndWarnings).toEqual([])
})

test("preserves the UNO header gap and uses central and corner via fields", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoShieldClad routingDisabled markHeadersNoConnect />)
  await circuit.renderUntilSettled()

  const platedHoles = circuit
    .getCircuitJson()
    .filter((element) => element.type === "pcb_plated_hole")
  const topHeaderXs = platedHoles
    .filter((hole) => hole.y === ARDUINO_SHIELD_HEADER_PLACEMENTS.digital0To7.y)
    .map((hole) => hole.x)
    .sort((a, b) => a - b)
  const nonPitchGaps = topHeaderXs
    .slice(1)
    .map((x, index) => x - topHeaderXs[index])
    .filter((gap) => Math.abs(gap - 2.54) > 0.001)
  const centralVias = ARDUINO_SHIELD_CLAD_VIA_POSITIONS.filter(
    (via) => via.x >= -19 && via.x <= -3 && via.y >= -6 && via.y <= 6,
  )
  const cornerVias = ARDUINO_SHIELD_CLAD_VIA_POSITIONS.filter(
    (via) => !centralVias.includes(via),
  )
  const corners = [
    cornerVias.filter((via) => via.x < 0 && via.y > 0),
    cornerVias.filter((via) => via.x < 0 && via.y < 0),
    cornerVias.filter((via) => via.x > 0 && via.y > 0),
    cornerVias.filter((via) => via.x > 0 && via.y < 0),
  ]
  const upperRightMountingHoleClearance = Math.min(
    ...corners[2]!.flatMap((via) =>
      ARDUINO_SHIELD_MOUNTING_HOLE_POSITIONS.filter(
        (hole) => hole.x > 0 && hole.y > 0,
      ).map(
        (hole) =>
          Math.hypot(via.x - hole.x, via.y - hole.y) -
          ARDUINO_SHIELD_MOUNTING_HOLE_DIAMETER / 2 -
          ARDUINO_SHIELD_CLAD_VIA_OUTER_DIAMETER / 2,
      ),
    ),
  )

  expect(nonPitchGaps).toHaveLength(1)
  expect(nonPitchGaps[0]).toBeCloseTo(4.064, 3)
  expect(ARDUINO_SHIELD_CONNECTOR_OFFSET_X).toBe(-2.54)
  expect(
    Math.min(
      ...ARDUINO_SHIELD_MOUNTING_HOLE_POSITIONS.filter(
        (hole) => hole.x > 0 && hole.y > 0,
      ).flatMap((hole) =>
        platedHoles
          .filter((pad) => pad.y === 24.13)
          .map((pad) => Math.hypot(hole.x - pad.x, hole.y - pad.y)),
      ),
    ),
  ).toBeGreaterThan(4)
  expect(centralVias).toHaveLength(130)
  expect(cornerVias).toHaveLength(96)
  expect(corners.map((corner) => corner.length)).toEqual([27, 27, 15, 27])
  expect(new Set(corners[2]!.map((via) => via.y)).size).toBe(3)
  expect(upperRightMountingHoleClearance).toBeCloseTo(1.3, 2)
  expect(new Set(ARDUINO_SHIELD_CLAD_VIA_POSITIONS.map(pointKey)).size).toBe(
    226,
  )
  expect(
    centralVias.some(
      (via) =>
        Math.abs(via.x - (-19 + ARDUINO_SHIELD_CLAD_VIA_SPACING)) < 0.001,
    ),
  ).toBe(true)
  expect(
    Math.min(
      ...cornerVias.flatMap((via) =>
        ARDUINO_SHIELD_MOUNTING_HOLE_POSITIONS.map(
          (hole) =>
            Math.hypot(via.x - hole.x, via.y - hole.y) -
            ARDUINO_SHIELD_MOUNTING_HOLE_DIAMETER / 2 -
            ARDUINO_SHIELD_CLAD_VIA_OUTER_DIAMETER / 2,
        ),
      ),
    ),
  ).toBeGreaterThanOrEqual(1.3)
})
