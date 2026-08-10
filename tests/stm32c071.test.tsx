import { expect, test } from "bun:test"
import {
  checkEachPcbTraceNonOverlapping,
  checkPadTraceClearance,
  checkViaTraceClearance,
} from "@tscircuit/checks"
import { Circuit } from "@tscircuit/core"
import { Stm32c071BiscuitBoard } from "../examples/stm32c071"
import { BISCUIT_BOARD_VIA_POSITIONS } from "../lib/BiscuitBoard"
import { getTraceWidthMetrics } from "./helpers/get-trace-width-metrics"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

test("routes the STM32C071 example without manufacturing vias", async () => {
  const circuit = new Circuit()
  circuit.add(<Stm32c071BiscuitBoard />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter((element) => element.type.endsWith("error"))
  const traces = circuitJson.filter((element) => element.type === "pcb_trace")
  const allowedViaPositions = new Set(BISCUIT_BOARD_VIA_POSITIONS.map(pointKey))
  const vias = circuitJson.filter((element) => element.type === "pcb_via")
  const clearanceErrors = [
    ...checkEachPcbTraceNonOverlapping(circuitJson, { minClearance: 0.2 }),
    ...checkPadTraceClearance(circuitJson, { minClearance: 0.2 }),
    ...checkViaTraceClearance(circuitJson, { minClearance: 0.2 }),
  ]
  const traceWidthMetrics = getTraceWidthMetrics(traces, 0.3)

  expect(errors).toEqual([])
  expect(clearanceErrors).toEqual([])
  expect(traceWidthMetrics.nominalCoverage).toBeGreaterThan(0.8)
  expect(traceWidthMetrics.averageWidth).toBeGreaterThan(0.27)
  expect(traces).toHaveLength(17)
  expect(vias).toHaveLength(BISCUIT_BOARD_VIA_POSITIONS.length)
  expect(
    vias.every(
      (via) => via.type === "pcb_via" && allowedViaPositions.has(pointKey(via)),
    ),
  ).toBe(true)
}, 15_000)
