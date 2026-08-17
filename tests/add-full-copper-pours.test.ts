import { expect, test } from "bun:test"
import type { CircuitJson, PcbBoard } from "circuit-json"
import { addFullCopperPours } from "../scripts/lib/add-full-copper-pours"

test("adds unsmasked top and bottom pours to every board", () => {
  const customOutline = [
    { x: 18, y: -2 },
    { x: 22, y: -2 },
    { x: 20, y: 2 },
  ]
  const pcbBoards: PcbBoard[] = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_a",
      center: { x: 0, y: 0 },
      width: 10,
      height: 6,
      thickness: 1.4,
      num_layers: 2,
      material: "fr4",
    },
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_b",
      center: { x: 20, y: 0 },
      width: 4,
      height: 4,
      thickness: 1.4,
      num_layers: 2,
      material: "fr4",
      outline: customOutline,
    },
  ]

  const fabricationCircuitJson = addFullCopperPours(pcbBoards as CircuitJson)
  const copperPours = fabricationCircuitJson.filter(
    (element) => element.type === "pcb_copper_pour" && element.shape === "brep",
  )

  expect(copperPours).toHaveLength(4)
  expect(copperPours.map((pour) => pour.layer)).toEqual([
    "top",
    "bottom",
    "top",
    "bottom",
  ])
  expect(copperPours.every((pour) => !pour.covered_with_solder_mask)).toBe(true)
  expect(copperPours[0]?.brep_shape.outer_ring.vertices).toEqual([
    { x: -5, y: -3 },
    { x: 5, y: -3 },
    { x: 5, y: 3 },
    { x: -5, y: 3 },
  ])
  expect(copperPours[2]?.brep_shape.outer_ring.vertices).toEqual(customOutline)
})
