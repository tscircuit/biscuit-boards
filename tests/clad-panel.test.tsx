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
import { CLAD_40X40_HEIGHT, CLAD_40X40_WIDTH } from "../lib/Clad40x40"
import {
  CLAD_PANEL_BOARD_GAP,
  CLAD_PANEL_EDGE_PADDING,
  CLAD_PANEL_XIAO_COUNT,
  CladPanel,
} from "../lib/CladPanel"
import { FEATHER_CLAD_HEIGHT, FEATHER_CLAD_WIDTH } from "../lib/feather-clad"
import { XIAO_CLAD_HEIGHT, XIAO_CLAD_WIDTH } from "../lib/xiao-clad"

test("panels the 40 mm clad in place of two XIAOs", async () => {
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
        BREADBOARD_CLAD_WIDTH,
        Math.max(
          CLAD_40X40_WIDTH,
          CLAD_PANEL_XIAO_COUNT * XIAO_CLAD_WIDTH +
            (CLAD_PANEL_XIAO_COUNT - 1) * CLAD_PANEL_BOARD_GAP,
        ) +
          CLAD_PANEL_BOARD_GAP +
          FEATHER_CLAD_WIDTH,
      ) +
      Math.max(ARDUINO_SHIELD_CLAD_WIDTH, BOOSTERPACK_CLAD_WIDTH) +
      CLAD_PANEL_BOARD_GAP +
      2 * CLAD_PANEL_EDGE_PADDING,
    height:
      Math.max(
        BREADBOARD_CLAD_HEIGHT +
          CLAD_PANEL_BOARD_GAP +
          Math.max(
            CLAD_40X40_HEIGHT + CLAD_PANEL_BOARD_GAP + XIAO_CLAD_HEIGHT,
            FEATHER_CLAD_HEIGHT,
          ),
        ARDUINO_SHIELD_CLAD_HEIGHT +
          BOOSTERPACK_CLAD_HEIGHT +
          CLAD_PANEL_BOARD_GAP,
      ) +
      2 * CLAD_PANEL_EDGE_PADDING,
  })
  expect(boards).toHaveLength(7)
  const boardTitles = circuitJson.flatMap((element) =>
    element.type === "source_board" ? [element.title] : [],
  )
  expect(
    boardTitles.filter((title) => title?.includes("perforated")),
  ).toHaveLength(1)
  expect(boardTitles.filter((title) => title?.includes("40 mm"))).toHaveLength(
    1,
  )
  expect(
    boardTitles.filter((title) => title?.includes("Feather")),
  ).toHaveLength(1)
  expect(boards.map((board) => [board.width, board.height])).toEqual([
    [BREADBOARD_CLAD_WIDTH, BREADBOARD_CLAD_HEIGHT],
    [CLAD_40X40_WIDTH, CLAD_40X40_HEIGHT],
    ...Array.from({ length: CLAD_PANEL_XIAO_COUNT }, () => [
      XIAO_CLAD_WIDTH,
      XIAO_CLAD_HEIGHT,
    ]),
    [FEATHER_CLAD_WIDTH, FEATHER_CLAD_HEIGHT],
    [BOOSTERPACK_CLAD_WIDTH, BOOSTERPACK_CLAD_HEIGHT],
    [ARDUINO_SHIELD_CLAD_WIDTH, ARDUINO_SHIELD_CLAD_HEIGHT],
  ])
  expect(boards[0]!.center.x).toBeCloseTo(-38.5, 6)
  expect(boards[0]!.center.y).toBe(32.5)

  expect(boards[1]!.center.x).toBeCloseTo(-50.93, 6)
  expect(boards[1]!.center.y).toBe(-40)

  const xiaoBoards = boards.slice(2, 2 + CLAD_PANEL_XIAO_COUNT)
  const expectedXiaoXs = [-60.83, -41.03]
  xiaoBoards.forEach((board, index) => {
    expect(board.center.x).toBeCloseTo(expectedXiaoXs[index]!, 6)
  })
  expect(xiaoBoards.every((board) => board.center.y === -7.5)).toBe(true)

  expect(boards[4]!.center.x).toBeCloseTo(-17.5, 6)
  expect(boards[4]!.center.y).toBe(-28.5)
  expect(boards[5]!.center.x).toBeCloseTo(38.5, 6)
  expect(boards[5]!.center.y).toBe(-28.5)
  expect(boards[6]!.center.x).toBeCloseTo(38.5, 6)
  expect(boards[6]!.center.y).toBe(28.5)
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
}, 60_000)
