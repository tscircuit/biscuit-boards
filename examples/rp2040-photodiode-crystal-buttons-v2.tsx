import {
  BiscuitBoardV2,
  type BiscuitBoardV2Props,
} from "../lib/biscuit-board-v2"
import { Rp2040PhotodiodeCircuit } from "./rp2040-photodiode-crystal-buttons"

/** Component placements captured from the V2 board editor. */
export const RP2040_PHOTODIODE_V2_COMPONENT_POSITIONS = {
  U_FLASH: { x: -17.75805766376172, y: -5.032680107911011 },
  C_FLASH: { x: -12.946403247612494, y: -10.915562527334988 },
  U1: { x: -0.04605006273958345, y: -0.016417789522801485 },
  R_USB_DM: { x: -6.740650040345772, y: 2.706760553920792 },
  R_USB_DP: { x: -6.74065004034577, y: 0.30676055392078816 },
  C_V1V1: { x: 3.9269279568355984, y: 8.120568871221263 },
  SW_BOOTSEL: { x: -13.59045502580641, y: 12.873052438917128 },
  SW_RESET: { x: -0.05456382542741167, y: 12.879091710119223 },
  Y1: { x: 10.123153678437767, y: -2.305694739492857 },
  C_XIN: { x: 9, y: -5.3 },
  C_XOUT: { x: 13, y: -2.3 },
  U_TIA: { x: 7.867697023352781, y: -16.22067887977604 },
  D_PHOTO: { x: 34.70565200029039, y: -10.55770669135537 },
  R_CC1: { x: -13.96723941743606, y: 18.24002671072203 },
  C_REG_IN: { x: -7.5942590555176, y: 18.196559433726073 },
} as const

const usbGroundBreakoutKeepClear = {
  obstacleId: "rp2040-v2-usb-ground-breakout",
  type: "rect" as const,
  layers: ["top"],
  center: { x: -29.7875, y: 4.0875 },
  width: Math.hypot(2.175, 1.775) + 0.35,
  height: 0.35,
  ccwRotationDegrees: (Math.atan2(-1.775, -2.175) * 180) / Math.PI,
  connectedTo: ["USB_GND_BREAKOUT"],
}

export type Rp2040PhotodiodeBiscuitBoardV2Props = Pick<
  BiscuitBoardV2Props,
  | "autorouter"
  | "autorouterOptions"
  | "minTraceWidth"
  | "minTraceToPadEdgeClearance"
  | "nominalTraceWidth"
  | "routingDisabled"
>

/** RP2040 photodiode, crystal, and programming-button circuit on BiscuitBoard V2. */
export const Rp2040PhotodiodeCrystalButtonsBiscuitBoardV2 = (
  props: Rp2040PhotodiodeBiscuitBoardV2Props = {},
) => (
  <BiscuitBoardV2
    minTraceWidth={0.1}
    minTraceToPadEdgeClearance={0.075}
    nominalTraceWidth={0.15}
    reservedAutorouterObstacles={[usbGroundBreakoutKeepClear]}
    autorouterEdgeClearance={0.7}
    autorouterOptions={{
      gridClearance: 0.1,
      expandTraces: true,
      maxBlockersPerSearch: 16_384,
      maxRipsPerRoute: 1_000,
      maxTotalRips: 10_000,
      maxSearchStates: 2_000_000,
      routeOrder: "adaptive",
    }}
    {...props}
  >
    <Rp2040PhotodiodeCircuit
      withCrystal
      withProgrammingButtons
      userLedXOffset={4}
      placements={RP2040_PHOTODIODE_V2_COMPONENT_POSITIONS}
    />
  </BiscuitBoardV2>
)

export default Rp2040PhotodiodeCrystalButtonsBiscuitBoardV2
