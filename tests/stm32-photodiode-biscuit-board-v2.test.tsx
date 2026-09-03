import { expect, test } from "bun:test"
import {
  checkEachPcbTraceNonOverlapping,
  checkPadTraceClearance,
  checkViaTraceClearance,
} from "@tscircuit/checks"
import { Circuit } from "@tscircuit/core"
import { Stm32PhotodiodeBiscuitBoardV2 } from "../examples/stm32-photodiode-biscuit-board-v2"
import {
  BISCUIT_BOARD_V2_VIA_POSITIONS,
  BISCUIT_BOARD_V2_WIDTH,
} from "../lib/biscuit-board-v2"

test("routes the STM32 photodiode circuit on BiscuitBoard V2", async () => {
  const circuit = new Circuit()
  circuit.add(<Stm32PhotodiodeBiscuitBoardV2 />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const board = circuitJson.find((element) => element.type === "pcb_board")
  const componentNames = new Set(
    circuitJson.flatMap((element) =>
      element.type === "source_component" && element.name ? [element.name] : [],
    ),
  )
  const errors = circuitJson.filter((element) => element.type.endsWith("error"))
  const clearanceErrors = [
    ...checkEachPcbTraceNonOverlapping(circuitJson, { minClearance: 0.075 }),
    ...checkPadTraceClearance(circuitJson, { minClearance: 0.075 }),
    ...checkViaTraceClearance(circuitJson, { minClearance: 0.075 }),
  ]

  expect(board).toMatchObject({
    width: BISCUIT_BOARD_V2_WIDTH,
    height: 55,
    num_layers: 2,
    min_trace_width: 0.15,
  })
  expect(errors).toEqual([])
  expect(clearanceErrors).toEqual([])
  expect(
    circuitJson.filter((element) => element.type === "pcb_via"),
  ).toHaveLength(BISCUIT_BOARD_V2_VIA_POSITIONS.length)
  for (const name of ["U_MCU", "J_SWD", "D_PHOTO", "U_TIA"])
    expect(componentNames.has(name)).toBe(true)
}, 15_000)
