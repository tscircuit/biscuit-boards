import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import {
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

  expect(board).toMatchObject({
    width: BISCUIT_BOARD_WIDTH,
    height: BISCUIT_BOARD_HEIGHT,
    num_layers: 2,
  })
  expect(vias).toHaveLength(BISCUIT_BOARD_VIA_POSITIONS.length)
  expect(
    vias.every(
      (via) =>
        via.type === "pcb_via" &&
        "net_is_assignable" in via &&
        via.net_is_assignable === true,
    ),
  ).toBe(true)
  expect(
    circuitJson.some(
      (element) => element.type === "source_component" && element.name === "U1",
    ),
  ).toBe(true)
})
