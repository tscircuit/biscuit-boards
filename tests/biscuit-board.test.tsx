import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import {
  BISCUIT_BOARD_BOTTOM_KEEPOUT,
  BISCUIT_BOARD_HEIGHT,
  BISCUIT_BOARD_VIA_POSITIONS,
  BISCUIT_BOARD_WIDTH,
  BiscuitBoard,
} from "../lib/BiscuitBoard"

test("wraps ordinary TSX in the prefabricated board", async () => {
  const circuit = new Circuit()
  circuit.add(
    <BiscuitBoard routingDisabled>
      <chip name="U1" footprint="soic8" />
    </BiscuitBoard>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()
  const board = circuitJson.find((element) => element.type === "pcb_board")
  const vias = circuitJson.filter((element) => element.type === "pcb_via")
  const keepouts = circuitJson.filter(
    (element) => element.type === "pcb_keepout",
  )
  const copperPours = circuitJson.filter(
    (element) => element.type === "pcb_copper_pour",
  )

  expect(board).toMatchObject({
    width: BISCUIT_BOARD_WIDTH,
    height: BISCUIT_BOARD_HEIGHT,
    num_layers: 2,
  })
  expect(copperPours).toEqual([])
  expect(keepouts).toEqual([
    expect.objectContaining({
      type: "pcb_keepout",
      shape: "rect",
      center: {
        x: BISCUIT_BOARD_BOTTOM_KEEPOUT.x,
        y: BISCUIT_BOARD_BOTTOM_KEEPOUT.y,
      },
      width: BISCUIT_BOARD_BOTTOM_KEEPOUT.width,
      height: BISCUIT_BOARD_BOTTOM_KEEPOUT.height,
      layers: ["top", "bottom"],
    }),
  ])
  expect(vias).toHaveLength(BISCUIT_BOARD_VIA_POSITIONS.length)
  expect(
    vias.every(
      (via) =>
        via.type === "pcb_via" &&
        "net_is_assignable" in via &&
        via.net_is_assignable === true &&
        via.hole_diameter === 2.1 &&
        via.outer_diameter === 2.3,
    ),
  ).toBe(true)
  expect(
    circuitJson.some(
      (element) => element.type === "source_component" && element.name === "U1",
    ),
  ).toBe(true)
})
