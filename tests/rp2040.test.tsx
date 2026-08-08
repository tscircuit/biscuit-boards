import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import { Rp2040BiscuitBoard } from "../examples/rp2040"
import { BISCUIT_BOARD_VIA_POSITIONS } from "../lib/BiscuitBoard"

test("places the common RP2040 design on the prefabricated BiscuitBoard", async () => {
  const circuit = new Circuit()
  circuit.add(<Rp2040BiscuitBoard />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const vias = circuitJson.filter((element) => element.type === "pcb_via")
  const pcbComponents = circuitJson.filter(
    (element) => element.type === "pcb_component",
  )
  const placementOrRoutingErrors = circuitJson.filter(
    (element) =>
      element.type === "pcb_placement_error" ||
      element.type === "pcb_autorouting_error",
  )

  expect(placementOrRoutingErrors).toEqual([])
  expect(pcbComponents.length).toBeGreaterThan(20)
  expect(vias).toHaveLength(BISCUIT_BOARD_VIA_POSITIONS.length)
  expect(
    vias.every(
      (via) =>
        via.type === "pcb_via" &&
        via.net_is_assignable === true &&
        via.pcb_trace_id === undefined,
    ),
  ).toBe(true)
})
