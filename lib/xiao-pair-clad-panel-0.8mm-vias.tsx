import type { PanelProps } from "@tscircuit/props"
import { XiaoCladWithPinHeaders08mmVias } from "./xiao-clad-0.8mm-vias"
import { XiaoCladWithPerforatedPinHeaders08mmVias } from "./xiao-clad-with-perforated-pin-headers-0.8mm-vias"

export const XIAO_PAIR_CLAD_PANEL_BOARD_GAP = 2
export const XIAO_PAIR_CLAD_PANEL_EDGE_PADDING = 3
export const XIAO_PAIR_CLAD_PANEL_TAB_WIDTH = 2

export interface XiaoPairCladPanel08mmViasProps {
  /** Defaults to routed tabs with mouse bites. */
  panelizationMethod?: PanelProps["panelizationMethod"]
  /** Adds perforations to the routed tab. Defaults to true. */
  mouseBites?: boolean
}

/** A standard and a perforated XIAO clad side by side. */
export const XiaoPairCladPanel08mmVias = ({
  panelizationMethod = "tab-routing",
  mouseBites = true,
}: XiaoPairCladPanel08mmViasProps) => (
  <panel
    name="XiaoPairCladPanel08mmVias"
    layoutMode="grid"
    row={1}
    col={2}
    boardGap={`${XIAO_PAIR_CLAD_PANEL_BOARD_GAP}mm`}
    edgePadding={`${XIAO_PAIR_CLAD_PANEL_EDGE_PADDING}mm`}
    panelizationMethod={panelizationMethod}
    tabWidth={`${XIAO_PAIR_CLAD_PANEL_TAB_WIDTH}mm`}
    mouseBites={mouseBites}
  >
    <XiaoCladWithPinHeaders08mmVias routingDisabled markHeadersNoConnect />
    <XiaoCladWithPerforatedPinHeaders08mmVias
      routingDisabled
      markHeadersNoConnect
    />
  </panel>
)
