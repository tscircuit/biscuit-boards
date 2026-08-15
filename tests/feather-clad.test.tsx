import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import {
  FEATHER_CLAD_HEIGHT,
  FEATHER_CLAD_VIA_HOLE_DIAMETER,
  FEATHER_CLAD_VIA_PAD_DIAMETER,
  FEATHER_CLAD_VIA_POSITIONS,
  FEATHER_CLAD_VIA_SPACING,
  FEATHER_CLAD_WIDTH,
  FEATHER_HEADER_HOLE_DIAMETER,
  FEATHER_HEADER_PAD_DIAMETER,
  FEATHER_HEADER_POSITIONS,
  FEATHER_HEADER_ROW_SPACING,
  FEATHER_MOUNTING_HOLE_DIAMETER,
  FEATHER_MOUNTING_HOLE_POSITIONS,
  FeatherCladWithPinHeaders,
} from "../lib/feather-clad"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

test("adds the classic Adafruit Feather outline and pin-header geometry", async () => {
  const circuit = new Circuit()
  circuit.add(
    <FeatherCladWithPinHeaders routingDisabled markHeadersNoConnect />,
  )
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
  const silkscreenTexts = circuitJson.flatMap((element) =>
    element.type === "pcb_silkscreen_text" ? [element.text] : [],
  )
  const headerIds = new Set(
    circuitJson.flatMap((element) =>
      element.type === "source_component" && element.name === "J_FEATHER"
        ? [element.source_component_id]
        : [],
    ),
  )
  const headerPorts = circuitJson.flatMap((element) =>
    element.type === "source_port" &&
    element.source_component_id !== undefined &&
    headerIds.has(element.source_component_id)
      ? [element]
      : [],
  )
  const errorsAndWarnings = circuitJson.filter(
    (element) =>
      element.type.endsWith("error") || element.type.endsWith("warning"),
  )

  expect(board).toMatchObject({
    width: FEATHER_CLAD_WIDTH,
    height: FEATHER_CLAD_HEIGHT,
    num_layers: 2,
  })
  expect(platedHoles).toHaveLength(28)
  expect(new Set(platedHoles.map(pointKey))).toEqual(
    new Set(FEATHER_HEADER_POSITIONS.map(pointKey)),
  )
  expect(
    platedHoles.every(
      (hole) =>
        "hole_diameter" in hole &&
        hole.hole_diameter === FEATHER_HEADER_HOLE_DIAMETER &&
        (("outer_diameter" in hole &&
          hole.outer_diameter === FEATHER_HEADER_PAD_DIAMETER) ||
          ("rect_pad_width" in hole &&
            "rect_pad_height" in hole &&
            hole.rect_pad_width === FEATHER_HEADER_PAD_DIAMETER &&
            hole.rect_pad_height === FEATHER_HEADER_PAD_DIAMETER)),
    ),
  ).toBe(true)
  expect(mountingHoles).toHaveLength(4)
  expect(new Set(mountingHoles.map(pointKey))).toEqual(
    new Set(FEATHER_MOUNTING_HOLE_POSITIONS.map(pointKey)),
  )
  expect(
    mountingHoles.every(
      (hole) =>
        hole.hole_shape === "circle" &&
        hole.hole_diameter === FEATHER_MOUNTING_HOLE_DIAMETER,
    ),
  ).toBe(true)
  expect(vias).toHaveLength(FEATHER_CLAD_VIA_POSITIONS.length)
  expect(new Set(vias.map(pointKey))).toEqual(
    new Set(FEATHER_CLAD_VIA_POSITIONS.map(pointKey)),
  )
  expect(
    vias.every(
      (via) =>
        via.hole_diameter === FEATHER_CLAD_VIA_HOLE_DIAMETER &&
        via.outer_diameter === FEATHER_CLAD_VIA_PAD_DIAMETER,
    ),
  ).toBe(true)
  expect(headerPorts).toHaveLength(28)
  expect(headerPorts.every((port) => port.do_not_connect)).toBe(true)
  expect(silkscreenTexts).toContain("UP")
  expect(silkscreenTexts).not.toContain("USB")
  expect(errorsAndWarnings).toEqual([])
})

test("keeps the Feather headers and prefabricated vias on their standard grids", () => {
  const headerXs = [
    ...new Set(FEATHER_HEADER_POSITIONS.map((position) => position.x)),
  ].toSorted((a, b) => a - b)
  expect(headerXs).toEqual([
    -FEATHER_HEADER_ROW_SPACING / 2,
    FEATHER_HEADER_ROW_SPACING / 2,
  ])
  expect(
    FEATHER_HEADER_POSITIONS.filter((position) => position.x === headerXs[0]),
  ).toHaveLength(16)
  expect(
    FEATHER_HEADER_POSITIONS.filter((position) => position.x === headerXs[1]),
  ).toHaveLength(12)

  const viaColumns = new Map<number, number[]>()
  for (const via of FEATHER_CLAD_VIA_POSITIONS) {
    viaColumns.set(via.x, [...(viaColumns.get(via.x) ?? []), via.y])
  }
  expect([...viaColumns.keys()].toSorted((a, b) => a - b)).toEqual([-8, 8])
  const expectedViaCounts = new Map([
    [-8, 31],
    [8, 22],
  ])
  for (const [x, ys] of viaColumns) {
    const sortedYs = ys.toSorted((a, b) => a - b)
    expect(sortedYs).toHaveLength(expectedViaCounts.get(x)!)
    for (const [index, y] of sortedYs.slice(1).entries()) {
      expect(y - sortedYs[index]!).toBeCloseTo(FEATHER_CLAD_VIA_SPACING)
    }
  }

  const rightHeaderTopY = Math.max(
    ...FEATHER_HEADER_POSITIONS.filter((position) => position.x > 0).map(
      (position) => position.y,
    ),
  )
  expect(Math.max(...viaColumns.get(8)!)).toBeLessThan(rightHeaderTopY)
})
