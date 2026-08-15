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
import { CLAD_32X32_HEIGHT, CLAD_32X32_WIDTH } from "../lib/Clad32x32"
import {
  CLAD_PANEL_BOARD_GAP,
  CLAD_PANEL_EDGE_PADDING,
  CLAD_PANEL_TAB_LENGTH,
  CLAD_PANEL_XIAO_COUNT,
  CladPanel,
} from "../lib/CladPanel"
import { FEATHER_CLAD_HEIGHT, FEATHER_CLAD_WIDTH } from "../lib/feather-clad"
import { XIAO_CLAD_HEIGHT, XIAO_CLAD_WIDTH } from "../lib/xiao-clad"

test("panels the clads with continuous cutouts and no tabs", async () => {
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
          CLAD_32X32_WIDTH,
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
            CLAD_32X32_HEIGHT + CLAD_PANEL_BOARD_GAP + XIAO_CLAD_HEIGHT,
            FEATHER_CLAD_HEIGHT,
          ),
        ARDUINO_SHIELD_CLAD_HEIGHT +
          BOOSTERPACK_CLAD_HEIGHT +
          CLAD_PANEL_BOARD_GAP,
      ) +
      2 * CLAD_PANEL_EDGE_PADDING,
  })
  expect(panel).toMatchObject({ width: 158, height: 118 })
  expect(boards).toHaveLength(7)
  const boardTitles = circuitJson.flatMap((element) =>
    element.type === "source_board" ? [element.title] : [],
  )
  expect(
    boardTitles.filter((title) => title?.includes("perforated")),
  ).toHaveLength(1)
  expect(boardTitles.filter((title) => title?.includes("32 mm"))).toHaveLength(
    1,
  )
  expect(boardTitles.filter((title) => title?.includes("40 mm"))).toHaveLength(
    0,
  )
  expect(
    boardTitles.filter((title) => title?.includes("Feather")),
  ).toHaveLength(1)
  expect(boards.map((board) => [board.width, board.height])).toEqual([
    [BREADBOARD_CLAD_WIDTH, BREADBOARD_CLAD_HEIGHT],
    [CLAD_32X32_WIDTH, CLAD_32X32_HEIGHT],
    ...Array.from({ length: CLAD_PANEL_XIAO_COUNT }, () => [
      XIAO_CLAD_WIDTH,
      XIAO_CLAD_HEIGHT,
    ]),
    [FEATHER_CLAD_WIDTH, FEATHER_CLAD_HEIGHT],
    [BOOSTERPACK_CLAD_WIDTH, BOOSTERPACK_CLAD_HEIGHT],
    [ARDUINO_SHIELD_CLAD_WIDTH, ARDUINO_SHIELD_CLAD_HEIGHT],
  ])
  expect(boards[0]!.center.x).toBeCloseTo(-38.5, 6)
  expect(boards[0]!.center.y).toBe(28.5)

  expect(boards[1]!.center.x).toBeCloseTo(-50.93, 6)
  expect(boards[1]!.center.y).toBe(-40)

  const xiaoBoards = boards.slice(2, 2 + CLAD_PANEL_XIAO_COUNT)
  const expectedXiaoXs = [-60.83, -41.03]
  xiaoBoards.forEach((board, index) => {
    expect(board.center.x).toBeCloseTo(expectedXiaoXs[index]!, 6)
  })
  expect(xiaoBoards.every((board) => board.center.y === -11.5)).toBe(true)

  expect(boards[4]!.center.x).toBeCloseTo(-18.7, 6)
  expect(boards[4]!.center.y).toBe(-28.5)
  expect(boards[5]!.center.x).toBeCloseTo(38.5, 6)
  expect(boards[5]!.center.y).toBe(-28.5)
  expect(boards[6]!.center.x).toBeCloseTo(38.5, 6)
  expect(boards[6]!.center.y).toBe(28.5)
  expect(circuitJson.some((element) => element.type === "pcb_cutout")).toBe(
    true,
  )
  const panelCutouts = circuitJson.flatMap((element) =>
    element.type === "pcb_cutout" &&
    element.shape === "rect" &&
    element.pcb_cutout_id.startsWith("panel_tab_")
      ? [element]
      : [],
  )
  expect(CLAD_PANEL_TAB_LENGTH).toBe(0)
  expect(panelCutouts.length).toBeGreaterThan(0)
  expect(panelCutouts.length % 2).toBe(0)

  for (let index = 0; index < panelCutouts.length; index += 2) {
    const firstCutout = panelCutouts[index]!
    const secondCutout = panelCutouts[index + 1]!
    const rotation = firstCutout.rotation ?? 0
    const angle = (rotation * Math.PI) / 180
    const deltaX = secondCutout.center.x - firstCutout.center.x
    const deltaY = secondCutout.center.y - firstCutout.center.y
    const distanceAlongCut = Math.abs(
      deltaX * Math.cos(angle) + deltaY * Math.sin(angle),
    )
    const distanceAcrossCut = Math.abs(
      -deltaX * Math.sin(angle) + deltaY * Math.cos(angle),
    )

    expect(secondCutout.rotation ?? 0).toBeCloseTo(rotation, 6)
    expect(distanceAlongCut).toBeCloseTo(
      (firstCutout.width + secondCutout.width) / 2,
      6,
    )
    expect(distanceAcrossCut).toBeCloseTo(0, 6)
  }
  expect(
    circuitJson.some(
      (element) =>
        element.type === "pcb_hole" &&
        element.pcb_hole_id.startsWith("panel_mouse_bite_"),
    ),
  ).toBe(false)
  expect(errors).toEqual([])
}, 60_000)
