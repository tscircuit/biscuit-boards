import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import { Stm32StepperBiscuitBoard } from "../examples/stm32-stepper-biscuit-board"
import {
  BISCUIT_BOARD_BOTTOM_KEEPOUT,
  BISCUIT_BOARD_VIA_POSITIONS,
} from "../lib/BiscuitBoard"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

test.skip("routes the STM32 stepper controller on BiscuitBoard", async () => {
  const circuit = new Circuit()
  circuit.add(<Stm32StepperBiscuitBoard />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter((element) => element.type.endsWith("error"))
  const board = circuitJson.find((element) => element.type === "pcb_board")
  const componentNames = new Set(
    circuitJson.flatMap((element) =>
      element.type === "source_component" && element.name ? [element.name] : [],
    ),
  )
  const traces = circuitJson.filter((element) => element.type === "pcb_trace")
  const vias = circuitJson.filter((element) => element.type === "pcb_via")
  const driver = circuitJson.find(
    (element) =>
      element.type === "source_component" && element.name === "U_DRIVER",
  )
  const motorConnector = circuitJson.find(
    (element) =>
      element.type === "source_component" && element.name === "J_MOTOR",
  )
  const powerConnector = circuitJson.find(
    (element) =>
      element.type === "source_component" && element.name === "J_PWR",
  )
  const powerLed = circuitJson.find(
    (element) =>
      element.type === "source_component" && element.name === "D_PWR",
  )
  const powerLedResistor = circuitJson.find(
    (element) =>
      element.type === "source_component" && element.name === "R_PWR_LED",
  )
  if (
    powerConnector?.type !== "source_component" ||
    powerLed?.type !== "source_component" ||
    powerLedResistor?.type !== "source_component"
  ) {
    throw new Error(
      "Power indicator or barrel jack source component is missing",
    )
  }
  const powerConnectorPcb = circuitJson.find(
    (element) =>
      element.type === "pcb_component" &&
      element.source_component_id === powerConnector.source_component_id,
  )
  const powerLedPcb = circuitJson.find(
    (element) =>
      element.type === "pcb_component" &&
      element.source_component_id === powerLed.source_component_id,
  )
  const powerLedResistorPcb = circuitJson.find(
    (element) =>
      element.type === "pcb_component" &&
      element.source_component_id === powerLedResistor.source_component_id,
  )
  if (
    powerConnectorPcb?.type !== "pcb_component" ||
    powerLedPcb?.type !== "pcb_component" ||
    powerLedResistorPcb?.type !== "pcb_component"
  ) {
    throw new Error("Power indicator or barrel jack PCB component is missing")
  }
  const powerConnectorBody = circuitJson.find(
    (element) =>
      element.type === "pcb_silkscreen_rect" &&
      element.pcb_component_id === powerConnectorPcb.pcb_component_id,
  )
  const allowedViaPositions = new Set(BISCUIT_BOARD_VIA_POSITIONS.map(pointKey))
  const swdioSourceTrace = circuitJson.find(
    (element) =>
      element.type === "source_trace" &&
      element.display_name === ".J_SWD > .SWDIO to .U_MCU > .SWDIO",
  )
  if (swdioSourceTrace?.type !== "source_trace") {
    throw new Error("SWDIO source trace is missing")
  }
  const swdioPcbTraces = circuitJson.filter(
    (element) =>
      element.type === "pcb_trace" &&
      element.source_trace_id === swdioSourceTrace.source_trace_id,
  )
  if (swdioPcbTraces.length === 0) {
    throw new Error("SWDIO PCB trace is missing")
  }
  const keepoutLeft =
    BISCUIT_BOARD_BOTTOM_KEEPOUT.x - BISCUIT_BOARD_BOTTOM_KEEPOUT.width / 2
  const keepoutRight =
    BISCUIT_BOARD_BOTTOM_KEEPOUT.x + BISCUIT_BOARD_BOTTOM_KEEPOUT.width / 2
  const keepoutBottom =
    BISCUIT_BOARD_BOTTOM_KEEPOUT.y - BISCUIT_BOARD_BOTTOM_KEEPOUT.height / 2
  const swdioSegmentsBelowKeepout = swdioPcbTraces.flatMap((trace) =>
    trace.type === "pcb_trace"
      ? trace.route.flatMap((end, index, route) => {
          const start = route[index - 1]
          if (
            start?.route_type !== "wire" ||
            end.route_type !== "wire" ||
            start.layer !== "top" ||
            end.layer !== "top" ||
            Math.max(start.x, end.x) < keepoutLeft ||
            Math.min(start.x, end.x) > keepoutRight ||
            Math.max(start.y, end.y) >= keepoutBottom
          ) {
            return []
          }
          return [{ start, end }]
        })
      : [],
  )
  const spiCsSourceTrace = circuitJson.find(
    (element) => element.type === "source_trace" && element.name === "SPI_CS",
  )
  if (spiCsSourceTrace?.type !== "source_trace") {
    throw new Error("SPI_CS source trace is missing")
  }
  const spiCsWirePoints = circuitJson.flatMap((element) =>
    element.type === "pcb_trace" &&
    element.source_trace_id === spiCsSourceTrace.source_trace_id
      ? element.route.filter((point) => point.route_type === "wire")
      : [],
  )

  expect(errors).toEqual([])
  expect(swdioSegmentsBelowKeepout.length).toBeGreaterThan(0)
  expect(
    swdioSegmentsBelowKeepout.every(
      ({ start, end }) => Math.min(start.width, end.width) >= 0.2,
    ),
  ).toBe(true)
  expect(
    swdioSegmentsBelowKeepout.every(
      ({ start, end }) => Math.max(start.y, end.y) <= -26.65,
    ),
  ).toBe(true)
  expect(spiCsWirePoints.length).toBeGreaterThan(0)
  expect(spiCsWirePoints.every((point) => point.width >= 0.2)).toBe(true)
  expect(board).toMatchObject({ width: 75, height: 55, num_layers: 2 })
  expect(driver).toMatchObject({
    manufacturer_part_number: "TMC5130A-TA",
  })
  expect(motorConnector).toMatchObject({
    manufacturer_part_number: "10129380-904001ALF",
  })
  expect(powerConnector).toMatchObject({
    manufacturer_part_number: "54-00164",
  })
  if (powerConnectorBody?.type !== "pcb_silkscreen_rect") {
    throw new Error("Barrel jack body is missing")
  }
  const barrelJackBodyBottom =
    powerConnectorBody.center.y - powerConnectorBody.height / 2
  for (const indicatorComponent of [powerLedPcb, powerLedResistorPcb]) {
    expect(
      indicatorComponent.center.y + indicatorComponent.height / 2,
    ).toBeLessThan(barrelJackBodyBottom - 0.5)
  }
  for (const name of [
    "U_MCU",
    "U_DRIVER",
    "J_SWD",
    "J_MOTOR",
    "J_PWR",
    "R_PWR_LED",
    "D_PWR",
  ]) {
    expect(componentNames.has(name)).toBe(true)
  }
  expect(traces.length).toBeGreaterThan(35)
  expect(vias).toHaveLength(BISCUIT_BOARD_VIA_POSITIONS.length)
  expect(
    vias.every(
      (via) => via.type === "pcb_via" && allowedViaPositions.has(pointKey(via)),
    ),
  ).toBe(true)
}, 120_000)
