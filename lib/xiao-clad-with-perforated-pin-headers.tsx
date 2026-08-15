import type { ConnectorProps } from "@tscircuit/props"
import { Fragment } from "react"
import {
  XIAO_CLAD_WIDTH,
  XIAO_HEADER_HOLE_DIAMETER,
  XIAO_HEADER_POSITIONS,
  XIAO_PIN_LABELS,
  XIAO_PIN_NAMES,
  XiaoCladLayout,
  type XiaoCladWithPinHeadersProps,
} from "./xiao-clad"

export const XIAO_PERFORATED_HEADER_PAD_WIDTH = 2.13
export const XIAO_PERFORATED_HEADER_PAD_HEIGHT = 2
export const XIAO_PERFORATION_HOLE_DIAMETER = 0.7

export const XIAO_PERFORATION_POSITIONS = XIAO_HEADER_POSITIONS.map(
  (position) => ({
    x: Math.sign(position.x) * (XIAO_CLAD_WIDTH / 2),
    y: position.y,
  }),
)

const XiaoPerforatedPinHeaderFootprint = () => (
  <footprint insertionDirection="from_below">
    {XIAO_HEADER_POSITIONS.map((headerPosition, index) => {
      const side = Math.sign(headerPosition.x)
      const padCenterX =
        side * (XIAO_CLAD_WIDTH / 2 - XIAO_PERFORATED_HEADER_PAD_WIDTH / 2)

      return (
        <Fragment
          key={`xiao-perforated-header-${headerPosition.x}-${headerPosition.y}`}
        >
          <platedhole
            portHints={[`pin${index + 1}`]}
            shape="circular_hole_with_rect_pad"
            holeDiameter={`${XIAO_HEADER_HOLE_DIAMETER}mm`}
            rectPadWidth={`${XIAO_PERFORATED_HEADER_PAD_WIDTH}mm`}
            rectPadHeight={`${XIAO_PERFORATED_HEADER_PAD_HEIGHT}mm`}
            holeOffsetX={headerPosition.x - padCenterX}
            pcbX={padCenterX}
            pcbY={headerPosition.y}
          />
        </Fragment>
      )
    })}
  </footprint>
)

/** XIAO headers with an additional 0.7 mm perforation at each board edge. */
export const XiaoPerforatedPinHeaders = (props: ConnectorProps) => (
  <connector
    pinLabels={XIAO_PIN_LABELS}
    manufacturerPartNumber="GENERIC-XIAO-2X7-MALE-2.54MM-DOWN-PERFORATED"
    footprint={<XiaoPerforatedPinHeaderFootprint />}
    noSchematicRepresentation
    {...props}
  />
)

export type XiaoCladWithPerforatedPinHeadersProps = XiaoCladWithPinHeadersProps

/** A XIAO clad whose header pads include perforations along both side edges. */
export const XiaoCladWithPerforatedPinHeaders = ({
  markHeadersNoConnect = false,
  ...props
}: XiaoCladWithPerforatedPinHeadersProps) => (
  <XiaoCladLayout
    {...props}
    boardName="XiaoCladWithPerforatedPinHeaders"
    boardTitle="XIAO form-factor copper clad with perforated pin-header sides"
    pinHeaders={
      <XiaoPerforatedPinHeaders
        name="J_XIAO"
        noConnect={markHeadersNoConnect ? XIAO_PIN_NAMES : undefined}
      />
    }
    edgeFeatures={XIAO_PERFORATION_POSITIONS.map((position) => (
      <Fragment key={`xiao-edge-perforation-${position.x}-${position.y}`}>
        <cutout
          shape="circle"
          radius={`${XIAO_PERFORATION_HOLE_DIAMETER / 2}mm`}
          pcbX={position.x}
          pcbY={position.y}
        />
      </Fragment>
    ))}
  />
)
