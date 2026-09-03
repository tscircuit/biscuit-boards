import {
  BiscuitBoardV2,
  type BiscuitBoardV2Props,
} from "../lib/biscuit-board-v2"
import {
  Stm32StepperControllerCircuitV2,
} from "./stm32-stepper-controller-circuit-v2"

/** Existing STM32 + TMC5130A stepper controller on BiscuitBoard V2. */
export const Stm32StepperBiscuitBoardV2 = (
  props: Pick<
    BiscuitBoardV2Props,
    "autorouter" | "autorouterOptions" | "routingDisabled"
  > = {},
) => (
  <BiscuitBoardV2
    minTraceWidth={0.15}
    nominalTraceWidth={0.2}
    autorouterEdgeClearance={0.7}
    autorouterOptions={{
      gridClearance: 0.1,
      gridPitch: 1,
      maxBlockersPerSearch: 128,
      routeOrder: "signal_longest_first",
      maxSearchStates: 2_000_000,
      maxRipsPerRoute: 1_000,
      maxTotalRips: 10_000,
      expansionsPerStep: 1_000,
    }}
    {...props}
  >
    <Stm32StepperControllerCircuitV2 />
  </BiscuitBoardV2>
)

export default () => <Stm32StepperBiscuitBoardV2 />
