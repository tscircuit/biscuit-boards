import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import {
  XIAO_CLAD_HEIGHT,
  XIAO_CLAD_WIDTH,
  XIAO_HEADER_HOLE_DIAMETER,
  XIAO_HEADER_PAD_DIAMETER,
  XIAO_HEADER_POSITIONS,
  XiaoClad,
  XiaoCladWithPinHeaders,
} from "../lib/XiaoClad"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

test("creates the bare classic XIAO outline without header holes", async () => {
  const circuit = new Circuit()
  circuit.add(<XiaoClad routingDisabled />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const board = circuitJson.find((element) => element.type === "pcb_board")
  const platedHoles = circuitJson.filter(
    (element) => element.type === "pcb_plated_hole",
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
  expect(platedHoles).toEqual([])
  expect(errorsAndWarnings).toEqual([])
})

test("adds the standard 2x7 XIAO pin-header geometry", async () => {
  const circuit = new Circuit()
  circuit.add(<XiaoCladWithPinHeaders routingDisabled markHeadersNoConnect />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const platedHoles = circuitJson.filter(
    (element) => element.type === "pcb_plated_hole",
  )
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

  expect(platedHoles).toHaveLength(14)
  expect(new Set(platedHoles.map(pointKey))).toEqual(
    new Set(XIAO_HEADER_POSITIONS.map(pointKey)),
  )
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
  expect(headerPortIds).toHaveLength(14)
  expect(noConnectHeaderPortIds).toHaveLength(14)
  expect(errorsAndWarnings).toEqual([])
})
