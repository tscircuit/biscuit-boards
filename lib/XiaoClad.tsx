import type { AutorouterProp } from "@tscircuit/props"
import { Fragment, type ReactNode } from "react"
import type { BiscuitBoardAutorouterOptions } from "./biscuit-board-autorouter"
import { createPrefabricatedViaAutorouter } from "./create-prefabricated-via-autorouter"

/** Seeed Studio XIAO classic outline, with USB oriented toward +Y. */
export const XIAO_CLAD_WIDTH = 17.8
export const XIAO_CLAD_HEIGHT = 21
export const XIAO_CLAD_MOUNTING_HOLE_DIAMETER = 2.2
export const XIAO_CLAD_VIA_HOLE_DIAMETER = 0.3
export const XIAO_CLAD_VIA_OUTER_DIAMETER = 0.4
export const XIAO_CLAD_MIN_VIA_CLEARANCE = 1

const XIAO_CLAD_EDGE_CLEARANCE = 0.8
const XIAO_CLAD_EDGE_CLEARANCE_VALIDATION_TOLERANCE = 0.001

export interface XiaoCladViaPosition {
  x: number
  y: number
}

export interface XiaoCladViaGridArea {
  width: number
  height: number
  centerX?: number
  centerY?: number
}

export interface XiaoCladViaGridOptions {
  /** One grid area retained for simple/backward-compatible configurations. */
  viaGridArea?: XiaoCladViaGridArea
  /** Multiple grid areas; cannot be combined with viaGridArea. */
  viaGridAreas?: readonly XiaoCladViaGridArea[]
  viaHoleDiameter?: number
  viaOuterDiameter?: number
  minViaClearance?: number
}

/**
 * Three edge grids leave the middle and top of the clad open for components.
 * Each physical grid dimension includes the copper radius of its outer vias.
 */
export const XIAO_CLAD_VIA_GRID_AREAS = [
  { width: 1.4, height: 10, centerX: -6.8, centerY: 0 },
  { width: 1.4, height: 10, centerX: 6.8, centerY: 0 },
  { width: 10, height: 2.8, centerX: 0, centerY: -8.4 },
] as const satisfies readonly XiaoCladViaGridArea[]

/** Conservative uninterrupted placement area between the four M2 holes. */
export const XIAO_CLAD_COMPONENT_AREA = {
  width: 9.8,
  height: 12.8,
  centerX: 0,
  centerY: 0,
} as const

const validateFinite = (name: string, value: number) => {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be finite`)
  }
}

const validatePositive = (name: string, value: number) => {
  validateFinite(name, value)
  if (value <= 0) {
    throw new Error(`${name} must be greater than zero`)
  }
}

const createPositionsForArea = ({
  viaGridArea,
  viaOuterDiameter,
  minViaClearance,
}: {
  viaGridArea: XiaoCladViaGridArea
  viaOuterDiameter: number
  minViaClearance: number
}): XiaoCladViaPosition[] => {
  validatePositive("viaGridArea.width", viaGridArea.width)
  validatePositive("viaGridArea.height", viaGridArea.height)

  const centerX = viaGridArea.centerX ?? 0
  const centerY = viaGridArea.centerY ?? 0
  validateFinite("viaGridArea.centerX", centerX)
  validateFinite("viaGridArea.centerY", centerY)

  const pitch = viaOuterDiameter + minViaClearance
  const countForLength = (length: number) =>
    length < viaOuterDiameter
      ? 0
      : Math.floor((length + minViaClearance) / pitch + 1e-9)
  const columnCount = countForLength(viaGridArea.width)
  const rowCount = countForLength(viaGridArea.height)
  const roundCoordinate = (value: number) => Number(value.toFixed(9))
  const positionsForAxis = (count: number, center: number) =>
    Array.from({ length: count }, (_, index) =>
      roundCoordinate(center + (index - (count - 1) / 2) * pitch),
    )

  return positionsForAxis(columnCount, centerX).flatMap((x) =>
    positionsForAxis(rowCount, centerY).map((y) => ({ x, y })),
  )
}

/** Fits maximum centered via matrices inside one or more physical areas. */
export const createXiaoCladViaPositions = ({
  viaGridArea,
  viaGridAreas,
  viaHoleDiameter = XIAO_CLAD_VIA_HOLE_DIAMETER,
  viaOuterDiameter = XIAO_CLAD_VIA_OUTER_DIAMETER,
  minViaClearance = XIAO_CLAD_MIN_VIA_CLEARANCE,
}: XiaoCladViaGridOptions = {}): XiaoCladViaPosition[] => {
  validatePositive("viaHoleDiameter", viaHoleDiameter)
  validatePositive("viaOuterDiameter", viaOuterDiameter)
  validateFinite("minViaClearance", minViaClearance)

  if (minViaClearance < 0) {
    throw new Error("minViaClearance must be zero or greater")
  }
  if (viaOuterDiameter < viaHoleDiameter) {
    throw new Error("viaOuterDiameter must be at least viaHoleDiameter")
  }
  if (viaGridArea !== undefined && viaGridAreas !== undefined) {
    throw new Error("Use either viaGridArea or viaGridAreas, not both")
  }

  const resolvedGridAreas =
    viaGridAreas ?? (viaGridArea ? [viaGridArea] : XIAO_CLAD_VIA_GRID_AREAS)
  const pitch = viaOuterDiameter + minViaClearance
  const pointKey = (point: XiaoCladViaPosition) =>
    `${point.x.toFixed(9)},${point.y.toFixed(9)}`
  const positions = Array.from(
    new Map(
      resolvedGridAreas
        .flatMap((area) =>
          createPositionsForArea({
            viaGridArea: area,
            viaOuterDiameter,
            minViaClearance,
          }),
        )
        .map((point) => [pointKey(point), point]),
    ).values(),
  )

  for (let firstIndex = 0; firstIndex < positions.length; firstIndex++) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < positions.length;
      secondIndex++
    ) {
      const distance = Math.hypot(
        positions[firstIndex].x - positions[secondIndex].x,
        positions[firstIndex].y - positions[secondIndex].y,
      )
      if (distance + 1e-9 < pitch) {
        throw new Error(
          "viaGridAreas place vias closer than viaOuterDiameter + minViaClearance",
        )
      }
    }
  }

  return positions
}

/** Four M2 clearance holes inset 2.5 mm from the XIAO-sized outline. */
export const XIAO_CLAD_MOUNTING_HOLE_POSITIONS = [
  { x: -XIAO_CLAD_WIDTH / 2 + 2.5, y: -XIAO_CLAD_HEIGHT / 2 + 2.5 },
  { x: XIAO_CLAD_WIDTH / 2 - 2.5, y: -XIAO_CLAD_HEIGHT / 2 + 2.5 },
  { x: -XIAO_CLAD_WIDTH / 2 + 2.5, y: XIAO_CLAD_HEIGHT / 2 - 2.5 },
  { x: XIAO_CLAD_WIDTH / 2 - 2.5, y: XIAO_CLAD_HEIGHT / 2 - 2.5 },
] as const

/** Default grid bounds retained for note/export compatibility. */
export const XIAO_CLAD_VIA_CANDIDATE_ZONES = [
  ...XIAO_CLAD_VIA_GRID_AREAS.map((area) => ({
    minX: (area.centerX ?? 0) - area.width / 2,
    maxX: (area.centerX ?? 0) + area.width / 2,
    minY: (area.centerY ?? 0) - area.height / 2,
    maxY: (area.centerY ?? 0) + area.height / 2,
    spacing: XIAO_CLAD_VIA_OUTER_DIAMETER + XIAO_CLAD_MIN_VIA_CLEARANCE,
  })),
] as const

export const XIAO_CLAD_VIA_POSITIONS = createXiaoCladViaPositions()

export interface XiaoCladProps extends XiaoCladViaGridOptions {
  children?: ReactNode
  autorouter?: AutorouterProp
  autorouterOptions?: BiscuitBoardAutorouterOptions
  minTraceWidth?: number
  nominalTraceWidth?: number
  routingDisabled?: boolean
}

/** A XIAO-sized prefabricated copper clad with fixed vias and four M2 holes. */
export const XiaoClad = ({
  children,
  autorouter,
  autorouterOptions,
  minTraceWidth,
  nominalTraceWidth = 0.3,
  routingDisabled = false,
  viaGridArea,
  viaGridAreas,
  viaHoleDiameter = XIAO_CLAD_VIA_HOLE_DIAMETER,
  viaOuterDiameter = XIAO_CLAD_VIA_OUTER_DIAMETER,
  minViaClearance = XIAO_CLAD_MIN_VIA_CLEARANCE,
}: XiaoCladProps) => {
  const viaPositions = createXiaoCladViaPositions({
    viaGridArea,
    viaGridAreas,
    viaHoleDiameter,
    viaOuterDiameter,
    minViaClearance,
  })
  const resolvedGridAreas =
    viaGridAreas ?? (viaGridArea ? [viaGridArea] : XIAO_CLAD_VIA_GRID_AREAS)

  return (
    <board
      name="XiaoClad"
      title="XIAO form-factor prefabricated copper clad"
      width={`${XIAO_CLAD_WIDTH}mm`}
      height={`${XIAO_CLAD_HEIGHT}mm`}
      borderRadius="1.5mm"
      layers={2}
      minTraceWidth={`${minTraceWidth ?? 0.15}mm`}
      minBoardEdgeClearance={`${XIAO_CLAD_EDGE_CLEARANCE - XIAO_CLAD_EDGE_CLEARANCE_VALIDATION_TOLERANCE}mm`}
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.4mm"
      autorouter={
        autorouter ??
        createPrefabricatedViaAutorouter({
          width: XIAO_CLAD_WIDTH,
          height: XIAO_CLAD_HEIGHT,
          edgeClearance: XIAO_CLAD_EDGE_CLEARANCE,
          options: autorouterOptions,
          minimumTraceWidth: minTraceWidth,
          nominalTraceWidth,
        })
      }
      routingDisabled={routingDisabled}
    >
      <net name="GND" isGroundNet />

      {XIAO_CLAD_MOUNTING_HOLE_POSITIONS.map((hole) => (
        <Fragment key={`xiao-mounting-hole-${hole.x}-${hole.y}`}>
          <hole
            pcbX={hole.x}
            pcbY={hole.y}
            diameter={`${XIAO_CLAD_MOUNTING_HOLE_DIAMETER}mm`}
          />
        </Fragment>
      ))}

      {resolvedGridAreas.map((area) => (
        <Fragment
          key={`xiao-via-grid-${area.centerX ?? 0}-${area.centerY ?? 0}-${area.width}-${area.height}`}
        >
          <pcbnoterect
            color="blue"
            width={area.width}
            height={area.height}
            pcbPositionAnchor="center"
            pcbX={area.centerX ?? 0}
            pcbY={area.centerY ?? 0}
          />
        </Fragment>
      ))}

      {viaPositions.map((via) => (
        <Fragment key={`xiao-prefab-via-${via.x}-${via.y}`}>
          <via
            netIsAssignable
            pcbX={via.x}
            pcbY={via.y}
            fromLayer="top"
            toLayer="bottom"
            holeDiameter={`${viaHoleDiameter}mm`}
            outerDiameter={`${viaOuterDiameter}mm`}
          />
        </Fragment>
      ))}

      <silkscreentext text="UP" pcbX={0} pcbY={8.2} fontSize="0.8mm" />
      <pcbnotedimension
        from={{ x: -XIAO_CLAD_WIDTH / 2, y: XIAO_CLAD_HEIGHT / 2 + 1.5 }}
        to={{ x: XIAO_CLAD_WIDTH / 2, y: XIAO_CLAD_HEIGHT / 2 + 1.5 }}
        text={`${XIAO_CLAD_WIDTH}mm`}
      />
      <pcbnotedimension
        from={{ x: XIAO_CLAD_WIDTH / 2 + 1.5, y: -XIAO_CLAD_HEIGHT / 2 }}
        to={{ x: XIAO_CLAD_WIDTH / 2 + 1.5, y: XIAO_CLAD_HEIGHT / 2 }}
        text={`${XIAO_CLAD_HEIGHT}mm`}
      />

      {children}
    </board>
  )
}
