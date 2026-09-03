import type { SimpleRouteJson } from "@tscircuit/core"
import type { AutorouterProp } from "@tscircuit/props"
import { Fragment, type ReactNode } from "react"
import type { BiscuitBoardAutorouterOptions } from "./biscuit-board-autorouter"
import { createPrefabricatedViaAutorouter } from "./create-prefabricated-via-autorouter"

export const BISCUIT_BOARD_V2_WIDTH = 75
export const BISCUIT_BOARD_V2_HEIGHT = 55
export const BISCUIT_BOARD_V2_MOUNTING_HOLE_DIAMETER = 2.2
export const BISCUIT_BOARD_V2_VIA_HOLE_DIAMETER = 0.5
export const BISCUIT_BOARD_V2_VIA_ANNULAR_RING_WIDTH = 0.254
export const BISCUIT_BOARD_V2_VIA_PAD_DIAMETER =
  BISCUIT_BOARD_V2_VIA_HOLE_DIAMETER +
  2 * BISCUIT_BOARD_V2_VIA_ANNULAR_RING_WIDTH
export const BISCUIT_BOARD_V2_VIA_SPACING = 2.5
export const BISCUIT_BOARD_V2_VIA_ARM_WIDTH = 2 * BISCUIT_BOARD_V2_VIA_SPACING
export const BISCUIT_BOARD_V2_VIA_X_OUTER_OFFSET = 32.2
export const BISCUIT_BOARD_V2_VIA_X_INNER_OFFSET =
  BISCUIT_BOARD_V2_VIA_X_OUTER_OFFSET - 4 * BISCUIT_BOARD_V2_VIA_SPACING
export const BISCUIT_BOARD_V2_VIA_Y_OUTER_OFFSET = 26.2
export const BISCUIT_BOARD_V2_VIA_Y_INNER_OFFSET =
  BISCUIT_BOARD_V2_VIA_Y_OUTER_OFFSET - 4 * BISCUIT_BOARD_V2_VIA_SPACING
export const BISCUIT_BOARD_V2_VIA_X_OUTWARD_SHIFT = 3.9
export const BISCUIT_BOARD_V2_CENTER_VIA_HALF_WIDTH =
  2 * BISCUIT_BOARD_V2_VIA_SPACING
export const BISCUIT_BOARD_V2_CENTER_VIA_Y_INNER_OFFSET =
  BISCUIT_BOARD_V2_VIA_Y_INNER_OFFSET + BISCUIT_BOARD_V2_VIA_SPACING

const BISCUIT_BOARD_V2_EDGE_CLEARANCE = 0.5
const BISCUIT_BOARD_V2_EDGE_CLEARANCE_VALIDATION_TOLERANCE = 0.001

export interface BiscuitBoardV2ViaPosition {
  x: number
  y: number
}

const roundCoordinate = (value: number) => Math.round(value * 1e6) / 1e6

const createPitchedRange = (start: number, end: number): number[] =>
  Array.from(
    {
      length: Math.round((end - start) / BISCUIT_BOARD_V2_VIA_SPACING) + 1,
    },
    (_, index) => roundCoordinate(start + index * BISCUIT_BOARD_V2_VIA_SPACING),
  )

const cornerViaAxisX = createPitchedRange(
  BISCUIT_BOARD_V2_VIA_X_INNER_OFFSET,
  BISCUIT_BOARD_V2_VIA_X_OUTER_OFFSET,
)
const cornerViaAxisY = createPitchedRange(
  BISCUIT_BOARD_V2_VIA_Y_INNER_OFFSET,
  BISCUIT_BOARD_V2_VIA_Y_OUTER_OFFSET,
)
const cornerViaArmAxisX = createPitchedRange(
  BISCUIT_BOARD_V2_VIA_X_INNER_OFFSET,
  BISCUIT_BOARD_V2_VIA_X_INNER_OFFSET + BISCUIT_BOARD_V2_VIA_ARM_WIDTH,
)
const cornerViaArmAxisY = createPitchedRange(
  BISCUIT_BOARD_V2_VIA_Y_INNER_OFFSET,
  BISCUIT_BOARD_V2_VIA_Y_INNER_OFFSET + BISCUIT_BOARD_V2_VIA_ARM_WIDTH,
)

const biscuitBoardV2ViaCorners = (
  [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ] as const
).map(([xSign, ySign]) => ({
  xSign,
  ySign,
  xOutwardShift: BISCUIT_BOARD_V2_VIA_X_OUTWARD_SHIFT,
}))

const createCornerViaPositions = ({
  xSign,
  ySign,
  xOutwardShift,
}: (typeof biscuitBoardV2ViaCorners)[number]): BiscuitBoardV2ViaPosition[] => {
  const shiftedCornerViaAxisX = cornerViaAxisX.map((x) =>
    roundCoordinate(x + xOutwardShift),
  )
  const shiftedCornerViaArmAxisX = cornerViaArmAxisX.map((x) =>
    roundCoordinate(x + xOutwardShift),
  )
  const horizontalArm = shiftedCornerViaAxisX.flatMap((x) =>
    cornerViaArmAxisY.map((y) => ({ x: x * xSign, y: y * ySign })),
  )
  const verticalArm = shiftedCornerViaArmAxisX.flatMap((x) =>
    cornerViaAxisY.map((y) => ({ x: x * xSign, y: y * ySign })),
  )

  return Array.from(
    new Map(
      [...horizontalArm, ...verticalArm].map((point) => [
        `${point.x},${point.y}`,
        point,
      ]),
    ).values(),
  )
}

/** Bounding boxes for the four corner via fields. */
export const BISCUIT_BOARD_V2_CORNER_VIA_ZONES = biscuitBoardV2ViaCorners.map(
  ({ xSign, ySign, xOutwardShift }) => {
    const localMinX = BISCUIT_BOARD_V2_VIA_X_INNER_OFFSET + xOutwardShift
    const localMaxX = BISCUIT_BOARD_V2_VIA_X_OUTER_OFFSET + xOutwardShift
    return {
      minX: xSign === 1 ? localMinX : -localMaxX,
      maxX: xSign === 1 ? localMaxX : -localMinX,
      minY:
        ySign === 1
          ? BISCUIT_BOARD_V2_VIA_Y_INNER_OFFSET
          : -BISCUIT_BOARD_V2_VIA_Y_OUTER_OFFSET,
      maxY:
        ySign === 1
          ? BISCUIT_BOARD_V2_VIA_Y_OUTER_OFFSET
          : -BISCUIT_BOARD_V2_VIA_Y_INNER_OFFSET,
      spacing: BISCUIT_BOARD_V2_VIA_SPACING,
    }
  },
)

/** Four three-via-wide L-shaped fields with 21 vias per corner. */
export const BISCUIT_BOARD_V2_CORNER_VIA_POSITIONS =
  biscuitBoardV2ViaCorners.flatMap(createCornerViaPositions)

/** Two 5 x 4 via grids centered along the top and bottom edges. */
export const BISCUIT_BOARD_V2_CENTER_VIA_ZONES = ([-1, 1] as const).map(
  (ySign) => ({
    minX: -BISCUIT_BOARD_V2_CENTER_VIA_HALF_WIDTH,
    maxX: BISCUIT_BOARD_V2_CENTER_VIA_HALF_WIDTH,
    minY:
      ySign === 1
        ? BISCUIT_BOARD_V2_CENTER_VIA_Y_INNER_OFFSET
        : -BISCUIT_BOARD_V2_VIA_Y_OUTER_OFFSET,
    maxY:
      ySign === 1
        ? BISCUIT_BOARD_V2_VIA_Y_OUTER_OFFSET
        : -BISCUIT_BOARD_V2_CENTER_VIA_Y_INNER_OFFSET,
    spacing: BISCUIT_BOARD_V2_VIA_SPACING,
  }),
)

export const BISCUIT_BOARD_V2_CENTER_VIA_POSITIONS =
  BISCUIT_BOARD_V2_CENTER_VIA_ZONES.flatMap((zone) =>
    createPitchedRange(zone.minX, zone.maxX).flatMap((x) =>
      createPitchedRange(zone.minY, zone.maxY).map((y) => ({ x, y })),
    ),
  )

export const BISCUIT_BOARD_V2_VIA_ZONES = [
  ...BISCUIT_BOARD_V2_CORNER_VIA_ZONES,
  ...BISCUIT_BOARD_V2_CENTER_VIA_ZONES,
]

export const BISCUIT_BOARD_V2_VIA_POSITIONS = [
  ...BISCUIT_BOARD_V2_CORNER_VIA_POSITIONS,
  ...BISCUIT_BOARD_V2_CENTER_VIA_POSITIONS,
]

export const BISCUIT_BOARD_V2_MOUNTING_HOLE_POSITIONS = [
  {
    x: BISCUIT_BOARD_V2_WIDTH / 2 - 2.5,
    y: BISCUIT_BOARD_V2_HEIGHT / 2 - 2.5,
  },
  {
    x: BISCUIT_BOARD_V2_WIDTH / 2 - 2.5,
    y: -BISCUIT_BOARD_V2_HEIGHT / 2 + 2.5,
  },
  {
    x: -BISCUIT_BOARD_V2_WIDTH / 2 + 2.5,
    y: -BISCUIT_BOARD_V2_HEIGHT / 2 + 2.5,
  },
  {
    x: -BISCUIT_BOARD_V2_WIDTH / 2 + 2.5,
    y: BISCUIT_BOARD_V2_HEIGHT / 2 - 2.5,
  },
] as const

export interface BiscuitBoardV2Props {
  children?: ReactNode
  autorouter?: AutorouterProp
  autorouterOptions?: BiscuitBoardAutorouterOptions
  minTraceWidth?: number
  minTraceToPadEdgeClearance?: number
  nominalTraceWidth?: number
  reservedAutorouterObstacles?: SimpleRouteJson["obstacles"]
  autorouterEdgeClearance?: number
  routingDisabled?: boolean
}

/** The second-generation 75 mm x 55 mm BiscuitBoard corner-via clad. */
export const BiscuitBoardV2 = ({
  children,
  autorouter,
  autorouterOptions,
  minTraceWidth,
  minTraceToPadEdgeClearance,
  nominalTraceWidth = 0.3,
  reservedAutorouterObstacles,
  autorouterEdgeClearance,
  routingDisabled = false,
}: BiscuitBoardV2Props) => (
  <board
    name="BiscuitBoardV2"
    title="BiscuitBoard V2 prefabricated copper clad"
    width={`${BISCUIT_BOARD_V2_WIDTH}mm`}
    height={`${BISCUIT_BOARD_V2_HEIGHT}mm`}
    borderRadius="2mm"
    layers={2}
    minTraceWidth={`${minTraceWidth ?? 0.15}mm`}
    minTraceToPadEdgeClearance={
      minTraceToPadEdgeClearance === undefined
        ? undefined
        : `${minTraceToPadEdgeClearance}mm`
    }
    minBoardEdgeClearance={`${BISCUIT_BOARD_V2_EDGE_CLEARANCE - BISCUIT_BOARD_V2_EDGE_CLEARANCE_VALIDATION_TOLERANCE}mm`}
    minViaHoleDiameter={`${BISCUIT_BOARD_V2_VIA_HOLE_DIAMETER}mm`}
    minViaPadDiameter={`${BISCUIT_BOARD_V2_VIA_PAD_DIAMETER}mm`}
    autorouter={
      autorouter ??
      createPrefabricatedViaAutorouter({
        width: BISCUIT_BOARD_V2_WIDTH,
        height: BISCUIT_BOARD_V2_HEIGHT,
        edgeClearance:
          autorouterEdgeClearance ?? BISCUIT_BOARD_V2_EDGE_CLEARANCE,
        options: autorouterOptions,
        minimumTraceWidth: minTraceWidth,
        nominalTraceWidth,
        reservedObstacles: reservedAutorouterObstacles,
      })
    }
    routingDisabled={routingDisabled}
  >
    <net name="GND" isGroundNet />

    <silkscreentext
      text="UP"
      pcbX={15}
      pcbY={25.5}
      layer="top"
      fontSize="2mm"
    />

    {BISCUIT_BOARD_V2_MOUNTING_HOLE_POSITIONS.map((hole) => (
      <Fragment key={`biscuit-board-v2-mounting-hole-${hole.x}-${hole.y}`}>
        <hole
          pcbX={hole.x}
          pcbY={hole.y}
          diameter={`${BISCUIT_BOARD_V2_MOUNTING_HOLE_DIAMETER}mm`}
        />
      </Fragment>
    ))}

    {BISCUIT_BOARD_V2_VIA_ZONES.map((zone) => (
      <Fragment key={`biscuit-board-v2-via-zone-${zone.minX}-${zone.minY}`}>
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

    {BISCUIT_BOARD_V2_VIA_POSITIONS.map((via) => (
      <Fragment key={`biscuit-board-v2-prefab-via-${via.x}-${via.y}`}>
        <via
          netIsAssignable
          pcbX={via.x}
          pcbY={via.y}
          fromLayer="top"
          toLayer="bottom"
          holeDiameter={`${BISCUIT_BOARD_V2_VIA_HOLE_DIAMETER}mm`}
          outerDiameter={`${BISCUIT_BOARD_V2_VIA_PAD_DIAMETER}mm`}
        />
      </Fragment>
    ))}

    <pcbnotedimension
      from={{
        x: -BISCUIT_BOARD_V2_WIDTH / 2,
        y: BISCUIT_BOARD_V2_HEIGHT / 2 + 2.5,
      }}
      to={{
        x: BISCUIT_BOARD_V2_WIDTH / 2,
        y: BISCUIT_BOARD_V2_HEIGHT / 2 + 2.5,
      }}
      text={`${BISCUIT_BOARD_V2_WIDTH}mm`}
    />
    <pcbnotedimension
      from={{
        x: BISCUIT_BOARD_V2_WIDTH / 2 + 2.5,
        y: -BISCUIT_BOARD_V2_HEIGHT / 2,
      }}
      to={{
        x: BISCUIT_BOARD_V2_WIDTH / 2 + 2.5,
        y: BISCUIT_BOARD_V2_HEIGHT / 2,
      }}
      text={`${BISCUIT_BOARD_V2_HEIGHT}mm`}
    />

    {children}
  </board>
)

export default BiscuitBoardV2
