import type { AutorouterProp } from "@tscircuit/props"
import { Fragment, type ReactNode } from "react"
import type { BiscuitBoardAutorouterOptions } from "./biscuit-board-autorouter"
import { createPrefabricatedViaAutorouter } from "./create-prefabricated-via-autorouter"

export const CLAD_40X40_WIDTH = 40
export const CLAD_40X40_HEIGHT = 40
export const CLAD_40X40_MOUNTING_HOLE_DIAMETER = 2
export const CLAD_40X40_EDGE_MOUNTING_HOLE_INSET = 3
export const CLAD_40X40_VIA_HOLE_DIAMETER = 0.3
export const CLAD_40X40_VIA_PAD_DIAMETER = 0.6
export const CLAD_40X40_VIA_SPACING = 1.3
export const CLAD_40X40_VIA_RING_HALF_SIZES = [2.6, 3.9, 5.2] as const

export const CLAD_40X40_MOUNTING_HOLE_POSITIONS = [
  { x: 0, y: 0 },
  {
    x: CLAD_40X40_WIDTH / 2 - CLAD_40X40_EDGE_MOUNTING_HOLE_INSET,
    y: CLAD_40X40_HEIGHT / 2 - CLAD_40X40_EDGE_MOUNTING_HOLE_INSET,
  },
]

const CLAD_40X40_EDGE_CLEARANCE = 0.2
const CLAD_40X40_EDGE_CLEARANCE_VALIDATION_TOLERANCE = 0.001

const createSquareViaRingPositions = (halfSize: number) => {
  const axisPositions = Array.from(
    { length: Math.round((halfSize * 2) / CLAD_40X40_VIA_SPACING) + 1 },
    (_, index) =>
      Math.round((-halfSize + index * CLAD_40X40_VIA_SPACING) * 1e6) / 1e6,
  )

  return [
    ...axisPositions.flatMap((x) => [
      { x, y: -halfSize },
      { x, y: halfSize },
    ]),
    ...axisPositions.slice(1, -1).flatMap((y) => [
      { x: -halfSize, y },
      { x: halfSize, y },
    ]),
  ]
}

/** Three concentric square via rings centered on the central mounting hole. */
export const CLAD_40X40_VIA_POSITIONS = CLAD_40X40_VIA_RING_HALF_SIZES.flatMap(
  createSquareViaRingPositions,
)

export interface Clad40x40Props {
  children?: ReactNode
  autorouter?: AutorouterProp
  autorouterOptions?: BiscuitBoardAutorouterOptions
  /** Enforced minimum trace width in millimeters. */
  minTraceWidth?: number
  nominalTraceWidth?: number
  routingDisabled?: boolean
}

/** A two-layer 40 mm square clad with two mounting holes and three via rings. */
export const Clad40x40 = ({
  children,
  autorouter,
  autorouterOptions,
  minTraceWidth,
  nominalTraceWidth = 0.2,
  routingDisabled = false,
}: Clad40x40Props) => (
  <board
    name="Clad40x40"
    title="40 mm x 40 mm copper clad"
    width={`${CLAD_40X40_WIDTH}mm`}
    height={`${CLAD_40X40_HEIGHT}mm`}
    borderRadius="1.5mm"
    layers={2}
    minTraceWidth={`${minTraceWidth ?? 0.15}mm`}
    minBoardEdgeClearance={`${CLAD_40X40_EDGE_CLEARANCE - CLAD_40X40_EDGE_CLEARANCE_VALIDATION_TOLERANCE}mm`}
    minViaHoleDiameter="0.2mm"
    minViaPadDiameter="0.4mm"
    autorouter={
      autorouter ??
      createPrefabricatedViaAutorouter({
        width: CLAD_40X40_WIDTH,
        height: CLAD_40X40_HEIGHT,
        edgeClearance: CLAD_40X40_EDGE_CLEARANCE,
        options: autorouterOptions,
        minimumTraceWidth: minTraceWidth,
        nominalTraceWidth,
      })
    }
    routingDisabled={routingDisabled}
  >
    {CLAD_40X40_MOUNTING_HOLE_POSITIONS.map((hole) => (
      <Fragment key={`clad-40x40-mounting-hole-${hole.x}-${hole.y}`}>
        <hole
          pcbX={hole.x}
          pcbY={hole.y}
          diameter={`${CLAD_40X40_MOUNTING_HOLE_DIAMETER}mm`}
        />
      </Fragment>
    ))}

    {CLAD_40X40_VIA_POSITIONS.map((via) => (
      <Fragment key={`clad-40x40-prefab-via-${via.x}-${via.y}`}>
        <via
          netIsAssignable
          pcbX={via.x}
          pcbY={via.y}
          fromLayer="top"
          toLayer="bottom"
          holeDiameter={`${CLAD_40X40_VIA_HOLE_DIAMETER}mm`}
          outerDiameter={`${CLAD_40X40_VIA_PAD_DIAMETER}mm`}
        />
      </Fragment>
    ))}

    <pcbnotedimension
      from={{
        x: -CLAD_40X40_WIDTH / 2,
        y: CLAD_40X40_HEIGHT / 2 + 2.5,
      }}
      to={{
        x: CLAD_40X40_WIDTH / 2,
        y: CLAD_40X40_HEIGHT / 2 + 2.5,
      }}
      text={`${CLAD_40X40_WIDTH}mm`}
    />
    <pcbnotedimension
      from={{
        x: CLAD_40X40_WIDTH / 2 + 2.5,
        y: -CLAD_40X40_HEIGHT / 2,
      }}
      to={{
        x: CLAD_40X40_WIDTH / 2 + 2.5,
        y: CLAD_40X40_HEIGHT / 2,
      }}
      text={`${CLAD_40X40_HEIGHT}mm`}
    />

    {children}
  </board>
)
