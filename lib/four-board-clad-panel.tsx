import type { PanelProps } from "@tscircuit/props"
import { ArduinoShieldClad } from "./ArduinoShieldClad"
import { BoosterPackClad } from "./BoosterPackClad"
import { BreadboardClad } from "./breadboard-clad"

export const FOUR_BOARD_CLAD_PANEL_BOARD_GAP = 2
export const FOUR_BOARD_CLAD_PANEL_EDGE_PADDING = 3
export const FOUR_BOARD_CLAD_PANEL_TAB_WIDTH = 2

export interface FourBoardCladPanelProps {
  /** Defaults to routed tabs with mouse bites. */
  panelizationMethod?: PanelProps["panelizationMethod"]
  /** Adds perforations to the routed tabs. Defaults to true. */
  mouseBites?: boolean
}

/** Two breadboards, one BoosterPack, and one Arduino shield in a 2x2 grid. */
export const FourBoardCladPanel = ({
  panelizationMethod = "tab-routing",
  mouseBites = true,
}: FourBoardCladPanelProps) => (
  <panel
    name="FourBoardCladPanel"
    layoutMode="grid"
    row={2}
    col={2}
    boardGap={`${FOUR_BOARD_CLAD_PANEL_BOARD_GAP}mm`}
    edgePadding={`${FOUR_BOARD_CLAD_PANEL_EDGE_PADDING}mm`}
    panelizationMethod={panelizationMethod}
    tabWidth={`${FOUR_BOARD_CLAD_PANEL_TAB_WIDTH}mm`}
    mouseBites={mouseBites}
  >
    <BreadboardClad routingDisabled markHeadersNoConnect />
    <BreadboardClad routingDisabled markHeadersNoConnect />
    <BoosterPackClad routingDisabled />
    <ArduinoShieldClad routingDisabled markHeadersNoConnect />
  </panel>
)
