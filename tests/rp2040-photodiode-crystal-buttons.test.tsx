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
  const pcbBoard = circuitJson.find((element) => element.type === "pcb_board")
  const sourceComponents = circuitJson.filter(
    (element) => element.type === "source_component",
  )
  const componentNames = new Set(
    sourceComponents.map((component) => component.name),
  )
  const traceNames = new Set(
    circuitJson
      .filter((element) => element.type === "source_trace")
      .map((trace) => trace.display_name),
  )
  const explicitTraceNames = new Set(
    circuitJson.flatMap((element) =>
      element.type === "source_trace" && element.name ? [element.name] : [],
    ),
  )
  const allowedViaPositions = new Set(BISCUIT_BOARD_VIA_POSITIONS.map(pointKey))
  const vias = circuitJson.filter((element) => element.type === "pcb_via")
  const assignableVias = vias.filter((via) => via.net_is_assignable === true)
  const photodiode = sourceComponents.find(
    (component) => component.name === "D_PHOTO",
  )
  const tia = sourceComponents.find((component) => component.name === "U_TIA")
  const photodiodePcbComponentId = circuitJson
    .flatMap((element) =>
      element.type === "pcb_component" &&
      element.source_component_id === photodiode?.source_component_id
        ? [element.pcb_component_id]
        : [],
    )
    .at(0)
  const photodiodePlatedHoles = circuitJson.filter(
    (element) =>
      element.type === "pcb_plated_hole" &&
      element.pcb_component_id === photodiodePcbComponentId,
  )
  const photodiodeSmtPads = circuitJson.filter(
    (element) =>
      element.type === "pcb_smtpad" &&
      element.pcb_component_id === photodiodePcbComponentId,
  )
  const bootselButton = circuitJson.find(
    (element) =>
      element.type === "source_component" && element.name === "SW_BOOTSEL",
  )
  if (bootselButton?.type !== "source_component") {
    throw new Error("BOOTSEL source component is missing")
  }
  const bootselPortsById = new Map(
    circuitJson.flatMap((element) =>
      element.type === "source_port" &&
      element.source_component_id === bootselButton.source_component_id
        ? [[element.source_port_id, element.pin_number] as const]
        : [],
    ),
  )
  const internallyConnectedPinPairs =
    bootselButton.internally_connected_source_port_ids
      ?.map((pair) =>
        pair
          .map((portId) => bootselPortsById.get(portId))
          .sort((a, b) => Number(a) - Number(b))
          .join("-"),
      )
      .sort()

  expect(componentNames.has("J_USB")).toBe(true)
  expect(pcbBoard?.type === "pcb_board" && pcbBoard.min_trace_width).toBe(0.15)
  expect(componentNames.has("U1")).toBe(true)
  expect(componentNames.has("U_FLASH")).toBe(true)
  expect(componentNames.has("R_BOOTSEL")).toBe(true)
  expect(componentNames.has("SW_BOOTSEL")).toBe(true)
  expect(componentNames.has("SW_RESET")).toBe(true)
  expect(componentNames.has("D_POWER")).toBe(true)
  expect(componentNames.has("D_USER")).toBe(true)
  expect(componentNames.has("R_XOUT")).toBe(true)
  expect(componentNames.has("C_VREG_IN")).toBe(true)
  expect(componentNames.has("C_IOVDD_TOP")).toBe(true)
  expect(componentNames.has("C_IOVDD_RIGHT")).toBe(true)
  expect(componentNames.has("C_IOVDD_BOTTOM")).toBe(true)
  expect(componentNames.has("C_USB_IOVDD")).toBe(true)
  expect(componentNames.has("C_TIA_SUPPLY")).toBe(true)
  expect(componentNames.has("R_3V3_REG_FEED")).toBe(true)
  expect(componentNames.has("R_3V3_FLASH_FEED")).toBe(true)
  expect(componentNames.has("R_3V3_STATUS_FEED")).toBe(true)
  expect(componentNames.has("R_3V3_ANALOG_FEED")).toBe(true)
  expect(photodiode?.manufacturer_part_number).toBe("BPW34")
  expect(tia?.manufacturer_part_number).toBe("OPA320AIDBVR")
  expect(photodiodePlatedHoles).toHaveLength(2)
  expect(photodiodeSmtPads).toHaveLength(0)
  expect(internallyConnectedPinPairs).toEqual(["1-3", "2-4"])

  expect(traceNames.has(".R_BOOTSEL > .pin1 to net.QSPI_SS")).toBe(true)
  expect(traceNames.has(".R_BOOTSEL > .pin2 to net.BOOTSEL")).toBe(true)
  expect(traceNames.has(".SW_BOOTSEL > .A to net.BOOTSEL")).toBe(true)
  expect(traceNames.has(".SW_BOOTSEL > .B_ALT to net.GND")).toBe(true)
  expect(traceNames.has(".SW_RESET > .A to net.RUN")).toBe(true)
  expect(traceNames.has(".SW_RESET > .B_ALT to net.GND")).toBe(true)
  expect(traceNames.has(".J_USB > .VBUS_A to net.VBUS")).toBe(true)
  expect(traceNames.has(".J_USB > .VBUS_B to net.VBUS")).toBe(true)
  expect(traceNames.has(".J_USB > .GND_A to net.GND")).toBe(true)
  expect(traceNames.has(".J_USB > .GND_B to net.GND")).toBe(true)
  for (const shield of ["SHIELD1", "SHIELD2", "SHIELD3", "SHIELD4"]) {
    expect(traceNames.has(`.J_USB > .${shield} to net.GND`)).toBe(true)
  }
  expect(explicitTraceNames.has("CLOCK_XOUT_SERIES_IN")).toBe(true)
  expect(traceNames.has(".U1 > .XIN to net.XIN")).toBe(true)
  expect(traceNames.has(".Y1 > .pin1 to net.XIN")).toBe(true)
  expect(traceNames.has(".R_XOUT > .pin2 to net.XOUT")).toBe(true)

  expect(assignableVias).toHaveLength(BISCUIT_BOARD_VIA_POSITIONS.length)
  expect(
    assignableVias.every(
      (via) => via.type === "pcb_via" && allowedViaPositions.has(pointKey(via)),
    ),
  ).toBe(true)
}, 10_000)

test.skip("routes every photodiode net on the RP2040 board", async () => {
  const circuit = new Circuit()
  circuit.add(<Rp2040PhotodiodeCrystalButtonsBiscuitBoard />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter((element) => element.type.endsWith("error"))
  const photodiodeNetIds = new Set(
    circuitJson.flatMap((element) =>
      element.type === "source_net" && element.name.startsWith("PD_")
        ? [element.source_net_id]
        : [],
    ),
  )
  const sourceTracesById = new Map(
    circuitJson.flatMap((element) =>
      element.type === "source_trace"
        ? [[element.source_trace_id, element] as const]
        : [],
    ),
  )
  const routedPhotodiodeNetIds = new Set(
    circuitJson.flatMap((element) => {
      if (element.type !== "pcb_trace" || !element.source_trace_id) return []

      const sourceTrace = sourceTracesById.get(element.source_trace_id)
      return (
        sourceTrace?.connected_source_net_ids?.filter((sourceNetId) =>
          photodiodeNetIds.has(sourceNetId),
        ) ?? []
      )
    }),
  )

  expect(errors).toEqual([])
  expect(photodiodeNetIds.size).toBe(3)
  expect(routedPhotodiodeNetIds).toEqual(photodiodeNetIds)
}, 120_000)
