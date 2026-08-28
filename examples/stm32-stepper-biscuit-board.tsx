import { BiscuitBoard, type BiscuitBoardProps } from "../lib/BiscuitBoard"
import { Stm32StepperControllerCircuit } from "./stm32-stepper-controller-circuit"

/** STM32 + TMC5130A controller for one bipolar stepper motor. */
export const Stm32StepperBiscuitBoard = (
  props: Pick<
    BiscuitBoardProps,
    "autorouter" | "autorouterOptions" | "routingDisabled"
  > = {},
) => (
  <BiscuitBoard
    minTraceWidth={0.15}
    nominalTraceWidth={0.2}
    autorouterEdgeClearance={0.7}
    autorouterOptions={{
      gridClearance: 0.1,
      routeOrder: "signal_longest_first",
    }}
    {...props}
  >
    <Stm32StepperControllerCircuit />
  </BiscuitBoard>
)

export default () => <Stm32StepperBiscuitBoard />
