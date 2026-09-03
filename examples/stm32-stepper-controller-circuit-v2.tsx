import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react"
import { Stm32StepperControllerCircuit } from "./stm32-stepper-controller-circuit"

export const STM32_STEPPER_V2_COMPONENT_POSITIONS = {
  U_REG: { x: 12, y: -11 },
  U_MCU: { x: 0.07390575447752923, y: -0.0732804798867619 },
  C_MCU: { x: -4.5, y: -5 },
  J_SWD: { x: 15.849665311299699, y: -22.501329360584194 },
  J_MOTOR: { x: 33.5528833811294, y: 1.1846847201103152 },
  C_5VOUT: { x: 23.18609955472588, y: 0.248611313238193 },
  U_DRIVER: { x: 15.90246227931054, y: -0.2089600471488957 },
  R_VCC: { x: 25.315869005838094, y: 4.047667978628961 },
  R_SENSE_B: { x: 20.181181829631604, y: -8.379033608290456 },
  C_CP: { x: 22, y: 8.2 },
  C_VCC: { x: 25.275734451291293, y: 8.53500341434159 },
  C_VCP: { x: 17.799635720801433, y: 6.933647288098026 },
  C_VSA: { x: 11.201349275267265, y: 6.88944435482054 },
  C_VIO: { x: -1.5, y: -5 },
  C_REG_OUT: { x: 3, y: -8 },
  C_REG_IN: { x: -19.044208260027165, y: 4.109262740425663 },
  D_PWR: { x: -9, y: 6 },
  R_PWR_LED: { x: -6, y: 6 },
  C_VM_BULK: { x: 5.09759697460208, y: 15.415331482986516 },
  C_VM: { x: 10.118912406454285, y: 15.542739472034405 },
  J_PWR: { x: -14.448853395069655, y: 22.073335950715514 },
  R_SENSE_A: { x: 11.418168466690886, y: 10.458746702625106 },
} as const satisfies Record<string, { x: number; y: number }>

const placementCenter = (
  selector: keyof typeof STM32_STEPPER_V2_COMPONENT_POSITIONS,
) => STM32_STEPPER_V2_COMPONENT_POSITIONS[selector]

const placementCenters = new Map(
  Object.entries(STM32_STEPPER_V2_COMPONENT_POSITIONS),
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
