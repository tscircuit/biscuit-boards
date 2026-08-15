import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import {
  CLAD_40X40_HEIGHT,
  CLAD_40X40_MOUNTING_HOLE_DIAMETER,
  CLAD_40X40_VIA_HOLE_DIAMETER,
  CLAD_40X40_VIA_PAD_DIAMETER,
  CLAD_40X40_VIA_POSITIONS,
  CLAD_40X40_VIA_RING_HALF_SIZE,
  CLAD_40X40_VIA_SPACING,
  CLAD_40X40_WIDTH,
  Clad40x40,
} from "../lib/Clad40x40"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

test("renders a 40 mm square clad with a centered mounting hole and via ring", async () => {
  const circuit = new Circuit()
  circuit.add(<Clad40x40 routingDisabled />)
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
    width: CLAD_40X40_WIDTH,
    height: CLAD_40X40_HEIGHT,
    num_layers: 2,
  })
  expect(mountingHoles).toHaveLength(1)
  expect(mountingHoles[0]).toMatchObject({
    x: 0,
    y: 0,
    hole_shape: "circle",
    hole_diameter: CLAD_40X40_MOUNTING_HOLE_DIAMETER,
  })
  expect(platedHoles).toEqual([])
  expect(vias).toHaveLength(CLAD_40X40_VIA_POSITIONS.length)
  expect(new Set(vias.map(pointKey))).toEqual(
    new Set(CLAD_40X40_VIA_POSITIONS.map(pointKey)),
  )
  expect(
    vias.every(
      (via) =>
        via.hole_diameter === CLAD_40X40_VIA_HOLE_DIAMETER &&
        via.outer_diameter === CLAD_40X40_VIA_PAD_DIAMETER,
    ),
  ).toBe(true)
  expect(errorsAndWarnings).toEqual([])
})

test("places the vias on a square at the configured pitch", () => {
  expect(CLAD_40X40_VIA_POSITIONS).toHaveLength(16)
  expect(
    CLAD_40X40_VIA_POSITIONS.every(
      ({ x, y }) =>
        Math.abs(x) === CLAD_40X40_VIA_RING_HALF_SIZE ||
        Math.abs(y) === CLAD_40X40_VIA_RING_HALF_SIZE,
    ),
  ).toBe(true)

  const expectedAxisPositions = [-2.6, -1.3, 0, 1.3, 2.6]
  expect(
    [...new Set(CLAD_40X40_VIA_POSITIONS.map(({ x }) => x))].toSorted(
      (a, b) => a - b,
    ),
  ).toEqual(expectedAxisPositions)
  expect(
    [...new Set(CLAD_40X40_VIA_POSITIONS.map(({ y }) => y))].toSorted(
      (a, b) => a - b,
    ),
  ).toEqual(expectedAxisPositions)
  expect(CLAD_40X40_VIA_SPACING).toBe(1.3)
})
