import {
  Rp2040PhotodiodeBiscuitBoardBase,
  type Rp2040PhotodiodeBiscuitBoardProps,
} from "./rp2040-photodiode"

export const Rp2040PhotodiodeCrystalButtonsBiscuitBoard = (
  props: Rp2040PhotodiodeBiscuitBoardProps = {},
) => (
  <Rp2040PhotodiodeBiscuitBoardBase
    {...props}
    withCrystal
    withProgrammingButtons
  />
)

export default Rp2040PhotodiodeCrystalButtonsBiscuitBoard
