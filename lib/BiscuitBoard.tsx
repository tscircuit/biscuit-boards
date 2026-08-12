import type { SimpleRouteJson } from "@tscircuit/core"
import type { AutorouterConfig, AutorouterProp } from "@tscircuit/props"
import { Fragment, type ReactNode } from "react"
import {
  BiscuitBoardAutorouter,
  type BiscuitBoardAutorouterOptions,
  createBiscuitBoardAutorouter,
} from "./biscuit-board-autorouter"

export const BISCUIT_BOARD_WIDTH = 75
export const BISCUIT_BOARD_HEIGHT = 55
const BISCUIT_BOARD_EDGE_CLEARANCE = 0.2
// Core's DRC currently treats an exactly-equal floating-point distance as a
// violation. Route at the full clearance, but leave a 1 µm comparison epsilon.
const BISCUIT_BOARD_EDGE_CLEARANCE_VALIDATION_TOLERANCE = 0.001

const createBoardBoundedAutorouter = (
  options: BiscuitBoardAutorouterOptions | undefined,
  minimumTraceWidth: number | undefined,
  nominalTraceWidth: number,
): AutorouterConfig => ({
  ...createBiscuitBoardAutorouter(options),
  algorithmFn: async (input: SimpleRouteJson) =>
    new BiscuitBoardAutorouter(
      {
        ...input,
        minTraceWidth: Math.max(input.minTraceWidth, minimumTraceWidth ?? 0),
        nominalTraceWidth: Math.max(
          input.nominalTraceWidth ?? 0,
          nominalTraceWidth,
          minimumTraceWidth ?? 0,
        ),
        connections: input.connections.map((connection) => {
          const width = Math.max(
            connection.width ?? input.minTraceWidth,
            minimumTraceWidth ?? 0,
          )
          return {
            ...connection,
            width,
            nominalTraceWidth: Math.max(
              connection.nominalTraceWidth ?? 0,
              nominalTraceWidth,
              width,
            ),
          }
        }),
        minBoardEdgeClearance: BISCUIT_BOARD_EDGE_CLEARANCE,
        bounds: {
          minX: -BISCUIT_BOARD_WIDTH / 2,
          maxX: BISCUIT_BOARD_WIDTH / 2,
          minY: -BISCUIT_BOARD_HEIGHT / 2,
          maxY: BISCUIT_BOARD_HEIGHT / 2,
        },
      },
      options,
    ),
})

export interface BiscuitBoardViaPosition {
  x: number
  y: number
}

const range = (start: number, end: number, increment: number): number[] =>
  Array.from(
    { length: Math.max(0, Math.floor((end - start) / increment)) },
    (_, index) => start + index * increment,
  )

const createViaZone = (zone: {
  minX: number
  maxX: number
  minY: number
  maxY: number
  spacing: number
}): BiscuitBoardViaPosition[] => {
  const xRange = range(zone.minX, zone.maxX, zone.spacing)
  const yRange = range(zone.minY, zone.maxY, zone.spacing)
  const centeringOffsetX =
    (zone.maxX - zone.minX - (xRange.length - 1) * zone.spacing) / 2
  const centeringOffsetY =
    (zone.maxY - zone.minY - (yRange.length - 1) * zone.spacing) / 2

  return xRange.flatMap((x) =>
    yRange.map((y) => ({
      x: x + centeringOffsetX,
      y: y + centeringOffsetY,
    })),
  )
}

export const BISCUIT_BOARD_VIA_ZONES = [
  { minX: -33.5, maxX: -21.5, minY: -23.5, maxY: -15.5, spacing: 4 },
  { minX: -33.5, maxX: -21.5, minY: 15.5, maxY: 23.5, spacing: 4 },
  { minX: 10, maxX: 27.5, minY: 17.5, maxY: 25.5, spacing: 4 },
  { minX: 30.5, maxX: 34.5, minY: -22.5, maxY: 22.5, spacing: 4 },
  { minX: -20, maxX: 0, minY: -8, maxY: 8, spacing: 4 },
] as const

export const BISCUIT_BOARD_VIA_POSITIONS =
  BISCUIT_BOARD_VIA_ZONES.flatMap(createViaZone)

const mountingHoles = [
  { x: BISCUIT_BOARD_WIDTH / 2 - 2.5, y: BISCUIT_BOARD_HEIGHT / 2 - 2.5 },
  { x: BISCUIT_BOARD_WIDTH / 2 - 6.5, y: BISCUIT_BOARD_HEIGHT / 2 - 2.5 },
  { x: BISCUIT_BOARD_WIDTH / 2 - 2.5, y: -BISCUIT_BOARD_HEIGHT / 2 + 2.5 },
  { x: -BISCUIT_BOARD_WIDTH / 2 + 2.5, y: -BISCUIT_BOARD_HEIGHT / 2 + 2.5 },
  { x: -BISCUIT_BOARD_WIDTH / 2 + 2.5, y: BISCUIT_BOARD_HEIGHT / 2 - 2.5 },
] as const

export interface BiscuitBoardProps {
  children?: ReactNode
  autorouter?: AutorouterProp
  autorouterOptions?: BiscuitBoardAutorouterOptions
  /** Enforced minimum trace width in millimeters. */
  minTraceWidth?: number
  /** Preferred post-route trace width in millimeters. Defaults to 0.3 mm. */
  nominalTraceWidth?: number
  routingDisabled?: boolean
}

/**
 * A prefabricated 75 mm x 55 mm copper-clad board with fixed through vias.
 * Child components use ordinary tscircuit TSX; the default local autorouter
 * can change layers only at the checked-in prefabricated via positions.
 */
export const BiscuitBoard = ({
  children,
  autorouter,
  autorouterOptions,
  minTraceWidth,
  nominalTraceWidth = 0.3,
  routingDisabled = false,
}: BiscuitBoardProps) => (
  <board
    name="BiscuitBoard"
    title="BiscuitBoard prefabricated copper clad"
    width={`${BISCUIT_BOARD_WIDTH}mm`}
    height={`${BISCUIT_BOARD_HEIGHT}mm`}
    borderRadius="2mm"
    layers={2}
    minTraceWidth={`${minTraceWidth ?? 0.15}mm`}
    minBoardEdgeClearance={`${BISCUIT_BOARD_EDGE_CLEARANCE - BISCUIT_BOARD_EDGE_CLEARANCE_VALIDATION_TOLERANCE}mm`}
    minViaHoleDiameter="0.2mm"
    minViaPadDiameter="0.4mm"
    autorouter={
      autorouter ??
      createBoardBoundedAutorouter(
        autorouterOptions,
        minTraceWidth,
        nominalTraceWidth,
      )
    }
    routingDisabled={routingDisabled}
  >
    <net name="GND" isGroundNet />

    <silkscreentext
      text="UP"
      pcbX={BISCUIT_BOARD_WIDTH / 2 - 10}
      pcbY={25.5}
      layer="top"
      fontSize="2mm"
    />

    {mountingHoles.map((hole) => (
      <Fragment key={`mounting-hole-${hole.x}-${hole.y}`}>
        <hole pcbX={hole.x} pcbY={hole.y} diameter="2.2mm" />
      </Fragment>
    ))}

    {BISCUIT_BOARD_VIA_ZONES.map((zone) => (
      <Fragment key={`via-zone-${zone.minX}-${zone.minY}`}>
        <pcbnoterect
          color="blue"
          width={zone.maxX - zone.minX}
          height={zone.maxY - zone.minY}
          pcbPositionAnchor="center"
          pcbX={zone.minX + (zone.maxX - zone.minX) / 2}
          pcbY={zone.minY + (zone.maxY - zone.minY) / 2}
        />
      </Fragment>
    ))}

    {BISCUIT_BOARD_VIA_POSITIONS.map((via) => (
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
        x: -BISCUIT_BOARD_WIDTH / 2,
        y: BISCUIT_BOARD_HEIGHT / 2 + 2.5,
      }}
      to={{
        x: BISCUIT_BOARD_WIDTH / 2,
        y: BISCUIT_BOARD_HEIGHT / 2 + 2.5,
      }}
      text={`${BISCUIT_BOARD_WIDTH}mm`}
    />
    <pcbnotedimension
      from={{
        x: BISCUIT_BOARD_WIDTH / 2 + 2.5,
        y: -BISCUIT_BOARD_HEIGHT / 2,
      }}
      to={{
        x: BISCUIT_BOARD_WIDTH / 2 + 2.5,
        y: BISCUIT_BOARD_HEIGHT / 2,
      }}
      text={`${BISCUIT_BOARD_HEIGHT}mm`}
    />

    {children}
  </board>
)
