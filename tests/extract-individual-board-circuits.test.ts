import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { extractIndividualBoardCircuits } from "../scripts/lib/extract-individual-board-circuits"

test("extracts each board and its descendant subcircuits without panel routing", () => {
  const circuitJson = [
    {
      type: "source_group",
      source_group_id: "source_group_panel",
      name: "Panel",
      is_subcircuit: true,
      subcircuit_id: "subcircuit_panel",
    },
    {
      type: "source_group",
      source_group_id: "source_group_board_a",
      parent_source_group_id: "source_group_panel",
      name: "BoardA",
      is_subcircuit: true,
      subcircuit_id: "subcircuit_board_a",
    },
    {
      type: "source_group",
      source_group_id: "source_group_child_a",
      parent_source_group_id: "source_group_board_a",
      name: "ChildA",
      is_subcircuit: true,
      subcircuit_id: "subcircuit_child_a",
    },
    {
      type: "source_group",
      source_group_id: "source_group_board_b",
      parent_source_group_id: "source_group_panel",
      name: "BoardB",
      is_subcircuit: true,
      subcircuit_id: "subcircuit_board_b",
    },
    {
      type: "source_board",
      source_board_id: "source_board_a",
      source_group_id: "source_group_board_a",
      title: "Repeated board",
    },
    {
      type: "source_board",
      source_board_id: "source_board_b",
      source_group_id: "source_group_board_b",
      title: "Repeated board",
    },
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_a",
      source_board_id: "source_board_a",
      center: { x: -10, y: 0 },
      width: 10,
      height: 10,
      thickness: 1.4,
      num_layers: 2,
      material: "fr4",
    },
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_b",
      source_board_id: "source_board_b",
      center: { x: 10, y: 0 },
      width: 10,
      height: 10,
      thickness: 1.4,
      num_layers: 2,
      material: "fr4",
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_child_a",
      source_component_id: "source_component_child_a",
      subcircuit_id: "subcircuit_child_a",
      center: { x: -10, y: 0 },
      width: 1,
      height: 1,
      layer: "top",
      rotation: 0,
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_b",
      source_component_id: "source_component_b",
      subcircuit_id: "subcircuit_board_b",
      center: { x: 10, y: 0 },
      width: 1,
      height: 1,
      layer: "top",
      rotation: 0,
    },
    {
      type: "pcb_panel",
      pcb_panel_id: "pcb_panel_0",
      center: { x: 0, y: 0 },
      width: 30,
      height: 20,
      thickness: 1.4,
    },
    {
      type: "pcb_cutout",
      pcb_cutout_id: "panel_tab_0",
      pcb_panel_id: "pcb_panel_0",
      shape: "rect",
      center: { x: 0, y: 0 },
      width: 2,
      height: 2,
    },
  ] as CircuitJson

  const boards = extractIndividualBoardCircuits(circuitJson)

  expect(boards.map((board) => board.fileStem)).toEqual([
    "01-repeated-board",
    "02-repeated-board",
  ])
  expect(
    boards[0]?.circuitJson.some(
      (element) =>
        element.type === "pcb_component" &&
        element.pcb_component_id === "pcb_component_child_a",
    ),
  ).toBe(true)
  expect(
    boards[0]?.circuitJson.some(
      (element) =>
        element.type === "pcb_component" &&
        element.pcb_component_id === "pcb_component_b",
    ),
  ).toBe(false)
  expect(
    boards.every((board) =>
      board.circuitJson.every(
        (element) =>
          element.type !== "pcb_panel" &&
          !(
            element.type === "pcb_cutout" &&
            element.pcb_cutout_id === "panel_tab_0"
          ),
      ),
    ),
  ).toBe(true)
})
