import { expect, test } from "bun:test"
import {
  checkEachPcbTraceNonOverlapping,
  checkPadTraceClearance,
  checkViaTraceClearance,
} from "@tscircuit/checks"
import { Circuit } from "@tscircuit/core"
import { Stm32PhotodiodeBiscuitBoard } from "../examples/stm32-photodiode-biscuit-board"
import { BISCUIT_BOARD_VIA_POSITIONS } from "../lib/BiscuitBoard"

test("builds the STM32 photodiode board on the original BiscuitBoard", async () => {
  const circuit = new Circuit()
  circuit.add(<Stm32PhotodiodeBiscuitBoard />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter((element) => element.type.endsWith("error"))
  const componentNames = new Set(
    circuitJson.flatMap((element) =>
      element.type === "source_component" ? [element.name] : [],
    ),
  )
  const sourceTraceNames = new Set(
    circuitJson.flatMap((element) =>
      element.type === "source_trace" ? [element.name] : [],
    ),
  )
  const assignableVias = circuitJson.filter(
    (element) => element.type === "pcb_via" && element.net_is_assignable,
  )
  const clearanceErrors = [
    ...checkEachPcbTraceNonOverlapping(circuitJson, { minClearance: 0.2 }),
    ...checkPadTraceClearance(circuitJson, { minClearance: 0.2 }),
    ...checkViaTraceClearance(circuitJson, { minClearance: 0.2 }),
  ]

  expect(errors).toEqual([])
  expect(clearanceErrors).toEqual([])
  expect(componentNames.has("J_SWD")).toBe(true)
  expect(componentNames.has("U_MCU")).toBe(true)
  expect(componentNames.has("D_PHOTO")).toBe(true)
  expect(componentNames.has("U_TIA")).toBe(true)
  expect(sourceTraceNames.has("ADC_PA0")).toBe(true)
  expect(assignableVias).toHaveLength(BISCUIT_BOARD_VIA_POSITIONS.length)
}, 15_000)
