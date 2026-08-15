import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import {
  CLAD_40X40_EDGE_MOUNTING_HOLE_INSET,
  CLAD_40X40_HEIGHT,
  CLAD_40X40_MOUNTING_HOLE_DIAMETER,
  CLAD_40X40_MOUNTING_HOLE_POSITIONS,
  CLAD_40X40_VIA_HOLE_DIAMETER,
  CLAD_40X40_VIA_PAD_DIAMETER,
  CLAD_40X40_VIA_POSITIONS,
  CLAD_40X40_VIA_RING_HALF_SIZES,
  CLAD_40X40_VIA_SPACING,
  CLAD_40X40_WIDTH,
  Clad40x40,
} from "../lib/Clad40x40"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

test("renders a 40 mm square clad with two mounting holes and three via rings", async () => {
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
  expect(mountingHoles).toHaveLength(CLAD_40X40_MOUNTING_HOLE_POSITIONS.length)
  expect(new Set(mountingHoles.map(pointKey))).toEqual(
    new Set(CLAD_40X40_MOUNTING_HOLE_POSITIONS.map(pointKey)),
  )
  expect(
    mountingHoles.every(
      (hole) =>
        hole.hole_shape === "circle" &&
        hole.hole_diameter === CLAD_40X40_MOUNTING_HOLE_DIAMETER,
    ),
  ).toBe(true)
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

test("places three concentric square via rings at the configured pitch", () => {
  expect(CLAD_40X40_VIA_RING_HALF_SIZES).toEqual([2.6, 3.9, 5.2])
  expect(CLAD_40X40_VIA_POSITIONS).toHaveLength(72)

  for (const halfSize of CLAD_40X40_VIA_RING_HALF_SIZES) {
    const ringPositions = CLAD_40X40_VIA_POSITIONS.filter(
      ({ x, y }) => Math.max(Math.abs(x), Math.abs(y)) === halfSize,
    )
    expect(ringPositions).toHaveLength(
      4 * Math.round((halfSize * 2) / CLAD_40X40_VIA_SPACING),
    )
  }

  expect(CLAD_40X40_VIA_SPACING).toBe(1.3)
})

test("places the second mounting hole at the top right", () => {
  expect(CLAD_40X40_EDGE_MOUNTING_HOLE_INSET).toBe(3)
  expect(CLAD_40X40_MOUNTING_HOLE_POSITIONS).toContainEqual({ x: 17, y: 17 })
})
