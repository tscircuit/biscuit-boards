import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import {
  CLAD_40X40_HEIGHT,
  CLAD_40X40_WIDTH,
  Clad40x40,
} from "../lib/Clad40x40"

test("renders a bare 40 mm x 40 mm clad", async () => {
  const circuit = new Circuit()
  circuit.add(<Clad40x40 routingDisabled />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const board = circuitJson.find((element) => element.type === "pcb_board")
  const components = circuitJson.filter(
    (element) =>
      element.type === "source_component" || element.type === "pcb_component",
  )
  const errorsAndWarnings = circuitJson.filter(
    (element) =>
      element.type.endsWith("error") || element.type.endsWith("warning"),
  )

  expect(board).toMatchObject({
    width: CLAD_40X40_WIDTH,
    height: CLAD_40X40_HEIGHT,
    num_layers: 2,
  })
  expect(components).toEqual([])
  expect(errorsAndWarnings).toEqual([])
})
