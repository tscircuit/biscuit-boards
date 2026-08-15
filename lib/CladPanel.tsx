import type { PanelProps } from "@tscircuit/props"
import {
  ARDUINO_SHIELD_CLAD_HEIGHT,
  ARDUINO_SHIELD_CLAD_WIDTH,
  ArduinoShieldClad,
} from "./ArduinoShieldClad"
import {
  BOOSTERPACK_CLAD_HEIGHT,
  BOOSTERPACK_CLAD_WIDTH,
  BoosterPackClad,
} from "./BoosterPackClad"
import {
  BREADBOARD_CLAD_HEIGHT,
  BREADBOARD_CLAD_WIDTH,
  BreadboardClad,
} from "./breadboard-clad"
import { CLAD_40X40_HEIGHT, CLAD_40X40_WIDTH, Clad40x40 } from "./Clad40x40"
import {
  FEATHER_CLAD_HEIGHT,
  FEATHER_CLAD_WIDTH,
  FeatherCladWithPinHeaders,
} from "./feather-clad"
import {
  XIAO_CLAD_HEIGHT,
  XIAO_CLAD_WIDTH,
  XiaoCladWithPinHeaders,
} from "./xiao-clad"
import { XiaoCladWithPerforatedPinHeaders } from "./xiao-clad-with-perforated-pin-headers"

export const CLAD_PANEL_BOARD_GAP = 2
export const CLAD_PANEL_EDGE_PADDING = 3
export const CLAD_PANEL_TAB_WIDTH = 2
export const CLAD_PANEL_XIAO_COUNT = 2

const CLAD_PANEL_XIAO_ROW_WIDTH =
  CLAD_PANEL_XIAO_COUNT * XIAO_CLAD_WIDTH +
  (CLAD_PANEL_XIAO_COUNT - 1) * CLAD_PANEL_BOARD_GAP
const CLAD_PANEL_XIAO_ROW_HEIGHT = XIAO_CLAD_HEIGHT
const CLAD_PANEL_SQUARE_COLUMN_WIDTH = Math.max(
  CLAD_40X40_WIDTH,
  CLAD_PANEL_XIAO_ROW_WIDTH,
)
const CLAD_PANEL_SQUARE_COLUMN_HEIGHT =
  CLAD_40X40_HEIGHT + CLAD_PANEL_BOARD_GAP + CLAD_PANEL_XIAO_ROW_HEIGHT
const CLAD_PANEL_LOWER_REGION_WIDTH =
  CLAD_PANEL_SQUARE_COLUMN_WIDTH + CLAD_PANEL_BOARD_GAP + FEATHER_CLAD_WIDTH
const CLAD_PANEL_LOWER_REGION_HEIGHT = Math.max(
  CLAD_PANEL_SQUARE_COLUMN_HEIGHT,
  FEATHER_CLAD_HEIGHT,
)
const CLAD_PANEL_LEFT_COLUMN_WIDTH = Math.max(
  BREADBOARD_CLAD_WIDTH,
  CLAD_PANEL_LOWER_REGION_WIDTH,
)
const CLAD_PANEL_LEFT_COLUMN_HEIGHT =
  BREADBOARD_CLAD_HEIGHT + CLAD_PANEL_BOARD_GAP + CLAD_PANEL_LOWER_REGION_HEIGHT
const CLAD_PANEL_LARGE_COLUMN_HEIGHT =
  ARDUINO_SHIELD_CLAD_HEIGHT + BOOSTERPACK_CLAD_HEIGHT + CLAD_PANEL_BOARD_GAP
const CLAD_PANEL_BREADBOARD_CENTER_Y =
  (CLAD_PANEL_LEFT_COLUMN_HEIGHT - BREADBOARD_CLAD_HEIGHT) / 2
const CLAD_PANEL_LOWER_REGION_CENTER_Y =
  -(CLAD_PANEL_LEFT_COLUMN_HEIGHT - CLAD_PANEL_LOWER_REGION_HEIGHT) / 2
const CLAD_PANEL_SQUARE_COLUMN_CENTER_X =
  -(CLAD_PANEL_LOWER_REGION_WIDTH - CLAD_PANEL_SQUARE_COLUMN_WIDTH) / 2
const CLAD_PANEL_XIAO_CENTER_Y =
  CLAD_PANEL_LOWER_REGION_CENTER_Y +
  (CLAD_PANEL_LOWER_REGION_HEIGHT - CLAD_PANEL_XIAO_ROW_HEIGHT) / 2
const CLAD_PANEL_XIAO_CENTER_XS = [-1, 1].map(
  (direction) =>
    CLAD_PANEL_SQUARE_COLUMN_CENTER_X +
    (direction * (XIAO_CLAD_WIDTH + CLAD_PANEL_BOARD_GAP)) / 2,
)
const CLAD_PANEL_40X40_CENTER_Y =
  CLAD_PANEL_LOWER_REGION_CENTER_Y -
  (CLAD_PANEL_LOWER_REGION_HEIGHT - CLAD_40X40_HEIGHT) / 2
const CLAD_PANEL_FEATHER_CENTER_X =
  (CLAD_PANEL_LOWER_REGION_WIDTH - FEATHER_CLAD_WIDTH) / 2

export interface CladPanelProps {
  /** Defaults to routed tabs with mouse bites. */
  panelizationMethod?: PanelProps["panelizationMethod"]
  /** Adds perforations to the routed tabs. Defaults to true. */
  mouseBites?: boolean
}

/** All clad variants, with the 40 mm square clad replacing two XIAOs. */
export const CladPanel = ({
  panelizationMethod = "tab-routing",
  mouseBites = true,
}: CladPanelProps) => (
  <panel
    name="CladPanel"
    layoutMode="grid"
    row={1}
    col={2}
    boardGap={`${CLAD_PANEL_BOARD_GAP}mm`}
    edgePadding={`${CLAD_PANEL_EDGE_PADDING}mm`}
    panelizationMethod={panelizationMethod}
    tabWidth={`${CLAD_PANEL_TAB_WIDTH}mm`}
    mouseBites={mouseBites}
  >
    <subpanel
      name="LeftCladColumn"
      layoutMode="none"
      width={`${CLAD_PANEL_LEFT_COLUMN_WIDTH}mm`}
      height={`${CLAD_PANEL_LEFT_COLUMN_HEIGHT}mm`}
      edgePadding="0mm"
    >
      <subpanel
        name="BreadboardSlot"
        layoutMode="grid"
        row={1}
        width={`${BREADBOARD_CLAD_WIDTH}mm`}
        height={`${BREADBOARD_CLAD_HEIGHT}mm`}
        pcbY={CLAD_PANEL_BREADBOARD_CENTER_Y}
        edgePadding="0mm"
      >
        <BreadboardClad routingDisabled markHeadersNoConnect />
      </subpanel>
      <subpanel
        name="Clad40x40Slot"
        layoutMode="grid"
        row={1}
        width={`${CLAD_40X40_WIDTH}mm`}
        height={`${CLAD_40X40_HEIGHT}mm`}
        pcbX={CLAD_PANEL_SQUARE_COLUMN_CENTER_X}
        pcbY={CLAD_PANEL_40X40_CENTER_Y}
        edgePadding="0mm"
      >
        <Clad40x40 routingDisabled />
      </subpanel>
      <subpanel
        name="StandardXiaoCladSlot"
        layoutMode="grid"
        row={1}
        width={`${XIAO_CLAD_WIDTH}mm`}
        height={`${XIAO_CLAD_HEIGHT}mm`}
        pcbX={CLAD_PANEL_XIAO_CENTER_XS[0]}
        pcbY={CLAD_PANEL_XIAO_CENTER_Y}
        edgePadding="0mm"
      >
        <XiaoCladWithPinHeaders routingDisabled markHeadersNoConnect />
      </subpanel>
      <subpanel
        name="PerforatedXiaoCladSlot"
        layoutMode="grid"
        row={1}
        width={`${XIAO_CLAD_WIDTH}mm`}
        height={`${XIAO_CLAD_HEIGHT}mm`}
        pcbX={CLAD_PANEL_XIAO_CENTER_XS[1]}
        pcbY={CLAD_PANEL_XIAO_CENTER_Y}
        edgePadding="0mm"
      >
        <XiaoCladWithPerforatedPinHeaders
          routingDisabled
          markHeadersNoConnect
        />
      </subpanel>
      <subpanel
        name="FeatherCladSlot"
        layoutMode="grid"
        row={1}
        width={`${FEATHER_CLAD_WIDTH}mm`}
        height={`${FEATHER_CLAD_HEIGHT}mm`}
        pcbX={CLAD_PANEL_FEATHER_CENTER_X}
        pcbY={CLAD_PANEL_LOWER_REGION_CENTER_Y}
        edgePadding="0mm"
      >
        <FeatherCladWithPinHeaders routingDisabled markHeadersNoConnect />
      </subpanel>
    </subpanel>
    <subpanel
      name="LargeCladColumn"
      layoutMode="grid"
      row={2}
      width={`${Math.max(ARDUINO_SHIELD_CLAD_WIDTH, BOOSTERPACK_CLAD_WIDTH)}mm`}
      height={`${CLAD_PANEL_LARGE_COLUMN_HEIGHT}mm`}
      boardGap={`${CLAD_PANEL_BOARD_GAP}mm`}
      edgePadding="0mm"
    >
      <BoosterPackClad routingDisabled />
      <ArduinoShieldClad routingDisabled markHeadersNoConnect />
    </subpanel>
  </panel>
)
