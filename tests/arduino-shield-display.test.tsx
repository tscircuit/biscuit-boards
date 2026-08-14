import { expect, test } from "bun:test"
import {
  checkEachPcbTraceNonOverlapping,
  checkPadTraceClearance,
  checkViaTraceClearance,
} from "@tscircuit/checks"
import { Circuit } from "@tscircuit/core"
import { Stm32c071DisplayArduinoShield } from "../examples/stm32c071-display-arduino-shield"
import { ARDUINO_SHIELD_CLAD_VIA_POSITIONS } from "../lib/ArduinoShieldClad"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

test("routes the STM32 display circuit on the Arduino shield clad", async () => {
  const circuit = new Circuit()
  circuit.add(<Stm32c071DisplayArduinoShield />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const errorsAndWarnings = circuitJson.filter(
    (element) =>
      element.type.endsWith("error") || element.type.endsWith("warning"),
  )
  const traces = circuitJson.filter((element) => element.type === "pcb_trace")
  const sourceTraces = circuitJson.filter(
    (element) => element.type === "source_trace",
  )
  const routedPrefabVias = traces.flatMap((trace) =>
    trace.route.filter((point) => point.route_type === "via"),
  )
  const allowedViaPositions = new Set(
    ARDUINO_SHIELD_CLAD_VIA_POSITIONS.map(pointKey),
  )
  const jPowerId = circuitJson
    .flatMap((element) =>
      element.type === "source_component" && element.name === "J_POWER"
        ? [element.source_component_id]
        : [],
    )
    .at(0)
  const poweredHeaderPortIds = new Set(
    circuitJson.flatMap((element) =>
      element.type === "source_port" &&
      element.source_component_id === jPowerId &&
      [4, 6].includes(element.pin_number ?? -1)
        ? [element.source_port_id]
        : [],
    ),
  )
  const tracedPortIds = new Set(
    sourceTraces.flatMap((trace) => trace.connected_source_port_ids),
  )
  const clearanceErrors = [
    ...checkEachPcbTraceNonOverlapping(circuitJson, { minClearance: 0.1 }),
    ...checkPadTraceClearance(circuitJson, { minClearance: 0.1 }),
    ...checkViaTraceClearance(circuitJson, { minClearance: 0.1 }),
  ]

  expect(errorsAndWarnings).toEqual([])
  expect(clearanceErrors).toEqual([])
  expect(traces).toHaveLength(35)
  expect(poweredHeaderPortIds.size).toBe(2)
  expect(
    [...poweredHeaderPortIds].every((portId) => tracedPortIds.has(portId)),
  ).toBe(true)
  expect(routedPrefabVias.length).toBeGreaterThan(0)
  expect(
    routedPrefabVias.every((via) => allowedViaPositions.has(pointKey(via))),
  ).toBe(true)
}, 60_000)
