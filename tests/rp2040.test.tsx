import { expect, test } from "bun:test"
import {
  checkEachPcbTraceNonOverlapping,
  checkPadTraceClearance,
  checkViaTraceClearance,
} from "@tscircuit/checks"
import { Circuit } from "@tscircuit/core"
import type {
  AnySourceComponent,
  PcbComponent,
  PcbCourtyardRect,
} from "circuit-json"
import { Rp2040BiscuitBoard } from "../examples/rp2040"
import {
  BISCUIT_BOARD_VIA_POSITIONS,
  BISCUIT_BOARD_WIDTH,
} from "../lib/BiscuitBoard"
import { getTraceWidthMetrics } from "./helpers/get-trace-width-metrics"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

test("routes the common RP2040 design on the prefabricated BiscuitBoard", async () => {
  const circuit = new Circuit()
  circuit.add(<Rp2040BiscuitBoard />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter((element) => element.type.endsWith("error"))
  const traces = circuitJson.filter((element) => element.type === "pcb_trace")
  const wireWidths = traces.flatMap((trace) =>
    trace.route
      .filter((point) => point.route_type === "wire")
      .map((point) => point.width),
  )
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
  const usbSourceComponent = circuitJson.find(
    (element) =>
      element.type === "source_component" && element.name === "J_USB",
  ) as AnySourceComponent | undefined
  const usbSourceComponentId =
    usbSourceComponent && "source_component_id" in usbSourceComponent
      ? usbSourceComponent.source_component_id
      : undefined
  const usbPcbComponent = circuitJson.find(
    (element) =>
      element.type === "pcb_component" &&
      element.source_component_id === usbSourceComponentId,
  ) as PcbComponent | undefined
  const usbCourtyard = circuitJson.find(
    (element) =>
      element.type === "pcb_courtyard_rect" &&
      element.pcb_component_id === usbPcbComponent?.pcb_component_id,
  ) as PcbCourtyardRect | undefined
  const allowedViaPositions = new Set(BISCUIT_BOARD_VIA_POSITIONS.map(pointKey))
  const clearanceErrors = [
    ...checkEachPcbTraceNonOverlapping(circuitJson, { minClearance: 0.1 }),
    ...checkPadTraceClearance(circuitJson, { minClearance: 0.1 }),
    ...checkViaTraceClearance(circuitJson, { minClearance: 0.1 }),
  ]
  const traceWidthMetrics = getTraceWidthMetrics(traces, 0.3)

  expect(errors).toEqual([])
  expect(clearanceErrors).toEqual([])
  expect(traces).toHaveLength(97)
  expect(Math.min(...wireWidths)).toBeGreaterThanOrEqual(0.2 - 1e-9)
  expect(traceWidthMetrics.nominalCoverage).toBeGreaterThan(0.8)
  expect(traceWidthMetrics.averageWidth).toBeGreaterThan(0.27)
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
  expect(usbCourtyard).toBeDefined()
  const courtyardRotation = ((usbCourtyard!.ccw_rotation ?? 0) * Math.PI) / 180
  const courtyardHalfWidth =
    (Math.abs(Math.cos(courtyardRotation)) * usbCourtyard!.width) / 2 +
    (Math.abs(Math.sin(courtyardRotation)) * usbCourtyard!.height) / 2
  const courtyardLeftEdge = usbCourtyard!.center.x - courtyardHalfWidth
  const courtyardOverhang = -BISCUIT_BOARD_WIDTH / 2 - courtyardLeftEdge
  expect(courtyardOverhang).toBeGreaterThan(0)
  expect(courtyardOverhang).toBeCloseTo(1.2, 3)
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
