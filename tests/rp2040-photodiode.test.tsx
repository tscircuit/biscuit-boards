import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import { Rp2040PhotodiodeBiscuitBoard } from "../examples/rp2040-photodiode"
import { BISCUIT_BOARD_VIA_POSITIONS } from "../lib/BiscuitBoard"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

test("builds the crystal-less RP2040 photodiode BiscuitBoard", async () => {
  const circuit = new Circuit()
  circuit.add(<Rp2040PhotodiodeBiscuitBoard routingDisabled />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const componentNames = new Set(
    circuitJson
      .filter((element) => element.type === "source_component")
      .map((component) => component.name),
  )
  const allowedViaPositions = new Set(BISCUIT_BOARD_VIA_POSITIONS.map(pointKey))
  const vias = circuitJson.filter((element) => element.type === "pcb_via")

  expect(componentNames.has("J_USB")).toBe(true)
  expect(componentNames.has("U1")).toBe(true)
  expect(componentNames.has("D_PHOTO")).toBe(true)
  expect(componentNames.has("U_TIA")).toBe(true)
  expect(componentNames.has("Y1")).toBe(false)
  expect(componentNames.has("C_XIN")).toBe(false)
  expect(componentNames.has("C_XOUT")).toBe(false)

  expect(vias).toHaveLength(BISCUIT_BOARD_VIA_POSITIONS.length)
  expect(
    vias.every(
      (via) =>
        via.type === "pcb_via" &&
        via.net_is_assignable === true &&
        allowedViaPositions.has(pointKey(via)),
    ),
  ).toBe(true)
})
