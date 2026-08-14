import { XiaoClad, type XiaoCladProps } from "../lib/XiaoClad"
import { STM32C071FBP6 } from "./stm32c071-parts"
import { UsbCUsb2Module, XC6206P332MR } from "./xiao-stm32-usb-parts"

const gnd = { displayName: "GND", schDisplayLabel: "GND" } as const
const v5 = { displayName: "USB 5V", schDisplayLabel: "USB_5V" } as const
const v3v3 = { displayName: "3V3", schDisplayLabel: "3V3" } as const
const usbDp = { displayName: "USB D+", schDisplayLabel: "USB_DP" } as const
const usbDm = { displayName: "USB D-", schDisplayLabel: "USB_DM" } as const

export const XiaoStm32Usb = (
  props: Pick<
    XiaoCladProps,
    "autorouter" | "autorouterOptions" | "routingDisabled"
  > = {},
) => (
  <XiaoClad
    autorouterOptions={{
      gridPitch: 0.5,
      gridClearance: 0.11,
      maxBlockersPerSearch: 96,
      maxSearchStates: 400_000,
      ...props.autorouterOptions,
    }}
    {...props}
    minTraceWidth={0.15}
    nominalTraceWidth={0.2}
    showUsbLabel={false}
  >
    <net name="GND" isGroundNet />
    <net name="V5" isPowerNet />
    <net name="V3V3" isPowerNet />
    <net name="USB_DP" />
    <net name="USB_DM" />

    <UsbCUsb2Module name="J_USB" pcbX={0} pcbY={7.5} />

    <STM32C071FBP6
      name="U_MCU"
      pcbX={0}
      pcbY={-2}
      noConnect={[
        "PB7",
        "OSCX_IN",
        "OSCX_OUT",
        "NRST",
        "PA0",
        "PA1",
        "PA2",
        "PA3",
        "PA4",
        "PA5",
        "PA6",
        "PA7",
        "PA8",
        "SWDIO",
        "SWCLK",
        "PB3",
      ]}
    />

    <XC6206P332MR name="U_LDO" pcbX={0} pcbY={-8} pcbRotation={90} />

    <resistor
      name="R_CC1"
      resistance="5.1k"
      footprint="0603"
      pcbX={-4}
      pcbY={2.8}
      pcbRotation={90}
    />
    <resistor
      name="R_CC2"
      resistance="5.1k"
      footprint="0603"
      pcbX={4}
      pcbY={2.8}
      pcbRotation={90}
    />

    <capacitor
      name="C_VIN"
      capacitance="1uF"
      footprint="0603"
      pcbX={-3.2}
      pcbY={-8.5}
    />
    <capacitor
      name="C_VOUT"
      capacitance="1uF"
      footprint="0603"
      pcbX={3.2}
      pcbY={-8.5}
    />
    <capacitor
      name="C_MCU"
      capacitance="100nF"
      footprint="0603"
      pcbX={0}
      pcbY={0}
      layer="bottom"
    />

    <trace name="USB_GND" from=".J_USB > .GND" to="net.GND" {...gnd} />
    <trace name="USB_VBUS" from=".J_USB > .VBUS" to="net.V5" {...v5} />
    <trace name="USB_CC1" from=".J_USB > .CC1" to=".R_CC1 > .pin1" />
    <trace name="CC1_GND" from=".R_CC1 > .pin2" to="net.GND" {...gnd} />
    <trace name="USB_CC2" from=".J_USB > .CC2" to=".R_CC2 > .pin1" />
    <trace name="CC2_GND" from=".R_CC2 > .pin2" to="net.GND" {...gnd} />
    <trace
      name="USB_DP_CONNECTOR"
      from=".J_USB > .USB_DP"
      to="net.USB_DP"
      {...usbDp}
    />
    <trace
      name="USB_DP_MCU"
      from=".U_MCU > .USB_DP"
      to="net.USB_DP"
      {...usbDp}
    />
    <trace
      name="USB_DM_CONNECTOR"
      from=".J_USB > .USB_DM"
      to="net.USB_DM"
      {...usbDm}
    />
    <trace
      name="USB_DM_MCU"
      from=".U_MCU > .USB_DM"
      to="net.USB_DM"
      {...usbDm}
    />

    <trace name="LDO_VIN" from=".U_LDO > .VIN" to="net.V5" {...v5} />
    <trace name="LDO_VOUT" from=".U_LDO > .VOUT" to="net.V3V3" {...v3v3} />
    <trace name="LDO_GND" from=".U_LDO > .GND" to="net.GND" {...gnd} />
    <trace name="C_VIN_V5" from=".C_VIN > .pin1" to="net.V5" {...v5} />
    <trace name="C_VIN_GND" from=".C_VIN > .pin2" to="net.GND" {...gnd} />
    <trace name="C_VOUT_3V3" from=".C_VOUT > .pin1" to="net.V3V3" {...v3v3} />
    <trace name="C_VOUT_GND" from=".C_VOUT > .pin2" to="net.GND" {...gnd} />
    <trace name="C_MCU_3V3" from=".C_MCU > .pin1" to="net.V3V3" {...v3v3} />
    <trace name="C_MCU_GND" from=".C_MCU > .pin2" to="net.GND" {...gnd} />
    <trace name="MCU_3V3" from=".U_MCU > .VDD_VDDA" to="net.V3V3" {...v3v3} />
    <trace name="MCU_GND" from=".U_MCU > .VSS_VSSA" to="net.GND" {...gnd} />
  </XiaoClad>
)

export default XiaoStm32Usb
