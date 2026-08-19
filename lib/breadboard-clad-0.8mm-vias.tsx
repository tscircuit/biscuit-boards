import type { AutorouterProp } from "@tscircuit/props"
import { Fragment, type ReactNode } from "react"
import { BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS } from "./BiscuitBoard"
import type { BiscuitBoardAutorouterOptions } from "./biscuit-board-autorouter"
import {
  BREADBOARD_CLAD_HEIGHT,
  BREADBOARD_CLAD_WIDTH,
  BREADBOARD_COLUMN_COUNT,
  BREADBOARD_COLUMN_XS,
  BREADBOARD_MOUNTING_HOLE_DIAMETER,
  BREADBOARD_TERMINAL_ROW_YS,
  BreadboardTerminalHeaders,
  type BreadboardTerminalRowLabel,
} from "./breadboard-clad"
import { createPrefabricatedViaAutorouter } from "./create-prefabricated-via-autorouter"

export const BREADBOARD_08MM_VIA_HOLE_DIAMETER = 0.8
export const BREADBOARD_08MM_VIA_PAD_DIAMETER = 0.9
export const BREADBOARD_08MM_MIN_VIA_EDGE_SPACING = 2
export const BREADBOARD_08MM_BREAKOUT_TRACE_WIDTH = 0.3
export const BREADBOARD_08MM_BREAKOUT_PAD_DIAMETER = 0.3
export const BREADBOARD_08MM_CORNER_VIA_SPACING = 3
export const BREADBOARD_08MM_CORNER_VIA_ARM_WIDTH = 3
export const BREADBOARD_08MM_CORNER_VIA_LONG_SIDE_COLUMNS = 5
export const BREADBOARD_08MM_CORNER_VIA_X_OUTER_OFFSET = 31
export const BREADBOARD_08MM_CORNER_VIA_X_INNER_OFFSET =
  BREADBOARD_08MM_CORNER_VIA_X_OUTER_OFFSET -
  (BREADBOARD_08MM_CORNER_VIA_LONG_SIDE_COLUMNS - 1) *
    BREADBOARD_08MM_CORNER_VIA_SPACING
export const BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET = 19
export const BREADBOARD_08MM_CORNER_VIA_Y_OUTER_OFFSET = 25
export const BREADBOARD_08MM_CORNER_VIA_X_OUTWARD_SHIFT = 3
export const BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET = 1.5
export const BREADBOARD_08MM_VIA_BREAKOUT_LENGTH = 1.4
export const BREADBOARD_08MM_BREAKOUT_TO_MOUNTING_HOLE_CLEARANCE = 1
export const BREADBOARD_08MM_ROW_BREAKOUT_LENGTH = 1.2

const BREADBOARD_08MM_CLAD_EDGE_CLEARANCE = 0.2
const BREADBOARD_08MM_CLAD_EDGE_CLEARANCE_VALIDATION_TOLERANCE = 0.001

export const BREADBOARD_08MM_TOP_BANK_ROWS = [
  "A",
  "B",
  "C",
  "D",
  "E",
] as const satisfies readonly BreadboardTerminalRowLabel[]
export const BREADBOARD_08MM_BOTTOM_BANK_ROWS = [
  "F",
  "G",
  "H",
  "I",
  "J",
] as const satisfies readonly BreadboardTerminalRowLabel[]

export type Breadboard08mmViaCorner =
  | "top_left"
  | "top_right"
  | "bottom_left"
  | "bottom_right"

export type Breadboard08mmViaArm = "horizontal" | "vertical"
export type Breadboard08mmViaBreakoutStyle = "direct" | "woven"
export type Breadboard08mmViaBreakoutSide = "long_side" | "short_side"

export interface Breadboard08mmViaPosition {
  name: string
  corner: Breadboard08mmViaCorner
  arm: Breadboard08mmViaArm
  breakoutSide: Breadboard08mmViaBreakoutSide
  breakoutStyle: Breadboard08mmViaBreakoutStyle
  x: number
  y: number
  breakoutRoute: Array<{ x: number; y: number }>
  breakoutEnd: { x: number; y: number }
}

export interface Breadboard08mmRowConnection {
  from: string
  to: string
  column: number
}

export interface Breadboard08mmRowBreakout {
  name: string
  terminalLabel: string
  column: number
  start: { x: number; y: number }
  end: { x: number; y: number }
}

const roundCoordinate = (value: number) => Math.round(value * 1e6) / 1e6

const createPitchedRange = (start: number, end: number) =>
  Array.from(
    {
      length:
        Math.round((end - start) / BREADBOARD_08MM_CORNER_VIA_SPACING) + 1,
    },
    (_, index) =>
      roundCoordinate(start + index * BREADBOARD_08MM_CORNER_VIA_SPACING),
  )

const cornerViaAxisX = createPitchedRange(
  BREADBOARD_08MM_CORNER_VIA_X_INNER_OFFSET,
  BREADBOARD_08MM_CORNER_VIA_X_OUTER_OFFSET,
)
const cornerViaArmAxisX = createPitchedRange(
  BREADBOARD_08MM_CORNER_VIA_X_INNER_OFFSET,
  BREADBOARD_08MM_CORNER_VIA_X_INNER_OFFSET +
    BREADBOARD_08MM_CORNER_VIA_ARM_WIDTH,
)
const cornerViaArmAxisY = createPitchedRange(
  BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET,
  BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET +
    BREADBOARD_08MM_CORNER_VIA_ARM_WIDTH,
)

interface LocalCornerPoint {
  x: number
  y: number
}

interface LocalCornerVia extends LocalCornerPoint {
  nameSuffix: string
  arm: Breadboard08mmViaArm
}

interface LocalCornerBreakout {
  side: Breadboard08mmViaBreakoutSide
  style: Breadboard08mmViaBreakoutStyle
  route: LocalCornerPoint[]
  end: LocalCornerPoint
}

const getPointToSegmentDistance = (
  point: LocalCornerPoint,
  start: LocalCornerPoint,
  end: LocalCornerPoint,
) => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  const projection =
    lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((point.x - start.x) * dx + (point.y - start.y) * dy) /
              lengthSquared,
          ),
        )
  return Math.hypot(
    point.x - (start.x + projection * dx),
    point.y - (start.y + projection * dy),
  )
}

const createCornerViaPositions = (
  corner: Breadboard08mmViaCorner,
  xSign: -1 | 1,
  ySign: -1 | 1,
): Breadboard08mmViaPosition[] => {
  const xOutwardShift =
    xSign === -1 || ySign === -1
      ? BREADBOARD_08MM_CORNER_VIA_X_OUTWARD_SHIFT
      : 0
  const toBoardPoint = (point: LocalCornerPoint) => ({
    x: roundCoordinate(point.x * xSign),
    y: roundCoordinate(point.y * ySign),
  })
  const shiftedCornerViaAxisX = cornerViaAxisX.map((x) =>
    roundCoordinate(x + xOutwardShift),
  )
  const shiftedCornerViaArmAxisX = cornerViaArmAxisX.map((x) =>
    roundCoordinate(x + xOutwardShift),
  )
  const verticalExtensionY = BREADBOARD_08MM_CORNER_VIA_Y_OUTER_OFFSET
  const localVias: LocalCornerVia[] = [
    ...shiftedCornerViaAxisX.flatMap((x, xIndex) =>
      cornerViaArmAxisY.map((y, yIndex) => ({
        nameSuffix: `H${xIndex + 1}_${yIndex === 0 ? "INNER" : "OUTER"}`,
        arm: "horizontal" as const,
        x,
        y,
      })),
    ),
    ...shiftedCornerViaArmAxisX.map((x, xIndex) => ({
      nameSuffix: `V3_${xIndex === 0 ? "INNER" : "OUTER"}`,
      arm: "vertical" as const,
      x,
      y: verticalExtensionY,
    })),
  ]

  const createBreakout = (
    via: LocalCornerVia,
    side: Breadboard08mmViaBreakoutSide,
  ): LocalCornerBreakout => {
    if (side === "long_side") {
      const sameColumnVias = localVias.filter(
        (candidate) => candidate.x === via.x,
      )
      const blockers = localVias.filter(
        (candidate) => candidate.x === via.x && candidate.y > via.y,
      )
      if (blockers.length === 0) {
        return {
          side,
          style: "direct",
          route: [],
          end: { x: via.x, y: via.y + BREADBOARD_08MM_VIA_BREAKOUT_LENGTH },
        }
      }
      const weaveX =
        via.x -
        (BREADBOARD_08MM_CORNER_VIA_SPACING * blockers.length) /
          sameColumnVias.length
      return {
        side,
        style: "woven",
        route: [
          {
            x: weaveX,
            y: via.y + BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET,
          },
        ],
        end: {
          x: weaveX,
          y:
            Math.max(...blockers.map((blocker) => blocker.y)) +
            BREADBOARD_08MM_VIA_BREAKOUT_LENGTH,
        },
      }
    }

    const blockers = localVias.filter(
      (candidate) => candidate.y === via.y && candidate.x > via.x,
    )
    if (blockers.length === 0) {
      return {
        side,
        style: "direct",
        route: [],
        end: { x: via.x + BREADBOARD_08MM_VIA_BREAKOUT_LENGTH, y: via.y },
      }
    }
    const weaveY = via.y - BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET
    return {
      side,
      style: "woven",
      route: [
        {
          x: via.x + BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET,
          y: weaveY,
        },
      ],
      end: {
        x:
          Math.max(...blockers.map((blocker) => blocker.x)) +
          BREADBOARD_08MM_VIA_BREAKOUT_LENGTH,
        y: weaveY,
      },
    }
  }

  const approachesMountingHole = (
    via: LocalCornerVia,
    breakout: LocalCornerBreakout,
  ) => {
    const route = [via, ...breakout.route, breakout.end].map(toBoardPoint)
    const minimumCenterlineDistance = Math.min(
      ...BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS.flatMap((hole) =>
        route
          .slice(0, -1)
          .map((point, index) =>
            getPointToSegmentDistance(hole, point, route[index + 1]!),
          ),
      ),
    )
    return (
      minimumCenterlineDistance -
        BREADBOARD_MOUNTING_HOLE_DIAMETER / 2 -
        BREADBOARD_08MM_BREAKOUT_TRACE_WIDTH / 2 <
      BREADBOARD_08MM_BREAKOUT_TO_MOUNTING_HOLE_CLEARANCE
    )
  }

  return localVias.map((via): Breadboard08mmViaPosition => {
    const longSideDistance = BREADBOARD_CLAD_HEIGHT / 2 - via.y
    const shortSideDistance = BREADBOARD_CLAD_WIDTH / 2 - via.x
    const preferredSide =
      longSideDistance <= shortSideDistance ? "long_side" : "short_side"
    const alternateSide =
      preferredSide === "long_side" ? "short_side" : "long_side"
    const preferredBreakout = createBreakout(via, preferredSide)
    const breakout = approachesMountingHole(via, preferredBreakout)
      ? createBreakout(via, alternateSide)
      : preferredBreakout

    return {
      name: `V_${corner.toUpperCase()}_${via.nameSuffix}`,
      corner,
      arm: via.arm,
      breakoutSide: breakout.side,
      breakoutStyle: breakout.style,
      ...toBoardPoint(via),
      breakoutRoute: breakout.route.map(toBoardPoint),
      breakoutEnd: toBoardPoint(breakout.end),
    }
  })
}

/** Four independent two-via-wide L fields with five long-side columns. */
export const BREADBOARD_08MM_VIA_POSITIONS = (
  [
    ["top_left", -1, 1],
    ["top_right", 1, 1],
    ["bottom_left", -1, -1],
    ["bottom_right", 1, -1],
  ] as const
).flatMap(([corner, xSign, ySign]) =>
  createCornerViaPositions(corner, xSign, ySign),
)

const createBankRowConnections = (
  rows: readonly BreadboardTerminalRowLabel[],
  column: number,
): Breadboard08mmRowConnection[] =>
  rows.slice(0, -1).map((row, index) => ({
    from: `${row}${column}`,
    to: `${rows[index + 1]}${column}`,
    column,
  }))

/** A-E and F-J are connected as conventional five-socket terminal strips. */
export const BREADBOARD_08MM_ROW_CONNECTIONS = Array.from(
  { length: BREADBOARD_COLUMN_COUNT },
  (_, index) => index + 1,
).flatMap((column) => [
  ...createBankRowConnections(BREADBOARD_08MM_TOP_BANK_ROWS, column),
  ...createBankRowConnections(BREADBOARD_08MM_BOTTOM_BANK_ROWS, column),
])

const createRowBreakout = (
  terminalLabel: string,
  column: number,
  y: number,
  yDirection: -1 | 1,
): Breadboard08mmRowBreakout => {
  const x = BREADBOARD_COLUMN_XS[column - 1]!
  return {
    name: `ROW_${terminalLabel}_BREAKOUT`,
    terminalLabel,
    column,
    start: { x, y },
    end: {
      x,
      y: roundCoordinate(y + yDirection * BREADBOARD_08MM_ROW_BREAKOUT_LENGTH),
    },
  }
}

/** Open copper stubs extend from both ends of every terminal strip. */
export const BREADBOARD_08MM_ROW_BREAKOUTS = Array.from(
  { length: BREADBOARD_COLUMN_COUNT },
  (_, index) => index + 1,
).flatMap((column) => [
  createRowBreakout(`A${column}`, column, BREADBOARD_TERMINAL_ROW_YS.A, 1),
  createRowBreakout(`E${column}`, column, BREADBOARD_TERMINAL_ROW_YS.E, -1),
  createRowBreakout(`F${column}`, column, BREADBOARD_TERMINAL_ROW_YS.F, 1),
  createRowBreakout(`J${column}`, column, BREADBOARD_TERMINAL_ROW_YS.J, -1),
])

const viaBreakoutPinLabels = Object.fromEntries(
  BREADBOARD_08MM_VIA_POSITIONS.map((via, index) => [
    `pin${index + 1}`,
    via.name,
  ]),
)

const rowBreakoutPinLabels = Object.fromEntries(
  BREADBOARD_08MM_ROW_BREAKOUTS.map((breakout, index) => [
    `pin${index + 1}`,
    breakout.name,
  ]),
)

const Breadboard08mmViaBreakoutFootprint = () => (
  <footprint>
    {BREADBOARD_08MM_VIA_POSITIONS.map((via, index) => (
      <Fragment key={`via-breakout-pad-${via.name}`}>
        <smtpad
          portHints={[`pin${index + 1}`]}
          shape="circle"
          radius={`${BREADBOARD_08MM_BREAKOUT_PAD_DIAMETER / 2}mm`}
          pcbX={via.breakoutEnd.x}
          pcbY={via.breakoutEnd.y}
        />
      </Fragment>
    ))}
  </footprint>
)

const Breadboard08mmRowBreakoutFootprint = () => (
  <footprint>
    {BREADBOARD_08MM_ROW_BREAKOUTS.map((breakout, index) => (
      <Fragment key={`row-breakout-pad-${breakout.name}`}>
        <smtpad
          portHints={[`pin${index + 1}`]}
          shape="circle"
          radius={`${BREADBOARD_08MM_BREAKOUT_PAD_DIAMETER / 2}mm`}
          pcbX={breakout.end.x}
          pcbY={breakout.end.y}
        />
      </Fragment>
    ))}
  </footprint>
)

export interface BreadboardClad08mmViasProps {
  children?: ReactNode
  autorouter?: AutorouterProp
  autorouterOptions?: BiscuitBoardAutorouterOptions
  minTraceWidth?: number
  nominalTraceWidth?: number
}

/**
 * A pre-routed breadboard clad with conventional five-socket terminal strips
 * and separate, individually broken-out 0.8 mm vias in the four corners.
 */
export const BreadboardClad08mmVias = ({
  children,
  autorouter,
  autorouterOptions,
  minTraceWidth,
  nominalTraceWidth = BREADBOARD_08MM_BREAKOUT_TRACE_WIDTH,
}: BreadboardClad08mmViasProps) => (
  <board
    name="BreadboardClad08mmVias"
    title="Pre-routed breadboard clad with separate 0.8 mm corner vias"
    width={`${BREADBOARD_CLAD_WIDTH}mm`}
    height={`${BREADBOARD_CLAD_HEIGHT}mm`}
    borderRadius="2mm"
    layers={2}
    minTraceWidth={`${minTraceWidth ?? 0.15}mm`}
    minBoardEdgeClearance={`${BREADBOARD_08MM_CLAD_EDGE_CLEARANCE - BREADBOARD_08MM_CLAD_EDGE_CLEARANCE_VALIDATION_TOLERANCE}mm`}
    minViaHoleDiameter={`${BREADBOARD_08MM_VIA_HOLE_DIAMETER}mm`}
    minViaPadDiameter={`${BREADBOARD_08MM_VIA_PAD_DIAMETER}mm`}
    minViaHoleEdgeToViaHoleEdgeClearance={`${BREADBOARD_08MM_MIN_VIA_EDGE_SPACING}mm`}
    autorouter={
      autorouter ??
      createPrefabricatedViaAutorouter({
        width: BREADBOARD_CLAD_WIDTH,
        height: BREADBOARD_CLAD_HEIGHT,
        edgeClearance: BREADBOARD_08MM_CLAD_EDGE_CLEARANCE,
        options: autorouterOptions,
        minimumTraceWidth: minTraceWidth,
        nominalTraceWidth,
      })
    }
  >
    {BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS.map((hole) => (
      <Fragment key={`breadboard-08mm-mounting-hole-${hole.x}-${hole.y}`}>
        <hole
          pcbX={hole.x}
          pcbY={hole.y}
          diameter={`${BREADBOARD_MOUNTING_HOLE_DIAMETER}mm`}
        />
      </Fragment>
    ))}

    <BreadboardTerminalHeaders name="J_TERMINALS" />

    <pinheader
      name="J_VIA_BREAKOUTS"
      pinCount={BREADBOARD_08MM_VIA_POSITIONS.length}
      pinLabels={viaBreakoutPinLabels}
      manufacturerPartNumber="GENERIC-BREADBOARD-08MM-VIA-BREAKOUTS"
      footprint={<Breadboard08mmViaBreakoutFootprint />}
      gender="unpopulated"
      showSilkscreenPinLabels={false}
      obstructsWithinBounds={false}
      pcbX={0}
      pcbY={0}
      shouldBeOnEdgeOfBoard={false}
      pcbStyle={{ silkscreenTextVisibility: "hidden" }}
    />

    <pinheader
      name="J_ROW_BREAKOUTS"
      pinCount={BREADBOARD_08MM_ROW_BREAKOUTS.length}
      pinLabels={rowBreakoutPinLabels}
      manufacturerPartNumber="GENERIC-BREADBOARD-ROW-BREAKOUTS"
      footprint={<Breadboard08mmRowBreakoutFootprint />}
      gender="unpopulated"
      showSilkscreenPinLabels={false}
      obstructsWithinBounds={false}
      pcbX={0}
      pcbY={0}
      shouldBeOnEdgeOfBoard={false}
      pcbStyle={{ silkscreenTextVisibility: "hidden" }}
    />

    {[1, 5, 10, 15, 20, BREADBOARD_COLUMN_COUNT].map((column) => (
      <Fragment key={`breadboard-08mm-column-label-${column}`}>
        <silkscreentext
          text={`${column}`}
          pcbX={BREADBOARD_COLUMN_XS[column - 1]}
          pcbY={17.2}
          fontSize="0.55mm"
        />
      </Fragment>
    ))}

    {BREADBOARD_08MM_VIA_POSITIONS.map((via) => (
      <Fragment key={via.name}>
        <via
          name={via.name}
          connectsTo={`.J_VIA_BREAKOUTS > .${via.name}`}
          pcbX={via.x}
          pcbY={via.y}
          fromLayer="top"
          toLayer="bottom"
          holeDiameter={`${BREADBOARD_08MM_VIA_HOLE_DIAMETER}mm`}
          outerDiameter={`${BREADBOARD_08MM_VIA_PAD_DIAMETER}mm`}
        />
        <trace
          name={`${via.name}_BREAKOUT`}
          from={`.${via.name} > .pin1`}
          to={`.J_VIA_BREAKOUTS > .${via.name}`}
          pcbPathRelativeTo={`.${via.name} > .pin1`}
          pcbPath={[
            `.${via.name} > .pin1`,
            ...via.breakoutRoute.map((point) => ({
              x: roundCoordinate(point.x - via.x),
              y: roundCoordinate(point.y - via.y),
            })),
            `.J_VIA_BREAKOUTS > .${via.name}`,
          ]}
          width={`${BREADBOARD_08MM_BREAKOUT_TRACE_WIDTH}mm`}
        />
      </Fragment>
    ))}

    {BREADBOARD_08MM_ROW_CONNECTIONS.map((connection) => (
      <Fragment key={`${connection.from}-${connection.to}`}>
        <trace
          name={`ROW_${connection.from}_${connection.to}`}
          from={`.J_TERMINALS > .${connection.from}`}
          to={`.J_TERMINALS > .${connection.to}`}
          width={`${BREADBOARD_08MM_BREAKOUT_TRACE_WIDTH}mm`}
        />
      </Fragment>
    ))}

    {BREADBOARD_08MM_ROW_BREAKOUTS.map((breakout) => (
      <Fragment key={breakout.name}>
        <trace
          name={breakout.name}
          from={`.J_TERMINALS > .${breakout.terminalLabel}`}
          to={`.J_ROW_BREAKOUTS > .${breakout.name}`}
          width={`${BREADBOARD_08MM_BREAKOUT_TRACE_WIDTH}mm`}
        />
      </Fragment>
    ))}

    <silkscreentext
      text="0.8MM VIA BREADBOARD"
      pcbX={33.5}
      pcbY={0}
      pcbRotation={90}
      fontSize="0.65mm"
    />

    {BREADBOARD_08MM_TOP_BANK_ROWS.map((row) => (
      <Fragment key={`top-row-label-${row}`}>
        <silkscreentext
          text={row}
          pcbX={-28.3}
          pcbY={BREADBOARD_TERMINAL_ROW_YS[row]}
          fontSize="0.55mm"
        />
      </Fragment>
    ))}
    {BREADBOARD_08MM_BOTTOM_BANK_ROWS.map((row) => (
      <Fragment key={`bottom-row-label-${row}`}>
        <silkscreentext
          text={row}
          pcbX={-28.3}
          pcbY={BREADBOARD_TERMINAL_ROW_YS[row]}
          fontSize="0.55mm"
        />
      </Fragment>
    ))}

    <pcbnotedimension
      from={{
        x: -BREADBOARD_CLAD_WIDTH / 2,
        y: BREADBOARD_CLAD_HEIGHT / 2 + 2.5,
      }}
      to={{
        x: BREADBOARD_CLAD_WIDTH / 2,
        y: BREADBOARD_CLAD_HEIGHT / 2 + 2.5,
      }}
      text={`${BREADBOARD_CLAD_WIDTH}mm`}
    />
    <pcbnotedimension
      from={{
        x: BREADBOARD_CLAD_WIDTH / 2 + 2.5,
        y: -BREADBOARD_CLAD_HEIGHT / 2,
      }}
      to={{
        x: BREADBOARD_CLAD_WIDTH / 2 + 2.5,
        y: BREADBOARD_CLAD_HEIGHT / 2,
      }}
      text={`${BREADBOARD_CLAD_HEIGHT}mm`}
    />

    {children}
  </board>
)
