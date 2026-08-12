import type { AutorouterProp, ConnectorProps } from "@tscircuit/props"
import { Fragment, type ReactNode } from "react"
import { BISCUIT_BOARD_HEIGHT, BISCUIT_BOARD_WIDTH } from "./BiscuitBoard"
import type { BiscuitBoardAutorouterOptions } from "./biscuit-board-autorouter"
import { createPrefabricatedViaAutorouter } from "./create-prefabricated-via-autorouter"

export const ARDUINO_SHIELD_CLAD_WIDTH = BISCUIT_BOARD_WIDTH
export const ARDUINO_SHIELD_CLAD_HEIGHT = BISCUIT_BOARD_HEIGHT
export const ARDUINO_SHIELD_HEADER_PITCH = 2.54
export const ARDUINO_SHIELD_HEADER_ROW_Y = 24.13

export const ARDUINO_SHIELD_HEADER_PLACEMENTS = {
  power: { x: 2.54, y: -24.13, rotation: 0 },
  analog: { x: 22.86, y: -24.13, rotation: 0 },
  digital0To7: { x: 20.32, y: 24.13, rotation: 180 },
  digital8To13: { x: -4.064, y: 24.13, rotation: 180 },
  icsp: { x: 30.607, y: 1.27, rotation: 270 },
} as const

/** Official UNO R3 hole centers translated to the clad's centered origin. */
export const ARDUINO_SHIELD_MOUNTING_HOLE_POSITIONS = [
  { x: 31.75, y: 8.89 },
  { x: 31.75, y: -19.05 },
  { x: -19.05, y: 24.13 },
  { x: -20.32, y: -24.13 },
] as const

const ARDUINO_SHIELD_EDGE_CLEARANCE = 0.2
const ARDUINO_SHIELD_EDGE_CLEARANCE_VALIDATION_TOLERANCE = 0.001

export interface ArduinoShieldCladViaPosition {
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

const rangeInclusive = (start: number, end: number, increment: number) =>
  Array.from(
    { length: Math.max(0, Math.floor((end - start) / increment) + 1) },
    (_, index) => start + index * increment,
  )

const createViaZone = (
  zone: ViaCandidateZone,
): ArduinoShieldCladViaPosition[] =>
  rangeInclusive(zone.minX, zone.maxX, zone.spacing).flatMap((x) =>
    rangeInclusive(zone.minY, zone.maxY, zone.spacing).map((y) => ({ x, y })),
  )

/**
 * Clustered fixed-via field arranged around the UNO shield connectors. The
 * main header rows remain clear, the ICSP socket has a nearby escape cluster,
 * and the right side is split around the two UNO mounting/ICSP regions.
 */
export const ARDUINO_SHIELD_CLAD_VIA_CANDIDATE_ZONES = [
  { minX: -33.5, maxX: -25.5, minY: 17.5, maxY: 21.5, spacing: 4 },
  { minX: -33.5, maxX: -25.5, minY: -21.5, maxY: -17.5, spacing: 4 },
  { minX: -21.5, maxX: -13.5, minY: 13.5, maxY: 17.5, spacing: 4 },
  { minX: -21.5, maxX: -13.5, minY: -17.5, maxY: -13.5, spacing: 4 },
  { minX: -8, maxX: 8, minY: -6, maxY: 6, spacing: 4 },
  { minX: 18, maxX: 22, minY: -4, maxY: 4, spacing: 4 },
  { minX: 34.5, maxX: 34.5, minY: -19.5, maxY: -7.5, spacing: 4 },
  { minX: 34.5, maxX: 34.5, minY: 7.5, maxY: 19.5, spacing: 4 },
] as const satisfies readonly ViaCandidateZone[]

const pointKey = (point: ArduinoShieldCladViaPosition) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

export const ARDUINO_SHIELD_CLAD_VIA_POSITIONS = Array.from(
  new Map(
    ARDUINO_SHIELD_CLAD_VIA_CANDIDATE_ZONES.flatMap(createViaZone).map(
      (point) => [pointKey(point), point],
    ),
  ).values(),
)

const powerPins = {
  pin1: ["NC"],
  pin2: ["IOREF"],
  pin3: ["RESET"],
  pin4: ["V3V3", "3V3"],
  pin5: ["V5", "5V"],
  pin6: ["GND1", "GND"],
  pin7: ["GND2", "GND"],
  pin8: ["VIN"],
} as const

const analogPins = {
  pin1: ["A0", "D14"],
  pin2: ["A1", "D15"],
  pin3: ["A2", "D16"],
  pin4: ["A3", "D17"],
  pin5: ["A4", "D18", "SDA"],
  pin6: ["A5", "D19", "SCL"],
} as const

const digital0To7Pins = {
  pin1: ["D0", "RX"],
  pin2: ["D1", "TX"],
  pin3: ["D2"],
  pin4: ["D3"],
  pin5: ["D4"],
  pin6: ["D5"],
  pin7: ["D6"],
  pin8: ["D7"],
} as const

const digital8To13Pins = {
  pin1: ["D8"],
  pin2: ["D9"],
  pin3: ["D10", "SS"],
  pin4: ["D11", "COPI", "MOSI"],
  pin5: ["D12", "CIPO", "MISO"],
  pin6: ["D13", "SCK"],
  pin7: ["GND"],
  pin8: ["AREF"],
  pin9: ["SDA_R3", "SDA"],
  pin10: ["SCL_R3", "SCL"],
} as const

const icspPins = {
  pin1: ["CIPO", "MISO"],
  pin2: ["V5", "5V"],
  pin3: ["SCK"],
  pin4: ["COPI", "MOSI"],
  pin5: ["RESET"],
  pin6: ["GND"],
} as const

const pinNames = (count: number) =>
  Array.from({ length: count }, (_, index) => `pin${index + 1}`)

const SingleRowShieldHeaderFootprint = ({ pinCount }: { pinCount: number }) => (
  <footprint insertionDirection="from_below">
    {Array.from({ length: pinCount }, (_, index) => {
      const pin = index + 1
      const x = (index - (pinCount - 1) / 2) * ARDUINO_SHIELD_HEADER_PITCH
      return (
        <Fragment key={`pin-${pin}`}>
          {pin === 1 ? (
            <platedhole
              portHints={[`pin${pin}`]}
              shape="circular_hole_with_rect_pad"
              holeDiameter="1mm"
              rectPadWidth="1.7mm"
              rectPadHeight="1.7mm"
              pcbX={x}
            />
          ) : (
            <platedhole
              portHints={[`pin${pin}`]}
              shape="circle"
              holeDiameter="1mm"
              outerDiameter="1.7mm"
              pcbX={x}
            />
          )}
        </Fragment>
      )
    })}
    <silkscreenrect
      width={`${pinCount * ARDUINO_SHIELD_HEADER_PITCH}mm`}
      height="2.54mm"
    />
  </footprint>
)

const IcspShieldSocketFootprint = () => (
  <footprint insertionDirection="from_below">
    {[-1, 0, 1].flatMap((column) =>
      [-1, 1].map((row, rowIndex) => {
        const pin = (column + 1) * 2 + rowIndex + 1
        return (
          <Fragment key={`icsp-pin-${pin}`}>
            {pin === 1 ? (
              <platedhole
                portHints={[`pin${pin}`]}
                shape="circular_hole_with_rect_pad"
                holeDiameter="1mm"
                rectPadWidth="1.7mm"
                rectPadHeight="1.7mm"
                pcbX={column * ARDUINO_SHIELD_HEADER_PITCH}
                pcbY={(row * ARDUINO_SHIELD_HEADER_PITCH) / 2}
              />
            ) : (
              <platedhole
                portHints={[`pin${pin}`]}
                shape="circle"
                holeDiameter="1mm"
                outerDiameter="1.7mm"
                pcbX={column * ARDUINO_SHIELD_HEADER_PITCH}
                pcbY={(row * ARDUINO_SHIELD_HEADER_PITCH) / 2}
              />
            )}
          </Fragment>
        )
      }),
    )}
    <silkscreenrect width="7.62mm" height="5.08mm" />
  </footprint>
)

export const ArduinoShieldPowerHeader = (props: ConnectorProps) => (
  <connector
    pinLabels={powerPins}
    manufacturerPartNumber="GENERIC-1X8-ARDUINO-STACKING-HEADER"
    footprint={<SingleRowShieldHeaderFootprint pinCount={8} />}
    noSchematicRepresentation
    {...props}
  />
)

export const ArduinoShieldAnalogHeader = (props: ConnectorProps) => (
  <connector
    pinLabels={analogPins}
    manufacturerPartNumber="GENERIC-1X6-ARDUINO-STACKING-HEADER"
    footprint={<SingleRowShieldHeaderFootprint pinCount={6} />}
    noSchematicRepresentation
    {...props}
  />
)

export const ArduinoShieldDigital0To7Header = (props: ConnectorProps) => (
  <connector
    pinLabels={digital0To7Pins}
    manufacturerPartNumber="GENERIC-1X8-ARDUINO-STACKING-HEADER"
    footprint={<SingleRowShieldHeaderFootprint pinCount={8} />}
    noSchematicRepresentation
    {...props}
  />
)

export const ArduinoShieldDigital8To13Header = (props: ConnectorProps) => (
  <connector
    pinLabels={digital8To13Pins}
    manufacturerPartNumber="GENERIC-1X10-ARDUINO-R3-STACKING-HEADER"
    footprint={<SingleRowShieldHeaderFootprint pinCount={10} />}
    noSchematicRepresentation
    {...props}
  />
)

export const ArduinoShieldIcspSocket = (props: ConnectorProps) => (
  <connector
    pinLabels={icspPins}
    manufacturerPartNumber="GENERIC-2X3-ARDUINO-ICSP-FEMALE-DOWN"
    footprint={<IcspShieldSocketFootprint />}
    noSchematicRepresentation
    {...props}
  />
)

export interface ArduinoShieldCladProps {
  children?: ReactNode
  autorouter?: AutorouterProp
  autorouterOptions?: BiscuitBoardAutorouterOptions
  minTraceWidth?: number
  nominalTraceWidth?: number
  routingDisabled?: boolean
  /** Marks every shield header pin NC for bare-template previews only. */
  markHeadersNoConnect?: boolean
}

/** A BiscuitBoard-sized clad with the official Arduino UNO R3 connector grid. */
export const ArduinoShieldClad = ({
  children,
  autorouter,
  autorouterOptions,
  minTraceWidth,
  nominalTraceWidth = 0.3,
  routingDisabled = false,
  markHeadersNoConnect = false,
}: ArduinoShieldCladProps) => (
  <board
    name="ArduinoShieldClad"
    title="BiscuitBoard clad with Arduino UNO R3 shield headers"
    width={`${ARDUINO_SHIELD_CLAD_WIDTH}mm`}
    height={`${ARDUINO_SHIELD_CLAD_HEIGHT}mm`}
    borderRadius="1.5mm"
    layers={2}
    minTraceWidth={`${minTraceWidth ?? 0.15}mm`}
    minBoardEdgeClearance={`${ARDUINO_SHIELD_EDGE_CLEARANCE - ARDUINO_SHIELD_EDGE_CLEARANCE_VALIDATION_TOLERANCE}mm`}
    minViaHoleDiameter="0.2mm"
    minViaPadDiameter="0.4mm"
    autorouter={
      autorouter ??
      createPrefabricatedViaAutorouter({
        width: ARDUINO_SHIELD_CLAD_WIDTH,
        height: ARDUINO_SHIELD_CLAD_HEIGHT,
        edgeClearance: ARDUINO_SHIELD_EDGE_CLEARANCE,
        options: autorouterOptions,
        minimumTraceWidth: minTraceWidth,
        nominalTraceWidth,
      })
    }
    routingDisabled={routingDisabled}
  >
    <net name="GND" isGroundNet />

    {ARDUINO_SHIELD_MOUNTING_HOLE_POSITIONS.map((hole) => (
      <Fragment key={`arduino-mounting-hole-${hole.x}-${hole.y}`}>
        <hole pcbX={hole.x} pcbY={hole.y} diameter="3.2mm" />
      </Fragment>
    ))}

    <ArduinoShieldPowerHeader
      name="J_POWER"
      noConnect={markHeadersNoConnect ? pinNames(8) : ["pin1"]}
      pcbX={ARDUINO_SHIELD_HEADER_PLACEMENTS.power.x}
      pcbY={ARDUINO_SHIELD_HEADER_PLACEMENTS.power.y}
    />
    <ArduinoShieldAnalogHeader
      name="J_ANALOG"
      noConnect={markHeadersNoConnect ? pinNames(6) : undefined}
      pcbX={ARDUINO_SHIELD_HEADER_PLACEMENTS.analog.x}
      pcbY={ARDUINO_SHIELD_HEADER_PLACEMENTS.analog.y}
    />
    <ArduinoShieldDigital0To7Header
      name="J_DIGITAL_0_7"
      noConnect={markHeadersNoConnect ? pinNames(8) : undefined}
      pcbX={ARDUINO_SHIELD_HEADER_PLACEMENTS.digital0To7.x}
      pcbY={ARDUINO_SHIELD_HEADER_PLACEMENTS.digital0To7.y}
      pcbRotation={ARDUINO_SHIELD_HEADER_PLACEMENTS.digital0To7.rotation}
    />
    <ArduinoShieldDigital8To13Header
      name="J_DIGITAL_8_13"
      noConnect={markHeadersNoConnect ? pinNames(10) : undefined}
      pcbX={ARDUINO_SHIELD_HEADER_PLACEMENTS.digital8To13.x}
      pcbY={ARDUINO_SHIELD_HEADER_PLACEMENTS.digital8To13.y}
      pcbRotation={ARDUINO_SHIELD_HEADER_PLACEMENTS.digital8To13.rotation}
    />
    <ArduinoShieldIcspSocket
      name="J_ICSP"
      noConnect={markHeadersNoConnect ? pinNames(6) : undefined}
      pcbX={ARDUINO_SHIELD_HEADER_PLACEMENTS.icsp.x}
      pcbY={ARDUINO_SHIELD_HEADER_PLACEMENTS.icsp.y}
      pcbRotation={ARDUINO_SHIELD_HEADER_PLACEMENTS.icsp.rotation}
    />

    <silkscreentext
      text="ARDUINO UNO R3 SHIELD"
      pcbX={0}
      pcbY={-10.5}
      fontSize="0.8mm"
    />
    <silkscreentext text="POWER" pcbX={2.54} pcbY={-21.5} fontSize="0.65mm" />
    <silkscreentext text="ANALOG" pcbX={22.86} pcbY={-21.5} fontSize="0.65mm" />
    <silkscreentext text="D8-13" pcbX={-4.064} pcbY={21.5} fontSize="0.65mm" />
    <silkscreentext text="D0-7" pcbX={20.32} pcbY={21.5} fontSize="0.65mm" />
    <silkscreentext text="ICSP" pcbX={27.3} pcbY={1.27} fontSize="0.6mm" />

    {ARDUINO_SHIELD_CLAD_VIA_CANDIDATE_ZONES.map((zone) => (
      <Fragment key={`arduino-via-zone-${zone.minX}-${zone.minY}`}>
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

    {ARDUINO_SHIELD_CLAD_VIA_POSITIONS.map((via) => (
      <Fragment key={`arduino-prefab-via-${via.x}-${via.y}`}>
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
        x: -ARDUINO_SHIELD_CLAD_WIDTH / 2,
        y: ARDUINO_SHIELD_CLAD_HEIGHT / 2 + 2.5,
      }}
      to={{
        x: ARDUINO_SHIELD_CLAD_WIDTH / 2,
        y: ARDUINO_SHIELD_CLAD_HEIGHT / 2 + 2.5,
      }}
      text={`${ARDUINO_SHIELD_CLAD_WIDTH}mm`}
    />
    <pcbnotedimension
      from={{
        x: ARDUINO_SHIELD_CLAD_WIDTH / 2 + 2.5,
        y: -ARDUINO_SHIELD_CLAD_HEIGHT / 2,
      }}
      to={{
        x: ARDUINO_SHIELD_CLAD_WIDTH / 2 + 2.5,
        y: ARDUINO_SHIELD_CLAD_HEIGHT / 2,
      }}
      text={`${ARDUINO_SHIELD_CLAD_HEIGHT}mm`}
    />

    {children}
  </board>
)
