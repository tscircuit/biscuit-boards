import {
  BiscuitBoardV2,
  type BiscuitBoardV2Props,
} from "../lib/biscuit-board-v2"
import { Stm32PhotodiodeCircuit } from "./stm32-photodiode-biscuit-board"

export type Stm32PhotodiodeBiscuitBoardV2Props = Pick<
  BiscuitBoardV2Props,
  | "autorouter"
  | "autorouterOptions"
  | "minTraceWidth"
  | "minTraceToPadEdgeClearance"
  | "nominalTraceWidth"
  | "routingDisabled"
>

/** STM32C071 photodiode amplifier on the second-generation BiscuitBoard. */
export const Stm32PhotodiodeBiscuitBoardV2 = (
  props: Stm32PhotodiodeBiscuitBoardV2Props = {},
) => (
  <BiscuitBoardV2
    minTraceWidth={0.15}
    minTraceToPadEdgeClearance={0.075}
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
    <Stm32PhotodiodeCircuit swdPcbX={16} />
  </BiscuitBoardV2>
)

export default () => <Stm32PhotodiodeBiscuitBoardV2 />
