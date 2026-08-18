import { expect, test } from "bun:test"
import type { PcbBoard } from "circuit-json"
import { getBoardsMissingFullCopperRegions } from "../scripts/lib/verify-full-copper-gerber"

const pcbBoard: PcbBoard = {
  type: "pcb_board",
  pcb_board_id: "pcb_board_0",
  center: { x: 0, y: 0 },
  width: 10,
  height: 6,
  thickness: 1.4,
  num_layers: 2,
  material: "fr4",
}

const makeGerber = (maxX: number) => `%FSLAX46Y46*%
G36*
X-5000000Y-3000000D02*
X${maxX * 1_000_000}Y-3000000D01*
X${maxX * 1_000_000}Y3000000D01*
X-5000000Y3000000D01*
X-5000000Y-3000000D01*
G37*
M02*`

test("accepts a solid Gerber region matching the complete board outline", () => {
  expect(getBoardsMissingFullCopperRegions(makeGerber(5), [pcbBoard])).toEqual(
    [],
  )
})

test("rejects a copper region that does not cover the complete board", () => {
  expect(
    getBoardsMissingFullCopperRegions(makeGerber(4), [pcbBoard]).map(
      (board) => board.pcb_board_id,
    ),
  ).toEqual(["pcb_board_0"])
})
