export {
  ARDUINO_SHIELD_CLAD_HEIGHT,
  ARDUINO_SHIELD_CLAD_VIA_CANDIDATE_ZONES,
  ARDUINO_SHIELD_CLAD_VIA_POSITIONS,
  ARDUINO_SHIELD_CLAD_WIDTH,
  ARDUINO_SHIELD_CONNECTOR_OFFSET_X,
  ARDUINO_SHIELD_HEADER_PITCH,
  ARDUINO_SHIELD_HEADER_PLACEMENTS,
  ARDUINO_SHIELD_HEADER_ROW_Y,
  ARDUINO_SHIELD_MOUNTING_HOLE_DIAMETER,
  ARDUINO_SHIELD_MOUNTING_HOLE_POSITIONS,
  ArduinoShieldAnalogHeader,
  ArduinoShieldClad,
  type ArduinoShieldCladProps,
  type ArduinoShieldCladViaPosition,
  ArduinoShieldDigital0To7Header,
  ArduinoShieldDigital8To13Header,
  ArduinoShieldIcspSocket,
  ArduinoShieldPowerHeader,
} from "./lib/ArduinoShieldClad"
export {
  BISCUIT_BOARD_HEIGHT,
  BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS,
  BISCUIT_BOARD_VIA_POSITIONS,
  BISCUIT_BOARD_VIA_ZONES,
  BISCUIT_BOARD_WIDTH,
  BiscuitBoard,
  type BiscuitBoardProps,
  type BiscuitBoardViaPosition,
} from "./lib/BiscuitBoard"
export {
  BOOSTERPACK_CLAD_HEIGHT,
  BOOSTERPACK_CLAD_VIA_CANDIDATE_ZONES,
  BOOSTERPACK_CLAD_VIA_EXCLUSION_ZONES,
  BOOSTERPACK_CLAD_VIA_POSITIONS,
  BOOSTERPACK_CLAD_WIDTH,
  BOOSTERPACK_HEADER_CENTER_X,
  BOOSTERPACK_HEADER_CENTER_Y,
  BOOSTERPACK_HEADER_PITCH,
  BoosterPackClad,
  type BoosterPackCladProps,
  type BoosterPackCladViaPosition,
  BoosterPackLeftHeader,
  BoosterPackRightHeader,
} from "./lib/BoosterPackClad"
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
export {
  XIAO_CLAD_HEIGHT,
  XIAO_CLAD_VIA_HOLE_DIAMETER,
  XIAO_CLAD_VIA_PAD_DIAMETER,
  XIAO_CLAD_VIA_POSITIONS,
  XIAO_CLAD_VIA_SPACING,
  XIAO_CLAD_WIDTH,
  XIAO_HEADER_HOLE_DIAMETER,
  XIAO_HEADER_PAD_DIAMETER,
  XIAO_HEADER_PITCH,
  XIAO_HEADER_POSITIONS,
  XIAO_HEADER_ROW_SPACING,
  XiaoClad,
  type XiaoCladProps,
  XiaoCladWithPinHeaders,
  type XiaoCladWithPinHeadersProps,
  XiaoPinHeaders,
} from "./lib/XiaoClad"

import { BiscuitBoard } from "./lib/BiscuitBoard"

export default () => <BiscuitBoard />
