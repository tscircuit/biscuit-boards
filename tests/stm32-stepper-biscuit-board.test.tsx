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
  const allowedViaPositions = new Set(BISCUIT_BOARD_VIA_POSITIONS.map(pointKey))

  expect(errors).toEqual([])
  expect(board).toMatchObject({ width: 75, height: 55, num_layers: 2 })
  expect(driver).toMatchObject({
    manufacturer_part_number: "TMC5130A-TA",
  })
  for (const name of ["U_MCU", "U_DRIVER", "J_SWD", "J_MOTOR", "J_PWR"]) {
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
