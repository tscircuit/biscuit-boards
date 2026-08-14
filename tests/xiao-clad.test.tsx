import { expect, test } from "bun:test"
import {
  checkEachPcbTraceNonOverlapping,
  checkPadTraceClearance,
  checkViaTraceClearance,
} from "@tscircuit/checks"
import { Circuit } from "@tscircuit/core"
import { XiaoStm32Usb } from "../examples/xiao-stm32-usb"
import {
  XIAO_CLAD_HEIGHT,
  XIAO_CLAD_VIA_HOLE_DIAMETER,
  XIAO_CLAD_VIA_PAD_DIAMETER,
  XIAO_CLAD_VIA_POSITIONS,
  XIAO_CLAD_VIA_SPACING,
  XIAO_CLAD_WIDTH,
  XIAO_HEADER_HOLE_DIAMETER,
  XIAO_HEADER_PAD_DIAMETER,
  XIAO_HEADER_POSITIONS,
  XiaoCladWithPinHeaders,
} from "../lib/xiao-clad"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

const expectOneMillimeterViaColumns = (
  vias: Array<{ x: number; y: number }>,
) => {
  const columns = new Map<number, number[]>()
  for (const via of vias) {
    columns.set(via.x, [...(columns.get(via.x) ?? []), via.y])
  }

  expect(columns.size).toBe(2)
  expect([...columns.keys()].toSorted((a, b) => a - b)).toEqual([-5.8, 5.8])
  for (const ys of columns.values()) {
    const sortedYs = ys.toSorted((a, b) => a - b)
    expect(sortedYs).toHaveLength(13)
    expect(
      sortedYs.slice(1).every((y, index) => y - sortedYs[index]! === 1),
    ).toBe(true)
  }
}

test("adds the standard 2x7 XIAO pin-header geometry", async () => {
  const circuit = new Circuit()
  circuit.add(<XiaoCladWithPinHeaders routingDisabled markHeadersNoConnect />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const board = circuitJson.find((element) => element.type === "pcb_board")
  const platedHoles = circuitJson.filter(
    (element) => element.type === "pcb_plated_hole",
  )
  const vias = circuitJson.filter((element) => element.type === "pcb_via")
  const headerIds = new Set(
    circuitJson.flatMap((element) =>
      element.type === "source_component" && element.name === "J_XIAO"
        ? [element.source_component_id]
        : [],
    ),
  )
  const headerPortIds = circuitJson.flatMap((element) =>
    element.type === "source_port" &&
    element.source_component_id !== undefined &&
    headerIds.has(element.source_component_id)
      ? [element.source_port_id]
      : [],
  )
  const noConnectHeaderPortIds = circuitJson.flatMap((element) =>
    element.type === "source_port" &&
    element.source_component_id !== undefined &&
    headerIds.has(element.source_component_id) &&
    element.do_not_connect
      ? [element.source_port_id]
      : [],
  )
  const errorsAndWarnings = circuitJson.filter(
    (element) =>
      element.type.endsWith("error") || element.type.endsWith("warning"),
  )

  expect(board).toMatchObject({
    width: XIAO_CLAD_WIDTH,
    height: XIAO_CLAD_HEIGHT,
    num_layers: 2,
  })
  expect(platedHoles).toHaveLength(14)
  expect(vias).toHaveLength(XIAO_CLAD_VIA_POSITIONS.length)
  expect(new Set(vias.map(pointKey))).toEqual(
    new Set(XIAO_CLAD_VIA_POSITIONS.map(pointKey)),
  )
  expect(new Set(platedHoles.map(pointKey))).toEqual(
    new Set(XIAO_HEADER_POSITIONS.map(pointKey)),
  )
  expect(
    vias.every(
      (via) =>
        via.hole_diameter === XIAO_CLAD_VIA_HOLE_DIAMETER &&
        via.outer_diameter === XIAO_CLAD_VIA_PAD_DIAMETER,
    ),
  ).toBe(true)
  expect(
    platedHoles.every(
      (hole) =>
        "hole_diameter" in hole &&
        hole.hole_diameter === XIAO_HEADER_HOLE_DIAMETER &&
        (("outer_diameter" in hole &&
          hole.outer_diameter === XIAO_HEADER_PAD_DIAMETER) ||
          ("rect_pad_width" in hole &&
            "rect_pad_height" in hole &&
            hole.rect_pad_width === XIAO_HEADER_PAD_DIAMETER &&
            hole.rect_pad_height === XIAO_HEADER_PAD_DIAMETER)),
    ),
  ).toBe(true)
  expect(XIAO_CLAD_VIA_SPACING).toBe(1)
  expectOneMillimeterViaColumns(vias)
  expect(headerPortIds).toHaveLength(14)
  expect(noConnectHeaderPortIds).toHaveLength(14)
  expect(errorsAndWarnings).toEqual([])
})

test("routes STM32 USB through only the fixed XIAO via field", async () => {
  const circuit = new Circuit()
  circuit.add(<XiaoStm32Usb />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const errorsAndWarnings = circuitJson.filter(
    (element) =>
      element.type.endsWith("error") || element.type.endsWith("warning"),
  )
  const traces = circuitJson.filter((element) => element.type === "pcb_trace")
  const allowedViaPositions = new Set(XIAO_CLAD_VIA_POSITIONS.map(pointKey))
  const routedPrefabVias = traces.flatMap((trace) =>
    trace.route.filter((point) => point.route_type === "via"),
  )
  const clearanceErrors = [
    ...checkEachPcbTraceNonOverlapping(circuitJson, { minClearance: 0.1 }),
    ...checkPadTraceClearance(circuitJson, { minClearance: 0.1 }),
    ...checkViaTraceClearance(circuitJson, { minClearance: 0.1 }),
  ]

  expect(errorsAndWarnings).toEqual([])
  expect(clearanceErrors).toEqual([])
  expect(traces).toHaveLength(16)
  expect(routedPrefabVias).toHaveLength(2)
  expect(
    routedPrefabVias.every((via) => allowedViaPositions.has(pointKey(via))),
  ).toBe(true)
  expect(new Set(routedPrefabVias.map(pointKey))).toEqual(
    new Set(["-5.800,4.000", "5.800,-5.000"]),
  )
}, 30_000)
