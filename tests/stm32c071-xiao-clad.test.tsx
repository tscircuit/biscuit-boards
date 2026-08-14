import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import { Stm32c071XiaoClad } from "../examples/stm32c071-xiao-clad"
import { XIAO_CLAD_VIA_POSITIONS } from "../lib/XiaoClad"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

test("routes the STM32C071 circuit on the XIAO clad's fixed vias", async () => {
  const circuit = new Circuit()
  circuit.add(<Stm32c071XiaoClad />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const errorsAndWarnings = circuitJson.filter(
    (element) =>
      element.type.endsWith("error") || element.type.endsWith("warning"),
  )
  const traces = circuitJson.filter((element) => element.type === "pcb_trace")
  const vias = circuitJson.filter((element) => element.type === "pcb_via")
  const swdSource = circuitJson.find(
    (element) =>
      element.type === "source_component" && element.name === "J_SWD",
  )
  const swdSourceComponentId =
    swdSource?.type === "source_component"
      ? swdSource.source_component_id
      : undefined
  const swdPcbComponent = circuitJson.find(
    (element) =>
      element.type === "pcb_component" &&
      element.source_component_id === swdSourceComponentId,
  )
  const routedVias = traces.flatMap((trace) =>
    trace.route.filter((point) => point.route_type === "via"),
  )
  const allowedViaPositions = new Set(XIAO_CLAD_VIA_POSITIONS.map(pointKey))

  expect(errorsAndWarnings).toEqual([])
  expect(swdSource).toMatchObject({
    manufacturer_part_number: "BM05B-SURS-TF",
  })
  expect(swdPcbComponent).toMatchObject({
    display_offset_x: 0,
    display_offset_y: 7.2,
    layer: "top",
    insertion_direction: "from_above",
    width: 6.2,
  })
  expect(traces).toHaveLength(17)
  expect(vias).toHaveLength(XIAO_CLAD_VIA_POSITIONS.length)
  expect(routedVias.length).toBeGreaterThan(0)
  expect(
    routedVias.every((via) => allowedViaPositions.has(pointKey(via))),
  ).toBe(true)
  expect(
    vias.every(
      (via) =>
        via.type === "pcb_via" &&
        via.net_is_assignable === true &&
        via.hole_diameter === 0.3 &&
        via.outer_diameter === 0.4,
    ),
  ).toBe(true)
}, 15_000)
