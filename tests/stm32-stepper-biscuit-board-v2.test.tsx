import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import { Stm32StepperBiscuitBoardV2 } from "../examples/stm32-stepper-biscuit-board-v2"
import { STM32_STEPPER_V2_COMPONENT_POSITIONS } from "../examples/stm32-stepper-controller-circuit-v2"
import {
  BISCUIT_BOARD_V2_VIA_POSITIONS,
  BISCUIT_BOARD_V2_WIDTH,
} from "../lib/biscuit-board-v2"

test("places the existing STM32 stepper controller on BiscuitBoard V2", async () => {
  const circuit = new Circuit()
  circuit.add(<Stm32StepperBiscuitBoardV2 routingDisabled />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const board = circuitJson.find((element) => element.type === "pcb_board")
  const componentNames = new Set(
    circuitJson.flatMap((element) =>
      element.type === "source_component" && element.name ? [element.name] : [],
    ),
  )

  expect(board).toMatchObject({
    width: BISCUIT_BOARD_V2_WIDTH,
    height: 55,
    num_layers: 2,
    min_trace_width: 0.15,
  })
  expect(
    circuitJson.filter((element) => element.type === "pcb_via"),
  ).toHaveLength(BISCUIT_BOARD_V2_VIA_POSITIONS.length)
  for (const name of ["U_MCU", "U_DRIVER", "J_SWD", "J_MOTOR", "J_PWR"])
    expect(componentNames.has(name)).toBe(true)

  const sourceComponents = new Map(
    circuitJson.flatMap((element) =>
      element.type === "source_component" && element.name
        ? [[element.source_component_id, element.name] as const]
        : [],
    ),
  )
  const pcbComponentsByName = new Map(
    circuitJson.flatMap((element) =>
      element.type === "pcb_component"
        ? [
            [sourceComponents.get(element.source_component_id), element] as const,
          ]
        : [],
    ),
  )

  for (const [name, position] of Object.entries(
    STM32_STEPPER_V2_COMPONENT_POSITIONS,
  )) {
    expect(pcbComponentsByName.get(name)).toMatchObject({
      display_offset_x: position.x,
      display_offset_y: position.y,
    })
  }

  expect(
    circuitJson.filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
})
