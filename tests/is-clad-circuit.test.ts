import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { isCladCircuit } from "../scripts/lib/is-clad-circuit"

test("includes bare and populated clad circuits", () => {
  const bareClad = [
    {
      type: "source_board",
      source_board_id: "source_board_0",
      source_group_id: "source_group_0",
      title: "40 mm x 40 mm copper clad",
    },
  ] as CircuitJson
  const populatedClad = [
    ...bareClad,
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_0",
      source_component_id: "source_component_0",
      subcircuit_id: "subcircuit_0",
      center: { x: 0, y: 0 },
      width: 1,
      height: 1,
      layer: "top",
      rotation: 0,
    },
  ] as CircuitJson

  expect(isCladCircuit(bareClad)).toBe(true)
  expect(isCladCircuit(populatedClad)).toBe(true)
})

test("excludes circuits without a clad board", () => {
  const circuitJson = [
    {
      type: "source_board",
      source_board_id: "source_board_0",
      source_group_id: "source_group_0",
      title: "Standard FR4 board",
    },
  ] as CircuitJson

  expect(isCladCircuit(circuitJson)).toBe(false)
})
