import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import {
  ARDUINO_SHIELD_CLAD_HEIGHT,
  ARDUINO_SHIELD_CLAD_WIDTH,
} from "../lib/ArduinoShieldClad"
import {
  BOOSTERPACK_CLAD_HEIGHT,
  BOOSTERPACK_CLAD_WIDTH,
} from "../lib/BoosterPackClad"
import {
  BREADBOARD_CLAD_HEIGHT,
  BREADBOARD_CLAD_WIDTH,
} from "../lib/breadboard-clad"
import {
  CLAD_PANEL_BOARD_GAP,
  CLAD_PANEL_EDGE_PADDING,
  CLAD_PANEL_XIAO_COUNT,
  CladPanel,
} from "../lib/CladPanel"
import { XIAO_CLAD_HEIGHT, XIAO_CLAD_WIDTH } from "../lib/xiao-clad"

test("panels standard XIAOs below the breadboard and perforated XIAOs at the bottom", async () => {
  const circuit = new Circuit()
  circuit.add(<CladPanel />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const panel = circuitJson.find((element) => element.type === "pcb_panel")
  const boards = circuitJson.filter((element) => element.type === "pcb_board")
  const errors = circuitJson.filter((element) => element.type.endsWith("error"))

  expect(panel).toMatchObject({
    width:
      Math.max(
        CLAD_PANEL_XIAO_COUNT * XIAO_CLAD_WIDTH +
          (CLAD_PANEL_XIAO_COUNT - 1) * CLAD_PANEL_BOARD_GAP,
        BREADBOARD_CLAD_WIDTH,
      ) +
      Math.max(ARDUINO_SHIELD_CLAD_WIDTH, BOOSTERPACK_CLAD_WIDTH) +
      CLAD_PANEL_BOARD_GAP +
      2 * CLAD_PANEL_EDGE_PADDING,
    height:
      Math.max(
        BREADBOARD_CLAD_HEIGHT +
          2 * XIAO_CLAD_HEIGHT +
          2 * CLAD_PANEL_BOARD_GAP,
        ARDUINO_SHIELD_CLAD_HEIGHT +
          BOOSTERPACK_CLAD_HEIGHT +
          CLAD_PANEL_BOARD_GAP,
      ) +
      2 * CLAD_PANEL_EDGE_PADDING,
  })
  expect(boards).toHaveLength(11)
  const boardTitles = circuitJson.flatMap((element) =>
    element.type === "source_board" ? [element.title] : [],
  )
  expect(
    boardTitles.filter((title) => title?.includes("perforated")),
  ).toHaveLength(CLAD_PANEL_XIAO_COUNT)
  expect(boards.map((board) => [board.width, board.height])).toEqual([
    [BREADBOARD_CLAD_WIDTH, BREADBOARD_CLAD_HEIGHT],
    ...Array.from({ length: CLAD_PANEL_XIAO_COUNT }, () => [
      XIAO_CLAD_WIDTH,
      XIAO_CLAD_HEIGHT,
    ]),
    ...Array.from({ length: CLAD_PANEL_XIAO_COUNT }, () => [
      XIAO_CLAD_WIDTH,
      XIAO_CLAD_HEIGHT,
    ]),
    [BOOSTERPACK_CLAD_WIDTH, BOOSTERPACK_CLAD_HEIGHT],
    [ARDUINO_SHIELD_CLAD_WIDTH, ARDUINO_SHIELD_CLAD_HEIGHT],
  ])
  expect(boards[0]!.center.x).toBeCloseTo(-38.5, 6)
  expect(boards[0]!.center.y).toBe(28.5)

  const xiaoBoards = boards.slice(1, 1 + CLAD_PANEL_XIAO_COUNT)
  const perforatedXiaoBoards = boards.slice(
    1 + CLAD_PANEL_XIAO_COUNT,
    1 + 2 * CLAD_PANEL_XIAO_COUNT,
  )
  const expectedXiaoXs = [-68.2, -48.4, -28.6, -8.8]
  for (const row of [xiaoBoards, perforatedXiaoBoards]) {
    row.forEach((board, index) => {
      expect(board.center.x).toBeCloseTo(expectedXiaoXs[index]!, 6)
    })
  }
  expect(xiaoBoards.every((board) => board.center.y === -11.5)).toBe(true)
  expect(perforatedXiaoBoards.every((board) => board.center.y === -34.5)).toBe(
    true,
  )

  expect(boards[9]!.center.x).toBeCloseTo(39.6, 6)
  expect(boards[9]!.center.y).toBe(-28.5)
  expect(boards[10]!.center.x).toBeCloseTo(39.6, 6)
  expect(boards[10]!.center.y).toBe(28.5)
  expect(circuitJson.some((element) => element.type === "pcb_cutout")).toBe(
    true,
  )
  expect(
    circuitJson.some(
      (element) =>
        element.type === "pcb_hole" &&
        element.pcb_hole_id.startsWith("panel_mouse_bite_"),
    ),
  ).toBe(true)
  expect(errors).toEqual([])
}, 15_000)
