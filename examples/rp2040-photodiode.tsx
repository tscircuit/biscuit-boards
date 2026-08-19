import type { ChipProps, ConnectorProps } from "@tscircuit/props"
import { BiscuitBoard, type BiscuitBoardProps } from "../lib/BiscuitBoard"

const rp2040Pins = {
  pin1: ["IOVDD6"],
  pin2: ["GPIO0"],
  pin3: ["GPIO1"],
  pin4: ["GPIO2"],
  pin5: ["GPIO3"],
  pin6: ["GPIO4"],
  pin7: ["GPIO5"],
  pin8: ["GPIO6"],
  pin9: ["GPIO7"],
  pin10: ["IOVDD5"],
  pin11: ["GPIO8"],
  pin12: ["GPIO9"],
  pin13: ["GPIO10"],
  pin14: ["GPIO11"],
  pin15: ["GPIO12"],
  pin16: ["GPIO13"],
  pin17: ["GPIO14"],
  pin18: ["GPIO15"],
  pin19: ["TESTEN"],
  pin20: ["XIN"],
  pin21: ["XOUT"],
  pin22: ["IOVDD4"],
  pin23: ["DVDD2"],
  pin24: ["SWCLK"],
  pin25: ["SWD"],
  pin26: ["RUN"],
  pin27: ["GPIO16"],
  pin28: ["GPIO17"],
  pin29: ["GPIO18"],
  pin30: ["GPIO19"],
  pin31: ["GPIO20"],
  pin32: ["GPIO21"],
  pin33: ["IOVDD3"],
  pin34: ["GPIO22"],
  pin35: ["GPIO23"],
  pin36: ["GPIO24"],
  pin37: ["GPIO25"],
  pin38: ["GPIO26_ADC0"],
  pin39: ["GPIO27_ADC1"],
  pin40: ["GPIO28_ADC2"],
  pin41: ["GPIO29_ADC3"],
  pin42: ["IOVDD2"],
  pin43: ["ADC_AVDD"],
  pin44: ["VREG_IN"],
  pin45: ["VREG_VOUT"],
  pin46: ["USB_DM"],
  pin47: ["USB_DP"],
  pin48: ["USB_VDD"],
  pin49: ["IOVDD1"],
  pin50: ["DVDD1"],
  pin51: ["QSPI_SD3"],
  pin52: ["QSPI_SCLK"],
  pin53: ["QSPI_SD0"],
  pin54: ["QSPI_SD2"],
  pin55: ["QSPI_SD1"],
  pin56: ["QSPI_SS"],
  pin57: ["GND", "thermalpad"],
} as const

const Rp2040 = (props: ChipProps<typeof rp2040Pins>) => (
  <chip
    pinLabels={rp2040Pins}
    manufacturerPartNumber="RP2040"
    supplierPartNumbers={{ jlcpcb: ["C2040"] }}
    footprint="qfn56_thermalpad3.1mmx3.1mm_p0.4001mm_w7.8999mm_h7.9001mm_pw0.2mm_pl0.85mm"
    {...props}
  />
)

const usbPins = {
  pin13: ["SHIELD1"],
  pin14: ["SHIELD2"],
  pin15: ["SHIELD3"],
  pin16: ["SHIELD4"],
  pin17: ["GND_A"],
  pin18: ["VBUS_A"],
  pin19: ["SBU2"],
  pin20: ["CC1"],
  pin21: ["DN_B"],
  pin22: ["DP_A"],
  pin23: ["DN_A"],
  pin24: ["DP_B"],
  pin25: ["SBU1"],
  pin26: ["CC2"],
  pin27: ["VBUS_B"],
  pin28: ["GND_B"],
} as const

const SmdUsbC = (props: ConnectorProps) => (
  <connector
    pinLabels={usbPins}
    standard="usb_c"
    manufacturerPartNumber="TYPE_C_16PIN_2MD_073_"
    supplierPartNumbers={{ jlcpcb: ["C2765186"] }}
    footprint="usbcmidmount16_pinstart13"
    {...props}
  />
)

// Local, deterministic rendering of KiCad's Package_TO_SOT_THT/TO-18-2:
// 2.54 mm lead pitch, 0.7 mm drills, and the original 1.6 x 1.2 / 1.2 mm pads.
const To18_2Footprint = () => (
  <footprint insertionDirection="from_above">
    <platedhole
      portHints={["pin1", "anode"]}
      shape="circular_hole_with_rect_pad"
      holeDiameter="0.7mm"
      rectPadWidth="1.6mm"
      rectPadHeight="1.2mm"
      pcbX={0}
      pcbY={0}
    />
    <platedhole
      portHints={["pin2", "cathode"]}
      shape="circle"
      holeDiameter="0.7mm"
      outerDiameter="1.2mm"
      pcbX={2.54}
      pcbY={0}
    />
    <silkscreencircle pcbX={1.27} pcbY={0} radius="2.4mm" />
    <courtyardcircle pcbX={1.27} pcbY={0} radius="2.55mm" />
  </footprint>
)

const PhotodiodeTransimpedanceAmplifier = () => (
  <>
    <diode
      name="D_PHOTO"
      photo
      manufacturerPartNumber="Generic TO-18 photodiode"
      footprint={<To18_2Footprint />}
      pcbX={25}
      pcbY={-16}
      pcbRotation={90}
      connections={{ anode: "net.GND", cathode: "net.PD_SUM" }}
    />

    <opamp
      name="U_TIA"
      manufacturerPartNumber="IC OPAMP GP 1 CIRCUIT SOT-23-5"
      footprint="sot23_5"
      pcbX={7}
      pcbY={-16}
      pcbRotation={90}
      connections={{
        inverting_input: "net.PD_SUM",
        non_inverting_input: "net.PD_BIAS",
        output: "net.PD_ADC",
        positive_supply: "net.V3V3",
        negative_supply: "net.GND",
      }}
    />

    <resistor
      name="R_TIA"
      resistance="100k"
      footprint="0603"
      pcbX={14}
      pcbY={-16}
      connections={{ pin1: "net.PD_SUM", pin2: "net.PD_ADC" }}
    />
    <capacitor
      name="C_TIA"
      capacitance="15pF"
      footprint="0603"
      pcbX={14}
      pcbY={-23}
      connections={{ pin1: "net.PD_SUM", pin2: "net.PD_ADC" }}
    />

    <resistor
      name="R_BIAS_TOP"
      resistance="100k"
      footprint="0603"
      pcbX={7}
      pcbY={-6}
      pcbRotation={90}
      connections={{ pin1: "net.V3V3", pin2: "net.PD_BIAS" }}
    />
    <resistor
      name="R_BIAS_BOTTOM"
      resistance="100k"
      footprint="0603"
      pcbX={12}
      pcbY={-6}
      pcbRotation={90}
      connections={{ pin1: "net.PD_BIAS", pin2: "net.GND" }}
    />
    <capacitor
      name="C_BIAS"
      capacitance="100nF"
      footprint="0603"
      pcbX={17}
      pcbY={-6}
      pcbRotation={90}
      connections={{ pin1: "net.PD_BIAS", pin2: "net.GND" }}
    />

    <silkscreentext
      text="LIGHT"
      fontSize="1mm"
      pcbX={25}
      pcbY={-20}
      layer="top"
    />
  </>
)

const Rp2040UsbSupport = () => (
  <>
    {/* With no precision clock, USB is intentionally power-only. */}
    <SmdUsbC
      name="J_USB"
      pcbX={-33}
      pcbY={0}
      pcbRotation={270}
      noConnect={[
        "SHIELD1",
        "SHIELD2",
        "SHIELD3",
        "SHIELD4",
        "SBU1",
        "SBU2",
        "GND_B",
        "VBUS_B",
        "DP_A",
        "DP_B",
        "DN_A",
        "DN_B",
      ]}
      connections={{
        VBUS_A: "net.VBUS",
        CC1: "net.CC1",
        CC2: "net.CC2",
      }}
    />
    <resistor
      name="R_CC1"
      resistance="5.1k"
      footprint="0603"
      pcbX={-15}
      pcbY={17}
      connections={{ pin1: "net.CC1" }}
    />
    <trace
      name="USB_GND_BREAKOUT"
      from=".R_USB_GND > .pin1"
      to=".J_USB > .GND_A"
      thickness="0.1mm"
      pcbPathRelativeTo=".R_USB_GND > .pin1"
      pcbPath={[".R_USB_GND > .pin1", { x: 0, y: -3.8 }, ".J_USB > .GND_A"]}
    />
    <trace
      name="USB_CC1_GND_TO_INPUT_CAP"
      from=".R_CC1 > .pin2"
      to=".C_REG_IN > .pin2"
      thickness="0.1mm"
      pcbPath={[".R_CC1 > .pin2", ".C_REG_IN > .pin2"]}
    />
    <resistor
      name="R_USB_GND"
      resistance="0"
      footprint="0603"
      pcbX={-29}
      pcbY={7}
      connections={{ pin2: "net.GND" }}
    />
    <resistor
      name="R_CC2"
      resistance="5.1k"
      footprint="0603"
      pcbX={-16}
      pcbY={-17}
      connections={{ pin1: "net.CC2" }}
    />
    <chip
      name="U_REG"
      pinLabels={{
        pin1: ["VIN"],
        pin2: ["GND"],
        pin3: ["EN"],
        pin4: ["NC"],
        pin5: ["VOUT"],
      }}
      noConnect={["NC"]}
      manufacturerPartNumber="AP2112K-3.3"
      footprint="sot23_5"
      pcbX={-25}
      pcbY={10}
      pcbRotation={180}
      connections={{
        VIN: "net.VBUS",
        EN: "net.VBUS",
        GND: "net.GND",
        VOUT: "net.V3V3",
      }}
    />
    <capacitor
      name="C_REG_IN"
      capacitance="1uF"
      footprint="0603"
      pcbX={-5}
      pcbY={17}
      pcbRotation={180}
      connections={{ pin1: "net.VBUS", pin2: "net.GND" }}
    />
    <capacitor
      name="C_REG_OUT"
      capacitance="10uF"
      footprint="0805"
      pcbX={-5}
      pcbY={-17}
      pcbRotation={180}
      connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
    />
    <trace
      name="USB_CC2_GND_TO_OUTPUT_CAP"
      from=".R_CC2 > .pin2"
      to=".C_REG_OUT > .pin2"
      thickness="0.1mm"
      pcbPath={[".R_CC2 > .pin2", ".C_REG_OUT > .pin2"]}
    />

    <Rp2040
      name="U1"
      pcbX={12}
      pcbY={2}
      pcbRotation={90}
      noConnect={[
        "XIN",
        "XOUT",
        "USB_DM",
        "USB_DP",
        "SWCLK",
        "SWD",
        "QSPI_SS",
        "QSPI_SCLK",
        "QSPI_SD0",
        "QSPI_SD1",
        "QSPI_SD2",
        "QSPI_SD3",
      ]}
      connections={{
        IOVDD1: "net.V3V3",
        IOVDD2: "net.V3V3",
        IOVDD3: "net.V3V3",
        IOVDD4: "net.V3V3",
        IOVDD5: "net.V3V3",
        IOVDD6: "net.V3V3",
        DVDD1: "net.V1V1",
        DVDD2: "net.V1V1",
        VREG_IN: "net.V3V3",
        VREG_VOUT: "net.V1V1",
        ADC_AVDD: "net.V3V3",
        USB_VDD: "net.V3V3",
        TESTEN: "net.GND",
        GND: "net.GND",
        RUN: "net.RUN",
        GPIO26_ADC0: "net.PD_ADC",
      }}
    />
    <resistor
      name="R_RUN"
      resistance="10k"
      footprint="0603"
      pcbX={8}
      pcbY={11}
      connections={{ pin1: "net.RUN", pin2: "net.V3V3" }}
    />
    <capacitor
      name="C_3V3_A"
      capacitance="100nF"
      footprint="0603"
      pcbX={20}
      pcbY={11}
      connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
    />
    <capacitor
      name="C_V1V1"
      capacitance="1uF"
      footprint="0603"
      pcbX={13}
      pcbY={11}
      connections={{ pin1: "net.V1V1", pin2: "net.GND" }}
    />
  </>
)

export const Rp2040PhotodiodeBiscuitBoard = (
  props: Pick<
    BiscuitBoardProps,
    | "autorouter"
    | "autorouterOptions"
    | "minTraceWidth"
    | "nominalTraceWidth"
    | "routingDisabled"
  > = {},
) => (
  <BiscuitBoard
    {...props}
    minTraceWidth={props.minTraceWidth ?? 0.1}
    nominalTraceWidth={props.nominalTraceWidth ?? 0.15}
    autorouterOptions={{
      gridClearance: 0.1,
      expandTraces: true,
      maxBlockersPerSearch: 256,
      maxRipsPerRoute: 1_000,
      maxTotalRips: 10_000,
      maxSearchStates: 2_000_000,
      routeOrder: "signal_longest_first",
      ...props.autorouterOptions,
    }}
  >
    <Rp2040UsbSupport />
    <PhotodiodeTransimpedanceAmplifier />
  </BiscuitBoard>
)

export default Rp2040PhotodiodeBiscuitBoard
