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
  const usbGroundTraceId = circuitJson
    .flatMap((element) =>
      element.type === "source_trace" && element.name === "USB_GND_BREAKOUT"
        ? [element.source_trace_id]
        : [],
    )
    .at(0)
  const usbGroundPcbTraceId = circuitJson
    .flatMap((element) =>
      element.type === "pcb_trace" &&
      element.source_trace_id === usbGroundTraceId
        ? [element.pcb_trace_id]
        : [],
    )
    .at(0)
  const usbGroundVias = vias.filter(
    (via) => via.pcb_trace_id === usbGroundPcbTraceId,
  )
  const assignableVias = vias.filter((via) => via.net_is_assignable === true)
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
  expect(componentNames.has("U1")).toBe(true)
  expect(componentNames.has("U_FLASH")).toBe(true)
  expect(componentNames.has("R_BOOTSEL")).toBe(true)
  expect(componentNames.has("SW_BOOTSEL")).toBe(true)
  expect(componentNames.has("SW_RESET")).toBe(true)
  expect(componentNames.has("D_POWER")).toBe(true)
  expect(componentNames.has("D_USER")).toBe(true)
  expect(internallyConnectedPinPairs).toEqual(["1-3", "2-4"])

  expect(traceNames.has(".R_BOOTSEL > .pin1 to net.QSPI_SS")).toBe(true)
  expect(traceNames.has(".R_BOOTSEL > .pin2 to net.BOOTSEL")).toBe(true)
  expect(traceNames.has(".SW_BOOTSEL > .A to net.BOOTSEL")).toBe(true)
  expect(traceNames.has(".SW_BOOTSEL > .B_ALT to net.GND")).toBe(true)
  expect(traceNames.has(".SW_RESET > .A to net.RUN")).toBe(true)
  expect(traceNames.has(".SW_RESET > .B_ALT to net.GND")).toBe(true)

  expect(usbGroundVias).toHaveLength(0)
  expect(assignableVias).toHaveLength(BISCUIT_BOARD_VIA_POSITIONS.length)
  expect(
    assignableVias.every(
      (via) => via.type === "pcb_via" && allowedViaPositions.has(pointKey(via)),
    ),
  ).toBe(true)
}, 10_000)

test("routes every photodiode net on the RP2040 board", async () => {
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
