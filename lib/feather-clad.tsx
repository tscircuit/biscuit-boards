import type { AutorouterProp, ConnectorProps } from "@tscircuit/props"
import { Fragment, type ReactNode } from "react"
import type { BiscuitBoardAutorouterOptions } from "./biscuit-board-autorouter"
import { createPrefabricatedViaAutorouter } from "./create-prefabricated-via-autorouter"

/** The classic Adafruit Feather outline, with USB at the positive Y edge. */
export const FEATHER_CLAD_WIDTH = 22.86
export const FEATHER_CLAD_HEIGHT = 50.8
export const FEATHER_HEADER_PITCH = 2.54
export const FEATHER_HEADER_ROW_SPACING = 20.32
export const FEATHER_HEADER_HOLE_DIAMETER = 1
export const FEATHER_HEADER_PAD_DIAMETER = 1.7
export const FEATHER_MOUNTING_HOLE_DIAMETER = 2.54
export const FEATHER_CLAD_VIA_HOLE_DIAMETER = 0.3
export const FEATHER_CLAD_VIA_PAD_DIAMETER = 0.6
export const FEATHER_CLAD_VIA_SPACING = 1.3

const FEATHER_CLAD_EDGE_CLEARANCE = 0.2
const FEATHER_CLAD_EDGE_CLEARANCE_VALIDATION_TOLERANCE = 0.001

/** Four 0.1 inch mounting holes inset 0.1 inch from each corner. */
export const FEATHER_MOUNTING_HOLE_POSITIONS = [-8.89, 8.89].flatMap((x) =>
  [-22.86, 22.86].map((y) => ({ x, y })),
)

const featherLeftHeaderYs = Array.from(
  { length: 16 },
  (_, index) => (7.5 - index) * FEATHER_HEADER_PITCH,
)

const featherRightHeaderYs = Array.from(
  { length: 12 },
  (_, index) => (3.5 - index) * FEATHER_HEADER_PITCH,
)

const featherViaYs = Array.from(
  { length: 31 },
  (_, index) =>
    Math.round((-19.5 + index * FEATHER_CLAD_VIA_SPACING) * 1e6) / 1e6,
)

/** Via columns flank the component field while preserving the header-free top right. */
export const FEATHER_CLAD_VIA_POSITIONS = [
  ...featherViaYs.map((y) => ({ x: -8, y })),
  ...featherViaYs
    .filter((y) => y <= featherRightHeaderYs[0]!)
    .map((y) => ({ x: 8, y })),
]

/** Header positions follow the standard Feather pinout with USB at positive Y. */
export const FEATHER_HEADER_POSITIONS = [
  ...featherLeftHeaderYs.map((y) => ({
    x: -FEATHER_HEADER_ROW_SPACING / 2,
    y,
  })),
  ...featherRightHeaderYs.map((y) => ({
    x: FEATHER_HEADER_ROW_SPACING / 2,
    y,
  })),
]

export const FEATHER_PIN_LABELS = {
  pin1: ["RST", "RESET"],
  pin2: ["V3V3", "3V3"],
  pin3: ["AREF"],
  pin4: ["GND"],
  pin5: ["A0"],
  pin6: ["A1"],
  pin7: ["A2"],
  pin8: ["A3"],
  pin9: ["A4", "D24"],
  pin10: ["A5", "D25"],
  pin11: ["SCK"],
  pin12: ["MOSI", "MO"],
  pin13: ["MISO", "MI"],
  pin14: ["RX", "D0"],
  pin15: ["TX", "D1"],
  pin16: ["FREE"],
  pin17: ["BAT", "VBAT"],
  pin18: ["EN"],
  pin19: ["USB", "VBUS"],
  pin20: ["D13"],
  pin21: ["D12"],
  pin22: ["D11"],
  pin23: ["D10"],
  pin24: ["D9"],
  pin25: ["D6"],
  pin26: ["D5"],
  pin27: ["SCL"],
  pin28: ["SDA"],
} as const

export const FEATHER_PIN_NAMES = Array.from(
  { length: 28 },
  (_, index) => `pin${index + 1}`,
)

const FeatherPinHeaderFootprint = () => (
  <footprint insertionDirection="from_below">
    {FEATHER_HEADER_POSITIONS.map((position, index) => (
      <Fragment key={`feather-header-${position.x}-${position.y}`}>
        {index === 0 ? (
          <platedhole
            portHints={[`pin${index + 1}`]}
            shape="circular_hole_with_rect_pad"
            holeDiameter={`${FEATHER_HEADER_HOLE_DIAMETER}mm`}
            rectPadWidth={`${FEATHER_HEADER_PAD_DIAMETER}mm`}
            rectPadHeight={`${FEATHER_HEADER_PAD_DIAMETER}mm`}
            pcbX={position.x}
            pcbY={position.y}
          />
        ) : (
          <platedhole
            portHints={[`pin${index + 1}`]}
            shape="circle"
            holeDiameter={`${FEATHER_HEADER_HOLE_DIAMETER}mm`}
            outerDiameter={`${FEATHER_HEADER_PAD_DIAMETER}mm`}
            pcbX={position.x}
            pcbY={position.y}
          />
        )}
      </Fragment>
    ))}
  </footprint>
)

export const FeatherPinHeaders = (props: ConnectorProps) => (
  <connector
    pinLabels={FEATHER_PIN_LABELS}
    manufacturerPartNumber="GENERIC-FEATHER-1X16-PLUS-1X12-MALE-2.54MM-DOWN"
    footprint={<FeatherPinHeaderFootprint />}
    noSchematicRepresentation
    {...props}
  />
)

export interface FeatherCladWithPinHeadersProps {
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

/** A two-layer copper clad matching the classic Adafruit Feather outline. */
export const FeatherCladWithPinHeaders = ({
  children,
  autorouter,
  autorouterOptions,
  minTraceWidth,
  nominalTraceWidth = 0.2,
  routingDisabled = false,
  markHeadersNoConnect = false,
  showUsbLabel = true,
}: FeatherCladWithPinHeadersProps) => (
  <board
    name="FeatherCladWithPinHeaders"
    title="Adafruit Feather form-factor copper clad with pin headers"
    width={`${FEATHER_CLAD_WIDTH}mm`}
    height={`${FEATHER_CLAD_HEIGHT}mm`}
    borderRadius="2.54mm"
    layers={2}
    minTraceWidth={`${minTraceWidth ?? 0.15}mm`}
    minBoardEdgeClearance={`${FEATHER_CLAD_EDGE_CLEARANCE - FEATHER_CLAD_EDGE_CLEARANCE_VALIDATION_TOLERANCE}mm`}
    minViaHoleDiameter="0.2mm"
    minViaPadDiameter="0.4mm"
    autorouter={
      autorouter ??
      createPrefabricatedViaAutorouter({
        width: FEATHER_CLAD_WIDTH,
        height: FEATHER_CLAD_HEIGHT,
        edgeClearance: FEATHER_CLAD_EDGE_CLEARANCE,
        options: autorouterOptions,
        minimumTraceWidth: minTraceWidth,
        nominalTraceWidth,
      })
    }
    routingDisabled={routingDisabled}
  >
    <FeatherPinHeaders
      name="J_FEATHER"
      noConnect={markHeadersNoConnect ? FEATHER_PIN_NAMES : undefined}
    />

    {FEATHER_MOUNTING_HOLE_POSITIONS.map((hole) => (
      <Fragment key={`feather-mounting-hole-${hole.x}-${hole.y}`}>
        <hole
          pcbX={hole.x}
          pcbY={hole.y}
          diameter={`${FEATHER_MOUNTING_HOLE_DIAMETER}mm`}
        />
      </Fragment>
    ))}

    {showUsbLabel && (
      <silkscreentext
        text="UP"
        pcbX={0}
        pcbY={FEATHER_CLAD_HEIGHT / 2 - 1.2}
        fontSize="0.7mm"
      />
    )}

    {FEATHER_CLAD_VIA_POSITIONS.map((via) => (
      <Fragment key={`feather-prefab-via-${via.x}-${via.y}`}>
        <via
          netIsAssignable
          pcbX={via.x}
          pcbY={via.y}
          fromLayer="top"
          toLayer="bottom"
          holeDiameter={`${FEATHER_CLAD_VIA_HOLE_DIAMETER}mm`}
          outerDiameter={`${FEATHER_CLAD_VIA_PAD_DIAMETER}mm`}
        />
      </Fragment>
    ))}

    <pcbnotedimension
      from={{
        x: -FEATHER_CLAD_WIDTH / 2,
        y: FEATHER_CLAD_HEIGHT / 2 + 2,
      }}
      to={{
        x: FEATHER_CLAD_WIDTH / 2,
        y: FEATHER_CLAD_HEIGHT / 2 + 2,
      }}
      text={`${FEATHER_CLAD_WIDTH}mm`}
    />
    <pcbnotedimension
      from={{
        x: FEATHER_CLAD_WIDTH / 2 + 2,
        y: -FEATHER_CLAD_HEIGHT / 2,
      }}
      to={{
        x: FEATHER_CLAD_WIDTH / 2 + 2,
        y: FEATHER_CLAD_HEIGHT / 2,
      }}
      text={`${FEATHER_CLAD_HEIGHT}mm`}
    />

    {children}
  </board>
)
