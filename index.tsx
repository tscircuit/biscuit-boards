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
export {
  BISCUIT_BOARD_LIGHTBURN_COPPER_MARGIN_MM,
  type BiscuitBoardLightburnArtifacts,
  type BiscuitBoardLightburnOptions,
  createBiscuitBoardLightburnArtifacts,
  prepareCircuitJsonForBiscuitBoardLightburn,
} from "./lib/biscuit-board-lightburn"
export {
  applyLightBurnLensDistortion,
  BISCUIT_BOARD_LENS_CALIBRATION,
  BISCUIT_BOARD_LENS_CALIBRATION_FIT,
  BISCUIT_BOARD_LENS_CALIBRATION_MATRIX,
  BISCUIT_BOARD_LENS_CALIBRATION_MODEL,
  createLensDistortedLightBurnProject,
  designToProjected,
  LENS_DISTORTION_MAX_SEGMENT_LENGTH_MM,
  type Point as LensDistortionPoint,
  projectedToDesign,
} from "./lib/lightburn-lens-distortion"

import { BiscuitBoard } from "./lib/BiscuitBoard"

export default () => <BiscuitBoard />
