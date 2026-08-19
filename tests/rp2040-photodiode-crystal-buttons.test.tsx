import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import { Rp2040PhotodiodeCrystalButtonsBiscuitBoard } from "../examples/rp2040-photodiode-crystal-buttons"
import { BISCUIT_BOARD_VIA_POSITIONS } from "../lib/BiscuitBoard"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

test("builds the RP2040 USB flash board with programming buttons", async () => {
  const circuit = new Circuit()
  circuit.add(<Rp2040PhotodiodeCrystalButtonsBiscuitBoard routingDisabled />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const componentNames = new Set(
    circuitJson
      .filter((element) => element.type === "source_component")
      .map((component) => component.name),
  )
  const traceNames = new Set(
    circuitJson
      .filter((element) => element.type === "source_trace")
      .map((trace) => trace.display_name),
  )
  const allowedViaPositions = new Set(BISCUIT_BOARD_VIA_POSITIONS.map(pointKey))
  const vias = circuitJson.filter((element) => element.type === "pcb_via")

  expect(componentNames.has("J_USB")).toBe(true)
  expect(componentNames.has("U1")).toBe(true)
  expect(componentNames.has("U_FLASH")).toBe(true)
  expect(componentNames.has("R_BOOTSEL")).toBe(true)
  expect(componentNames.has("SW_BOOTSEL")).toBe(true)
  expect(componentNames.has("SW_RESET")).toBe(true)
  expect(componentNames.has("D_POWER")).toBe(true)
  expect(componentNames.has("D_USER")).toBe(true)

  expect(traceNames.has(".R_BOOTSEL > .pin1 to net.QSPI_SS")).toBe(true)
  expect(traceNames.has(".R_BOOTSEL > .pin2 to net.BOOTSEL")).toBe(true)
  expect(traceNames.has(".SW_BOOTSEL > .A to net.BOOTSEL")).toBe(true)
  expect(traceNames.has(".SW_BOOTSEL > .B to net.GND")).toBe(true)
  expect(traceNames.has(".SW_RESET > .A to net.RUN")).toBe(true)
  expect(traceNames.has(".SW_RESET > .B to net.GND")).toBe(true)

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
