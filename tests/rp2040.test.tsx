import { expect, test } from "bun:test"
import {
  checkEachPcbTraceNonOverlapping,
  checkPadTraceClearance,
  checkViaTraceClearance,
} from "@tscircuit/checks"
import { Circuit } from "@tscircuit/core"
import { Rp2040BiscuitBoard } from "../examples/rp2040"
import { BISCUIT_BOARD_VIA_POSITIONS } from "../lib/BiscuitBoard"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

test("routes the common RP2040 design on the prefabricated BiscuitBoard", async () => {
  const circuit = new Circuit()
  circuit.add(<Rp2040BiscuitBoard />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter((element) => element.type.endsWith("error"))
  const traces = circuitJson.filter((element) => element.type === "pcb_trace")
  const routedPrefabVias = traces.flatMap((trace) =>
    trace.route.filter((point) => point.route_type === "via"),
  )
  const throughPadTransitions = traces.flatMap((trace) =>
    trace.route.filter((point) => point.route_type === "through_pad"),
  )
  const vias = circuitJson.filter((element) => element.type === "pcb_via")
  const pcbComponents = circuitJson.filter(
    (element) => element.type === "pcb_component",
  )
  const allowedViaPositions = new Set(BISCUIT_BOARD_VIA_POSITIONS.map(pointKey))
  const clearanceErrors = [
    ...checkEachPcbTraceNonOverlapping(circuitJson, { minClearance: 0.1 }),
    ...checkPadTraceClearance(circuitJson, { minClearance: 0.1 }),
    ...checkViaTraceClearance(circuitJson, { minClearance: 0.1 }),
  ]

  expect(errors).toEqual([])
  expect(clearanceErrors).toEqual([])
  expect(traces).toHaveLength(97)
  expect(routedPrefabVias.length).toBeGreaterThan(0)
  expect(
    routedPrefabVias.every((via) => allowedViaPositions.has(pointKey(via))),
  ).toBe(true)
  expect(throughPadTransitions).toEqual([])
  expect(
    traces.some((trace) =>
      trace.route.some((point, index) => {
        if (point.route_type !== "via") return false
        const before = trace.route[index - 1]
        const after = trace.route[index + 1]
        return (
          before?.route_type === "wire" &&
          after?.route_type === "wire" &&
          before.layer !== after.layer
        )
      }),
    ),
  ).toBe(true)
  expect(pcbComponents.length).toBeGreaterThan(20)
  expect(vias).toHaveLength(BISCUIT_BOARD_VIA_POSITIONS.length)
  expect(
    vias.every(
      (via) =>
        via.type === "pcb_via" &&
        via.net_is_assignable === true &&
        allowedViaPositions.has(pointKey(via)),
    ),
  ).toBe(true)
}, 360_000)
