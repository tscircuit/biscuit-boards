import type { AutorouterProp, ConnectorProps } from "@tscircuit/props"
import { Fragment, type ReactNode } from "react"

/** The classic Seeed Studio XIAO outline, with USB at the positive Y edge. */
export const XIAO_CLAD_WIDTH = 17.8
export const XIAO_CLAD_HEIGHT = 21
export const XIAO_HEADER_PITCH = 2.54
export const XIAO_HEADER_ROW_SPACING = 15.24
export const XIAO_HEADER_HOLE_DIAMETER = 1
export const XIAO_HEADER_PAD_DIAMETER = 1.7

const xiaoHeaderYs = Array.from(
  { length: 7 },
  (_, index) => (3 - index) * XIAO_HEADER_PITCH,
)

export const XIAO_HEADER_POSITIONS = [
  ...xiaoHeaderYs.map((y) => ({ x: -XIAO_HEADER_ROW_SPACING / 2, y })),
  ...xiaoHeaderYs.map((y) => ({ x: XIAO_HEADER_ROW_SPACING / 2, y })),
]

const xiaoPins = {
  pin1: ["D0", "A0"],
  pin2: ["D1", "A1"],
  pin3: ["D2", "A2"],
  pin4: ["D3", "A3"],
  pin5: ["D4", "SDA"],
  pin6: ["D5", "SCL"],
  pin7: ["D6", "TX"],
  pin8: ["V5", "5V"],
  pin9: ["GND"],
  pin10: ["V3V3", "3V3"],
  pin11: ["D10", "MOSI"],
  pin12: ["D9", "MISO"],
  pin13: ["D8", "SCK"],
  pin14: ["D7", "RX"],
} as const

const pinNames = Array.from({ length: 14 }, (_, index) => `pin${index + 1}`)

const XiaoPinHeaderFootprint = () => (
  <footprint insertionDirection="from_below">
    {XIAO_HEADER_POSITIONS.map((position, index) => (
      <Fragment key={`xiao-header-${position.x}-${position.y}`}>
        {index === 0 ? (
          <platedhole
            portHints={[`pin${index + 1}`]}
            shape="circular_hole_with_rect_pad"
            holeDiameter={`${XIAO_HEADER_HOLE_DIAMETER}mm`}
            rectPadWidth={`${XIAO_HEADER_PAD_DIAMETER}mm`}
            rectPadHeight={`${XIAO_HEADER_PAD_DIAMETER}mm`}
            pcbX={position.x}
            pcbY={position.y}
          />
        ) : (
          <platedhole
            portHints={[`pin${index + 1}`]}
            shape="circle"
            holeDiameter={`${XIAO_HEADER_HOLE_DIAMETER}mm`}
            outerDiameter={`${XIAO_HEADER_PAD_DIAMETER}mm`}
            pcbX={position.x}
            pcbY={position.y}
          />
        )}
      </Fragment>
    ))}
  </footprint>
)

export const XiaoPinHeaders = (props: ConnectorProps) => (
  <connector
    pinLabels={xiaoPins}
    manufacturerPartNumber="GENERIC-XIAO-2X7-MALE-2.54MM-DOWN"
    footprint={<XiaoPinHeaderFootprint />}
    noSchematicRepresentation
    {...props}
  />
)

export interface XiaoCladProps {
  children?: ReactNode
  autorouter?: AutorouterProp
  routingDisabled?: boolean
  /** Adds the classic 2x7, 2.54 mm pitch XIAO through-hole header pattern. */
  withPinHeaders?: boolean
  /** Marks every header pin NC for bare-template previews only. */
  markHeadersNoConnect?: boolean
}

/** A two-layer copper clad matching the classic Seeed Studio XIAO outline. */
export const XiaoClad = ({
  children,
  autorouter,
  routingDisabled = false,
  withPinHeaders = false,
  markHeadersNoConnect = false,
}: XiaoCladProps) => (
  <board
    name={withPinHeaders ? "XiaoCladWithPinHeaders" : "XiaoClad"}
    title={
      withPinHeaders
        ? "XIAO form-factor copper clad with pin headers"
        : "XIAO form-factor copper clad"
    }
    width={`${XIAO_CLAD_WIDTH}mm`}
    height={`${XIAO_CLAD_HEIGHT}mm`}
    borderRadius="1mm"
    layers={2}
    autorouter={autorouter}
    routingDisabled={routingDisabled}
  >
    {withPinHeaders && (
      <XiaoPinHeaders
        name="J_XIAO"
        noConnect={markHeadersNoConnect ? pinNames : undefined}
      />
    )}

    <silkscreentext
      text="USB"
      pcbX={0}
      pcbY={XIAO_CLAD_HEIGHT / 2 - 1.2}
      fontSize="0.7mm"
    />

    <pcbnotedimension
      from={{ x: -XIAO_CLAD_WIDTH / 2, y: XIAO_CLAD_HEIGHT / 2 + 2 }}
      to={{ x: XIAO_CLAD_WIDTH / 2, y: XIAO_CLAD_HEIGHT / 2 + 2 }}
      text={`${XIAO_CLAD_WIDTH}mm`}
    />
    <pcbnotedimension
      from={{ x: XIAO_CLAD_WIDTH / 2 + 2, y: -XIAO_CLAD_HEIGHT / 2 }}
      to={{ x: XIAO_CLAD_WIDTH / 2 + 2, y: XIAO_CLAD_HEIGHT / 2 }}
      text={`${XIAO_CLAD_HEIGHT}mm`}
    />

    {children}
  </board>
)

export type XiaoCladWithPinHeadersProps = Omit<XiaoCladProps, "withPinHeaders">

/** Convenience component for the populated-header XIAO clad variant. */
export const XiaoCladWithPinHeaders = (props: XiaoCladWithPinHeadersProps) => (
  <XiaoClad {...props} withPinHeaders />
)
