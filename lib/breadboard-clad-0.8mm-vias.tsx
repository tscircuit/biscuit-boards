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
export const BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET = 0.8
export const BREADBOARD_08MM_BREAKOUT_LANE_SPACING = 0.4
export const BREADBOARD_08MM_VIA_BREAKOUT_LENGTH = 1.4
export const BREADBOARD_08MM_BREAKOUT_ENDPOINT_SPACING = 1
export const BREADBOARD_08MM_BREAKOUT_ENDPOINT_EDGE_INSET = 1
const BREADBOARD_08MM_LONG_EDGE_COLLECTION_INSET = 1.5
const BREADBOARD_08MM_LONG_EDGE_COLLECTION_OUTWARD_SHIFT = 0.5
const BREADBOARD_08MM_TOP_RIGHT_COLLECTION_OUTWARD_SHIFT = 6.5
const BREADBOARD_08MM_SIDE_EDGE_ENDPOINT_MAX_Y = 17.5
const BREADBOARD_08MM_SIDE_COLLECTION_GATE_X = 26.8
const BREADBOARD_08MM_SIDE_COLLECTION_GATE_START_X_MAX = 24
const BREADBOARD_08MM_SIDE_COLLECTION_GATE_MIN_Y = 15.6
const BREADBOARD_08MM_SIDE_COLLECTION_LANE_SPACING = 0.6
const BREADBOARD_08MM_SIDE_INNER_COLLECTION_X = 36
const BREADBOARD_08MM_SIDE_COLLECTION_LANE_Y = 22.7
const BREADBOARD_08MM_SIDE_VERTICAL_COLLECTION_LANE_Y = 23
const BREADBOARD_08MM_VERTICAL_OUTER_COLLECTION_Y = 26
export const BREADBOARD_08MM_ROW_BREAKOUT_LENGTH = 1.2

const BREADBOARD_08MM_CLAD_EDGE_CLEARANCE = 0.2
const BREADBOARD_08MM_CLAD_EDGE_CLEARANCE_VALIDATION_TOLERANCE = 0.001
const BREADBOARD_08MM_SIDE_OUTER_COLLECTION_X = 37

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

// These five escapes enter the top-right side bank through ordered horizontal
// lanes so an outer trace never closes off an inner trace's route.
const topRightCollectedRowKeys = [
  "H1_INNER:top",
  "H2_INNER:top",
  "H2_OUTER:top",
  "H3_OUTER:top",
  "H3_INNER:top",
] as const
const TOP_RIGHT_COLLECTION_LANE_START_Y = 15.6
const TOP_RIGHT_COLLECTION_COLLECTOR_START_X = 26.6
const TOP_RIGHT_COLLECTION_LANE_PITCH = 0.3
const TOP_RIGHT_COLLECTION_COLLECTOR_PITCH = 0.26

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
    openAreaEdge: Breadboard08mmViaOpenAreaEdge,
    layer: "top" | "bottom",
  ): LocalCornerBreakout => {
    const innerX = shiftedCornerViaAxisX[0]!
    const openCenterX = innerX - BREADBOARD_08MM_VIA_BREAKOUT_LENGTH
    const openRowsY =
      BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET -
      BREADBOARD_08MM_VIA_BREAKOUT_LENGTH
    const columnIndex = Math.round(
      (via.x - innerX) / BREADBOARD_08MM_CORNER_VIA_SPACING,
    )

    if (
      layer === "top" &&
      openAreaEdge === "toward_board_center" &&
      via.y === BREADBOARD_08MM_CORNER_VIA_Y_OUTER_OFFSET
    ) {
      return {
        openAreaEdge,
        style: "direct",
        route: [],
        end: {
          x: via.x,
          y: BREADBOARD_08MM_VERTICAL_OUTER_COLLECTION_Y,
        },
      }
    }

    if (layer === "top") {
      if (openAreaEdge === "toward_breadboard_rows") {
        if (via.y === BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET) {
          return {
            openAreaEdge,
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
          openAreaEdge,
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

      if (columnIndex === 0) {
        return {
          openAreaEdge,
          style: "direct",
          route: [],
          end: { x: openCenterX, y: via.y },
        }
      }
      const weaveY = via.y - BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET
      return {
        openAreaEdge,
        style: "woven",
        route: [
          {
            x: via.x - BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET,
            y: weaveY,
          },
        ],
        end: { x: openCenterX, y: weaveY },
      }
    }

    if (openAreaEdge === "toward_board_center") {
      if (via.y === BREADBOARD_08MM_CORNER_VIA_Y_OUTER_OFFSET) {
        const isOuterVerticalVia = via.x === shiftedCornerViaArmAxisX.at(-1)!
        return {
          openAreaEdge,
          style: "direct",
          route: [],
          end: {
            x: via.x,
            y: isOuterVerticalVia
              ? BREADBOARD_08MM_VERTICAL_OUTER_COLLECTION_Y
              : via.y,
          },
        }
      }
      if (columnIndex === 0) {
        return {
          openAreaEdge,
          style: "direct",
          route: [],
          end: { x: openCenterX, y: via.y },
        }
      }
      const laneOffset =
        0.7 + (columnIndex - 1) * BREADBOARD_08MM_BREAKOUT_LANE_SPACING
      const laneY = via.y - laneOffset
      return {
        openAreaEdge,
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

    if (
      layer === "bottom" &&
      via.y === BREADBOARD_08MM_CORNER_VIA_Y_OUTER_OFFSET
    ) {
      return {
        openAreaEdge,
        style: "woven",
        route: [
          { x: via.x, y: BREADBOARD_08MM_SIDE_VERTICAL_COLLECTION_LANE_Y },
        ],
        end: {
          x: BREADBOARD_08MM_SIDE_INNER_COLLECTION_X,
          y: BREADBOARD_08MM_SIDE_VERTICAL_COLLECTION_LANE_Y,
        },
      }
    }

    if (
      columnIndex === 0 &&
      via.y ===
        BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET +
          BREADBOARD_08MM_CORNER_VIA_ARM_WIDTH
    ) {
      return {
        openAreaEdge,
        style: "woven",
        route: [{ x: via.x, y: BREADBOARD_08MM_SIDE_COLLECTION_LANE_Y }],
        end: {
          x:
            BREADBOARD_CLAD_WIDTH / 2 -
            BREADBOARD_08MM_BREAKOUT_ENDPOINT_EDGE_INSET,
          y: BREADBOARD_08MM_SIDE_COLLECTION_LANE_Y,
        },
      }
    }

    const wrapLaneX =
      openCenterX -
      (via.y === BREADBOARD_08MM_CORNER_VIA_Y_OUTER_OFFSET
        ? columnIndex === 0
          ? 1.2
          : 0.8
        : 0.4)
    const route =
      via.y === BREADBOARD_08MM_CORNER_VIA_Y_OUTER_OFFSET && columnIndex > 0
        ? [
            {
              x: via.x - BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET,
              y: via.y - BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET,
            },
            {
              x: wrapLaneX,
              y: via.y - BREADBOARD_08MM_BREAKOUT_WEAVE_OFFSET,
            },
          ]
        : [{ x: wrapLaneX, y: via.y }]
    return {
      openAreaEdge,
      style: "woven",
      route,
      end: { x: wrapLaneX, y: openRowsY },
    }
  }

  const localPositions = localVias.map((via) => {
    const boardCenterDistance = via.x - shiftedCornerViaAxisX[0]!
    const breadboardRowsDistance =
      via.y - BREADBOARD_08MM_CORNER_VIA_Y_INNER_OFFSET
    // The extra via beneath the second top-right mounting hole uses the long
    // open area on top, leaving its bottom trace free to enter the side bank.
    const topOpenAreaEdge =
      corner === "top_right" && via.nameSuffix === "V3_INNER"
        ? "toward_board_center"
        : boardCenterDistance < breadboardRowsDistance
          ? "toward_board_center"
          : "toward_breadboard_rows"
    const bottomOpenAreaEdge =
      topOpenAreaEdge === "toward_board_center"
        ? "toward_breadboard_rows"
        : "toward_board_center"
    return {
      via,
      topBreakout: createBreakout(via, topOpenAreaEdge, "top"),
      bottomBreakout: createBreakout(via, bottomOpenAreaEdge, "bottom"),
    }
  })

  const innerX = shiftedCornerViaAxisX[0]!
  const longEdgeCollectionOutwardShift =
    BREADBOARD_08MM_LONG_EDGE_COLLECTION_OUTWARD_SHIFT +
    (corner === "top_right"
      ? BREADBOARD_08MM_TOP_RIGHT_COLLECTION_OUTWARD_SHIFT
      : 0)
  const collectedBreakouts = new Map<string, LocalCornerBreakout>()
  for (const openAreaEdge of [
    "toward_board_center",
    "toward_breadboard_rows",
  ] as const) {
    const breakouts = localPositions
      .flatMap((position) =>
        (["top", "bottom"] as const).map((layer) => ({
          key: `${position.via.nameSuffix}:${layer}`,
          breakout:
            layer === "top" ? position.topBreakout : position.bottomBreakout,
        })),
      )
      .filter((entry) => entry.breakout.openAreaEdge === openAreaEdge)
      .sort((a, b) =>
        openAreaEdge === "toward_breadboard_rows"
          ? a.breakout.end.x - b.breakout.end.x
          : a.breakout.end.y - b.breakout.end.y,
      )
    const innerRowBreakouts =
      openAreaEdge === "toward_breadboard_rows"
        ? breakouts.filter(
            (entry) =>
              !(
                corner === "top_right" &&
                topRightCollectedRowKeys.includes(
                  entry.key as (typeof topRightCollectedRowKeys)[number],
                )
              ) &&
              entry.breakout.end.x <
                BREADBOARD_08MM_SIDE_COLLECTION_GATE_START_X_MAX,
          )
        : []

    breakouts.forEach((entry, index) => {
      const end =
        openAreaEdge === "toward_breadboard_rows"
          ? {
              x:
                BREADBOARD_CLAD_WIDTH / 2 -
                BREADBOARD_08MM_BREAKOUT_ENDPOINT_EDGE_INSET,
              y:
                BREADBOARD_08MM_SIDE_EDGE_ENDPOINT_MAX_Y -
                (breakouts.length - 1 - index) *
                  BREADBOARD_08MM_BREAKOUT_ENDPOINT_SPACING,
            }
          : {
              x:
                innerX -
                BREADBOARD_08MM_LONG_EDGE_COLLECTION_INSET -
                (breakouts.length - 1 - index) *
                  BREADBOARD_08MM_BREAKOUT_ENDPOINT_SPACING +
                longEdgeCollectionOutwardShift,
              y:
                BREADBOARD_CLAD_HEIGHT / 2 -
                BREADBOARD_08MM_BREAKOUT_ENDPOINT_EDGE_INSET,
            }
      const topRightCollectedRowIndex = topRightCollectedRowKeys.indexOf(
        entry.key as (typeof topRightCollectedRowKeys)[number],
      )
      const collectionRoute =
        openAreaEdge === "toward_board_center"
          ? end.x - (end.y - entry.breakout.end.y) <= entry.breakout.end.x
            ? [
                {
                  x: roundCoordinate(end.x - (end.y - entry.breakout.end.y)),
                  y: entry.breakout.end.y,
                },
              ]
            : []
          : corner === "top_right" && topRightCollectedRowIndex >= 0
            ? [
                {
                  x: entry.breakout.end.x,
                  y:
                    TOP_RIGHT_COLLECTION_LANE_START_Y +
                    topRightCollectedRowIndex * TOP_RIGHT_COLLECTION_LANE_PITCH,
                },
                {
                  x:
                    TOP_RIGHT_COLLECTION_COLLECTOR_START_X +
                    topRightCollectedRowIndex *
                      TOP_RIGHT_COLLECTION_COLLECTOR_PITCH,
                  y:
                    TOP_RIGHT_COLLECTION_LANE_START_Y +
                    topRightCollectedRowIndex * TOP_RIGHT_COLLECTION_LANE_PITCH,
                },
                {
                  x:
                    TOP_RIGHT_COLLECTION_COLLECTOR_START_X +
                    topRightCollectedRowIndex *
                      TOP_RIGHT_COLLECTION_COLLECTOR_PITCH,
                  y: end.y,
                },
              ]
            : corner === "top_right" && entry.key === "V3_INNER:bottom"
              ? [
                  // Run outside the bank before turning toward this endpoint;
                  // otherwise this trace forms a wall across H1_OUTER's lane.
                  {
                    x: BREADBOARD_08MM_SIDE_OUTER_COLLECTION_X,
                    y: entry.breakout.end.y,
                  },
                  {
                    x: BREADBOARD_08MM_SIDE_OUTER_COLLECTION_X,
                    y: end.y,
                  },
                ]
              : entry.breakout.end.x <
                  BREADBOARD_08MM_SIDE_COLLECTION_GATE_START_X_MAX
                ? [
                    {
                      x: BREADBOARD_08MM_SIDE_COLLECTION_GATE_X,
                      y:
                        BREADBOARD_08MM_SIDE_COLLECTION_GATE_MIN_Y +
                        innerRowBreakouts.indexOf(entry) *
                          BREADBOARD_08MM_SIDE_COLLECTION_LANE_SPACING,
                    },
                  ]
                : []
      collectedBreakouts.set(entry.key, {
        ...entry.breakout,
        route: [
          ...entry.breakout.route,
          entry.breakout.end,
          ...collectionRoute,
        ],
        end,
      })
    })
  }

  const toBoardBreakout = (
    breakout: LocalCornerBreakout,
  ): Breadboard08mmViaBreakout => ({
    openAreaEdge: breakout.openAreaEdge,
    style: breakout.style,
    route: breakout.route.map(toBoardPoint),
    end: toBoardPoint(breakout.end),
  })

  return localPositions.map(
    ({ via }): Breadboard08mmViaPosition => ({
      name: `V_${corner.toUpperCase()}_${via.nameSuffix}`,
      corner,
      arm: via.arm,
      ...toBoardPoint(via),
      topBreakout: toBoardBreakout(
        collectedBreakouts.get(`${via.nameSuffix}:top`)!,
      ),
      bottomBreakout: toBoardBreakout(
        collectedBreakouts.get(`${via.nameSuffix}:bottom`)!,
      ),
    }),
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

    <BreadboardTerminalHeaders name="J_TERMINALS" />

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
