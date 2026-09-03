import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import {
  BISCUIT_BOARD_V2_CENTER_VIA_HALF_WIDTH,
  BISCUIT_BOARD_V2_CENTER_VIA_POSITIONS,
  BISCUIT_BOARD_V2_CENTER_VIA_Y_INNER_OFFSET,
  BISCUIT_BOARD_V2_CENTER_VIA_ZONES,
  BISCUIT_BOARD_V2_CORNER_VIA_POSITIONS,
  BISCUIT_BOARD_V2_HEIGHT,
  BISCUIT_BOARD_V2_MOUNTING_HOLE_DIAMETER,
  BISCUIT_BOARD_V2_MOUNTING_HOLE_POSITIONS,
  BISCUIT_BOARD_V2_VIA_ANNULAR_RING_WIDTH,
  BISCUIT_BOARD_V2_VIA_HOLE_DIAMETER,
  BISCUIT_BOARD_V2_VIA_PAD_DIAMETER,
  BISCUIT_BOARD_V2_VIA_POSITIONS,
  BISCUIT_BOARD_V2_VIA_SPACING,
  BISCUIT_BOARD_V2_WIDTH,
  BiscuitBoardV2,
} from "../lib/biscuit-board-v2"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

test("renders BiscuitBoard V2 without changing the original board", async () => {
  const circuit = new Circuit()
  circuit.add(<BiscuitBoardV2 routingDisabled />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const board = circuitJson.find((element) => element.type === "pcb_board")
  const mountingHoles = circuitJson.filter(
    (element) => element.type === "pcb_hole",
  )
  const vias = circuitJson.filter((element) => element.type === "pcb_via")
  const keepouts = circuitJson.filter(
    (element) => element.type === "pcb_keepout",
  )
  const errorsAndWarnings = circuitJson.filter(
    (element) =>
      element.type.endsWith("error") || element.type.endsWith("warning"),
  )

  expect(board).toMatchObject({
    width: BISCUIT_BOARD_V2_WIDTH,
    height: BISCUIT_BOARD_V2_HEIGHT,
    num_layers: 2,
  })
  expect(mountingHoles).toHaveLength(4)
  expect(new Set(mountingHoles.map(pointKey))).toEqual(
    new Set(BISCUIT_BOARD_V2_MOUNTING_HOLE_POSITIONS.map(pointKey)),
  )
  expect(
    mountingHoles.every(
      (hole) =>
        hole.hole_shape === "circle" &&
        hole.hole_diameter === BISCUIT_BOARD_V2_MOUNTING_HOLE_DIAMETER,
    ),
  ).toBe(true)
  expect(keepouts).toEqual([])
  expect(vias).toHaveLength(124)
  expect(new Set(vias.map(pointKey))).toEqual(
    new Set(BISCUIT_BOARD_V2_VIA_POSITIONS.map(pointKey)),
  )
  expect(
    vias.every(
      (via) =>
        via.hole_diameter === BISCUIT_BOARD_V2_VIA_HOLE_DIAMETER &&
        via.outer_diameter === BISCUIT_BOARD_V2_VIA_PAD_DIAMETER,
    ),
  ).toBe(true)
  expect(
    (BISCUIT_BOARD_V2_VIA_PAD_DIAMETER -
      BISCUIT_BOARD_V2_VIA_HOLE_DIAMETER) /
      2,
  ).toBe(BISCUIT_BOARD_V2_VIA_ANNULAR_RING_WIDTH)
  expect(errorsAndWarnings).toEqual([])
})

test("uses three-row corner fields at 2.5 mm pitch", () => {
  expect(BISCUIT_BOARD_V2_VIA_SPACING).toBe(2.5)
  expect(BISCUIT_BOARD_V2_CORNER_VIA_POSITIONS).toHaveLength(84)

  for (const xSign of [-1, 1] as const) {
    for (const ySign of [-1, 1] as const) {
      const cornerVias = BISCUIT_BOARD_V2_CORNER_VIA_POSITIONS.filter(
        ({ x, y }) => Math.sign(x) === xSign && Math.sign(y) === ySign,
      )
      expect(cornerVias).toHaveLength(21)

      const minimumPitch = Math.min(
        ...cornerVias.flatMap((via, viaIndex) =>
          cornerVias
            .slice(viaIndex + 1)
            .map((otherVia) =>
              Math.hypot(via.x - otherVia.x, via.y - otherVia.y),
            ),
        ),
      )
      expect(minimumPitch).toBeCloseTo(BISCUIT_BOARD_V2_VIA_SPACING, 6)
    }
  }
})

test("adds 5 x 4 via grids at the top and bottom center", () => {
  expect(BISCUIT_BOARD_V2_CENTER_VIA_HALF_WIDTH).toBe(5)
  expect(BISCUIT_BOARD_V2_CENTER_VIA_Y_INNER_OFFSET).toBe(18.7)
  expect(BISCUIT_BOARD_V2_CENTER_VIA_ZONES).toHaveLength(2)
  expect(BISCUIT_BOARD_V2_CENTER_VIA_POSITIONS).toHaveLength(40)
  expect(BISCUIT_BOARD_V2_VIA_POSITIONS).toHaveLength(124)

  for (const ySign of [-1, 1] as const) {
    const centerVias = BISCUIT_BOARD_V2_CENTER_VIA_POSITIONS.filter(
      ({ y }) => Math.sign(y) === ySign,
    )
    expect(centerVias).toHaveLength(20)
    expect(new Set(centerVias.map(({ x }) => x))).toEqual(
      new Set([-5, -2.5, 0, 2.5, 5]),
    )

    const minimumPitch = Math.min(
      ...centerVias.flatMap((via, viaIndex) =>
        centerVias
          .slice(viaIndex + 1)
          .map((otherVia) =>
            Math.hypot(via.x - otherVia.x, via.y - otherVia.y),
          ),
      ),
    )
    expect(minimumPitch).toBeCloseTo(BISCUIT_BOARD_V2_VIA_SPACING, 6)
  }
})
