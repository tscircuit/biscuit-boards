import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import { Stm32StepperBiscuitBoard } from "../examples/stm32-stepper-biscuit-board"
import { BISCUIT_BOARD_VIA_POSITIONS } from "../lib/BiscuitBoard"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

test("routes the STM32 stepper controller on BiscuitBoard", async () => {
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

  expect(errors).toEqual([])
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
