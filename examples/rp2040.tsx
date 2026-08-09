import { Microcontroller_RP2040 } from "@tscircuit/common"
import { BiscuitBoard, type BiscuitBoardProps } from "../lib/BiscuitBoard"

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
    <Microcontroller_RP2040
      name="MCU"
      pcbX={5.5}
      pcbY={-2.75}
      pcbRotation={90}
    />
  </BiscuitBoard>
)

export default Rp2040BiscuitBoard
