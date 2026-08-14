import type { ReactElement, ReactNode } from "react"
import { Children, cloneElement, Fragment, isValidElement } from "react"
import {
  BoosterPackClad,
  type BoosterPackCladProps,
} from "../lib/BoosterPackClad"
import { Stm32c071DisplayBiscuitBoard } from "./stm32c071-display"

interface PcbPlacement extends Record<string, unknown> {
  pcbX: number
  pcbY: number
  pcbRotation?: number
}

const componentPlacements: Record<string, PcbPlacement> = {
  J_DISPLAY: { pcbX: -2, pcbY: 0, pcbRotation: 90 },
  R_I2C_SCL: { pcbX: -6.8, pcbY: -4.8, pcbRotation: 90 },
  R_I2C_SDA: { pcbX: -6.8, pcbY: 4.8, pcbRotation: 90 },
  SW_BTN1: { pcbX: -12.5, pcbY: 8 },
  SW_BTN2: { pcbX: -12.5, pcbY: -8 },
  R_BTN1: { pcbX: -7.3, pcbY: 8 },
  R_BTN2: { pcbX: -7.3, pcbY: -8 },
  J_SWD: { pcbX: 8, pcbY: -15, pcbRotation: 180 },
  U_MCU: { pcbX: 8.5, pcbY: 0, pcbRotation: 270 },
  C_MCU: { pcbX: 4.1, pcbY: 0, pcbRotation: 90 },
  C_NRST: { pcbX: 13, pcbY: 5.5, pcbRotation: 90 },
  C_BULK: { pcbX: 15, pcbY: -10, pcbRotation: 90 },
  R_PWR_LED: { pcbX: -3, pcbY: 13.5 },
  D_PWR: { pcbX: 0.5, pcbY: 13.5 },
  R_USER_LED: { pcbX: 7, pcbY: 13.5 },
  D_USER: { pcbX: 10.5, pcbY: 13.5 },
}

const unusedMcuPins = [
  "pin1",
  "pin2",
  "pin3",
  "pin9",
  "pin10",
  "pin11",
  "pin12",
  "pin13",
  "pin14",
  "pin20",
]

const silkscreen = [
  { text: "BTN1", pcbX: -12.5, pcbY: 12, fontSize: "0.7mm" },
  { text: "BTN2", pcbX: -12.5, pcbY: -12, fontSize: "0.7mm" },
  { text: "DISPLAY", pcbX: -2, pcbY: 6.1, fontSize: "0.7mm" },
  { text: "POWER", pcbX: -1.25, pcbY: 15.1, fontSize: "0.65mm" },
  { text: "PA8", pcbX: 8.75, pcbY: 15.1, fontSize: "0.65mm" },
  { text: "SWD", pcbX: 8, pcbY: -10.6, fontSize: "0.7mm" },
] as const

const reservedTraceObstacle = (
  id: string,
  from: { x: number; y: number },
  to: { x: number; y: number },
) => {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const isMostlyVertical = Math.abs(dy) >= Math.abs(dx)
  return {
    obstacleId: id,
    type: "rect" as const,
    layers: ["top"],
    center: { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 },
    width: isMostlyVertical ? Math.abs(dx) + 0.2 : Math.abs(dx),
    height: isMostlyVertical ? Math.abs(dy) : Math.abs(dy) + 0.2,
    connectedTo: [id],
  }
}

const swclkRoute = [
  { x: 6, y: -12.75 },
  { x: 6, y: -18 },
  { x: 18, y: -18 },
  { x: 18, y: -4 },
  { x: 10.775, y: -4 },
  { x: 10.775, y: -2.85 },
] as const

export const BOOSTERPACK_SWD_RESERVED_ROUTING_OBSTACLES = [
  reservedTraceObstacle(
    "reserved-swdio",
    { x: 10, y: -12.75 },
    { x: 10.125, y: -2.85 },
  ),
  ...swclkRoute
    .slice(1)
    .map((to, index) =>
      reservedTraceObstacle(`reserved-swclk-${index}`, swclkRoute[index]!, to),
    ),
]

const getRepackedDisplayChildren = (routeSwdAndBulk: boolean): ReactNode => {
  const original = Stm32c071DisplayBiscuitBoard({
    routingDisabled: true,
  }) as ReactElement<{ children?: ReactNode }>

  return Children.map(original.props.children, (child) => {
    if (!isValidElement<Record<string, unknown>>(child)) return child

    if (child.type === "keepout" || child.type === "silkscreentext") {
      return null
    }

    const name = typeof child.props.name === "string" ? child.props.name : ""
    if (
      (!routeSwdAndBulk && name.startsWith("CBULK_")) ||
      (!routeSwdAndBulk &&
        (name.startsWith("SWD_") || name === "SWDIO" || name === "SWCLK"))
    ) {
      return null
    }

    const placement = componentPlacements[name]
    if (placement) {
      return cloneElement(child, {
        ...placement,
        ...(name === "U_MCU" ? { noConnect: unusedMcuPins } : {}),
      })
    }

    if (name === "DISPLAY_SCL" || name === "DISPLAY_SDA") {
      // The original hints target the 75 x 55 mm BiscuitBoard placement and
      // are outside this smaller board. Let the clad router solve these nets.
      return cloneElement(child, { pcbRouteHints: undefined })
    }

    if (name === "SWDIO") {
      return cloneElement(child, { pcbStraightLine: true })
    }

    if (name === "SWCLK") {
      return cloneElement(child, {
        pcbPathRelativeTo: ".J_SWD > .SWCLK",
        pcbPath: [
          // Coordinates are in J_SWD's 180-degree-rotated component frame.
          { x: 2, y: 3 },
          { x: -10, y: 3 },
          { x: -10, y: -11 },
          { x: -2.775, y: -11 },
        ],
      })
    }

    return child
  })
}

export interface Stm32c071DisplayBoosterPackCladProps
  extends Pick<
    BoosterPackCladProps,
    | "autorouter"
    | "autorouterOptions"
    | "minTraceWidth"
    | "nominalTraceWidth"
    | "routingDisabled"
  > {
  /**
   * Include the five SWD and two bulk-capacitor connections. Enabled by
   * default; disabling it is retained only for routing comparisons.
   */
  routeSwdAndBulk?: boolean
}

export const Stm32c071DisplayBoosterPackClad = ({
  routeSwdAndBulk = true,
  ...props
}: Stm32c071DisplayBoosterPackCladProps = {}) => (
  <BoosterPackClad
    {...props}
    reservedAutorouterObstacles={
      routeSwdAndBulk ? BOOSTERPACK_SWD_RESERVED_ROUTING_OBSTACLES : []
    }
    minTraceWidth={props.minTraceWidth ?? 0.2}
    autorouterOptions={{
      gridClearance: 0.16,
      gridPitch: 1,
      maxBlockersPerSearch: 128,
      maxRipsPerRoute: 1_000,
      maxSearchStates: 2_000_000,
      maxTotalRips: 10_000,
      routeOrder: "signal_longest_first",
      ...props.autorouterOptions,
    }}
  >
    {getRepackedDisplayChildren(routeSwdAndBulk)}

    <trace
      name="LAUNCHPAD_3V3"
      from=".J_LAUNCHPAD_LEFT > .LP_3V3"
      to="net.V3V3"
      displayName="LaunchPad 3V3"
      schDisplayLabel="3V3"
    />
    <trace
      name="LAUNCHPAD_GND_LEFT"
      from=".J_LAUNCHPAD_LEFT > .LP_GND_INNER"
      to="net.GND"
      displayName="LaunchPad GND"
      schDisplayLabel="GND"
    />
    <trace
      name="LAUNCHPAD_GND_RIGHT"
      from=".J_LAUNCHPAD_RIGHT > .LP_GND"
      to="net.GND"
      displayName="LaunchPad GND"
      schDisplayLabel="GND"
    />
    {silkscreen.map((text) => (
      <Fragment key={text.text}>
        <silkscreentext {...text} />
      </Fragment>
    ))}
  </BoosterPackClad>
)

export default Stm32c071DisplayBoosterPackClad
