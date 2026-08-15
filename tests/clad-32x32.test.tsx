import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import {
  CLAD_32X32_EDGE_CONNECTOR_OPENING,
  CLAD_32X32_HEIGHT,
  CLAD_32X32_MOUNTING_HOLE_DIAMETER,
  CLAD_32X32_MOUNTING_HOLE_INSET,
  CLAD_32X32_MOUNTING_HOLE_POSITIONS,
  CLAD_32X32_VIA_ARM_INNER_OFFSET,
  CLAD_32X32_VIA_ARM_OUTER_OFFSET,
  CLAD_32X32_VIA_ARM_WIDTH,
  CLAD_32X32_VIA_HOLE_DIAMETER,
  CLAD_32X32_VIA_PAD_DIAMETER,
  CLAD_32X32_VIA_POSITIONS,
  CLAD_32X32_VIA_SPACING,
  CLAD_32X32_WIDTH,
  Clad32x32,
} from "../lib/Clad32x32"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

test("renders a 32 mm square clad with four corner mounting holes", async () => {
  const circuit = new Circuit()
  circuit.add(<Clad32x32 routingDisabled />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const board = circuitJson.find((element) => element.type === "pcb_board")
  const mountingHoles = circuitJson.filter(
    (element) => element.type === "pcb_hole",
  )
  const platedHoles = circuitJson.filter(
    (element) => element.type === "pcb_plated_hole",
  )
  const vias = circuitJson.filter((element) => element.type === "pcb_via")
  const errorsAndWarnings = circuitJson.filter(
    (element) =>
      element.type.endsWith("error") || element.type.endsWith("warning"),
  )

  expect(board).toMatchObject({
    width: CLAD_32X32_WIDTH,
    height: CLAD_32X32_HEIGHT,
    num_layers: 2,
  })
  expect(mountingHoles).toHaveLength(4)
  expect(new Set(mountingHoles.map(pointKey))).toEqual(
    new Set(CLAD_32X32_MOUNTING_HOLE_POSITIONS.map(pointKey)),
  )
  expect(mountingHoles.some(({ x, y }) => x === 0 && y === 0)).toBe(false)
  expect(
    mountingHoles.every(
      (hole) =>
        hole.hole_shape === "circle" &&
        hole.hole_diameter === CLAD_32X32_MOUNTING_HOLE_DIAMETER,
    ),
  ).toBe(true)
  expect(platedHoles).toEqual([])
  expect(vias).toHaveLength(CLAD_32X32_VIA_POSITIONS.length)
  expect(new Set(vias.map(pointKey))).toEqual(
    new Set(CLAD_32X32_VIA_POSITIONS.map(pointKey)),
  )
  expect(
    vias.every(
      (via) =>
        via.hole_diameter === CLAD_32X32_VIA_HOLE_DIAMETER &&
        via.outer_diameter === CLAD_32X32_VIA_PAD_DIAMETER,
    ),
  ).toBe(true)
  expect(errorsAndWarnings).toEqual([])
})

test("places a two-via-wide L-shaped field in every corner", () => {
  expect(CLAD_32X32_VIA_SPACING).toBe(1.3)
  expect(CLAD_32X32_VIA_ARM_WIDTH).toBe(1.3)
  expect(CLAD_32X32_VIA_POSITIONS).toHaveLength(80)

  for (const xSign of [-1, 1] as const) {
    for (const ySign of [-1, 1] as const) {
      const cornerVias = CLAD_32X32_VIA_POSITIONS.filter(
        ({ x, y }) => Math.sign(x) === xSign && Math.sign(y) === ySign,
      )
      expect(cornerVias).toHaveLength(20)

      for (const via of cornerVias) {
        const localX = via.x * xSign
        const localY = via.y * ySign
        expect(localX).toBeGreaterThanOrEqual(CLAD_32X32_VIA_ARM_INNER_OFFSET)
        expect(localX).toBeLessThanOrEqual(CLAD_32X32_VIA_ARM_OUTER_OFFSET)
        expect(localY).toBeGreaterThanOrEqual(CLAD_32X32_VIA_ARM_INNER_OFFSET)
        expect(localY).toBeLessThanOrEqual(CLAD_32X32_VIA_ARM_OUTER_OFFSET)
        expect(
          localX <=
            CLAD_32X32_VIA_ARM_INNER_OFFSET + CLAD_32X32_VIA_ARM_WIDTH ||
            localY <=
              CLAD_32X32_VIA_ARM_INNER_OFFSET + CLAD_32X32_VIA_ARM_WIDTH,
        ).toBe(true)
      }
    }
  }
})

test("keeps each side midpoint open for connectors", () => {
  expect(CLAD_32X32_EDGE_CONNECTOR_OPENING).toBe(15.6)
  expect(
    CLAD_32X32_VIA_POSITIONS.every(
      ({ x, y }) =>
        Math.abs(x) >= CLAD_32X32_VIA_ARM_INNER_OFFSET &&
        Math.abs(y) >= CLAD_32X32_VIA_ARM_INNER_OFFSET,
    ),
  ).toBe(true)
})

test("insets all four mounting holes by 3 mm", () => {
  expect(CLAD_32X32_MOUNTING_HOLE_INSET).toBe(3)
  const centerOffset = CLAD_32X32_WIDTH / 2 - CLAD_32X32_MOUNTING_HOLE_INSET
  expect(CLAD_32X32_MOUNTING_HOLE_POSITIONS).toEqual([
    { x: -centerOffset, y: -centerOffset },
    { x: -centerOffset, y: centerOffset },
    { x: centerOffset, y: -centerOffset },
    { x: centerOffset, y: centerOffset },
  ])
})
