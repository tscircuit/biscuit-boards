import type { ReactElement, ReactNode } from "react"
import { Children, cloneElement, isValidElement } from "react"
import {
  ArduinoShieldClad,
  type ArduinoShieldCladProps,
} from "../lib/ArduinoShieldClad"
import { Stm32c071DisplayBiscuitBoard } from "./stm32c071-display"

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

const getDisplayCircuitChildren = (): ReactNode => {
  const original = Stm32c071DisplayBiscuitBoard({
    routingDisabled: true,
  }) as ReactElement<{ children?: ReactNode }>

  return Children.map(original.props.children, (child) => {
    if (!isValidElement<Record<string, unknown>>(child)) return child

    const name = typeof child.props.name === "string" ? child.props.name : ""

    if (name === "J_DISPLAY") {
      return cloneElement(child, { pcbX: 7.5 })
    }

    if (name === "J_SWD") {
      return cloneElement(child, {
        pcbX: 18,
        pcbY: -17,
        pcbRotation: 180,
      })
    }

    if (name === "U_MCU") {
      return cloneElement(child, { noConnect: unusedMcuPins })
    }

    return child
  })
}

const pinNames = (count: number) =>
  Array.from({ length: count }, (_, index) => `pin${index + 1}`)

export const Stm32c071DisplayArduinoShield = (
  props: Pick<
    ArduinoShieldCladProps,
    | "autorouter"
    | "autorouterOptions"
    | "minTraceWidth"
    | "nominalTraceWidth"
    | "routingDisabled"
  > = {},
) => (
  <ArduinoShieldClad
    {...props}
    minTraceWidth={props.minTraceWidth ?? 0.2}
    nominalTraceWidth={props.nominalTraceWidth ?? 0.2}
    headerNoConnects={{
      power: ["pin1", "pin2", "pin3", "pin5", "pin7", "pin8"],
      analog: pinNames(6),
      digital0To7: pinNames(8),
      digital8To13: pinNames(10),
      icsp: pinNames(6),
    }}
    autorouterOptions={{
      gridClearance: 0.1,
      gridPitch: 1,
      maxBlockersPerSearch: 128,
      maxRipsPerRoute: 1_000,
      maxSearchStates: 2_000_000,
      maxTotalRips: 10_000,
      routeOrder: "signal_longest_first",
      ...props.autorouterOptions,
    }}
  >
    {getDisplayCircuitChildren()}

    <trace
      name="ARDUINO_3V3"
      from=".J_POWER > .pin4"
      to="net.V3V3"
      displayName="Arduino 3V3"
      schDisplayLabel="3V3"
    />
    <trace
      name="ARDUINO_GND"
      from=".J_POWER > .pin6"
      to="net.GND"
      displayName="Arduino GND"
      schDisplayLabel="GND"
    />
  </ArduinoShieldClad>
)

export default Stm32c071DisplayArduinoShield
