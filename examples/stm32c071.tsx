import {
  BiscuitBoard,
  type BiscuitBoardProps,
} from "../lib/BiscuitBoard"
import { S5B_PH_SM4_TB, STM32C071FBP6 } from "./stm32c071-parts"

const gnd = { displayName: "GND", schDisplayLabel: "GND" } as const
const v3v3 = { displayName: "3V3", schDisplayLabel: "3V3" } as const
const schSections = {
  mcu: "mcu",
  status: "status",
  debug: "debug",
} as const

export const Stm32c071BiscuitBoard = (
  props: Pick<BiscuitBoardProps, "autorouter" | "routingDisabled"> = {},
) => (
  <BiscuitBoard {...props}>
    <net name="V3V3" isPowerNet />

    <schematicsection name={schSections.mcu} displayName="STM32C071 MCU" />
    <schematicsection name={schSections.status} displayName="Status LEDs" />
    <schematicsection name={schSections.debug} displayName="SWD + Reset" />

    <S5B_PH_SM4_TB
      name="J_SWD"
      schSectionName={schSections.debug}
      pcbX={22}
      pcbY={-21.5}
      pcbRotation={180}
    />

    <STM32C071FBP6
      name="U_MCU"
      schSectionName={schSections.mcu}
      pcbX={18}
      pcbY={0}
      pcbRotation={270}
    />

    <capacitor
      name="C_MCU"
      schSectionName={schSections.mcu}
      capacitance="100nF"
      footprint="0805"
      manufacturerPartNumber="CL21B104KBCNNNC"
      supplierPartNumbers={{ digikey: ["1276-1003-1-ND"] }}
      pcbX={12.5}
      pcbY={1}
      pcbRotation={90}
    />
    <capacitor
      name="C_NRST"
      schSectionName={schSections.debug}
      capacitance="100nF"
      footprint="0805"
      manufacturerPartNumber="CL21B104KBCNNNC"
      supplierPartNumbers={{ digikey: ["1276-1003-1-ND"] }}
      pcbX={12}
      pcbY={6}
      pcbRotation={90}
    />
    <capacitor
      name="C_BULK"
      schSectionName={schSections.debug}
      capacitance="4.7uF"
      footprint="0805"
      manufacturerPartNumber="CL21A475KQFNNNE"
      supplierPartNumbers={{ digikey: ["1276-1065-1-ND"] }}
      pcbX={28}
      pcbY={-13.5}
      pcbRotation={90}
    />

    <resistor
      name="R_PWR_LED"
      schSectionName={schSections.status}
      resistance="1k"
      footprint="0603"
      manufacturerPartNumber="GENERIC-0603-1K"
      pcbX={5}
      pcbY={7.5}
    />
    <led
      name="D_PWR"
      schSectionName={schSections.status}
      color="green"
      footprint="0603"
      manufacturerPartNumber="GENERIC-0603-GREEN-LED"
      pcbX={8.5}
      pcbY={7.5}
    />
    <resistor
      name="R_USER_LED"
      schSectionName={schSections.status}
      resistance="1k"
      footprint="0603"
      manufacturerPartNumber="GENERIC-0603-1K"
      pcbX={22.5}
      pcbY={8}
    />
    <led
      name="D_USER"
      schSectionName={schSections.status}
      color="blue"
      footprint="0603"
      manufacturerPartNumber="GENERIC-0603-BLUE-LED"
      pcbX={26}
      pcbY={8}
    />

    <silkscreentext text="POWER" pcbX={6.75} pcbY={9.2} fontSize="0.8mm" />
    <silkscreentext text="PA8 USER" pcbX={24.75} pcbY={9.7} fontSize="0.8mm" />
    <silkscreentext text="SWD" pcbX={22} pcbY={-16.7} fontSize="0.8mm" />

    <trace name="MCU_3V3" from=".U_MCU > .VDD_VDDA" to="net.V3V3" {...v3v3} />
    <trace name="MCU_GND" from=".U_MCU > .VSS_VSSA" to="net.GND" {...gnd} />
    <trace name="CMCU_3V3" from=".C_MCU > .pin1" to="net.V3V3" {...v3v3} />
    <trace name="CMCU_GND" from=".C_MCU > .pin2" to="net.GND" {...gnd} />
    <trace name="NRST_FILTER" from=".U_MCU > .NRST" to=".C_NRST > .pin1" />
    <trace name="CNRST_GND" from=".C_NRST > .pin2" to="net.GND" {...gnd} />
    <trace name="CBULK_3V3" from=".C_BULK > .pin1" to="net.V3V3" {...v3v3} />
    <trace name="CBULK_GND" from=".C_BULK > .pin2" to="net.GND" {...gnd} />

    <trace name="SWD_3V3" from=".J_SWD > .V3V3" to="net.V3V3" {...v3v3} />
    <trace name="SWD_GND" from=".J_SWD > .GND" to="net.GND" {...gnd} />
    <trace name="SWDIO" from=".J_SWD > .SWDIO" to=".U_MCU > .SWDIO" />
    <trace name="SWCLK" from=".J_SWD > .SWCLK" to=".U_MCU > .SWCLK" />
    <trace name="SWD_NRST" from=".J_SWD > .NRST" to=".U_MCU > .NRST" />

    <trace
      name="PWR_LED_3V3"
      from="net.V3V3"
      to=".R_PWR_LED > .pin1"
      {...v3v3}
    />
    <trace
      name="PWR_LED_ANODE"
      from=".R_PWR_LED > .pin2"
      to=".D_PWR > .anode"
    />
    <trace name="PWR_LED_GND" from=".D_PWR > .cathode" to="net.GND" {...gnd} />
    <trace name="USER_LED_PA8" from=".U_MCU > .PA8" to=".R_USER_LED > .pin1" />
    <trace
      name="USER_LED_ANODE"
      from=".R_USER_LED > .pin2"
      to=".D_USER > .anode"
    />
    <trace
      name="USER_LED_GND"
      from=".D_USER > .cathode"
      to="net.GND"
      {...gnd}
    />
  </BiscuitBoard>
)

export default () => <Stm32c071BiscuitBoard />
