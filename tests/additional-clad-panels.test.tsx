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
  FOUR_BOARD_CLAD_PANEL_BOARD_GAP,
  FOUR_BOARD_CLAD_PANEL_EDGE_PADDING,
  FourBoardCladPanel,
} from "../lib/four-board-clad-panel"
import { XIAO_CLAD_HEIGHT, XIAO_CLAD_WIDTH } from "../lib/xiao-clad"
import { XIAO_PERFORATION_HOLE_DIAMETER } from "../lib/xiao-clad-with-perforated-pin-headers"
import {
  XIAO_PAIR_CLAD_PANEL_BOARD_GAP,
  XIAO_PAIR_CLAD_PANEL_EDGE_PADDING,
  XiaoPairCladPanel,
} from "../lib/xiao-pair-clad-panel"

test("panels two breadboards with BoosterPack and Arduino clads", async () => {
  const circuit = new Circuit()
  circuit.add(<FourBoardCladPanel />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const panel = circuitJson.find((element) => element.type === "pcb_panel")
  const boards = circuitJson.filter((element) => element.type === "pcb_board")
  const titles = circuitJson.flatMap((element) =>
    element.type === "source_board" ? [element.title] : [],
  )
  const errors = circuitJson.filter((element) => element.type.endsWith("error"))

  expect(panel).toMatchObject({
    width:
      2 * BREADBOARD_CLAD_WIDTH +
      FOUR_BOARD_CLAD_PANEL_BOARD_GAP +
      2 * FOUR_BOARD_CLAD_PANEL_EDGE_PADDING,
    height:
      2 * BREADBOARD_CLAD_HEIGHT +
      FOUR_BOARD_CLAD_PANEL_BOARD_GAP +
      2 * FOUR_BOARD_CLAD_PANEL_EDGE_PADDING,
  })
  expect(boards).toHaveLength(4)
  expect(boards.map((board) => [board.width, board.height])).toEqual([
    [BREADBOARD_CLAD_WIDTH, BREADBOARD_CLAD_HEIGHT],
    [BREADBOARD_CLAD_WIDTH, BREADBOARD_CLAD_HEIGHT],
    [BOOSTERPACK_CLAD_WIDTH, BOOSTERPACK_CLAD_HEIGHT],
    [ARDUINO_SHIELD_CLAD_WIDTH, ARDUINO_SHIELD_CLAD_HEIGHT],
  ])
  expect(titles.filter((title) => title?.includes("breadboard"))).toHaveLength(
    2,
  )
  expect(titles.filter((title) => title?.includes("BoosterPack"))).toHaveLength(
    1,
  )
  expect(titles.filter((title) => title?.includes("Arduino"))).toHaveLength(1)
  expect(
    circuitJson.some(
      (element) =>
        element.type === "pcb_hole" &&
        element.pcb_hole_id.startsWith("panel_mouse_bite_"),
    ),
  ).toBe(true)
  expect(errors).toEqual([])
}, 30_000)

test("panels standard and perforated XIAO clads side by side", async () => {
  const circuit = new Circuit()
  circuit.add(<XiaoPairCladPanel />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const panel = circuitJson.find((element) => element.type === "pcb_panel")
  const boards = circuitJson.filter((element) => element.type === "pcb_board")
  const cutouts = circuitJson.filter(
    (element) => element.type === "pcb_cutout" && element.shape === "circle",
  )
  const errors = circuitJson.filter((element) => element.type.endsWith("error"))

  expect(panel).toMatchObject({
    width:
      2 * XIAO_CLAD_WIDTH +
      XIAO_PAIR_CLAD_PANEL_BOARD_GAP +
      2 * XIAO_PAIR_CLAD_PANEL_EDGE_PADDING,
    height: XIAO_CLAD_HEIGHT + 2 * XIAO_PAIR_CLAD_PANEL_EDGE_PADDING,
  })
  expect(boards).toHaveLength(2)
  expect(boards.map((board) => [board.width, board.height])).toEqual([
    [XIAO_CLAD_WIDTH, XIAO_CLAD_HEIGHT],
    [XIAO_CLAD_WIDTH, XIAO_CLAD_HEIGHT],
  ])
  expect(cutouts).toHaveLength(14)
  expect(
    cutouts.every(
      (cutout) => cutout.radius * 2 === XIAO_PERFORATION_HOLE_DIAMETER,
    ),
  ).toBe(true)
  expect(errors).toEqual([])
}, 15_000)
