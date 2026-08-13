import { BiscuitBoard, type BiscuitBoardProps } from "../lib/BiscuitBoard"
import { B3FS_1000P, FemalePinHeader2x4 } from "./stm32c071-display-parts"
import { S5B_PH_SM4_TB, STM32C071FBP6 } from "./stm32c071-parts"

const gnd = { displayName: "GND", schDisplayLabel: "GND" } as const
const v3v3 = { displayName: "3V3", schDisplayLabel: "3V3" } as const
const schSections = {
  mcu: "mcu",
  status: "status",
  debug: "debug",
  display: "display",
  controls: "controls",
} as const

export const Stm32c071DisplayBiscuitBoard = (
  props: Pick<BiscuitBoardProps, "autorouter" | "routingDisabled"> = {},
) => (
  <BiscuitBoard {...props} minTraceWidth={0.25}>
    <net name="V3V3" isPowerNet />

    <schematicsection name={schSections.mcu} displayName="STM32C071 MCU" />
    <schematicsection name={schSections.status} displayName="Status LEDs" />
    <schematicsection name={schSections.debug} displayName="SWD + Reset" />
    <schematicsection name={schSections.display} displayName="I2C Display" />
    <schematicsection name={schSections.controls} displayName="User Buttons" />

    <keepout
      shape="rect"
      pcbX={13}
      pcbY={-11.2}
      width="1.5mm"
      height="0.4mm"
      layers={["top"]}
    />
    <keepout
      shape="rect"
      pcbX={14.56}
      pcbY={-3}
      width="0.2mm"
      height="2.5mm"
      layers={["top"]}
    />

    <FemalePinHeader2x4
      name="J_DISPLAY"
      schSectionName={schSections.display}
      pcbX={5.86}
      pcbY={0.32}
      pcbRotation={90}
    />
    <resistor
      name="R_I2C_SCL"
      schSectionName={schSections.display}
      resistance="4.7k"
      footprint="0603"
      manufacturerPartNumber="GENERIC-0603-4K7"
      pcbX={-2.14}
      pcbY={-8.68}
      pcbRotation={90}
    />
    <resistor
      name="R_I2C_SDA"
      schSectionName={schSections.display}
      resistance="4.7k"
      footprint="0603"
      manufacturerPartNumber="GENERIC-0603-4K7"
      pcbX={-2.14}
      pcbY={10.32}
      pcbRotation={90}
    />

    <B3FS_1000P
      name="SW_BTN1"
      schSectionName={schSections.controls}
      pcbX={-30}
      pcbY={8}
    />
    <B3FS_1000P
      name="SW_BTN2"
      schSectionName={schSections.controls}
      pcbX={-30}
      pcbY={-8}
    />
    <resistor
      name="R_BTN1"
      schSectionName={schSections.controls}
      resistance="10k"
      footprint="0603"
      manufacturerPartNumber="GENERIC-0603-10K"
      pcbX={-22.5}
      pcbY={8}
    />
    <resistor
      name="R_BTN2"
      schSectionName={schSections.controls}
      resistance="10k"
      footprint="0603"
      manufacturerPartNumber="GENERIC-0603-10K"
      pcbX={-22.5}
      pcbY={-8}
    />

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
      pcbX={14}
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
      pcbX={29.5}
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
      pcbY={15}
    />
    <led
      name="D_PWR"
      schSectionName={schSections.status}
      color="green"
      footprint="0603"
      manufacturerPartNumber="GENERIC-0603-GREEN-LED"
      pcbX={8.5}
      pcbY={15}
    />
    <resistor
      name="R_USER_LED"
      schSectionName={schSections.status}
      resistance="1k"
      footprint="0603"
      manufacturerPartNumber="GENERIC-0603-1K"
      pcbX={22.5}
      pcbY={12}
    />
    <led
      name="D_USER"
      schSectionName={schSections.status}
      color="blue"
      footprint="0603"
      manufacturerPartNumber="GENERIC-0603-BLUE-LED"
      pcbX={26}
      pcbY={12}
    />

    <silkscreentext text="POWER" pcbX={6.75} pcbY={16.7} fontSize="0.8mm" />
    <silkscreentext text="PA8 USER" pcbX={24.75} pcbY={13.7} fontSize="0.8mm" />
    <silkscreentext text="SWD POWER" pcbX={22} pcbY={-16.7} fontSize="0.8mm" />
    <silkscreentext text="DISPLAY" pcbX={5.86} pcbY={6.52} fontSize="0.8mm" />
    <silkscreentext text="SDA" pcbX={3.06} pcbY={-3.49} fontSize="0.6mm" />
    <silkscreentext text="SCL" pcbX={3.06} pcbY={-0.95} fontSize="0.6mm" />
    <silkscreentext text="3V3" pcbX={3.06} pcbY={1.59} fontSize="0.6mm" />
    <silkscreentext text="GND" pcbX={3.06} pcbY={4.13} fontSize="0.6mm" />
    <silkscreentext text="BTN1" pcbX={-30} pcbY={12} fontSize="0.8mm" />
    <silkscreentext text="BTN2" pcbX={-30} pcbY={-12} fontSize="0.8mm" />

    <trace name="DISPLAY_GND" from=".J_DISPLAY > .GND" to="net.GND" {...gnd} />
    <trace
      name="DISPLAY_3V3"
      from=".J_DISPLAY > .V3V3"
      to="net.V3V3"
      {...v3v3}
    />
    <trace
      name="DISPLAY_SCL"
      from=".J_DISPLAY > .SCL"
      to=".U_MCU > .PA11"
      width="0.25mm"
      displayName="I2C2_SCL"
      schDisplayLabel="I2C2_SCL"
      pcbRouteHints={[
        { x: 8, y: 18 },
        { x: 12, y: 6 },
        { x: 14, y: 0 },
      ]}
    />
    <trace
      name="DISPLAY_SDA"
      from=".J_DISPLAY > .SDA"
      to=".U_MCU > .PA12"
      displayName="I2C2_SDA"
      schDisplayLabel="I2C2_SDA"
      pcbRouteHints={[
        { x: 10, y: 23 },
        { x: 29, y: 18 },
        { x: 31, y: 0 },
      ]}
    />
    <trace
      name="I2C_SCL_PULLUP_3V3"
      from=".R_I2C_SCL > .pin1"
      to="net.V3V3"
      {...v3v3}
    />
    <trace
      name="I2C_SCL_PULLUP_SIGNAL"
      from=".R_I2C_SCL > .pin2"
      to=".J_DISPLAY > .SCL"
      displayName="I2C2_SCL"
      schDisplayLabel="I2C2_SCL"
    />
    <trace
      name="I2C_SDA_PULLUP_3V3"
      from=".R_I2C_SDA > .pin1"
      to="net.V3V3"
      {...v3v3}
    />
    <trace
      name="I2C_SDA_PULLUP_SIGNAL"
      from=".R_I2C_SDA > .pin2"
      to=".J_DISPLAY > .SDA"
      displayName="I2C2_SDA"
      schDisplayLabel="I2C2_SDA"
    />

    <trace name="BTN1_PA0" from=".U_MCU > .PA0" to=".SW_BTN1 > .A" />
    <trace name="BTN1_GND" from=".SW_BTN1 > .B_ALT" to="net.GND" {...gnd} />
    <trace
      name="BTN1_PULLUP_3V3"
      from=".R_BTN1 > .pin1"
      to="net.V3V3"
      {...v3v3}
    />
    <trace
      name="BTN1_PULLUP_SIGNAL"
      from=".R_BTN1 > .pin2"
      to=".SW_BTN1 > .A"
    />
    <trace name="BTN2_PA1" from=".U_MCU > .PA1" to=".SW_BTN2 > .A" />
    <trace name="BTN2_GND" from=".SW_BTN2 > .B_ALT" to="net.GND" {...gnd} />
    <trace
      name="BTN2_PULLUP_3V3"
      from=".R_BTN2 > .pin1"
      to="net.V3V3"
      {...v3v3}
    />
    <trace
      name="BTN2_PULLUP_SIGNAL"
      from=".R_BTN2 > .pin2"
      to=".SW_BTN2 > .A"
    />

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

export default () => <Stm32c071DisplayBiscuitBoard />
