import { BiscuitBoard, type BiscuitBoardProps } from "../lib/BiscuitBoard"
import { S5B_PH_SM4_TB, STM32C071FBP6 } from "./stm32c071-parts"

const gnd = { displayName: "GND", schDisplayLabel: "GND" } as const
const v3v3 = { displayName: "3V3", schDisplayLabel: "3V3" } as const

const schSections = {
  mcu: "mcu",
  debug: "debug",
  photodiode: "photodiode",
} as const

const To18PhotodiodeFootprint = () => (
  <footprint insertionDirection="from_above">
    <smtpad
      portHints={["pin1", "anode"]}
      shape="rect"
      width="1.2mm"
      height="1.2mm"
      pcbX={0}
      pcbY={0}
    />
    <smtpad
      portHints={["pin2", "cathode"]}
      shape="rect"
      width="1.2mm"
      height="1.2mm"
      pcbX={2.54}
      pcbY={0}
    />
    <silkscreencircle pcbX={1.27} pcbY={0} radius="2.4mm" />
    <courtyardcircle pcbX={1.27} pcbY={0} radius="2.55mm" />
  </footprint>
)

export type Stm32PhotodiodeBiscuitBoardProps = Pick<
  BiscuitBoardProps,
  | "autorouter"
  | "autorouterOptions"
  | "minTraceWidth"
  | "nominalTraceWidth"
  | "routingDisabled"
>

/** Reusable STM32C071 photodiode transimpedance-amplifier circuit. */
export const Stm32PhotodiodeCircuit = ({
  swdPcbX = 22,
}: {
  swdPcbX?: number
} = {}) => (
  <>
    <net name="V3V3" isPowerNet />

    <schematicsection name={schSections.mcu} displayName="STM32C071 MCU" />
    <schematicsection name={schSections.debug} displayName="SWD + Reset" />
    <schematicsection
      name={schSections.photodiode}
      displayName="Photodiode TIA"
    />

    <S5B_PH_SM4_TB
      name="J_SWD"
      schSectionName={schSections.debug}
      pcbX={swdPcbX}
      pcbY={-21.5}
      pcbRotation={180}
    />

    <STM32C071FBP6
      name="U_MCU"
      schSectionName={schSections.mcu}
      pcbX={18.07107482079018}
      pcbY={-1.2793467742231641}
      pcbRotation={270}
      noConnect={[
        "PB7",
        "PC14",
        "PC15",
        "PA1",
        "PA2",
        "PA3",
        "PA4",
        "PA5",
        "PA6",
        "PA7",
        "PA8",
        "PA11",
        "PA12",
        "PB3",
      ]}
    />

    <capacitor
      name="C_MCU"
      schSectionName={schSections.mcu}
      capacitance="100nF"
      footprint="0805"
      manufacturerPartNumber="CL21B104KBCNNNC"
      supplierPartNumbers={{ digikey: ["1276-1003-1-ND"] }}
      pcbX={10.438830197084897}
      pcbY={0.5735510752589406}
      pcbRotation={90}
    />
    <capacitor
      name="C_NRST"
      schSectionName={schSections.debug}
      capacitance="100nF"
      footprint="0805"
      manufacturerPartNumber="CL21B104KBCNNNC"
      supplierPartNumbers={{ digikey: ["1276-1003-1-ND"] }}
      pcbX={14.274394265285636}
      pcbY={5.92892517920982}
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

    <diode
      name="D_PHOTO"
      schSectionName={schSections.photodiode}
      photo
      manufacturerPartNumber="Generic TO-18 photodiode"
      footprint={<To18PhotodiodeFootprint />}
      pcbX={-15.640764174731324}
      pcbY={20.309666546592453}
      pcbRotation={90}
    />
    <opamp
      name="U_TIA"
      schSectionName={schSections.photodiode}
      manufacturerPartNumber="IC OPAMP GP 1 CIRCUIT SOT-23-5"
      footprint="sot23_5"
      pcbX={4.911044226035074}
      pcbY={5.133467863543082}
      pcbRotation={90}
    />
    <resistor
      name="R_TIA"
      schSectionName={schSections.photodiode}
      resistance="100k"
      footprint="0603"
      pcbX={6.677740534951354}
      pcbY={19.17774053495135}
    />
    <capacitor
      name="C_TIA"
      schSectionName={schSections.photodiode}
      capacitance="15pF"
      footprint="0603"
      pcbX={6.588853166177827}
      pcbY={14.855549475094097}
    />
    <resistor
      name="R_BIAS_TOP"
      schSectionName={schSections.photodiode}
      resistance="100k"
      footprint="0603"
      pcbX={-3.7555426345749616}
      pcbY={11}
      pcbRotation={90}
    />
    <resistor
      name="R_BIAS_BOTTOM"
      schSectionName={schSections.photodiode}
      resistance="100k"
      footprint="0603"
      pcbX={-7.155535794055819}
      pcbY={10.95555631561324}
      pcbRotation={90}
    />
    <capacitor
      name="C_BIAS"
      schSectionName={schSections.photodiode}
      capacitance="100nF"
      footprint="0603"
      pcbX={-11.755508431979262}
      pcbY={11.133331053160287}
      pcbRotation={90}
    />

    <silkscreentext text="LIGHT" pcbX={-7} pcbY={21.5} fontSize="1mm" />
    <silkscreentext text="SWD" pcbX={swdPcbX} pcbY={-16.7} fontSize="0.8mm" />

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

    <trace name="PHOTO_GND" from=".D_PHOTO > .anode" to="net.GND" {...gnd} />
    <trace name="PHOTO_SUM" from=".D_PHOTO > .cathode" to="net.PD_SUM" />
    <trace name="TIA_SUM" from=".U_TIA > .inverting_input" to="net.PD_SUM" />
    <trace
      name="TIA_BIAS"
      from=".U_TIA > .non_inverting_input"
      to="net.PD_BIAS"
    />
    <trace name="TIA_OUTPUT" from=".U_TIA > .output" to="net.PD_ADC" />
    <trace
      name="TIA_3V3"
      from=".U_TIA > .positive_supply"
      to="net.V3V3"
      {...v3v3}
    />
    <trace
      name="TIA_GND"
      from=".U_TIA > .negative_supply"
      to="net.GND"
      {...gnd}
    />
    <trace name="RTIA_OUTPUT" from=".R_TIA > .pin1" to="net.PD_ADC" />
    <trace name="RTIA_SUM" from=".R_TIA > .pin2" to="net.PD_SUM" />
    <trace name="CTIA_OUTPUT" from=".C_TIA > .pin1" to="net.PD_ADC" />
    <trace name="CTIA_SUM" from=".C_TIA > .pin2" to="net.PD_SUM" />
    <trace
      name="BIAS_TOP_3V3"
      from=".R_BIAS_TOP > .pin1"
      to="net.V3V3"
      {...v3v3}
    />
    <trace name="BIAS_TOP_OUT" from=".R_BIAS_TOP > .pin2" to="net.PD_BIAS" />
    <trace
      name="BIAS_BOTTOM_IN"
      from=".R_BIAS_BOTTOM > .pin1"
      to="net.PD_BIAS"
    />
    <trace
      name="BIAS_BOTTOM_GND"
      from=".R_BIAS_BOTTOM > .pin2"
      to="net.GND"
      {...gnd}
    />
    <trace name="CBIAS_IN" from=".C_BIAS > .pin1" to="net.PD_BIAS" />
    <trace name="CBIAS_GND" from=".C_BIAS > .pin2" to="net.GND" {...gnd} />
    <trace name="ADC_PA0" from="net.PD_ADC" to=".U_MCU > .PA0" />
  </>
)

/** STM32C071 photodiode transimpedance amplifier on the original BiscuitBoard. */
export const Stm32PhotodiodeBiscuitBoard = (
  props: Stm32PhotodiodeBiscuitBoardProps = {},
) => (
  <BiscuitBoard {...props}>
    <Stm32PhotodiodeCircuit />
  </BiscuitBoard>
)

export default () => <Stm32PhotodiodeBiscuitBoard />
