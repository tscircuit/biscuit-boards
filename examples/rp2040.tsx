import { Microcontroller_RP2040 } from "@tscircuit/common"
import {
  Children,
  type ComponentProps,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react"
import { BiscuitBoard, type BiscuitBoardProps } from "../lib/BiscuitBoard"

const USB_PCB_Y = 37.725

const MicrocontrollerRp2040WithEdgeUsb = (
  props: ComponentProps<typeof Microcontroller_RP2040>,
) => {
  const rp2040 = Microcontroller_RP2040(props) as ReactElement<{
    children?: ReactNode
  }>

  return cloneElement(
    rp2040,
    undefined,
    Children.map(rp2040.props.children, (child) => {
      if (
        !isValidElement<{ name?: string; pcbY?: number }>(child) ||
        child.props.name !== "J_USB"
      ) {
        return child
      }

      return cloneElement(child, { pcbY: USB_PCB_Y })
    }),
  )
}

export const Rp2040BiscuitBoard = (
  props: Pick<
    BiscuitBoardProps,
    "autorouter" | "autorouterOptions" | "routingDisabled"
  > = {},
) => (
  <BiscuitBoard
    {...props}
    autorouterOptions={{
      gridClearance: 0.1,
      maxRipsPerRoute: 1_000,
      maxTotalRips: 10_000,
      routeOrder: "signal_longest_first",
      ...props.autorouterOptions,
    }}
    routingDisabled={props.routingDisabled ?? false}
  >
    <MicrocontrollerRp2040WithEdgeUsb
      name="MCU"
      pcbX={5.5}
      pcbY={-2.75}
      pcbRotation={90}
    />
  </BiscuitBoard>
)

export default Rp2040BiscuitBoard
