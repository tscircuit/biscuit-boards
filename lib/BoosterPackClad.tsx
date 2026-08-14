import type { SimpleRouteJson } from "@tscircuit/core"
import type { AutorouterProp, ConnectorProps } from "@tscircuit/props"
import { Fragment, type ReactNode } from "react"
import {
  BISCUIT_BOARD_HEIGHT,
  BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS,
  BISCUIT_BOARD_WIDTH,
} from "./BiscuitBoard"
import type { BiscuitBoardAutorouterOptions } from "./biscuit-board-autorouter"
import { createPrefabricatedViaAutorouter } from "./create-prefabricated-via-autorouter"

// Preserve the existing clad's tooling outline and mounting-hole layout. This
// is larger than the TI SLAA542 maximum BoosterPack outline, but the header
// geometry remains compatible with the LaunchPad connector pattern.
export const BOOSTERPACK_CLAD_WIDTH = BISCUIT_BOARD_WIDTH
export const BOOSTERPACK_CLAD_HEIGHT = BISCUIT_BOARD_HEIGHT
export const BOOSTERPACK_HEADER_PITCH = 2.54
export const BOOSTERPACK_HEADER_CENTER_X = 21.59
export const BOOSTERPACK_HEADER_CENTER_Y = 1.27
export const BOOSTERPACK_CLAD_VIA_OUTER_DIAMETER = 0.6
export const BOOSTERPACK_CLAD_VIA_PITCH = 1.3
export const BOOSTERPACK_CLAD_MOUNTING_HOLE_VIA_CLEARANCE = 1
export const BOOSTERPACK_CORNER_VERTICAL_ARM_INNER_Y = 11.5

const BOOSTERPACK_CLAD_EDGE_CLEARANCE = 0.2
const BOOSTERPACK_CLAD_EDGE_CLEARANCE_VALIDATION_TOLERANCE = 0.001
const BOOSTERPACK_MOUNTING_HOLE_RADIUS = 1.1
export const BOOSTERPACK_EDGE_HEADER_CENTER_X =
  BOOSTERPACK_CLAD_WIDTH / 2 - BOOSTERPACK_HEADER_PITCH / 2
const BOOSTERPACK_EDGE_HEADER_CLEARANCE_HALF_HEIGHT =
  Math.min(
    ...BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS.map((hole) => Math.abs(hole.y)),
  ) -
  BOOSTERPACK_MOUNTING_HOLE_RADIUS -
  BOOSTERPACK_CLAD_MOUNTING_HOLE_VIA_CLEARANCE
export const BOOSTERPACK_EDGE_HEADER_PIN_COUNT = Math.floor(
  (2 * BOOSTERPACK_EDGE_HEADER_CLEARANCE_HALF_HEIGHT) /
    BOOSTERPACK_HEADER_PITCH,
)
const BOOSTERPACK_EDGE_HEADER_HALF_HEIGHT =
  (BOOSTERPACK_EDGE_HEADER_PIN_COUNT * BOOSTERPACK_HEADER_PITCH) / 2
export const BOOSTERPACK_MIDDLE_VIA_CLUSTER_CENTER_X =
  -BOOSTERPACK_HEADER_CENTER_X / 2 - 2
export const BOOSTERPACK_MIDDLE_VIA_CLUSTER_WIDTH = 6.3
export const BOOSTERPACK_MIDDLE_VIA_CLUSTER_HEIGHT = 5.6
export const BOOSTERPACK_EDGE_BAND_OUTER_X = BOOSTERPACK_CLAD_WIDTH / 2 - 2
export const BOOSTERPACK_EDGE_BAND_CENTER_GAP =
  (BOOSTERPACK_CLAD_WIDTH / 2 - 14.5) * 1.1 * 1.3 * 1.2
const BOOSTERPACK_EDGE_BAND_INNER_X = BOOSTERPACK_EDGE_BAND_CENTER_GAP / 2

export interface BoosterPackCladViaPosition {
  x: number
  y: number
}

interface ViaCandidateZone {
  minX: number
  maxX: number
  minY: number
  maxY: number
  spacing: number
  originX?: number
  originY?: number
}

export interface BoosterPackCladPlacementZone {
  name: string
  purpose: "connector" | "chips-and-sensors" | "interface"
  minX: number
  maxX: number
  minY: number
  maxY: number
}

const roundCoordinate = (value: number) => Math.round(value * 1e6) / 1e6

const maximallyPackedRange = (start: number, end: number, pitch: number) => {
  const intervalCount = Math.floor((end - start) / pitch)
  if (intervalCount <= 0) return [(start + end) / 2]

  const populatedStart = (start + end - intervalCount * pitch) / 2
  return Array.from({ length: intervalCount + 1 }, (_, index) =>
    roundCoordinate(populatedStart + index * pitch),
  )
}

const anchoredPitchedRange = (
  start: number,
  end: number,
  pitch: number,
  origin: number,
) => {
  const firstIndex = Math.ceil((start - origin) / pitch - 1e-9)
  const lastIndex = Math.floor((end - origin) / pitch + 1e-9)
  return Array.from(
    { length: Math.max(0, lastIndex - firstIndex + 1) },
    (_, index) => roundCoordinate(origin + (firstIndex + index) * pitch),
  )
}

const createViaAxis = (
  start: number,
  end: number,
  pitch: number,
  origin?: number,
) =>
  origin === undefined
    ? maximallyPackedRange(start, end, pitch)
    : anchoredPitchedRange(start, end, pitch, origin)

const createViaZone = (zone: ViaCandidateZone): BoosterPackCladViaPosition[] =>
  createViaAxis(zone.minX, zone.maxX, zone.spacing, zone.originX).flatMap((x) =>
    createViaAxis(zone.minY, zone.maxY, zone.spacing, zone.originY).map(
      (y) => ({
        x,
        y,
      }),
    ),
  )

/**
 * Four L-shaped corner fields keep the center and the middle of every board
 * edge open for chips, sensors, controls, and connectors.
 */
export const BOOSTERPACK_CLAD_VIA_CANDIDATE_ZONES = [
  // Compact routing cluster halfway from J1/J3 to the board center.
  {
    minX:
      BOOSTERPACK_MIDDLE_VIA_CLUSTER_CENTER_X -
      BOOSTERPACK_MIDDLE_VIA_CLUSTER_WIDTH / 2,
    maxX:
      BOOSTERPACK_MIDDLE_VIA_CLUSTER_CENTER_X +
      BOOSTERPACK_MIDDLE_VIA_CLUSTER_WIDTH / 2,
    minY: -BOOSTERPACK_MIDDLE_VIA_CLUSTER_HEIGHT / 2,
    maxY: BOOSTERPACK_MIDDLE_VIA_CLUSTER_HEIGHT / 2,
    spacing: BOOSTERPACK_CLAD_VIA_PITCH,
  },
  // Upper-left horizontal and vertical arms share one anchored lattice.
  {
    minX: -BOOSTERPACK_EDGE_BAND_OUTER_X,
    maxX: -BOOSTERPACK_EDGE_BAND_INNER_X,
    minY: 21.5,
    maxY: 25.5,
    spacing: BOOSTERPACK_CLAD_VIA_PITCH,
    originX: -BOOSTERPACK_EDGE_BAND_OUTER_X,
    originY: 21.5,
  },
  {
    minX: -BOOSTERPACK_EDGE_BAND_OUTER_X,
    maxX: -31.5,
    minY: BOOSTERPACK_CORNER_VERTICAL_ARM_INNER_Y,
    maxY: 25.5,
    spacing: BOOSTERPACK_CLAD_VIA_PITCH,
    originX: -BOOSTERPACK_EDGE_BAND_OUTER_X,
    originY: 21.5,
  },
  // Upper-right corner.
  {
    minX: BOOSTERPACK_EDGE_BAND_INNER_X,
    maxX: BOOSTERPACK_EDGE_BAND_OUTER_X,
    minY: 21.5,
    maxY: 25.5,
    spacing: BOOSTERPACK_CLAD_VIA_PITCH,
    originX: BOOSTERPACK_EDGE_BAND_OUTER_X,
    originY: 21.5,
  },
  {
    minX: 31.5,
    maxX: BOOSTERPACK_EDGE_BAND_OUTER_X,
    minY: BOOSTERPACK_CORNER_VERTICAL_ARM_INNER_Y,
    maxY: 25.5,
    spacing: BOOSTERPACK_CLAD_VIA_PITCH,
    originX: BOOSTERPACK_EDGE_BAND_OUTER_X,
    originY: 21.5,
  },
  // Lower-left corner.
  {
    minX: -BOOSTERPACK_EDGE_BAND_OUTER_X,
    maxX: -BOOSTERPACK_EDGE_BAND_INNER_X,
    minY: -25.5,
    maxY: -21.5,
    spacing: BOOSTERPACK_CLAD_VIA_PITCH,
    originX: -BOOSTERPACK_EDGE_BAND_OUTER_X,
    originY: -21.5,
  },
  {
    minX: -BOOSTERPACK_EDGE_BAND_OUTER_X,
    maxX: -31.5,
    minY: -25.5,
    maxY: -BOOSTERPACK_CORNER_VERTICAL_ARM_INNER_Y,
    spacing: BOOSTERPACK_CLAD_VIA_PITCH,
    originX: -BOOSTERPACK_EDGE_BAND_OUTER_X,
    originY: -21.5,
  },
  // Lower-right corner.
  {
    minX: BOOSTERPACK_EDGE_BAND_INNER_X,
    maxX: BOOSTERPACK_EDGE_BAND_OUTER_X,
    minY: -25.5,
    maxY: -21.5,
    spacing: BOOSTERPACK_CLAD_VIA_PITCH,
    originX: BOOSTERPACK_EDGE_BAND_OUTER_X,
    originY: -21.5,
  },
  {
    minX: 31.5,
    maxX: BOOSTERPACK_EDGE_BAND_OUTER_X,
    minY: -25.5,
    maxY: -BOOSTERPACK_CORNER_VERTICAL_ARM_INNER_Y,
    spacing: BOOSTERPACK_CLAD_VIA_PITCH,
    originX: BOOSTERPACK_EDGE_BAND_OUTER_X,
    originY: -21.5,
  },
] as const satisfies readonly ViaCandidateZone[]

/**
 * Reusable placement bays kept clear of prefabricated via pads. The central
 * bays cover controls, chips, sensors, debug, and power circuitry. Centered
 * openings along every edge leave room for connectors whose bodies or cables
 * must reach beyond the board outline.
 */
export const BOOSTERPACK_CLAD_PLACEMENT_ZONES = [
  {
    name: "left-edge-pin-header",
    purpose: "connector",
    minX: -BOOSTERPACK_CLAD_WIDTH / 2,
    maxX: -BOOSTERPACK_CLAD_WIDTH / 2 + BOOSTERPACK_HEADER_PITCH,
    minY: -BOOSTERPACK_EDGE_HEADER_HALF_HEIGHT,
    maxY: BOOSTERPACK_EDGE_HEADER_HALF_HEIGHT,
  },
  {
    name: "left-launchpad-header",
    purpose: "connector",
    minX: -24.5,
    maxX: -18.5,
    minY: -12,
    maxY: 14.5,
  },
  {
    name: "right-launchpad-header",
    purpose: "connector",
    minX: 18.5,
    maxX: 24.5,
    minY: -12,
    maxY: 14.5,
  },
  {
    name: "upper-interface",
    purpose: "interface",
    minX: -17.5,
    maxX: 17.5,
    minY: 11.5,
    maxY: 19.5,
  },
  {
    name: "central-chips-and-sensors",
    purpose: "chips-and-sensors",
    minX: -7.5,
    maxX: 7.5,
    minY: -11.5,
    maxY: 11.5,
  },
  {
    name: "left-upper-interface",
    purpose: "interface",
    minX: -17.5,
    maxX: -7.5,
    minY: 4.75,
    maxY: 11.5,
  },
  {
    name: "left-lower-interface",
    purpose: "interface",
    minX: -17.5,
    maxX: -7.5,
    minY: -11.5,
    maxY: -4.75,
  },
  {
    name: "right-upper-interface",
    purpose: "interface",
    minX: 7.5,
    maxX: 17.5,
    minY: 4.75,
    maxY: 11.5,
  },
  {
    name: "right-lower-interface",
    purpose: "interface",
    minX: 7.5,
    maxX: 17.5,
    minY: -11.5,
    maxY: -4.75,
  },
  {
    name: "lower-interface",
    purpose: "interface",
    minX: -17.5,
    maxX: 17.5,
    minY: -19.5,
    maxY: -11.5,
  },
  {
    name: "upper-edge-connector",
    purpose: "connector",
    minX: -10.5,
    maxX: 10.5,
    minY: 20.5,
    maxY: 26.5,
  },
  {
    name: "lower-edge-connector",
    purpose: "connector",
    minX: -10.5,
    maxX: 10.5,
    minY: -26.5,
    maxY: -20.5,
  },
] as const satisfies readonly BoosterPackCladPlacementZone[]

/** Keep vias clear of mounting-hole pads and the left-edge header body. */
export const BOOSTERPACK_CLAD_VIA_EXCLUSION_ZONES = [
  {
    minX: -36.7,
    maxX: -33.3,
    minY: 23.3,
    maxY: 26.7,
    spacing: BOOSTERPACK_CLAD_VIA_PITCH,
  },
  {
    minX: -36.7,
    maxX: -33.3,
    minY: -26.7,
    maxY: -23.3,
    spacing: BOOSTERPACK_CLAD_VIA_PITCH,
  },
  {
    minX: 33.3,
    maxX: 36.7,
    minY: 23.3,
    maxY: 26.7,
    spacing: BOOSTERPACK_CLAD_VIA_PITCH,
  },
  {
    minX: 29.6,
    maxX: 32.4,
    minY: 23.6,
    maxY: 26.4,
    spacing: BOOSTERPACK_CLAD_VIA_PITCH,
  },
  {
    minX: 33.3,
    maxX: 36.7,
    minY: -26.7,
    maxY: -23.3,
    spacing: BOOSTERPACK_CLAD_VIA_PITCH,
  },
  {
    minX:
      -BOOSTERPACK_EDGE_HEADER_CENTER_X -
      BOOSTERPACK_HEADER_PITCH / 2 -
      BOOSTERPACK_CLAD_VIA_OUTER_DIAMETER / 2,
    maxX:
      -BOOSTERPACK_EDGE_HEADER_CENTER_X +
      BOOSTERPACK_HEADER_PITCH / 2 +
      BOOSTERPACK_CLAD_VIA_OUTER_DIAMETER / 2,
    minY:
      -BOOSTERPACK_EDGE_HEADER_HALF_HEIGHT -
      BOOSTERPACK_CLAD_VIA_OUTER_DIAMETER / 2,
    maxY:
      BOOSTERPACK_EDGE_HEADER_HALF_HEIGHT +
      BOOSTERPACK_CLAD_VIA_OUTER_DIAMETER / 2,
    spacing: BOOSTERPACK_CLAD_VIA_PITCH,
  },
] as const satisfies readonly ViaCandidateZone[]

const pointKey = (point: BoosterPackCladViaPosition) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

const isInsideExclusion = (point: BoosterPackCladViaPosition) =>
  BOOSTERPACK_CLAD_VIA_EXCLUSION_ZONES.some(
    (zone) =>
      point.x >= zone.minX &&
      point.x <= zone.maxX &&
      point.y >= zone.minY &&
      point.y <= zone.maxY,
  ) ||
  BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS.some(
    (hole) =>
      Math.hypot(point.x - hole.x, point.y - hole.y) <
      1.1 +
        BOOSTERPACK_CLAD_VIA_OUTER_DIAMETER / 2 +
        BOOSTERPACK_CLAD_MOUNTING_HOLE_VIA_CLEARANCE,
  )

export const BOOSTERPACK_CLAD_VIA_POSITIONS = Array.from(
  new Map(
    BOOSTERPACK_CLAD_VIA_CANDIDATE_ZONES.flatMap(createViaZone).map((point) => [
      pointKey(point),
      point,
    ]),
  ).values(),
).filter((point) => !isInsideExclusion(point))

const leftHeaderPins = {
  pin1: ["J1_1", "LP_3V3"],
  pin2: ["J3_1", "LP_5V"],
  pin3: ["J1_2", "LP_ANALOG_IN"],
  pin4: ["J3_2", "LP_GND_INNER"],
  pin5: ["J1_3", "LP_UART_RX"],
  pin6: ["J3_3"],
  pin7: ["J1_4", "LP_UART_TX"],
  pin8: ["J3_4"],
  pin9: ["J1_5", "LP_GPIO_INTERRUPT"],
  pin10: ["J3_5"],
  pin11: ["J1_6", "LP_SPI_A_SCLK"],
  pin12: ["J3_6"],
  pin13: ["J1_7", "LP_SPI_B_SCLK"],
  pin14: ["J3_7"],
  pin15: ["J1_8", "LP_GPIO_1"],
  pin16: ["J3_8"],
  pin17: ["J1_9", "LP_GPIO_2"],
  pin18: ["J3_9"],
  pin19: ["J1_10", "LP_GPIO_3"],
  pin20: ["J3_10"],
} as const

const rightHeaderPins = {
  pin1: ["J4_20"],
  pin2: ["J2_20", "LP_GND"],
  pin3: ["J4_19"],
  pin4: ["J2_19", "LP_TIMER_OUT"],
  pin5: ["J4_18"],
  pin6: ["J2_18", "LP_GPIO_INTERRUPT_2"],
  pin7: ["J4_17"],
  pin8: ["J2_17", "LP_TEST"],
  pin9: ["J4_16"],
  pin10: ["J2_16", "LP_RESET"],
  pin11: ["J4_15"],
  pin12: ["J2_15", "LP_I2C_SDA", "LP_SPI_B_SIMO"],
  pin13: ["J4_14"],
  pin14: ["J2_14", "LP_I2C_SCL", "LP_SPI_B_SOMI"],
  pin15: ["J4_13"],
  pin16: ["J2_13", "LP_GPIO_4"],
  pin17: ["J4_12"],
  pin18: ["J2_12", "LP_GPIO_5"],
  pin19: ["J4_11"],
  pin20: ["J2_11", "LP_GPIO_6"],
} as const

const leftHeaderNoConnect = Array.from({ length: 20 }, (_, index) => index + 1)
  .filter((pin) => pin !== 1 && pin !== 4)
  .map((pin) => `pin${pin}`)
const rightHeaderNoConnect = Array.from({ length: 20 }, (_, index) => index + 1)
  .filter((pin) => pin !== 2)
  .map((pin) => `pin${pin}`)

const DualMaleHeaderFootprint = ({
  insertionDirection = "from_below",
}: {
  insertionDirection?: "from_above" | "from_below"
}) => (
  <footprint insertionDirection={insertionDirection}>
    {Array.from({ length: 10 }, (_, row) => {
      const y = (4.5 - row) * BOOSTERPACK_HEADER_PITCH
      return (
        <Fragment key={`row-y-${y}`}>
          {row === 0 ? (
            <platedhole
              portHints={[`pin${row * 2 + 1}`]}
              shape="circular_hole_with_rect_pad"
              holeDiameter="1.02mm"
              rectPadWidth="1.7mm"
              rectPadHeight="1.7mm"
              pcbX={-BOOSTERPACK_HEADER_PITCH / 2}
              pcbY={y}
            />
          ) : (
            <platedhole
              portHints={[`pin${row * 2 + 1}`]}
              shape="circle"
              holeDiameter="1.02mm"
              outerDiameter="1.7mm"
              pcbX={-BOOSTERPACK_HEADER_PITCH / 2}
              pcbY={y}
            />
          )}
          <platedhole
            portHints={[`pin${row * 2 + 2}`]}
            shape="circle"
            holeDiameter="1.02mm"
            outerDiameter="1.7mm"
            pcbX={BOOSTERPACK_HEADER_PITCH / 2}
            pcbY={y}
          />
        </Fragment>
      )
    })}
    <silkscreenrect width="5.08mm" height="25.4mm" />
    <silkscreencircle
      pcbX={-BOOSTERPACK_HEADER_PITCH / 2}
      pcbY={4.5 * BOOSTERPACK_HEADER_PITCH}
      radius="0.3mm"
    />
  </footprint>
)

const SingleMaleHeaderFootprint = ({ pinCount }: { pinCount: number }) => (
  <footprint insertionDirection="from_above">
    {Array.from({ length: pinCount }, (_, row) => {
      const pin = row + 1
      const y = ((pinCount - 1) / 2 - row) * BOOSTERPACK_HEADER_PITCH
      return (
        <Fragment key={`pin-${pin}`}>
          {pin === 1 ? (
            <platedhole
              portHints={[`pin${pin}`]}
              shape="circular_hole_with_rect_pad"
              holeDiameter="1.02mm"
              rectPadWidth="1.7mm"
              rectPadHeight="1.7mm"
              pcbY={y}
            />
          ) : (
            <platedhole
              portHints={[`pin${pin}`]}
              shape="circle"
              holeDiameter="1.02mm"
              outerDiameter="1.7mm"
              pcbY={y}
            />
          )}
        </Fragment>
      )
    })}
    <silkscreenrect
      width="2.54mm"
      height={`${pinCount * BOOSTERPACK_HEADER_PITCH}mm`}
    />
    <silkscreencircle
      pcbY={((pinCount - 1) / 2) * BOOSTERPACK_HEADER_PITCH}
      radius="0.3mm"
    />
  </footprint>
)

export const BoosterPackLeftHeader = (props: ConnectorProps) => (
  <connector
    pinLabels={leftHeaderPins}
    manufacturerPartNumber="GENERIC-2X10-MALE-2.54MM-DOWN"
    footprint={<DualMaleHeaderFootprint />}
    noConnect={leftHeaderNoConnect}
    noSchematicRepresentation
    {...props}
  />
)

export const BoosterPackRightHeader = (props: ConnectorProps) => (
  <connector
    pinLabels={rightHeaderPins}
    manufacturerPartNumber="GENERIC-2X10-MALE-2.54MM-DOWN"
    footprint={<DualMaleHeaderFootprint />}
    noConnect={rightHeaderNoConnect}
    noSchematicRepresentation
    {...props}
  />
)

const edgeHeaderPins = Object.fromEntries(
  Array.from({ length: BOOSTERPACK_EDGE_HEADER_PIN_COUNT }, (_, index) => [
    `pin${index + 1}`,
    [`EDGE_${index + 1}`],
  ]),
)
const edgeHeaderNoConnect = Array.from(
  { length: BOOSTERPACK_EDGE_HEADER_PIN_COUNT },
  (_, index) => `pin${index + 1}`,
)

export const BoosterPackEdgePinHeader = (props: ConnectorProps) => (
  <connector
    pinLabels={edgeHeaderPins}
    manufacturerPartNumber={`GENERIC-1X${BOOSTERPACK_EDGE_HEADER_PIN_COUNT}-MALE-2.54MM-UP`}
    footprint={
      <SingleMaleHeaderFootprint pinCount={BOOSTERPACK_EDGE_HEADER_PIN_COUNT} />
    }
    noConnect={edgeHeaderNoConnect}
    noSchematicRepresentation
    {...props}
  />
)

export interface BoosterPackCladProps {
  children?: ReactNode
  autorouter?: AutorouterProp
  autorouterOptions?: BiscuitBoardAutorouterOptions
  minTraceWidth?: number
  nominalTraceWidth?: number
  routingDisabled?: boolean
  reservedAutorouterObstacles?: SimpleRouteJson["obstacles"]
}

/** A BiscuitBoard-sized clad with a TI 40-pin BoosterPack header pattern. */
export const BoosterPackClad = ({
  children,
  autorouter,
  autorouterOptions,
  minTraceWidth,
  nominalTraceWidth = 0.3,
  routingDisabled = false,
  reservedAutorouterObstacles,
}: BoosterPackCladProps) => (
  <board
    name="BoosterPackClad"
    title="BiscuitBoard clad with TI 40-pin BoosterPack headers"
    width={`${BOOSTERPACK_CLAD_WIDTH}mm`}
    height={`${BOOSTERPACK_CLAD_HEIGHT}mm`}
    borderRadius="1.5mm"
    layers={2}
    minTraceWidth={`${minTraceWidth ?? 0.15}mm`}
    minBoardEdgeClearance={`${BOOSTERPACK_CLAD_EDGE_CLEARANCE - BOOSTERPACK_CLAD_EDGE_CLEARANCE_VALIDATION_TOLERANCE}mm`}
    minViaHoleDiameter="0.2mm"
    minViaPadDiameter="0.4mm"
    autorouter={
      autorouter ??
      createPrefabricatedViaAutorouter({
        width: BOOSTERPACK_CLAD_WIDTH,
        height: BOOSTERPACK_CLAD_HEIGHT,
        edgeClearance: BOOSTERPACK_CLAD_EDGE_CLEARANCE,
        options: autorouterOptions,
        minimumTraceWidth: minTraceWidth,
        nominalTraceWidth,
        reservedObstacles: reservedAutorouterObstacles,
      })
    }
    routingDisabled={routingDisabled}
  >
    <net name="GND" isGroundNet />

    {BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS.map((hole) => (
      <Fragment key={`mounting-hole-${hole.x}-${hole.y}`}>
        <hole pcbX={hole.x} pcbY={hole.y} diameter="2.2mm" />
      </Fragment>
    ))}

    <BoosterPackLeftHeader
      name="J_LAUNCHPAD_LEFT"
      pcbX={-BOOSTERPACK_HEADER_CENTER_X}
      pcbY={BOOSTERPACK_HEADER_CENTER_Y}
    />
    <BoosterPackRightHeader
      name="J_LAUNCHPAD_RIGHT"
      pcbX={BOOSTERPACK_HEADER_CENTER_X}
      pcbY={BOOSTERPACK_HEADER_CENTER_Y}
    />
    <BoosterPackEdgePinHeader
      name="J_EDGE_LEFT"
      pcbX={-BOOSTERPACK_EDGE_HEADER_CENTER_X}
      pcbY={0}
    />
    <silkscreentext
      text="LAUNCHPAD SIDE"
      pcbX={0}
      pcbY={-BOOSTERPACK_CLAD_HEIGHT / 2 + 3.5}
      fontSize="0.8mm"
    />
    <silkscreentext text="J1/J3" pcbX={-21.59} pcbY={14.9} fontSize="0.7mm" />
    <silkscreentext text="J4/J2" pcbX={21.59} pcbY={14.9} fontSize="0.7mm" />
    <silkscreentext
      text="EDGE LEFT"
      pcbX={-BOOSTERPACK_EDGE_HEADER_CENTER_X + 3.5}
      pcbY={0}
      pcbRotation={90}
      fontSize="0.65mm"
    />
    {BOOSTERPACK_CLAD_VIA_CANDIDATE_ZONES.map((zone) => (
      <Fragment
        key={`candidate-zone-${zone.minX}-${zone.maxX}-${zone.minY}-${zone.maxY}`}
      >
        <pcbnoterect
          color="blue"
          width={Math.max(0.2, zone.maxX - zone.minX)}
          height={Math.max(0.2, zone.maxY - zone.minY)}
          pcbPositionAnchor="center"
          pcbX={zone.minX + (zone.maxX - zone.minX) / 2}
          pcbY={zone.minY + (zone.maxY - zone.minY) / 2}
        />
      </Fragment>
    ))}

    {BOOSTERPACK_CLAD_VIA_POSITIONS.map((via) => (
      <Fragment key={`prefab-via-${via.x}-${via.y}`}>
        <via
          netIsAssignable
          pcbX={via.x}
          pcbY={via.y}
          fromLayer="top"
          toLayer="bottom"
          holeDiameter="0.3mm"
          outerDiameter="0.6mm"
        />
      </Fragment>
    ))}

    <pcbnotedimension
      from={{
        x: -BOOSTERPACK_CLAD_WIDTH / 2,
        y: BOOSTERPACK_CLAD_HEIGHT / 2 + 2.5,
      }}
      to={{
        x: BOOSTERPACK_CLAD_WIDTH / 2,
        y: BOOSTERPACK_CLAD_HEIGHT / 2 + 2.5,
      }}
      text={`${BOOSTERPACK_CLAD_WIDTH}mm`}
    />
    <pcbnotedimension
      from={{
        x: BOOSTERPACK_CLAD_WIDTH / 2 + 2.5,
        y: -BOOSTERPACK_CLAD_HEIGHT / 2,
      }}
      to={{
        x: BOOSTERPACK_CLAD_WIDTH / 2 + 2.5,
        y: BOOSTERPACK_CLAD_HEIGHT / 2,
      }}
      text={`${BOOSTERPACK_CLAD_HEIGHT}mm`}
    />

    {children}
  </board>
)
