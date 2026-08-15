import type { AutorouterProp } from "@tscircuit/props"
import { Fragment, type ReactNode } from "react"
import type { BiscuitBoardAutorouterOptions } from "./biscuit-board-autorouter"
import { createPrefabricatedViaAutorouter } from "./create-prefabricated-via-autorouter"

export const CLAD_32X32_WIDTH = 32
export const CLAD_32X32_HEIGHT = 32
export const CLAD_32X32_MOUNTING_HOLE_DIAMETER = 2
export const CLAD_32X32_MOUNTING_HOLE_INSET = 3
export const CLAD_32X32_VIA_HOLE_DIAMETER = 0.3
export const CLAD_32X32_VIA_PAD_DIAMETER = 0.6
export const CLAD_32X32_VIA_SPACING = 1.3
export const CLAD_32X32_VIA_ARM_INNER_OFFSET = 7.8
export const CLAD_32X32_VIA_ARM_OUTER_OFFSET = 14.3
export const CLAD_32X32_VIA_ARM_WIDTH = 2.6
export const CLAD_32X32_EDGE_CONNECTOR_OPENING =
  CLAD_32X32_VIA_ARM_INNER_OFFSET * 2

const mountingHoleCenterOffset =
  CLAD_32X32_WIDTH / 2 - CLAD_32X32_MOUNTING_HOLE_INSET

export const CLAD_32X32_MOUNTING_HOLE_POSITIONS = [
  { x: -mountingHoleCenterOffset, y: -mountingHoleCenterOffset },
  { x: -mountingHoleCenterOffset, y: mountingHoleCenterOffset },
  { x: mountingHoleCenterOffset, y: -mountingHoleCenterOffset },
  { x: mountingHoleCenterOffset, y: mountingHoleCenterOffset },
]

export interface Clad32x32ViaPosition {
  x: number
  y: number
}

const CLAD_32X32_EDGE_CLEARANCE = 0.2
const CLAD_32X32_EDGE_CLEARANCE_VALIDATION_TOLERANCE = 0.001

const roundCoordinate = (value: number) => Math.round(value * 1e6) / 1e6

const createPitchedRange = (start: number, end: number) =>
  Array.from(
    {
      length: Math.round((end - start) / CLAD_32X32_VIA_SPACING) + 1,
    },
    (_, index) => roundCoordinate(start + index * CLAD_32X32_VIA_SPACING),
  )

const cornerAxis = createPitchedRange(
  CLAD_32X32_VIA_ARM_INNER_OFFSET,
  CLAD_32X32_VIA_ARM_OUTER_OFFSET,
)
const armAxis = createPitchedRange(
  CLAD_32X32_VIA_ARM_INNER_OFFSET,
  CLAD_32X32_VIA_ARM_INNER_OFFSET + CLAD_32X32_VIA_ARM_WIDTH,
)

const createCornerViaPositions = (
  xSign: -1 | 1,
  ySign: -1 | 1,
): Clad32x32ViaPosition[] => {
  const horizontalArm = cornerAxis.flatMap((x) =>
    armAxis.map((y) => ({ x: x * xSign, y: y * ySign })),
  )
  const verticalArm = armAxis.flatMap((x) =>
    cornerAxis.map((y) => ({ x: x * xSign, y: y * ySign })),
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

/** Four three-via-wide L-shaped fields leave every side midpoint open. */
export const CLAD_32X32_VIA_POSITIONS = (
  [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ] as const
).flatMap(([xSign, ySign]) => createCornerViaPositions(xSign, ySign))

export interface Clad32x32Props {
  children?: ReactNode
  autorouter?: AutorouterProp
  autorouterOptions?: BiscuitBoardAutorouterOptions
  /** Enforced minimum trace width in millimeters. */
  minTraceWidth?: number
  nominalTraceWidth?: number
  routingDisabled?: boolean
}

/** A two-layer 32 mm square clad with four corner holes and L-shaped via fields. */
export const Clad32x32 = ({
  children,
  autorouter,
  autorouterOptions,
  minTraceWidth,
  nominalTraceWidth = 0.2,
  routingDisabled = false,
}: Clad32x32Props) => (
  <board
    name="Clad32x32"
    title="32 mm x 32 mm copper clad"
    width={`${CLAD_32X32_WIDTH}mm`}
    height={`${CLAD_32X32_HEIGHT}mm`}
    borderRadius="1.5mm"
    layers={2}
    minTraceWidth={`${minTraceWidth ?? 0.15}mm`}
    minBoardEdgeClearance={`${CLAD_32X32_EDGE_CLEARANCE - CLAD_32X32_EDGE_CLEARANCE_VALIDATION_TOLERANCE}mm`}
    minViaHoleDiameter="0.2mm"
    minViaPadDiameter="0.4mm"
    autorouter={
      autorouter ??
      createPrefabricatedViaAutorouter({
        width: CLAD_32X32_WIDTH,
        height: CLAD_32X32_HEIGHT,
        edgeClearance: CLAD_32X32_EDGE_CLEARANCE,
        options: autorouterOptions,
        minimumTraceWidth: minTraceWidth,
        nominalTraceWidth,
      })
    }
    routingDisabled={routingDisabled}
  >
    {CLAD_32X32_MOUNTING_HOLE_POSITIONS.map((hole) => (
      <Fragment key={`clad-32x32-mounting-hole-${hole.x}-${hole.y}`}>
        <hole
          pcbX={hole.x}
          pcbY={hole.y}
          diameter={`${CLAD_32X32_MOUNTING_HOLE_DIAMETER}mm`}
        />
      </Fragment>
    ))}

    {CLAD_32X32_VIA_POSITIONS.map((via) => (
      <Fragment key={`clad-32x32-prefab-via-${via.x}-${via.y}`}>
        <via
          netIsAssignable
          pcbX={via.x}
          pcbY={via.y}
          fromLayer="top"
          toLayer="bottom"
          holeDiameter={`${CLAD_32X32_VIA_HOLE_DIAMETER}mm`}
          outerDiameter={`${CLAD_32X32_VIA_PAD_DIAMETER}mm`}
        />
      </Fragment>
    ))}

    <pcbnotedimension
      from={{ x: -CLAD_32X32_WIDTH / 2, y: CLAD_32X32_HEIGHT / 2 + 2.5 }}
      to={{ x: CLAD_32X32_WIDTH / 2, y: CLAD_32X32_HEIGHT / 2 + 2.5 }}
      text={`${CLAD_32X32_WIDTH}mm`}
    />
    <pcbnotedimension
      from={{ x: CLAD_32X32_WIDTH / 2 + 2.5, y: -CLAD_32X32_HEIGHT / 2 }}
      to={{ x: CLAD_32X32_WIDTH / 2 + 2.5, y: CLAD_32X32_HEIGHT / 2 }}
      text={`${CLAD_32X32_HEIGHT}mm`}
    />

    {children}
  </board>
)
