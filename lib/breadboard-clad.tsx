import type { AutorouterProp, ConnectorProps } from "@tscircuit/props"
import { Fragment, type ReactNode } from "react"
import {
  BISCUIT_BOARD_HEIGHT,
  BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS,
  BISCUIT_BOARD_WIDTH,
} from "./BiscuitBoard"
import type { BiscuitBoardAutorouterOptions } from "./biscuit-board-autorouter"
import { createPrefabricatedViaAutorouter } from "./create-prefabricated-via-autorouter"

export const BREADBOARD_CLAD_WIDTH = BISCUIT_BOARD_WIDTH
export const BREADBOARD_CLAD_HEIGHT = BISCUIT_BOARD_HEIGHT
export const BREADBOARD_HEADER_PITCH = 2.54
export const BREADBOARD_COLUMN_COUNT = 21
export const BREADBOARD_HEADER_HOLE_DIAMETER = 1
export const BREADBOARD_HEADER_PAD_DIAMETER = 1.7
export const BREADBOARD_CLAD_VIA_HOLE_DIAMETER = 0.3
export const BREADBOARD_CLAD_VIA_PAD_DIAMETER = 0.6
export const BREADBOARD_CLAD_VIA_PITCH = BREADBOARD_HEADER_PITCH
export const BREADBOARD_CLAD_VIA_ROW_YS = [
  -16.51,
  -BREADBOARD_HEADER_PITCH / 2,
  BREADBOARD_HEADER_PITCH / 2,
  16.51,
] as const
export const BREADBOARD_CORNER_VIA_SPACING = 1.3
export const BREADBOARD_CORNER_VIA_ARM_WIDTH = 1.3
export const BREADBOARD_CORNER_VIA_X_INNER_OFFSET = 27
export const BREADBOARD_CORNER_VIA_X_OUTER_OFFSET = 32.2
export const BREADBOARD_CORNER_VIA_Y_INNER_OFFSET = 21
export const BREADBOARD_CORNER_VIA_Y_OUTER_OFFSET = 26.2
export const BREADBOARD_MOUNTING_HOLE_DIAMETER = 2.2

const BREADBOARD_CLAD_EDGE_CLEARANCE = 0.2
const BREADBOARD_CLAD_EDGE_CLEARANCE_VALIDATION_TOLERANCE = 0.001
const BREADBOARD_TERMINAL_INNER_ROW_Y = 3.81

export const BREADBOARD_TERMINAL_ROW_LABELS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
] as const

export type BreadboardTerminalRowLabel =
  (typeof BREADBOARD_TERMINAL_ROW_LABELS)[number]

export interface BreadboardHeaderPosition {
  pin: number
  label: string
  column: number
  x: number
  y: number
}

export interface BreadboardCladViaPosition {
  x: number
  y: number
}

const roundCoordinate = (value: number) => Math.round(value * 1e6) / 1e6

const createPitchedRange = (start: number, end: number) =>
  Array.from(
    {
      length: Math.round((end - start) / BREADBOARD_CORNER_VIA_SPACING) + 1,
    },
    (_, index) =>
      roundCoordinate(start + index * BREADBOARD_CORNER_VIA_SPACING),
  )

export const BREADBOARD_COLUMN_XS = Array.from(
  { length: BREADBOARD_COLUMN_COUNT },
  (_, index) =>
    roundCoordinate(
      (index - (BREADBOARD_COLUMN_COUNT - 1) / 2) * BREADBOARD_HEADER_PITCH,
    ),
)

export const BREADBOARD_TERMINAL_ROW_YS = Object.fromEntries(
  BREADBOARD_TERMINAL_ROW_LABELS.map((label, index) => {
    const bankIndex = index < 5 ? index : index - 5
    const y =
      index < 5
        ? BREADBOARD_TERMINAL_INNER_ROW_Y +
          (4 - bankIndex) * BREADBOARD_HEADER_PITCH
        : -BREADBOARD_TERMINAL_INNER_ROW_Y - bankIndex * BREADBOARD_HEADER_PITCH
    return [label, roundCoordinate(y)]
  }),
) as Record<BreadboardTerminalRowLabel, number>

/** Individually routable A1-J21 sockets in a conventional breadboard grid. */
export const BREADBOARD_TERMINAL_HEADER_POSITIONS =
  BREADBOARD_TERMINAL_ROW_LABELS.flatMap((row, rowIndex) =>
    BREADBOARD_COLUMN_XS.map((x, columnIndex) => ({
      pin: rowIndex * BREADBOARD_COLUMN_COUNT + columnIndex + 1,
      label: `${row}${columnIndex + 1}`,
      column: columnIndex + 1,
      x,
      y: BREADBOARD_TERMINAL_ROW_YS[row],
    })),
  ) satisfies BreadboardHeaderPosition[]

const cornerViaAxisX = createPitchedRange(
  BREADBOARD_CORNER_VIA_X_INNER_OFFSET,
  BREADBOARD_CORNER_VIA_X_OUTER_OFFSET,
)
const cornerViaAxisY = createPitchedRange(
  BREADBOARD_CORNER_VIA_Y_INNER_OFFSET,
  BREADBOARD_CORNER_VIA_Y_OUTER_OFFSET,
)
const cornerViaArmAxisX = createPitchedRange(
  BREADBOARD_CORNER_VIA_X_INNER_OFFSET,
  BREADBOARD_CORNER_VIA_X_INNER_OFFSET + BREADBOARD_CORNER_VIA_ARM_WIDTH,
)
const cornerViaArmAxisY = createPitchedRange(
  BREADBOARD_CORNER_VIA_Y_INNER_OFFSET,
  BREADBOARD_CORNER_VIA_Y_INNER_OFFSET + BREADBOARD_CORNER_VIA_ARM_WIDTH,
)

const createCornerViaPositions = (
  xSign: -1 | 1,
  ySign: -1 | 1,
): BreadboardCladViaPosition[] => {
  const horizontalArm = cornerViaAxisX.flatMap((x) =>
    cornerViaArmAxisY.map((y) => ({ x: x * xSign, y: y * ySign })),
  )
  const verticalArm = cornerViaArmAxisX.flatMap((x) =>
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

/** Four two-via-wide L-shaped fields at the board corners. */
export const BREADBOARD_CORNER_VIA_POSITIONS = (
  [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ] as const
).flatMap(([xSign, ySign]) => createCornerViaPositions(xSign, ySign))

/**
 * Fixed layer-change rows run through each open channel and stay clear of the
 * terminal headers.
 */
export const BREADBOARD_CLAD_VIA_POSITIONS = [
  ...BREADBOARD_CLAD_VIA_ROW_YS.flatMap((y) =>
    BREADBOARD_COLUMN_XS.map((x) => ({ x, y })),
  ),
  ...BREADBOARD_CORNER_VIA_POSITIONS,
] satisfies BreadboardCladViaPosition[]

const terminalPinLabels = Object.fromEntries(
  BREADBOARD_TERMINAL_HEADER_POSITIONS.map((position) => [
    `pin${position.pin}`,
    [position.label],
  ]),
)

const terminalPinNames = BREADBOARD_TERMINAL_HEADER_POSITIONS.map(
  (position) => `pin${position.pin}`,
)

const BreadboardTerminalHeaderFootprint = () => (
  <footprint insertionDirection="from_above">
    {BREADBOARD_TERMINAL_HEADER_POSITIONS.map((position) => (
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

/** One connector exposing every terminal socket by its breadboard name. */
export const BreadboardTerminalHeaders = (props: ConnectorProps) => (
  <connector
    pinLabels={terminalPinLabels}
    manufacturerPartNumber="GENERIC-BREADBOARD-10X21-FEMALE-2.54MM"
    footprint={<BreadboardTerminalHeaderFootprint />}
    noSchematicRepresentation
    {...props}
  />
)

export interface BreadboardCladProps {
  children?: ReactNode
  autorouter?: AutorouterProp
  autorouterOptions?: BiscuitBoardAutorouterOptions
  minTraceWidth?: number
  nominalTraceWidth?: number
  routingDisabled?: boolean
  /** Marks all sockets NC for a bare template preview. */
  markHeadersNoConnect?: boolean
  /** Per-header no-connect overrides for partially populated designs. */
  headerNoConnects?: {
    terminals?: string[]
  }
}

/**
 * A laser-routable breadboard clad with individual 2.54 mm socket pads and
 * fixed vias. Nothing is pre-connected, so every breadboard net is defined by
 * the traces in the consuming circuit.
 */
export const BreadboardClad = ({
  children,
  autorouter,
  autorouterOptions,
  minTraceWidth,
  nominalTraceWidth = 0.3,
  routingDisabled = false,
  markHeadersNoConnect = false,
  headerNoConnects,
}: BreadboardCladProps) => (
  <board
    name="BreadboardClad"
    title="Laser-routable breadboard clad with prefabricated vias"
    width={`${BREADBOARD_CLAD_WIDTH}mm`}
    height={`${BREADBOARD_CLAD_HEIGHT}mm`}
    borderRadius="2mm"
    layers={2}
    minTraceWidth={`${minTraceWidth ?? 0.15}mm`}
    minBoardEdgeClearance={`${BREADBOARD_CLAD_EDGE_CLEARANCE - BREADBOARD_CLAD_EDGE_CLEARANCE_VALIDATION_TOLERANCE}mm`}
    minViaHoleDiameter="0.2mm"
    minViaPadDiameter="0.4mm"
    autorouter={
      autorouter ??
      createPrefabricatedViaAutorouter({
        width: BREADBOARD_CLAD_WIDTH,
        height: BREADBOARD_CLAD_HEIGHT,
        edgeClearance: BREADBOARD_CLAD_EDGE_CLEARANCE,
        options: autorouterOptions,
        minimumTraceWidth: minTraceWidth,
        nominalTraceWidth,
      })
    }
    routingDisabled={routingDisabled}
  >
    <net name="GND" isGroundNet />

    {BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS.map((hole) => (
      <Fragment key={`breadboard-mounting-hole-${hole.x}-${hole.y}`}>
        <hole
          pcbX={hole.x}
          pcbY={hole.y}
          diameter={`${BREADBOARD_MOUNTING_HOLE_DIAMETER}mm`}
        />
      </Fragment>
    ))}

    <BreadboardTerminalHeaders
      name="J_TERMINALS"
      noConnect={
        headerNoConnects?.terminals ??
        (markHeadersNoConnect ? terminalPinNames : undefined)
      }
    />

    {[1, 5, 10, 15, 20, BREADBOARD_COLUMN_COUNT].map((column) => (
      <Fragment key={`column-label-${column}`}>
        <silkscreentext
          text={`${column}`}
          pcbX={BREADBOARD_COLUMN_XS[column - 1]}
          pcbY={16.5}
          fontSize="0.55mm"
        />
      </Fragment>
    ))}

    {BREADBOARD_CLAD_VIA_POSITIONS.map((via) => (
      <Fragment key={`breadboard-prefab-via-${via.x}-${via.y}`}>
        <via
          netIsAssignable
          pcbX={via.x}
          pcbY={via.y}
          fromLayer="top"
          toLayer="bottom"
          holeDiameter={`${BREADBOARD_CLAD_VIA_HOLE_DIAMETER}mm`}
          outerDiameter={`${BREADBOARD_CLAD_VIA_PAD_DIAMETER}mm`}
        />
      </Fragment>
    ))}

    <silkscreentext
      text="BREADBOARD CLAD"
      pcbX={33.5}
      pcbY={0}
      pcbRotation={90}
      fontSize="0.7mm"
    />

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
