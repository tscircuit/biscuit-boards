import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react"
import manualEdits from "../manual-edits.json"
import { Stm32StepperControllerCircuit } from "./stm32-stepper-controller-circuit"

const placementCenter = (selector: string) => {
  const placement = manualEdits.pcb_placements.find(
    (candidate) => candidate.selector === selector,
  )
  if (!placement) throw new Error(`Missing manual placement for ${selector}`)
  return placement.center
}

const placementCenters = new Map(
  manualEdits.pcb_placements.map(({ selector, center }) => [selector, center]),
)

const jPower = placementCenter("J_PWR")
const jSwd = placementCenter("J_SWD")
const driver = placementCenter("U_DRIVER")
const fiveV = placementCenter("C_5VOUT")
const powerLed = placementCenter("D_PWR")

const PREFABRICATED_VIA_ROUTE_HINTS = {
  motorB2: [
    { x: 5, y: -18.7, via: true, to_layer: "bottom" as const },
    { x: 26.1, y: -18.7, via: true, to_layer: "top" as const },
  ],
  swdio: [
    { x: 5, y: -21.2, via: true, to_layer: "bottom" as const },
    { x: -5, y: -21.2, via: true, to_layer: "top" as const },
  ],
  swclk: [
    { x: 2.5, y: -23.7, via: true, to_layer: "bottom" as const },
    { x: -2.5, y: -23.7, via: true, to_layer: "top" as const },
  ],
  nrst: [
    { x: 0, y: -26.2, via: true, to_layer: "bottom" as const },
    { x: -5, y: -26.2, via: true, to_layer: "top" as const },
  ],
} as const

const V3V3_POINT_TO_POINT_TARGETS: Record<string, string> = {
  ".U_REG > .OUT": ".C_REG_OUT > .pin1",
  ".C_REG_OUT > .pin1": ".U_MCU > .VDD_VDDA",
  ".U_MCU > .VDD_VDDA": ".C_MCU > .pin1",
  ".C_MCU > .pin1": ".R_PWR_LED > .pin1",
  ".U_DRIVER > .VCC_IO": ".U_MCU > .VDD_VDDA",
  ".C_VIO > .pin1": ".U_MCU > .VDD_VDDA",
  ".U_DRIVER > .SD_MODE": ".U_DRIVER > .VCC_IO",
  ".U_DRIVER > .SPI_MODE": ".U_DRIVER > .SD_MODE",
}

const STM32_STEPPER_V2_SILKSCREEN_POSITIONS = {
  "6-18V": { pcbX: jPower.x, pcbY: jPower.y + 0.776664049284488 },
  TMC5130A: { pcbX: driver.x, pcbY: driver.y + 6 },
  SWD: { pcbX: jSwd.x, pcbY: jSwd.y + 5.37333595071551 },
  POWER: { pcbX: powerLed.x - 3, pcbY: powerLed.y - 0.5 },
} as const

interface AdaptableElementProps {
  from?: string
  maxLength?: number | string
  name?: string
  text?: string
  to?: string
  for?: string
  pcbX?: number
  pcbY?: number
  offsets?: Array<{ x: number; y: number }>
  pcbRouteHints?: Array<{
    x: number
    y: number
    via?: boolean
    to_layer?: "top" | "bottom"
  }>
  pcbPathRelativeTo?: string
  pcbPath?: Array<{ x: number; y: number }>
}

const adaptControllerChild = (child: ReactNode): ReactNode => {
  if (!isValidElement<AdaptableElementProps>(child)) return child

  const silkscreenPosition = child.props.text
    ? STM32_STEPPER_V2_SILKSCREEN_POSITIONS[
        child.props.text as keyof typeof STM32_STEPPER_V2_SILKSCREEN_POSITIONS
      ]
    : undefined
  if (silkscreenPosition) return cloneElement(child, silkscreenPosition)

  if (child.props.for === ".J_SWD > .SWDIO") {
    return null
  }

  if (child.props.name === "POWER_INPUT_VM") {
    return cloneElement(child, {
      pcbPathRelativeTo: undefined,
      pcbPath: undefined,
    })
  }

  if (child.props.name === "DRIVER_5VOUT") {
    return cloneElement(child, {
      pcbPath: [
        { x: 5.35, y: 1.25 },
        { x: 5.35, y: fiveV.y - driver.y },
      ],
    })
  }

  if (child.props.name === "MOTOR_B2") {
    return cloneElement(child, {
      pcbPathRelativeTo: undefined,
      pcbPath: undefined,
      pcbRouteHints: [...PREFABRICATED_VIA_ROUTE_HINTS.motorB2],
    })
  }

  if (
    child.props.from === ".J_SWD > .SWDIO" &&
    child.props.to === ".U_MCU > .SWDIO"
  ) {
    return cloneElement(child, {
      pcbPathRelativeTo: undefined,
      pcbPath: undefined,
      pcbRouteHints: [...PREFABRICATED_VIA_ROUTE_HINTS.swdio],
    })
  }

  if (
    child.props.from === ".J_SWD > .SWCLK" &&
    child.props.to === ".U_MCU > .SWCLK"
  ) {
    return cloneElement(child, {
      pcbPathRelativeTo: undefined,
      pcbPath: undefined,
      pcbRouteHints: [...PREFABRICATED_VIA_ROUTE_HINTS.swclk],
    })
  }

  if (
    child.props.from === ".J_SWD > .NRST" &&
    child.props.to === ".U_MCU > .NRST"
  ) {
    return cloneElement(child, {
      pcbRouteHints: [...PREFABRICATED_VIA_ROUTE_HINTS.nrst],
    })
  }

  if (
    child.props.from === ".J_SWD > .V3V3" &&
    child.props.to === "net.V3V3"
  ) {
    return cloneElement(child, {
      to: ".U_REG > .OUT",
      maxLength: 50,
      pcbRouteHints: [
        { x: 19.8496653112997, y: -17 },
        { x: 23, y: -17 },
        { x: 23, y: -10.05 },
      ],
    })
  }

  const v3v3Target = child.props.from
    ? V3V3_POINT_TO_POINT_TARGETS[child.props.from]
    : undefined
  if (
    child.props.from === ".R_PWR_LED > .pin1" &&
    child.props.to === "net.V3V3"
  ) {
    return null
  }
  if (child.props.to === "net.V3V3" && v3v3Target) {
    return cloneElement(child, {
      to: v3v3Target,
      maxLength: child.props.from === ".C_VIO > .pin1" ? 6 : 50,
    })
  }
  if (
    child.props.to === "net.GND" &&
    [".C_REG_OUT > .pin2", ".C_MCU > .pin2"].includes(
      child.props.from ?? "",
    )
  ) {
    return cloneElement(child, { maxLength: 10 })
  }

  if (
    child.props.from === ".U_DRIVER > .VS2" &&
    child.props.to === ".U_DRIVER > .VS1"
  ) {
    return cloneElement(child, { to: "net.VM" })
  }

  const componentPosition = child.props.name
    ? placementCenters.get(child.props.name)
    : undefined
  if (componentPosition) {
    return cloneElement(child, {
      pcbX: componentPosition.x,
      pcbY: componentPosition.y,
    })
  }

  return child
}

/** Original controller logic adapted to the manually placed V2 layout. */
export const Stm32StepperControllerCircuitV2 = (): ReactElement => {
  const originalCircuit = Stm32StepperControllerCircuit()
  const originalChildren = (originalCircuit.props as { children?: ReactNode })
    .children

  return <>{Children.map(originalChildren, adaptControllerChild)}</>
}
