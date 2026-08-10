// biome-ignore-all lint/style/useFilenamingConvention: This public board filename was explicitly requested.
import type { SimpleRouteJson } from "@tscircuit/core"
import type { AutorouterConfig } from "@tscircuit/props"
import { Fragment } from "react"
import {
  BISCUIT_BOARD_HEIGHT,
  BISCUIT_BOARD_VIA_ZONES,
  BISCUIT_BOARD_WIDTH,
  type BiscuitBoardViaPosition,
} from "../lib/BiscuitBoard"
import {
  BiscuitBoardAutorouter,
  createBiscuitBoardAutorouter,
} from "../lib/biscuit-board-autorouter"

const BOARD_EDGE_CLEARANCE = 0.2
const BOARD_EDGE_CLEARANCE_VALIDATION_TOLERANCE = 0.001

export const ALIGNMENT_V1_VIA_POSITIONS = [
  // Bottom-left cluster.
  { x: -31.5, y: -21.5 },
  { x: -23.5, y: -17.5 },
  { x: -31.5, y: -17.5 },
  { x: -27.5, y: -21.5 },
  // Top-left cluster.
  { x: -31.5, y: 21.5 },
  { x: -23.5, y: 17.5 },
  { x: -27.5, y: 21.5 },
  { x: -31.5, y: 17.5 },
  // Top-right cluster.
  { x: 10.75, y: 19.5 },
  { x: 26.75, y: 23.5 },
  { x: 14.75, y: 23.5 },
  { x: 22.75, y: 19.5 },
  // Right-side long cluster.
  { x: 32.5, y: 22 },
  { x: 32.5, y: 2 },
  { x: 32.5, y: -22 },
  { x: 32.5, y: 10 },
  { x: 32.5, y: -14 },
  // Center cluster.
  { x: -18, y: 6 },
  { x: -2, y: -6 },
  { x: -14, y: -2 },
  { x: -6, y: 2 },
] as const satisfies readonly BiscuitBoardViaPosition[]

const mountingHoles = [
  { x: BISCUIT_BOARD_WIDTH / 2 - 2.5, y: BISCUIT_BOARD_HEIGHT / 2 - 2.5 },
  { x: BISCUIT_BOARD_WIDTH / 2 - 6.5, y: BISCUIT_BOARD_HEIGHT / 2 - 2.5 },
  { x: BISCUIT_BOARD_WIDTH / 2 - 2.5, y: -BISCUIT_BOARD_HEIGHT / 2 + 2.5 },
  { x: -BISCUIT_BOARD_WIDTH / 2 + 2.5, y: -BISCUIT_BOARD_HEIGHT / 2 + 2.5 },
  { x: -BISCUIT_BOARD_WIDTH / 2 + 2.5, y: BISCUIT_BOARD_HEIGHT / 2 - 2.5 },
] as const

const createBoardBoundedAutorouter = (): AutorouterConfig => ({
  ...createBiscuitBoardAutorouter(),
  algorithmFn: async (input: SimpleRouteJson) =>
    new BiscuitBoardAutorouter({
      ...input,
      minBoardEdgeClearance: BOARD_EDGE_CLEARANCE,
      bounds: {
        minX: -BISCUIT_BOARD_WIDTH / 2,
        maxX: BISCUIT_BOARD_WIDTH / 2,
        minY: -BISCUIT_BOARD_HEIGHT / 2,
        maxY: BISCUIT_BOARD_HEIGHT / 2,
      },
    }),
})

export const AlignmentV1 = () => (
  <board
    name="alignment_v1"
    title="alignment_v1 prefabricated copper clad"
    width={`${BISCUIT_BOARD_WIDTH}mm`}
    height={`${BISCUIT_BOARD_HEIGHT}mm`}
    borderRadius="2mm"
    layers={2}
    minTraceWidth="0.15mm"
    minBoardEdgeClearance={`${BOARD_EDGE_CLEARANCE - BOARD_EDGE_CLEARANCE_VALIDATION_TOLERANCE}mm`}
    minViaHoleDiameter="0.2mm"
    minViaPadDiameter="0.4mm"
    autorouter={createBoardBoundedAutorouter()}
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

    {ALIGNMENT_V1_VIA_POSITIONS.map((via) => (
      <Fragment key={`prefab-via-${via.x}-${via.y}`}>
        <via
          netIsAssignable
          pcbX={via.x}
          pcbY={via.y}
          fromLayer="top"
          toLayer="bottom"
          holeDiameter="0.2mm"
          outerDiameter="0.4mm"
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
  </board>
)

export default AlignmentV1
