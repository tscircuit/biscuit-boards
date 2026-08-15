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
import { FEATHER_CLAD_WIDTH, FeatherCladWithPinHeaders } from "./feather-clad"
import {
  XIAO_CLAD_HEIGHT,
  XIAO_CLAD_WIDTH,
  XiaoCladWithPinHeaders,
} from "./xiao-clad"
import { XiaoCladWithPerforatedPinHeaders } from "./xiao-clad-with-perforated-pin-headers"

export const CLAD_PANEL_BOARD_GAP = 2
export const CLAD_PANEL_EDGE_PADDING = 3
export const CLAD_PANEL_TAB_WIDTH = 2
export const CLAD_PANEL_XIAO_COUNT = 4

const CLAD_PANEL_XIAO_ROW_WIDTH =
  CLAD_PANEL_XIAO_COUNT * XIAO_CLAD_WIDTH +
  (CLAD_PANEL_XIAO_COUNT - 1) * CLAD_PANEL_BOARD_GAP
const CLAD_PANEL_COLUMN_HEIGHT =
  ARDUINO_SHIELD_CLAD_HEIGHT + BOOSTERPACK_CLAD_HEIGHT + CLAD_PANEL_BOARD_GAP
const CLAD_PANEL_BREADBOARD_CENTER_Y =
  (CLAD_PANEL_COLUMN_HEIGHT - BREADBOARD_CLAD_HEIGHT) / 2
const CLAD_PANEL_STANDARD_XIAO_CENTER_Y =
  CLAD_PANEL_BREADBOARD_CENTER_Y -
  BREADBOARD_CLAD_HEIGHT / 2 -
  CLAD_PANEL_BOARD_GAP -
  XIAO_CLAD_HEIGHT / 2
const CLAD_PANEL_PERFORATED_XIAO_CENTER_Y =
  CLAD_PANEL_STANDARD_XIAO_CENTER_Y - XIAO_CLAD_HEIGHT - CLAD_PANEL_BOARD_GAP

export interface CladPanelProps {
  /** Defaults to routed tabs with mouse bites. */
  panelizationMethod?: PanelProps["panelizationMethod"]
  /** Adds perforations to the routed tabs. Defaults to true. */
  mouseBites?: boolean
}

/** All clad variants, with the Feather in a narrow third column. */
export const CladPanel = ({
  panelizationMethod = "tab-routing",
  mouseBites = true,
}: CladPanelProps) => (
  <panel
    name="CladPanel"
    layoutMode="grid"
    row={1}
    col={3}
    boardGap={`${CLAD_PANEL_BOARD_GAP}mm`}
    edgePadding={`${CLAD_PANEL_EDGE_PADDING}mm`}
    panelizationMethod={panelizationMethod}
    tabWidth={`${CLAD_PANEL_TAB_WIDTH}mm`}
    mouseBites={mouseBites}
  >
    <subpanel
      name="LeftCladColumn"
      layoutMode="none"
      width={`${CLAD_PANEL_XIAO_ROW_WIDTH}mm`}
      height={`${CLAD_PANEL_COLUMN_HEIGHT}mm`}
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
        name="XiaoCladRow"
        layoutMode="grid"
        row={1}
        width={`${CLAD_PANEL_XIAO_ROW_WIDTH}mm`}
        height={`${XIAO_CLAD_HEIGHT}mm`}
        pcbY={CLAD_PANEL_STANDARD_XIAO_CENTER_Y}
        boardGap={`${CLAD_PANEL_BOARD_GAP}mm`}
        edgePadding="0mm"
      >
        {Array.from({ length: CLAD_PANEL_XIAO_COUNT }, (_, index) => (
          <XiaoCladWithPinHeaders
            key={`xiao-clad-${index + 1}`}
            routingDisabled
            markHeadersNoConnect
          />
        ))}
      </subpanel>
      <subpanel
        name="PerforatedXiaoCladRow"
        layoutMode="grid"
        row={1}
        width={`${CLAD_PANEL_XIAO_ROW_WIDTH}mm`}
        height={`${XIAO_CLAD_HEIGHT}mm`}
        pcbY={CLAD_PANEL_PERFORATED_XIAO_CENTER_Y}
        boardGap={`${CLAD_PANEL_BOARD_GAP}mm`}
        edgePadding="0mm"
      >
        {Array.from({ length: CLAD_PANEL_XIAO_COUNT }, (_, index) => (
          <XiaoCladWithPerforatedPinHeaders
            key={`perforated-xiao-clad-${index + 1}`}
            routingDisabled
            markHeadersNoConnect
          />
        ))}
      </subpanel>
    </subpanel>
    <subpanel
      name="LargeCladColumn"
      layoutMode="grid"
      row={2}
      width={`${Math.max(ARDUINO_SHIELD_CLAD_WIDTH, BOOSTERPACK_CLAD_WIDTH)}mm`}
      height={`${CLAD_PANEL_COLUMN_HEIGHT}mm`}
      boardGap={`${CLAD_PANEL_BOARD_GAP}mm`}
      edgePadding="0mm"
    >
      <BoosterPackClad routingDisabled />
      <ArduinoShieldClad routingDisabled markHeadersNoConnect />
    </subpanel>
    <subpanel
      name="FeatherCladColumn"
      layoutMode="grid"
      row={1}
      width={`${FEATHER_CLAD_WIDTH}mm`}
      height={`${CLAD_PANEL_COLUMN_HEIGHT}mm`}
      edgePadding="0mm"
    >
      <FeatherCladWithPinHeaders routingDisabled markHeadersNoConnect />
    </subpanel>
  </panel>
)
