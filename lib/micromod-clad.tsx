import type { AutorouterProp, ConnectorProps } from "@tscircuit/props"
import { Fragment, type ReactNode } from "react"
import type { BiscuitBoardAutorouterOptions } from "./biscuit-board-autorouter"
import { createPrefabricatedViaAutorouter } from "./create-prefabricated-via-autorouter"

/** SparkFun MicroMod processor-card dimensions and M.2 E-key geometry. */
export const MICROMOD_CLAD_WIDTH = 22
export const MICROMOD_CLAD_HEIGHT = 22
export const MICROMOD_CLAD_THICKNESS = 0.8
export const MICROMOD_M2_CONTACT_PITCH = 0.5
export const MICROMOD_M2_CONTACT_WIDTH = 0.35
export const MICROMOD_M2_SOLDER_PASTE_MARGIN = -MICROMOD_M2_CONTACT_WIDTH / 2
export const MICROMOD_M2_TOP_CONTACT_HEIGHT = 1.45
export const MICROMOD_M2_BOTTOM_CONTACT_HEIGHT = 1.95
export const MICROMOD_M2_KEY_START_CONTACT = 24
export const MICROMOD_M2_KEY_END_CONTACT = 31
export const MICROMOD_M2_KEY_CENTER_X = 2.625
export const MICROMOD_M2_KEY_WIDTH = 1.2
export const MICROMOD_M2_KEY_DEPTH = 3.5
export const MICROMOD_MOUNTING_NOTCH_CENTER_X = 4
export const MICROMOD_MOUNTING_NOTCH_RADIUS = 1.75
export const MICROMOD_CLAD_VIA_HOLE_DIAMETER = 0.3
export const MICROMOD_CLAD_VIA_PAD_DIAMETER = 0.6
export const MICROMOD_CLAD_VIA_SPACING = 1.3

const MICROMOD_CLAD_EDGE_CLEARANCE = 0.2
const MICROMOD_CLAD_EDGE_CLEARANCE_VALIDATION_TOLERANCE = 0.001
const MICROMOD_M2_CARD_EDGE_Y = -MICROMOD_CLAD_HEIGHT / 2

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, index) => start + index)

const sampleArc = ({
  centerX,
  centerY,
  radius,
  startDegrees,
  endDegrees,
  segments,
}: {
  centerX: number
  centerY: number
  radius: number
  startDegrees: number
  endDegrees: number
  segments: number
}) =>
  Array.from({ length: segments + 1 }, (_, index) => {
    const angle =
      ((startDegrees + ((endDegrees - startDegrees) * index) / segments) *
        Math.PI) /
      180
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    }
  })

/**
 * Processor-card outline based on SparkFun's M.2-CARD-E-22 footprint.
 * The contact-edge key and the offset retention-screw notch are part of the
 * routed perimeter rather than internal drill features.
 */
export const MICROMOD_CLAD_OUTLINE = [
  { x: -9.925, y: -11 },
  { x: 2.025, y: -11 },
  { x: 2.025, y: -8.1 },
  ...sampleArc({
    centerX: MICROMOD_M2_KEY_CENTER_X,
    centerY: -8.1,
    radius: MICROMOD_M2_KEY_WIDTH / 2,
    startDegrees: 180,
    endDegrees: 0,
    segments: 8,
  }).slice(1),
  { x: 3.225, y: -11 },
  { x: 9.925, y: -11 },
  ...sampleArc({
    centerX: 10.425,
    centerY: -7.5,
    radius: 0.5,
    startDegrees: 180,
    endDegrees: 90,
    segments: 4,
  }).slice(1),
  ...sampleArc({
    centerX: 10.425,
    centerY: -6.425,
    radius: 0.575,
    startDegrees: -90,
    endDegrees: 0,
    segments: 4,
  }).slice(1),
  { x: 11, y: 10 },
  ...sampleArc({
    centerX: 10,
    centerY: 10,
    radius: 1,
    startDegrees: 0,
    endDegrees: 90,
    segments: 6,
  }).slice(1),
  { x: 5.75, y: 11 },
  ...sampleArc({
    centerX: MICROMOD_MOUNTING_NOTCH_CENTER_X,
    centerY: 11,
    radius: MICROMOD_MOUNTING_NOTCH_RADIUS,
    startDegrees: 0,
    endDegrees: -180,
    segments: 12,
  }).slice(1),
  { x: -10, y: 11 },
  ...sampleArc({
    centerX: -10,
    centerY: 10,
    radius: 1,
    startDegrees: 90,
    endDegrees: 180,
    segments: 6,
  }).slice(1),
  { x: -11, y: -6.425 },
  ...sampleArc({
    centerX: -10.425,
    centerY: -6.425,
    radius: 0.575,
    startDegrees: 180,
    endDegrees: 270,
    segments: 4,
  }).slice(1),
  ...sampleArc({
    centerX: -10.425,
    centerY: -7.5,
    radius: 0.5,
    startDegrees: 90,
    endDegrees: 0,
    segments: 4,
  }).slice(1),
]

export const MICROMOD_M2_CONTACT_NUMBERS = [...range(1, 23), ...range(32, 75)]

export interface MicroModM2EdgeContact {
  contactNumber: number
  x: number
  y: number
  width: number
  height: number
  layer: "top" | "bottom"
}

export const MICROMOD_M2_EDGE_CONTACTS: MicroModM2EdgeContact[] =
  MICROMOD_M2_CONTACT_NUMBERS.map((contactNumber) => {
    const isTop = contactNumber % 2 === 1
    return {
      contactNumber,
      x: 9.5 - contactNumber * (MICROMOD_M2_CONTACT_PITCH / 2),
      y: MICROMOD_M2_CARD_EDGE_Y + (isTop ? 1.275 : 1.525),
      width: MICROMOD_M2_CONTACT_WIDTH,
      height: isTop
        ? MICROMOD_M2_TOP_CONTACT_HEIGHT
        : MICROMOD_M2_BOTTOM_CONTACT_HEIGHT,
      layer: isTop ? "top" : "bottom",
    }
  })

export const MICROMOD_M2_KEY_PIN_NAMES = range(
  MICROMOD_M2_KEY_START_CONTACT,
  MICROMOD_M2_KEY_END_CONTACT,
).map((contactNumber) => `pin${contactNumber}`)

export const MICROMOD_M2_PIN_NAMES = range(1, 75).map(
  (contactNumber) => `pin${contactNumber}`,
)

/** Signal names follow SparkFun's MicroMod processor interface v1.0. */
export const MICROMOD_M2_PIN_LABELS = {
  pin1: ["M2_1", "GND_1"],
  pin2: ["M2_2", "V3V3_2"],
  pin3: ["M2_3", "USB_DPLUS"],
  pin4: ["M2_4", "V3V3_EN"],
  pin5: ["M2_5", "USB_DMINUS"],
  pin6: ["M2_6", "RESET"],
  pin7: ["M2_7", "GND_7"],
  pin8: ["M2_8", "G11"],
  pin9: ["M2_9", "USB_VIN"],
  pin10: ["M2_10", "D0"],
  pin11: ["M2_11", "BOOT"],
  pin12: ["M2_12", "I2C_SDA"],
  pin13: ["M2_13", "RTS1"],
  pin14: ["M2_14", "I2C_SCL"],
  pin15: ["M2_15", "CTS1"],
  pin16: ["M2_16", "I2C_INT"],
  pin17: ["M2_17", "TX1"],
  pin18: ["M2_18", "D1", "CAM_TRIG"],
  pin19: ["M2_19", "RX1"],
  pin20: ["M2_20", "RX2"],
  pin21: ["M2_21", "SWDCK"],
  pin22: ["M2_22", "TX2"],
  pin23: ["M2_23", "SWDIO"],
  pin24: ["M2_24_KEY"],
  pin25: ["M2_25_KEY"],
  pin26: ["M2_26_KEY"],
  pin27: ["M2_27_KEY"],
  pin28: ["M2_28_KEY"],
  pin29: ["M2_29_KEY"],
  pin30: ["M2_30_KEY"],
  pin31: ["M2_31_KEY"],
  pin32: ["M2_32", "PWM0"],
  pin33: ["M2_33", "GND_33"],
  pin34: ["M2_34", "A0"],
  pin35: ["M2_35", "USBHOST_DPLUS"],
  pin36: ["M2_36", "GND_36"],
  pin37: ["M2_37", "USBHOST_DMINUS"],
  pin38: ["M2_38", "A1"],
  pin39: ["M2_39", "GND_39"],
  pin40: ["M2_40", "G0", "BUS0"],
  pin41: ["M2_41", "CAN_RX"],
  pin42: ["M2_42", "G1", "BUS1"],
  pin43: ["M2_43", "CAN_TX"],
  pin44: ["M2_44", "G2", "BUS2"],
  pin45: ["M2_45", "GND_45"],
  pin46: ["M2_46", "G3", "BUS3"],
  pin47: ["M2_47", "PWM1"],
  pin48: ["M2_48", "G4", "BUS4"],
  pin49: ["M2_49", "BATT_VIN"],
  pin50: ["M2_50", "AUD_BCLK"],
  pin51: ["M2_51", "I2C_SDA1"],
  pin52: ["M2_52", "AUD_LRCLK"],
  pin53: ["M2_53", "I2C_SCL1"],
  pin54: ["M2_54", "AUD_IN", "CAM_PCLK"],
  pin55: ["M2_55", "SPI_CS"],
  pin56: ["M2_56", "AUD_OUT", "CAM_MCLK"],
  pin57: ["M2_57", "SPI_SCK"],
  pin58: ["M2_58", "AUD_MCLK"],
  pin59: ["M2_59", "SPI_SDO"],
  pin60: ["M2_60", "SPI_SCK1", "SDIO_CLK"],
  pin61: ["M2_61", "SPI_SDI"],
  pin62: ["M2_62", "SPI_SDO1", "SDIO_CMD"],
  pin63: ["M2_63", "G10", "ADC_DPLUS", "CAM_VSYNC"],
  pin64: ["M2_64", "SPI_SDI1", "SDIO_DATA0"],
  pin65: ["M2_65", "G9", "ADC_DMINUS", "CAM_HSYNC"],
  pin66: ["M2_66", "SDIO_DATA1"],
  pin67: ["M2_67", "G8"],
  pin68: ["M2_68", "SDIO_DATA2"],
  pin69: ["M2_69", "G7", "BUS7"],
  pin70: ["M2_70", "SPI_CS1", "SDIO_DATA3"],
  pin71: ["M2_71", "G6", "BUS6"],
  pin72: ["M2_72", "RTC_3V"],
  pin73: ["M2_73", "G5", "BUS5"],
  pin74: ["M2_74", "V3V3_74"],
  pin75: ["M2_75", "GND_75"],
} as const

/** Two via columns flanking the MicroMod card's central component field. */
export const MICROMOD_CLAD_VIA_POSITIONS = [-7.8, 7.8].flatMap((x) =>
  Array.from({ length: 13 }, (_, index) => ({
    x,
    y: Math.round((-5.7 + index * MICROMOD_CLAD_VIA_SPACING) * 1e6) / 1e6,
  })),
)

const MicroModM2EdgeFootprint = () => (
  <footprint insertionDirection="from_y_neg">
    {MICROMOD_M2_EDGE_CONTACTS.map((contact) => (
      <Fragment key={`micromod-m2-contact-${contact.contactNumber}`}>
        <smtpad
          portHints={[`pin${contact.contactNumber}`]}
          shape="rect"
          width={`${contact.width}mm`}
          height={`${contact.height}mm`}
          pcbX={contact.x}
          pcbY={contact.y}
          layer={contact.layer}
          coveredWithSolderMask={false}
          solderPasteMargin={`${MICROMOD_M2_SOLDER_PASTE_MARGIN}mm`}
        />
      </Fragment>
    ))}
  </footprint>
)

/** The processor-card side of SparkFun's 75-position MicroMod M.2 interface. */
export const MicroModM2EdgeConnector = ({
  noConnect,
  ...props
}: ConnectorProps) => (
  <connector
    {...props}
    standard="m2"
    pinLabels={MICROMOD_M2_PIN_LABELS}
    manufacturerPartNumber="GENERIC-MICROMOD-M2-CARD-E-22"
    footprint={<MicroModM2EdgeFootprint />}
    noSchematicRepresentation
    allowOffBoard
    noConnect={[
      ...new Set([...MICROMOD_M2_KEY_PIN_NAMES, ...(noConnect ?? [])]),
    ]}
  />
)

export interface MicroModCladProps {
  children?: ReactNode
  autorouter?: AutorouterProp
  autorouterOptions?: BiscuitBoardAutorouterOptions
  minTraceWidth?: number
  nominalTraceWidth?: number
  routingDisabled?: boolean
  /** Marks every M.2 contact NC for bare-template previews. */
  markEdgeConnectorNoConnect?: boolean
  /** Shows the MicroMod orientation label. Defaults to true. */
  showMicroModLabel?: boolean
}

/**
 * A two-layer prefabricated-via clad in SparkFun's MicroMod processor form
 * factor, including the staggered M.2 edge-contact pattern.
 */
export const MicroModClad = ({
  children,
  autorouter,
  autorouterOptions,
  minTraceWidth,
  nominalTraceWidth = 0.2,
  routingDisabled = false,
  markEdgeConnectorNoConnect = false,
  showMicroModLabel = true,
}: MicroModCladProps) => (
  <board
    name="MicroModClad"
    title="SparkFun MicroMod processor form-factor copper clad"
    width={`${MICROMOD_CLAD_WIDTH}mm`}
    height={`${MICROMOD_CLAD_HEIGHT}mm`}
    outline={MICROMOD_CLAD_OUTLINE}
    thickness={`${MICROMOD_CLAD_THICKNESS}mm`}
    layers={2}
    minTraceWidth={`${minTraceWidth ?? 0.15}mm`}
    minBoardEdgeClearance={`${MICROMOD_CLAD_EDGE_CLEARANCE - MICROMOD_CLAD_EDGE_CLEARANCE_VALIDATION_TOLERANCE}mm`}
    minViaHoleDiameter="0.2mm"
    minViaPadDiameter="0.4mm"
    autorouter={
      autorouter ??
      createPrefabricatedViaAutorouter({
        width: MICROMOD_CLAD_WIDTH,
        height: MICROMOD_CLAD_HEIGHT,
        edgeClearance: MICROMOD_CLAD_EDGE_CLEARANCE,
        options: autorouterOptions,
        minimumTraceWidth: minTraceWidth,
        nominalTraceWidth,
      })
    }
    routingDisabled={routingDisabled}
  >
    <MicroModM2EdgeConnector
      name="J_MICROMOD"
      noConnect={markEdgeConnectorNoConnect ? MICROMOD_M2_PIN_NAMES : undefined}
    />

    {showMicroModLabel && (
      <silkscreentext text="MicroMod" pcbY="-6.8mm" fontSize="0.65mm" />
    )}

    {MICROMOD_CLAD_VIA_POSITIONS.map((via) => (
      <Fragment key={`micromod-prefab-via-${via.x}-${via.y}`}>
        <via
          netIsAssignable
          pcbX={via.x}
          pcbY={via.y}
          fromLayer="top"
          toLayer="bottom"
          holeDiameter={`${MICROMOD_CLAD_VIA_HOLE_DIAMETER}mm`}
          outerDiameter={`${MICROMOD_CLAD_VIA_PAD_DIAMETER}mm`}
        />
      </Fragment>
    ))}

    <pcbnotedimension
      from={{ x: -MICROMOD_CLAD_WIDTH / 2, y: MICROMOD_CLAD_HEIGHT / 2 + 2 }}
      to={{ x: MICROMOD_CLAD_WIDTH / 2, y: MICROMOD_CLAD_HEIGHT / 2 + 2 }}
      text={`${MICROMOD_CLAD_WIDTH}mm`}
    />
    <pcbnotedimension
      from={{ x: MICROMOD_CLAD_WIDTH / 2 + 2, y: -MICROMOD_CLAD_HEIGHT / 2 }}
      to={{ x: MICROMOD_CLAD_WIDTH / 2 + 2, y: MICROMOD_CLAD_HEIGHT / 2 }}
      text={`${MICROMOD_CLAD_HEIGHT}mm`}
    />

    {children}
  </board>
)
