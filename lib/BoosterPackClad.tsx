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

const BOOSTERPACK_CLAD_EDGE_CLEARANCE = 0.2
const BOOSTERPACK_CLAD_EDGE_CLEARANCE_VALIDATION_TOLERANCE = 0.001

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
}

export interface BoosterPackCladPlacementZone {
  name: string
  purpose: "connector" | "chips-and-sensors" | "interface"
  minX: number
  maxX: number
  minY: number
  maxY: number
}

const rangeInclusive = (start: number, end: number, increment: number) =>
  Array.from(
    { length: Math.max(0, Math.floor((end - start) / increment) + 1) },
    (_, index) => start + index * increment,
  )

const createViaZone = (zone: ViaCandidateZone): BoosterPackCladViaPosition[] =>
  rangeInclusive(zone.minX, zone.maxX, zone.spacing).flatMap((x) =>
    rangeInclusive(zone.minY, zone.maxY, zone.spacing).map((y) => ({ x, y })),
  )

/**
 * Four routing corridors surround the reusable placement bays: a dual-column
 * rail outside the left LaunchPad header, single-row upper and lower bands,
 * and a right-edge rail. The right halves of the upper and lower edges remain
 * open for connectors.
 */
export const BOOSTERPACK_CLAD_VIA_CANDIDATE_ZONES = [
  // Continuous escape rail in the narrow corridor outside J1/J3.
  { minX: -29.5, maxX: -25.5, minY: -16, maxY: 16, spacing: 4 },
  // Single inner-edge rows leave the outer edge available for hardware.
  { minX: -21.5, maxX: -5.5, minY: 21.5, maxY: 21.5, spacing: 4 },
  { minX: -21.5, maxX: -1.5, minY: -21.5, maxY: -21.5, spacing: 4 },
  // Shortened right-edge rail clears both connector bays.
  { minX: 32.5, maxX: 32.5, minY: -16.25, maxY: 15.75, spacing: 4 },
] as const satisfies readonly ViaCandidateZone[]

/**
 * Reusable placement bays kept clear of prefabricated via pads. The central
 * bays cover controls, chips, sensors, debug, and power circuitry. Open bays
 * along the upper-right and lower-right edges leave room for connectors whose
 * bodies or cables must reach beyond the board outline.
 */
export const BOOSTERPACK_CLAD_PLACEMENT_ZONES = [
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
    minX: -17.5,
    maxX: 17.5,
    minY: -11.5,
    maxY: 11.5,
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
    minX: 1,
    maxX: 27,
    minY: 20.5,
    maxY: 26.5,
  },
  {
    name: "lower-edge-connector",
    purpose: "connector",
    minX: 1,
    maxX: 27,
    minY: -26.5,
    maxY: -20.5,
  },
] as const satisfies readonly BoosterPackCladPlacementZone[]

/** The candidate zones are placed directly in known open routing channels. */
export const BOOSTERPACK_CLAD_VIA_EXCLUSION_ZONES: readonly ViaCandidateZone[] =
  []

const pointKey = (point: BoosterPackCladViaPosition) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

const isInsideExclusion = (point: BoosterPackCladViaPosition) =>
  BOOSTERPACK_CLAD_VIA_EXCLUSION_ZONES.some(
    (zone) =>
      point.x >= zone.minX &&
      point.x <= zone.maxX &&
      point.y >= zone.minY &&
      point.y <= zone.maxY,
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

const DualMaleHeaderFootprint = () => (
  <footprint insertionDirection="from_below">
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

    <silkscreentext
      text="LAUNCHPAD SIDE"
      pcbX={0}
      pcbY={-BOOSTERPACK_CLAD_HEIGHT / 2 + 3.5}
      fontSize="0.8mm"
    />
    <silkscreentext text="J1/J3" pcbX={-21.59} pcbY={14.9} fontSize="0.7mm" />
    <silkscreentext text="J4/J2" pcbX={21.59} pcbY={14.9} fontSize="0.7mm" />

    {BOOSTERPACK_CLAD_VIA_CANDIDATE_ZONES.map((zone) => (
      <Fragment key={`candidate-zone-${zone.minX}-${zone.minY}`}>
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
          holeDiameter="0.8mm"
          outerDiameter="1.2mm"
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
