import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import {
  createXiaoCladViaPositions,
  XIAO_CLAD_COMPONENT_AREA,
  XIAO_CLAD_HEIGHT,
  XIAO_CLAD_MOUNTING_HOLE_DIAMETER,
  XIAO_CLAD_MOUNTING_HOLE_POSITIONS,
  XIAO_CLAD_VIA_OUTER_DIAMETER,
  XIAO_CLAD_VIA_POSITIONS,
  XIAO_CLAD_WIDTH,
  XiaoClad,
} from "../lib/XiaoClad"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

test("uses the XIAO outline with four M2 holes and fixed vias", async () => {
  const circuit = new Circuit()
  circuit.add(<XiaoClad routingDisabled />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const board = circuitJson.find((element) => element.type === "pcb_board")
  const mountingHoles = circuitJson.filter(
    (element) => element.type === "pcb_hole",
  )
  const vias = circuitJson.filter((element) => element.type === "pcb_via")
  const copperPours = circuitJson.filter(
    (element) => element.type === "pcb_copper_pour",
  )
  const errorsAndWarnings = circuitJson.filter(
    (element) =>
      element.type.endsWith("error") || element.type.endsWith("warning"),
  )

  expect(board).toMatchObject({
    width: XIAO_CLAD_WIDTH,
    height: XIAO_CLAD_HEIGHT,
    num_layers: 2,
  })
  expect(mountingHoles).toHaveLength(4)
  expect(new Set(mountingHoles.map(pointKey))).toEqual(
    new Set(XIAO_CLAD_MOUNTING_HOLE_POSITIONS.map(pointKey)),
  )
  expect(
    mountingHoles.every(
      (hole) =>
        hole.hole_shape === "circle" &&
        hole.hole_diameter === XIAO_CLAD_MOUNTING_HOLE_DIAMETER,
    ),
  ).toBe(true)
  expect(vias).toHaveLength(28)
  expect(new Set(vias.map(pointKey))).toEqual(
    new Set(XIAO_CLAD_VIA_POSITIONS.map(pointKey)),
  )
  expect(
    vias.every(
      (via) =>
        via.type === "pcb_via" &&
        via.net_is_assignable === true &&
        via.hole_diameter === 0.3 &&
        via.outer_diameter === 0.4,
    ),
  ).toBe(true)
  expect(copperPours).toEqual([])
  expect(errorsAndWarnings).toEqual([])
})

test("keeps mounting holes and prefab vias mechanically separated", () => {
  const minimumCenterDistance =
    XIAO_CLAD_MOUNTING_HOLE_DIAMETER / 2 + XIAO_CLAD_VIA_OUTER_DIAMETER / 2

  for (const via of XIAO_CLAD_VIA_POSITIONS) {
    expect(
      Math.abs(via.x) + XIAO_CLAD_VIA_OUTER_DIAMETER / 2,
    ).toBeLessThanOrEqual(XIAO_CLAD_WIDTH / 2)
    expect(
      Math.abs(via.y) + XIAO_CLAD_VIA_OUTER_DIAMETER / 2,
    ).toBeLessThanOrEqual(XIAO_CLAD_HEIGHT / 2)
    expect(
      Math.abs(via.x) - XIAO_CLAD_VIA_OUTER_DIAMETER / 2 >=
        XIAO_CLAD_COMPONENT_AREA.width / 2 ||
        Math.abs(via.y) - XIAO_CLAD_VIA_OUTER_DIAMETER / 2 >=
          XIAO_CLAD_COMPONENT_AREA.height / 2,
    ).toBe(true)
    for (const hole of XIAO_CLAD_MOUNTING_HOLE_POSITIONS) {
      expect(Math.hypot(via.x - hole.x, via.y - hole.y)).toBeGreaterThan(
        minimumCenterDistance,
      )
    }
  }
})

test("derives via quantity and pitch from multiple grid areas", async () => {
  const options = {
    viaGridAreas: [
      { width: 5, height: 1, centerX: 0.5, centerY: -2 },
      { width: 5, height: 1, centerX: 0.5, centerY: 2 },
    ],
    viaHoleDiameter: 0.6,
    viaOuterDiameter: 1,
    minViaClearance: 1,
  }
  const positions = createXiaoCladViaPositions(options)

  expect(positions).toHaveLength(6)
  expect(new Set(positions.map((position) => position.x))).toEqual(
    new Set([-1.5, 0.5, 2.5]),
  )
  expect(new Set(positions.map((position) => position.y))).toEqual(
    new Set([-2, 2]),
  )

  for (let firstIndex = 0; firstIndex < positions.length; firstIndex++) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < positions.length;
      secondIndex++
    ) {
      expect(
        Math.hypot(
          positions[firstIndex].x - positions[secondIndex].x,
          positions[firstIndex].y - positions[secondIndex].y,
        ),
      ).toBeGreaterThanOrEqual(1 + options.minViaClearance)
    }
  }

  const circuit = new Circuit()
  circuit.add(<XiaoClad routingDisabled {...options} />)
  await circuit.renderUntilSettled()
  const vias = circuit
    .getCircuitJson()
    .filter((element) => element.type === "pcb_via")

  expect(vias).toHaveLength(6)
  expect(
    vias.every((via) => via.hole_diameter === 0.6 && via.outer_diameter === 1),
  ).toBe(true)
})

test("rejects invalid via grid geometry", () => {
  expect(() =>
    createXiaoCladViaPositions({ viaGridArea: { width: 0, height: 5 } }),
  ).toThrow("viaGridArea.width must be greater than zero")
  expect(() => createXiaoCladViaPositions({ minViaClearance: -0.1 })).toThrow(
    "minViaClearance must be zero or greater",
  )
  expect(() =>
    createXiaoCladViaPositions({
      viaHoleDiameter: 1.1,
      viaOuterDiameter: 1,
    }),
  ).toThrow("viaOuterDiameter must be at least viaHoleDiameter")
  expect(() =>
    createXiaoCladViaPositions({
      viaGridArea: { width: 5, height: 5 },
      viaGridAreas: [{ width: 5, height: 5 }],
    }),
  ).toThrow("Use either viaGridArea or viaGridAreas, not both")
  expect(() =>
    createXiaoCladViaPositions({
      viaOuterDiameter: 1,
      minViaClearance: 1,
      viaGridAreas: [
        { width: 1, height: 1, centerX: 0 },
        { width: 1, height: 1, centerX: 1.5 },
      ],
    }),
  ).toThrow("viaGridAreas place vias closer")
})
