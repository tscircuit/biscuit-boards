import type { AutorouterProp, ConnectorProps } from "@tscircuit/props"
import { Fragment, type ReactNode } from "react"
import { BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS } from "./BiscuitBoard"
import type { BiscuitBoardAutorouterOptions } from "./biscuit-board-autorouter"
import {
  BREADBOARD_CLAD_HEIGHT,
  BREADBOARD_CLAD_WIDTH,
  BREADBOARD_COLUMN_COUNT,
  BREADBOARD_COLUMN_XS,
  BREADBOARD_HEADER_HOLE_DIAMETER,
  BREADBOARD_HEADER_PAD_DIAMETER,
  BREADBOARD_HEADER_PITCH,
  BREADBOARD_MOUNTING_HOLE_DIAMETER,
  type BreadboardHeaderPosition,
  type BreadboardTerminalRowLabel,
} from "./breadboard-clad"
import { createPrefabricatedViaAutorouter } from "./create-prefabricated-via-autorouter"

export const BREADBOARD_08MM_VIA_HOLE_DIAMETER = 0.8
export const BREADBOARD_08MM_VIA_PAD_DIAMETER = 0.9
export const BREADBOARD_08MM_MIN_VIA_EDGE_SPACING = 2
export const BREADBOARD_08MM_BREAKOUT_TRACE_WIDTH = 0.15
export const BREADBOARD_08MM_ROW_TRACE_WIDTH = 0.3
export const BREADBOARD_08MM_BREAKOUT_PAD_DIAMETER = 0.3
export const BREADBOARD_08MM_CORNER_VIA_SPACING = 3
export const BREADBOARD_08MM_CORNER_VIA_ARM_WIDTH = 3
export const BREADBOARD_08MM_CORNER_VIA_ARM_X_INNER_OFFSET = 25
export const BREADBOARD_08MM_CORNER_VIA_LONG_SIDE_COLUMNS = 5
export const BREADBOARD_08MM_TOP_RIGHT_LONG_SIDE_COLUMNS = 6
export const BREADBOARD_08MM_CORNER_VIA_X_OUTER_OFFSET = 31
export const BREADBOARD_08MM_CORNER_VIA_X_INNER_OFFSET =
  BREADBOARD_08MM_CORNER_VIA_X_OUTER_OFFSET -
  (BREADBOARD_08MM_CORNER_VIA_LONG_SIDE_COLUMNS - 1) *
    BREADBOARD_08MM_CORNER_VIA_SPACING
export const BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET = 19
export const BREADBOARD_08MM_CORNER_VIA_Y_OUTER_OFFSET = 25
export const BREADBOARD_08MM_CORNER_VIA_X_OUTWARD_SHIFT = 3
export const BREADBOARD_08MM_EDGE_HUG_COLUMN_COUNT = 2
export const BREADBOARD_08MM_EDGE_HUG_Y_SHIFT =
  BREADBOARD_08MM_CORNER_VIA_SPACING
export const BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET = 0.8
export const BREADBOARD_08MM_BREAKOUT_LANE_SPACING = 0.28
export const BREADBOARD_08MM_BOTTOM_ENDPOINT_FANOUT_LENGTH = 2
export const BREADBOARD_08MM_VIA_BREAKOUT_LENGTH = 1
export const BREADBOARD_08MM_ROW_BREAKOUT_LENGTH = 1.2

const BREADBOARD_08MM_CLAD_EDGE_CLEARANCE = 0.2
const BREADBOARD_08MM_CLAD_EDGE_CLEARANCE_VALIDATION_TOLERANCE = 0.001
const BREADBOARD_08MM_BOTTOM_BEHIND_VIA_LANE_START_OFFSET = 1.2
const BREADBOARD_08MM_BOTTOM_BEHIND_VIA_LANE_SPACING = 0.5

export const BREADBOARD_08MM_TOP_BANK_ROWS = [
  "A",
  "B",
  "C",
  "D",
] as const satisfies readonly BreadboardTerminalRowLabel[]
export const BREADBOARD_08MM_BOTTOM_BANK_ROWS = [
  "E",
  "F",
  "G",
  "H",
] as const satisfies readonly BreadboardTerminalRowLabel[]

function roundCoordinate(value: number) {
  return Math.round(value * 1e6) / 1e6
}

// Preserve the conventional 7.62 mm center trench while placing four rows at
// 2.54 mm pitch on either side.
const BREADBOARD_08MM_TERMINAL_BANK_CENTER_Y = 3 * BREADBOARD_HEADER_PITCH

export const BREADBOARD_08MM_TERMINAL_ROW_YS = Object.fromEntries(
  [...BREADBOARD_08MM_TOP_BANK_ROWS, ...BREADBOARD_08MM_BOTTOM_BANK_ROWS].map(
    (label, index) => {
      const bankIndex = index % BREADBOARD_08MM_TOP_BANK_ROWS.length
      const distanceFromCenter =
        (BREADBOARD_08MM_TOP_BANK_ROWS.length - 1) / 2 - bankIndex
      const bankSign = index < BREADBOARD_08MM_TOP_BANK_ROWS.length ? 1 : -1
      return [
        label,
        roundCoordinate(
          bankSign *
            (BREADBOARD_08MM_TERMINAL_BANK_CENTER_Y +
              bankSign * distanceFromCenter * BREADBOARD_HEADER_PITCH),
        ),
      ]
    },
  ),
) as Record<
  | (typeof BREADBOARD_08MM_TOP_BANK_ROWS)[number]
  | (typeof BREADBOARD_08MM_BOTTOM_BANK_ROWS)[number],
  number
>

export const BREADBOARD_08MM_TERMINAL_HEADER_POSITIONS = [
  ...BREADBOARD_08MM_TOP_BANK_ROWS,
  ...BREADBOARD_08MM_BOTTOM_BANK_ROWS,
].flatMap((row, rowIndex) =>
  BREADBOARD_COLUMN_XS.map((x, columnIndex) => ({
    pin: rowIndex * BREADBOARD_COLUMN_COUNT + columnIndex + 1,
    label: `${row}${columnIndex + 1}`,
    column: columnIndex + 1,
    x,
    y: BREADBOARD_08MM_TERMINAL_ROW_YS[row],
  })),
) satisfies BreadboardHeaderPosition[]

export type Breadboard08mmViaCorner =
  | "top_left"
  | "top_right"
  | "bottom_left"
  | "bottom_right"

export type Breadboard08mmViaArm = "horizontal" | "vertical"
export type Breadboard08mmViaBreakoutStyle = "direct" | "woven"
export type Breadboard08mmViaOpenAreaEdge =
  | "toward_board_center"
  | "toward_breadboard_rows"

export interface Breadboard08mmViaBreakout {
  openAreaEdge: Breadboard08mmViaOpenAreaEdge
  style: Breadboard08mmViaBreakoutStyle
  route: Array<{ x: number; y: number }>
  end: { x: number; y: number }
}

export interface Breadboard08mmViaPosition {
  name: string
  corner: Breadboard08mmViaCorner
  arm: Breadboard08mmViaArm
  x: number
  y: number
  topBreakout: Breadboard08mmViaBreakout
  bottomBreakout: Breadboard08mmViaBreakout
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
  BREADBOARD_08MM_CORNER_VIA_ARM_X_INNER_OFFSET,
  BREADBOARD_08MM_CORNER_VIA_ARM_X_INNER_OFFSET +
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
  openAreaEdge: Breadboard08mmViaOpenAreaEdge
  style: Breadboard08mmViaBreakoutStyle
  route: LocalCornerPoint[]
  end: LocalCornerPoint
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
  const cornerLongSideAxisX =
    corner === "top_right"
      ? [
          ...cornerViaAxisX,
          BREADBOARD_08MM_CORNER_VIA_X_OUTER_OFFSET +
            BREADBOARD_08MM_CORNER_VIA_SPACING,
        ]
      : cornerViaAxisX
  const shiftedCornerViaAxisX = cornerLongSideAxisX.map((x) =>
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
        y:
          y +
          (xIndex < BREADBOARD_08MM_EDGE_HUG_COLUMN_COUNT
            ? BREADBOARD_08MM_EDGE_HUG_Y_SHIFT
            : 0),
      })),
    ),
    ...shiftedCornerViaArmAxisX.map((x, xIndex) => ({
      nameSuffix: `V3_${xIndex === 0 ? "INNER" : "OUTER"}`,
      arm: "vertical" as const,
      x,
      y: verticalExtensionY,
    })),
  ]

  const createTopBreakout = (via: LocalCornerVia): LocalCornerBreakout => {
    const innerX = shiftedCornerViaAxisX[0]!
    const openRowsY =
      BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET -
      BREADBOARD_08MM_VIA_BREAKOUT_LENGTH
    const columnIndex = Math.round(
      (via.x - innerX) / BREADBOARD_08MM_CORNER_VIA_SPACING,
    )

    if (via.y === BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET) {
      return {
        openAreaEdge: "toward_breadboard_rows",
        style: "direct",
        route: [],
        end: { x: via.x, y: openRowsY },
      }
    }
    const rowWeaveDirection = columnIndex % 2 === 0 ? -1 : 1
    const weaveDirection =
      via.y === BREADBOARD_08MM_CORNER_VIA_Y_OUTER_OFFSET
        ? -rowWeaveDirection
        : rowWeaveDirection
    const weaveX =
      via.x + weaveDirection * BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET
    return {
      openAreaEdge: "toward_breadboard_rows",
      style: "woven",
      route: [
        {
          x: weaveX,
          y: via.y - BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET,
        },
      ],
      end: { x: weaveX, y: openRowsY },
    }
  }

  const createBottomBreakout = (via: LocalCornerVia): LocalCornerBreakout => {
    const innerX = shiftedCornerViaAxisX[0]!
    const openCenterX = innerX - BREADBOARD_08MM_VIA_BREAKOUT_LENGTH
    const columnIndex = Math.round(
      (via.x - innerX) / BREADBOARD_08MM_CORNER_VIA_SPACING,
    )

    // Short-arm escapes go behind the outer row first so their center-facing
    // paths cannot wall off a via inside the L-shaped field.
    if (via.arm === "vertical") {
      const verticalArmIndex = shiftedCornerViaArmAxisX.indexOf(via.x)
      const behindViaLaneY =
        via.y +
        BREADBOARD_08MM_BOTTOM_BEHIND_VIA_LANE_START_OFFSET +
        verticalArmIndex * BREADBOARD_08MM_BOTTOM_BEHIND_VIA_LANE_SPACING
      return {
        openAreaEdge: "toward_board_center",
        style: "woven",
        route: [
          {
            x: via.x - BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET,
            y: behindViaLaneY,
          },
        ],
        end: { x: openCenterX, y: behindViaLaneY },
      }
    }

    // The top-right field has one extra long-arm column. Route its outer via
    // after the short-arm lanes so widening the lanes does not cross either
    // the inner-row pads or the short-arm breakouts.
    if (
      columnIndex >= BREADBOARD_08MM_CORNER_VIA_LONG_SIDE_COLUMNS &&
      via.y ===
        BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET +
          BREADBOARD_08MM_CORNER_VIA_ARM_WIDTH
    ) {
      const behindViaLaneY =
        BREADBOARD_08MM_CORNER_VIA_Y_OUTER_OFFSET +
        BREADBOARD_08MM_BOTTOM_BEHIND_VIA_LANE_START_OFFSET +
        shiftedCornerViaArmAxisX.length *
          BREADBOARD_08MM_BOTTOM_BEHIND_VIA_LANE_SPACING
      return {
        openAreaEdge: "toward_board_center",
        style: "woven",
        route: [
          {
            x: via.x - BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET,
            y: behindViaLaneY,
          },
        ],
        end: { x: openCenterX, y: behindViaLaneY },
      }
    }

    if (columnIndex === 0) {
      return {
        openAreaEdge: "toward_board_center",
        style: "direct",
        route: [],
        end: { x: openCenterX, y: via.y },
      }
    }
    const shouldTuckInsideBreakoutEndLine =
      via.y === BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET &&
      columnIndex >= 2 &&
      columnIndex < BREADBOARD_08MM_CORNER_VIA_LONG_SIDE_COLUMNS
    const laneOffset = shouldTuckInsideBreakoutEndLine
      ? 0.35 +
        (columnIndex - 2) * BREADBOARD_08MM_BREAKOUT_LANE_SPACING
      : 0.7 +
        (columnIndex - 1) * BREADBOARD_08MM_BREAKOUT_LANE_SPACING
    const laneY = via.y - laneOffset
    return {
      openAreaEdge: "toward_board_center",
      style: "woven",
      route: [
        {
          x: via.x - BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET,
          y: laneY,
        },
      ],
      end: { x: openCenterX, y: laneY },
    }
  }

  const toBoardBreakout = (
    breakout: LocalCornerBreakout,
  ): Breadboard08mmViaBreakout => ({
    openAreaEdge: breakout.openAreaEdge,
    style: breakout.style,
    route: breakout.route.map(toBoardPoint),
    end: toBoardPoint(breakout.end),
  })

  const bottomBreakouts = localVias.map(createBottomBreakout)
  const bottomBreakoutsByLane = bottomBreakouts
    .map((breakout, viaIndex) => ({ breakout, viaIndex }))
    .sort(
      (first, second) =>
        first.breakout.end.y - second.breakout.end.y ||
        first.viaIndex - second.viaIndex,
    )
  const bottomEndpointRankByViaIndex = new Map(
    bottomBreakoutsByLane.map(({ viaIndex }, endpointRank) => [
      viaIndex,
      endpointRank,
    ]),
  )
  const bottomEndpointMinimumY = bottomBreakoutsByLane[0]!.breakout.end.y
  const bottomEndpointMaximumY =
    bottomBreakoutsByLane.at(-1)!.breakout.end.y
  const bottomEndpointSpacing =
    (bottomEndpointMaximumY - bottomEndpointMinimumY) /
    (localVias.length - 1)

  return localVias.map(
    (via, viaIndex): Breadboard08mmViaPosition => {
      const bottomBreakout = bottomBreakouts[viaIndex]!
      const endpointRank = bottomEndpointRankByViaIndex.get(viaIndex)!
      const evenlySpacedBottomBreakout = {
        ...bottomBreakout,
        style: "woven" as const,
        route: [...bottomBreakout.route, bottomBreakout.end],
        end: {
          x:
            bottomBreakout.end.x -
            BREADBOARD_08MM_BOTTOM_ENDPOINT_FANOUT_LENGTH,
          y: roundCoordinate(
            bottomEndpointMinimumY + endpointRank * bottomEndpointSpacing,
          ),
        },
      }
      return {
        name: `V_${corner.toUpperCase()}_${via.nameSuffix}`,
        corner,
        arm: via.arm,
        ...toBoardPoint(via),
        topBreakout: toBoardBreakout(createTopBreakout(via)),
        bottomBreakout: toBoardBreakout(evenlySpacedBottomBreakout),
      }
    },
  )
}

/** Four independent L fields; top-right has an extra column below its holes. */
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

/** A-D and E-H are connected as four-socket terminal strips. */
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
  createRowBreakout(`A${column}`, column, BREADBOARD_08MM_TERMINAL_ROW_YS.A, 1),
  createRowBreakout(
    `D${column}`,
    column,
    BREADBOARD_08MM_TERMINAL_ROW_YS.D,
    -1,
  ),
  createRowBreakout(`E${column}`, column, BREADBOARD_08MM_TERMINAL_ROW_YS.E, 1),
  createRowBreakout(
    `H${column}`,
    column,
    BREADBOARD_08MM_TERMINAL_ROW_YS.H,
    -1,
  ),
])

const terminalPinLabels = Object.fromEntries(
  BREADBOARD_08MM_TERMINAL_HEADER_POSITIONS.map((position) => [
    `pin${position.pin}`,
    [position.label],
  ]),
)

const Breadboard08mmTerminalHeaderFootprint = () => (
  <footprint insertionDirection="from_above">
    {BREADBOARD_08MM_TERMINAL_HEADER_POSITIONS.map((position) => (
      <Fragment key={`terminal-${position.label}`}>
        {position.pin === 1 ? (
          <platedhole
            portHints={[`pin${position.pin}`]}
            shape="circular_hole_with_rect_pad"
            holeDiameter={`${BREADBOARD_HEADER_HOLE_DIAMETER}mm`}
            rectPadWidth={`${BREADBOARD_HEADER_PAD_DIAMETER}mm`}
            rectPadHeight={`${BREADBOARD_HEADER_PAD_DIAMETER}mm`}
            pcbX={position.x}
            pcbY={position.y}
          />
        ) : (
          <platedhole
            portHints={[`pin${position.pin}`]}
            shape="circle"
            holeDiameter={`${BREADBOARD_HEADER_HOLE_DIAMETER}mm`}
            outerDiameter={`${BREADBOARD_HEADER_PAD_DIAMETER}mm`}
            pcbX={position.x}
            pcbY={position.y}
          />
        )}
      </Fragment>
    ))}
  </footprint>
)

const Breadboard08mmTerminalHeaders = (props: ConnectorProps) => (
  <connector
    pinLabels={terminalPinLabels}
    manufacturerPartNumber="GENERIC-BREADBOARD-8X21-FEMALE-2.54MM"
    footprint={<Breadboard08mmTerminalHeaderFootprint />}
    noSchematicRepresentation
    {...props}
  />
)

const viaBreakoutPinLabels = Object.fromEntries(
  BREADBOARD_08MM_VIA_POSITIONS.flatMap((via, index) => [
    [`pin${index * 2 + 1}`, `${via.name}_TOP`],
    [`pin${index * 2 + 2}`, `${via.name}_BOTTOM`],
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
          portHints={[`pin${index * 2 + 1}`]}
          shape="circle"
          radius={`${BREADBOARD_08MM_BREAKOUT_PAD_DIAMETER / 2}mm`}
          layer="top"
          pcbX={via.topBreakout.end.x}
          pcbY={via.topBreakout.end.y}
        />
        <smtpad
          portHints={[`pin${index * 2 + 2}`]}
          shape="circle"
          radius={`${BREADBOARD_08MM_BREAKOUT_PAD_DIAMETER / 2}mm`}
          layer="bottom"
          pcbX={via.bottomBreakout.end.x}
          pcbY={via.bottomBreakout.end.y}
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
 * A pre-routed breadboard clad with four-socket terminal strips
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
    pcbStyle={{
      viaHoleDiameter: `${BREADBOARD_08MM_VIA_HOLE_DIAMETER}mm`,
      viaPadDiameter: `${BREADBOARD_08MM_VIA_PAD_DIAMETER}mm`,
    }}
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

    <Breadboard08mmTerminalHeaders name="J_TERMINALS" />

    <pinheader
      name="J_VIA_BREAKOUTS"
      pinCount={BREADBOARD_08MM_VIA_POSITIONS.length * 2}
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
        <trace
          name={`${via.name}_DUAL_LAYER_BREAKOUT`}
          from={`.J_VIA_BREAKOUTS > .${via.name}_TOP`}
          to={`.J_VIA_BREAKOUTS > .${via.name}_BOTTOM`}
          pcbPath={[
            `.J_VIA_BREAKOUTS > .${via.name}_TOP`,
            ...via.topBreakout.route.toReversed(),
            { x: via.x, y: via.y },
            {
              x: via.x,
              y: via.y,
              via: true,
              fromLayer: "top",
              toLayer: "bottom",
            },
            { x: via.x, y: via.y },
            ...via.bottomBreakout.route,
            `.J_VIA_BREAKOUTS > .${via.name}_BOTTOM`,
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
          width={`${BREADBOARD_08MM_ROW_TRACE_WIDTH}mm`}
        />
      </Fragment>
    ))}

    {BREADBOARD_08MM_ROW_BREAKOUTS.map((breakout) => (
      <Fragment key={breakout.name}>
        <trace
          name={breakout.name}
          from={`.J_TERMINALS > .${breakout.terminalLabel}`}
          to={`.J_ROW_BREAKOUTS > .${breakout.name}`}
          width={`${BREADBOARD_08MM_ROW_TRACE_WIDTH}mm`}
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
          pcbY={BREADBOARD_08MM_TERMINAL_ROW_YS[row]}
          fontSize="0.55mm"
        />
      </Fragment>
    ))}
    {BREADBOARD_08MM_BOTTOM_BANK_ROWS.map((row) => (
      <Fragment key={`bottom-row-label-${row}`}>
        <silkscreentext
          text={row}
          pcbX={-28.3}
          pcbY={BREADBOARD_08MM_TERMINAL_ROW_YS[row]}
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
