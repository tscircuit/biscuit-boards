import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import { Rp2040PhotodiodeCrystalBiscuitBoard } from "../examples/rp2040-photodiode-crystal"
import { BISCUIT_BOARD_VIA_POSITIONS } from "../lib/BiscuitBoard"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

test("builds the crystal-equipped RP2040 photodiode BiscuitBoard", async () => {
  const circuit = new Circuit()
  circuit.add(<Rp2040PhotodiodeCrystalBiscuitBoard routingDisabled />)
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
  expect(componentNames.has("D_PHOTO")).toBe(true)
  expect(componentNames.has("U_TIA")).toBe(true)
  expect(componentNames.has("Y1")).toBe(true)
  expect(componentNames.has("C_XIN")).toBe(true)
  expect(componentNames.has("C_XOUT")).toBe(true)
  expect(componentNames.has("R_USB_DM")).toBe(true)
  expect(componentNames.has("R_USB_DP")).toBe(true)
  expect(componentNames.has("U_FLASH")).toBe(true)
  expect(componentNames.has("C_FLASH")).toBe(true)
  expect(componentNames.has("R_POWER_LED")).toBe(true)
  expect(componentNames.has("D_POWER")).toBe(true)
  expect(componentNames.has("R_USER_LED")).toBe(true)
  expect(componentNames.has("D_USER")).toBe(true)
  expect(componentNames.has("SW_BOOTSEL")).toBe(false)

  expect(traceNames.has(".J_USB > .DP_A to net.USB_DP_CONN")).toBe(true)
  expect(traceNames.has(".R_USB_DP > .pin2 to net.USB_DP_MCU")).toBe(true)
  expect(traceNames.has(".U1 > .USB_DP to net.USB_DP_MCU")).toBe(true)
  expect(traceNames.has(".J_USB > .DN_A to net.USB_DM_CONN")).toBe(true)
  expect(traceNames.has(".R_USB_DM > .pin2 to net.USB_DM_MCU")).toBe(true)
  expect(traceNames.has(".U1 > .USB_DM to net.USB_DM_MCU")).toBe(true)
  expect(traceNames.has(".U1 > .QSPI_SS to net.QSPI_SS")).toBe(true)
  expect(traceNames.has(".U_FLASH > .CS to net.QSPI_SS")).toBe(true)

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
