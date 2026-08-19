import type { AutorouterProp, ConnectorProps } from "@tscircuit/props"
import { Fragment, type ReactNode } from "react"
import type { BiscuitBoardAutorouterOptions } from "./biscuit-board-autorouter"
import { createPrefabricatedViaAutorouter } from "./create-prefabricated-via-autorouter"

/** The classic Seeed Studio XIAO outline, with USB at the positive Y edge. */
export const XIAO_CLAD_WIDTH = 17.8
export const XIAO_CLAD_HEIGHT = 21
export const XIAO_HEADER_PITCH = 2.54
export const XIAO_HEADER_ROW_SPACING = 15.24
export const XIAO_HEADER_HOLE_DIAMETER = 1
export const XIAO_HEADER_PAD_DIAMETER = 1.7
export const XIAO_CLAD_VIA_HOLE_DIAMETER = 0.8
export const XIAO_CLAD_VIA_PAD_DIAMETER = 0.9
export const XIAO_CLAD_VIA_SPACING = 3
export const XIAO_CLAD_HEADER_CLEARANCE = 2
export const XIAO_CLAD_VIA_COLUMN_X =
  XIAO_HEADER_ROW_SPACING / 2 -
  XIAO_HEADER_PAD_DIAMETER / 2 -
  XIAO_CLAD_HEADER_CLEARANCE -
  XIAO_CLAD_VIA_PAD_DIAMETER / 2

const XIAO_CLAD_EDGE_CLEARANCE = 0.2
const XIAO_CLAD_EDGE_CLEARANCE_VALIDATION_TOLERANCE = 0.001

/** Two 1 x 6 via columns flanking the central component field. */
export const XIAO_CLAD_VIA_POSITIONS = [
  -XIAO_CLAD_VIA_COLUMN_X,
  XIAO_CLAD_VIA_COLUMN_X,
].flatMap((x) =>
  Array.from({ length: 6 }, (_, index) => ({
    x,
    y: Math.round((-7.5 + index * XIAO_CLAD_VIA_SPACING) * 1e6) / 1e6,
  })),
)

const xiaoHeaderYs = Array.from(
  { length: 7 },
  (_, index) => (3 - index) * XIAO_HEADER_PITCH,
)

export const XIAO_HEADER_POSITIONS = [
  ...xiaoHeaderYs.map((y) => ({ x: -XIAO_HEADER_ROW_SPACING / 2, y })),
  ...xiaoHeaderYs.map((y) => ({ x: XIAO_HEADER_ROW_SPACING / 2, y })),
]

export const XIAO_PIN_LABELS = {
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

export const XIAO_PIN_NAMES = Array.from(
  { length: 14 },
  (_, index) => `pin${index + 1}`,
)

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
    pinLabels={XIAO_PIN_LABELS}
    manufacturerPartNumber="GENERIC-XIAO-2X7-MALE-2.54MM-DOWN"
    footprint={<XiaoPinHeaderFootprint />}
    noSchematicRepresentation
    {...props}
  />
)

export interface XiaoCladWithPinHeaders08mmViasProps {
  children?: ReactNode
  autorouter?: AutorouterProp
  autorouterOptions?: BiscuitBoardAutorouterOptions
  minTraceWidth?: number
  nominalTraceWidth?: number
  routingDisabled?: boolean
  /** Marks every header pin NC for template previews and routing examples. */
  markHeadersNoConnect?: boolean
  /** Shows the USB-edge orientation mark. Defaults to true. */
  showUsbLabel?: boolean
}

export interface XiaoCladLayoutProps
  extends Omit<XiaoCladWithPinHeaders08mmViasProps, "markHeadersNoConnect"> {
  boardName: string
  boardTitle: string
  pinHeaders: ReactNode
  edgeFeatures?: ReactNode
}

export const XiaoCladLayout = ({
  boardName,
  boardTitle,
  pinHeaders,
  edgeFeatures,
  children,
  autorouter,
  autorouterOptions,
  minTraceWidth,
  nominalTraceWidth = 0.2,
  routingDisabled = false,
  showUsbLabel = true,
}: XiaoCladLayoutProps) => (
  <board
    name={boardName}
    title={boardTitle}
    width={`${XIAO_CLAD_WIDTH}mm`}
    height={`${XIAO_CLAD_HEIGHT}mm`}
    borderRadius="1mm"
    layers={2}
    minTraceWidth={`${minTraceWidth ?? 0.15}mm`}
    minBoardEdgeClearance={`${XIAO_CLAD_EDGE_CLEARANCE - XIAO_CLAD_EDGE_CLEARANCE_VALIDATION_TOLERANCE}mm`}
    minViaHoleDiameter="0.2mm"
    minViaPadDiameter="0.4mm"
    autorouter={
      autorouter ??
      createPrefabricatedViaAutorouter({
        width: XIAO_CLAD_WIDTH,
        height: XIAO_CLAD_HEIGHT,
        edgeClearance: XIAO_CLAD_EDGE_CLEARANCE,
        options: autorouterOptions,
        minimumTraceWidth: minTraceWidth,
        nominalTraceWidth,
      })
    }
    routingDisabled={routingDisabled}
  >
    {pinHeaders}
    {edgeFeatures}

    {showUsbLabel && (
      <silkscreentext
        text="UP"
        pcbX={0}
        pcbY={XIAO_CLAD_HEIGHT / 2 - 1.2}
        fontSize="0.7mm"
      />
    )}

    {XIAO_CLAD_VIA_POSITIONS.map((via) => (
      <Fragment key={`xiao-prefab-via-${via.x}-${via.y}`}>
        <via
          netIsAssignable
          pcbX={via.x}
          pcbY={via.y}
          fromLayer="top"
          toLayer="bottom"
          holeDiameter={`${XIAO_CLAD_VIA_HOLE_DIAMETER}mm`}
          outerDiameter={`${XIAO_CLAD_VIA_PAD_DIAMETER}mm`}
        />
      </Fragment>
    ))}

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

/** A two-layer copper clad matching the classic Seeed Studio XIAO outline. */
export const XiaoCladWithPinHeaders08mmVias = ({
  markHeadersNoConnect = false,
  ...props
}: XiaoCladWithPinHeaders08mmViasProps) => (
  <XiaoCladLayout
    {...props}
    boardName="XiaoCladWithPinHeaders08mmVias"
    boardTitle="XIAO form-factor copper clad with pin headers and 0.8 mm vias"
    pinHeaders={
      <XiaoPinHeaders
        name="J_XIAO"
        noConnect={markHeadersNoConnect ? XIAO_PIN_NAMES : undefined}
      />
    }
  />
)
