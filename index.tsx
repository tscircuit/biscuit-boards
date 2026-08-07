export {
  BISCUIT_BOARD_HEIGHT,
  BISCUIT_BOARD_VIA_POSITIONS,
  BISCUIT_BOARD_VIA_ZONES,
  BISCUIT_BOARD_WIDTH,
  BiscuitBoard,
  type BiscuitBoardProps,
  type BiscuitBoardViaPosition,
} from "./lib/BiscuitBoard"
export {
  BiscuitBoardAutorouter,
  type BiscuitBoardAutorouterOptions,
  createBiscuitBoardAutorouter,
} from "./lib/biscuit-board-autorouter"

import { BiscuitBoard } from "./lib/BiscuitBoard"

export default () => <BiscuitBoard />
