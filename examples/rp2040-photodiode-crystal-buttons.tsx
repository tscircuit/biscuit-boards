import type {
  ChipProps,
  ConnectorProps,
  PushButtonProps,
} from "@tscircuit/props"
import { Fragment } from "react"
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

const buttonPins = {
  pin1: ["A"],
  pin2: ["A_ALT"],
  pin3: ["B"],
  pin4: ["B_ALT"],
} as const

const Kmr2Footprint = () => (
  <footprint>
    <smtpad
      portHints={["pin1"]}
      shape="rect"
      width="1.2mm"
      height="0.8mm"
      pcbX={-1.9}
      pcbY={-1.1}
    />
    <smtpad
      portHints={["pin2"]}
      shape="rect"
      width="1.2mm"
      height="0.8mm"
      pcbX={1.9}
      pcbY={-1.1}
    />
    <smtpad
      portHints={["pin3"]}
      shape="rect"
      width="1.2mm"
      height="0.8mm"
      pcbX={-1.9}
      pcbY={1.1}
    />
    <smtpad
      portHints={["pin4"]}
      shape="rect"
      width="1.2mm"
      height="0.8mm"
      pcbX={1.9}
      pcbY={1.1}
    />
    <silkscreenrect width="4.6mm" height="3.2mm" />
    <silkscreencircle radius="0.8mm" />
    <courtyardrect width="4.8mm" height="3.4mm" />
  </footprint>
)

const Kmr2PushButton = (props: PushButtonProps<typeof buttonPins>) => (
  <pushbutton
    pinLabels={buttonPins}
    internallyConnectedPins={[
      ["pin1", "pin2"],
      ["pin3", "pin4"],
    ]}
    manufacturerPartNumber="KMR221GLFS"
    footprint={<Kmr2Footprint />}
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

const Crystal3225Footprint = () => (
  <footprint>
    <smtpad
      portHints={["pin1", "left"]}
      shape="rect"
      width="1.2mm"
      height="1.4mm"
      pcbX={-1.1}
      pcbY={-0.85}
    />
    <smtpad
      portHints={["pin2"]}
      shape="rect"
      width="1.2mm"
      height="1.4mm"
      pcbX={1.1}
      pcbY={-0.85}
    />
    <smtpad
      portHints={["pin3", "right"]}
      shape="rect"
      width="1.2mm"
      height="1.4mm"
      pcbX={1.1}
      pcbY={0.85}
    />
    <smtpad
      portHints={["pin4"]}
      shape="rect"
      width="1.2mm"
      height="1.4mm"
      pcbX={-1.1}
      pcbY={0.85}
    />
    <silkscreenrect width="3.5mm" height="2.9mm" />
  </footprint>
)

const Rp2040CrystalClock = () => (
  <>
    <crystal
      name="Y1"
      frequency="12MHz"
      loadCapacitance="12pF"
      manufacturerPartNumber="X322512MSB4SI"
      supplierPartNumbers={{ jlcpcb: ["C9002"] }}
      pinVariant="four_pin"
      footprint={<Crystal3225Footprint />}
      pcbX={19.5}
      pcbY={2}
      connections={{
        pin1: "net.XIN",
        pin2: "net.GND",
        pin3: "net.XOUT",
        pin4: "net.GND",
      }}
    />
    <capacitor
      name="C_XIN"
      capacitance="18pF"
      footprint="0603"
      pcbX={22}
      pcbY={-1}
      pcbRotation={90}
      connections={{ pin1: "net.XIN", pin2: "net.GND" }}
    />
    <capacitor
      name="C_XOUT"
      capacitance="18pF"
      footprint="0603"
      pcbX={17}
      pcbY={5}
      pcbRotation={270}
      connections={{ pin1: "net.XOUT", pin2: "net.GND" }}
    />
  </>
)

const W25q16UsOn8Footprint = () => {
  const pads = [
    { pin: 1, x: -1.1, y: 0.75 },
    { pin: 2, x: -1.1, y: 0.25 },
    { pin: 3, x: -1.1, y: -0.25 },
    { pin: 4, x: -1.1, y: -0.75 },
    { pin: 5, x: 1.1, y: -0.75 },
    { pin: 6, x: 1.1, y: -0.25 },
    { pin: 7, x: 1.1, y: 0.25 },
    { pin: 8, x: 1.1, y: 0.75 },
  ]

  return (
    <footprint>
      {pads.map(({ pin, x, y }) => (
        <Fragment key={pin}>
          <smtpad
            portHints={[`pin${pin}`]}
            shape="rect"
            width="0.6mm"
            height="0.35mm"
            pcbX={x}
            pcbY={y}
          />
        </Fragment>
      ))}
      <silkscreenrect width="3mm" height="2mm" />
      <silkscreencircle pcbX={-1.25} pcbY={1.15} radius="0.18mm" />
    </footprint>
  )
}

const Rp2040UsbFlashSupport = ({
  withProgrammingButtons = false,
}: {
  withProgrammingButtons?: boolean
}) => (
  <>
    <resistor
      name="R_USB_DM"
      resistance="27"
      footprint="0603"
      pcbX={3}
      pcbY={withProgrammingButtons ? 7 : 6.5}
      connections={{ pin1: "net.USB_DM_CONN", pin2: "net.USB_DM_MCU" }}
    />
    <resistor
      name="R_USB_DP"
      resistance="27"
      footprint="0603"
      pcbX={3}
      pcbY={withProgrammingButtons ? 4 : 4.5}
      connections={{ pin1: "net.USB_DP_CONN", pin2: "net.USB_DP_MCU" }}
    />

    <chip
      name="U_FLASH"
      pinLabels={{
        pin1: ["CS"],
        pin2: ["DO", "IO1"],
        pin3: ["WP", "IO2"],
        pin4: ["GND"],
        pin5: ["DI", "IO0"],
        pin6: ["CLK"],
        pin7: ["HOLD", "IO3"],
        pin8: ["VCC"],
      }}
      manufacturerPartNumber="W25Q16JVUXIQ"
      footprint={<W25q16UsOn8Footprint />}
      pcbX={1}
      pcbY={0.15}
      pcbRotation={180}
      connections={{
        CS: "net.QSPI_SS",
        IO1: "net.QSPI_SD1",
        IO2: "net.QSPI_SD2",
        GND: "net.GND",
        IO0: "net.QSPI_SD0",
        CLK: "net.QSPI_SCLK",
        IO3: "net.QSPI_SD3",
        VCC: "net.V3V3",
      }}
    />
    <capacitor
      name="C_FLASH"
      capacitance="100nF"
      footprint="0603"
      pcbX={1}
      pcbY={-1.8}
      pcbRotation={90}
      connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
    />
    <resistor
      name="R_POWER_LED"
      resistance="1k"
      footprint="0603"
      pcbX={25}
      pcbY={10}
      connections={{ pin1: "net.V3V3", pin2: "net.POWER_LED_A" }}
    />
    <led
      name="D_POWER"
      color="green"
      footprint="0603"
      manufacturerPartNumber="GENERIC-0603-GREEN-LED"
      pcbX={29}
      pcbY={10}
      connections={{ anode: "net.POWER_LED_A", cathode: "net.GND" }}
    />
    <resistor
      name="R_USER_LED"
      resistance="1k"
      footprint="0603"
      pcbX={25}
      pcbY={5}
      connections={{ pin1: "net.USER_LED", pin2: "net.USER_LED_A" }}
    />
    <led
      name="D_USER"
      color="blue"
      footprint="0603"
      manufacturerPartNumber="GENERIC-0603-BLUE-LED"
      pcbX={29}
      pcbY={5}
      connections={{ anode: "net.USER_LED_A", cathode: "net.GND" }}
    />
    <silkscreentext
      text="POWER"
      fontSize="0.8mm"
      pcbX={27}
      pcbY={11.8}
      layer="top"
    />
    <silkscreentext
      text="GPIO25"
      fontSize="0.8mm"
      pcbX={27}
      pcbY={6.8}
      layer="top"
    />
  </>
)

const Rp2040ProgrammingButtons = () => (
  <>
    <resistor
      name="R_BOOTSEL"
      resistance="1k"
      footprint="0603"
      pcbX={4}
      pcbY={-2.5}
      pcbRotation={90}
      connections={{ pin1: "net.QSPI_SS", pin2: "net.BOOTSEL" }}
    />
    <Kmr2PushButton
      name="SW_BOOTSEL"
      pcbX={3}
      pcbY={-6}
      connections={{ A: "net.BOOTSEL", B: "net.GND" }}
    />
    <Kmr2PushButton
      name="SW_RESET"
      pcbX={4}
      pcbY={15}
      connections={{ A: "net.RUN", B: "net.GND" }}
    />
    <silkscreentext
      text="BOOTSEL"
      fontSize="0.7mm"
      pcbX={3}
      pcbY={-8.2}
      layer="top"
    />
    <silkscreentext
      text="RESET"
      fontSize="0.7mm"
      pcbX={4}
      pcbY={17.2}
      layer="top"
    />
  </>
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
      connections={{ pin1: "net.PD_ADC", pin2: "net.PD_SUM" }}
    />
    <capacitor
      name="C_TIA"
      capacitance="15pF"
      footprint="0603"
      pcbX={14}
      pcbY={-20}
      connections={{ pin1: "net.PD_ADC", pin2: "net.PD_SUM" }}
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

const Rp2040UsbSupport = ({
  withCrystal = false,
  withProgrammingButtons = false,
}: {
  withCrystal?: boolean
  withProgrammingButtons?: boolean
}) => (
  <>
    {/* The crystal variant also connects USB data for ROM BOOTSEL flashing. */}
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
        ...(withCrystal ? [] : (["DP_A", "DP_B", "DN_A", "DN_B"] as const)),
      ]}
      connections={{
        CC1: "net.CC1",
        CC2: "net.CC2",
        ...(withCrystal
          ? {
              DP_A: "net.USB_DP_CONN",
              DP_B: "net.USB_DP_CONN",
              DN_A: "net.USB_DM_CONN",
              DN_B: "net.USB_DM_CONN",
            }
          : undefined),
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
      pcbPath={[".R_USB_GND > .pin1", { x: -1.2, y: -3.8 }, ".J_USB > .GND_A"]}
    />
    <trace
      name="USB_VBUS"
      from=".J_USB > .VBUS_A"
      to=".U_REG > .VIN"
      pcbRouteHints={[
        { x: -27.5, y: 1.5 },
        { x: -20, y: 1.5 },
        { x: -20, y: 8 },
      ]}
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
        GND: "net.GND",
        VOUT: "net.V3V3",
      }}
    />
    <trace
      name="REGULATOR_ENABLE"
      from=".U_REG > .VIN"
      to=".U_REG > .EN"
      pcbRouteHints={[
        { x: -22.5, y: 9.05 },
        { x: -22.5, y: 10.95 },
      ]}
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
      pcbRotation={withProgrammingButtons ? 0 : 180}
      connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
    />
    <trace
      name="USB_CC2_GND_TO_OUTPUT_CAP"
      from=".C_REG_OUT > .pin2"
      to=".R_CC2 > .pin2"
      thickness="0.1mm"
      pcbPathRelativeTo={
        withProgrammingButtons ? ".C_REG_OUT > .pin2" : undefined
      }
      pcbPath={
        withProgrammingButtons
          ? [
              ".C_REG_OUT > .pin2",
              { x: 0.9125, y: -1.5 },
              { x: -10.175, y: -1.5 },
              ".R_CC2 > .pin2",
            ]
          : [".C_REG_OUT > .pin2", ".R_CC2 > .pin2"]
      }
    />

    <Rp2040
      name="U1"
      pcbX={12}
      pcbY={2}
      pcbRotation={90}
      noConnect={[
        ...(withCrystal ? [] : (["XIN", "XOUT"] as const)),
        ...(withCrystal ? [] : (["USB_DM", "USB_DP"] as const)),
        "SWCLK",
        "SWD",
        ...(withCrystal
          ? []
          : ([
              "QSPI_SS",
              "QSPI_SCLK",
              "QSPI_SD0",
              "QSPI_SD1",
              "QSPI_SD2",
              "QSPI_SD3",
            ] as const)),
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
        GPIO25: "net.USER_LED",
        ...(withCrystal ? { XIN: "net.XIN", XOUT: "net.XOUT" } : undefined),
        ...(withCrystal
          ? {
              USB_DM: "net.USB_DM_MCU",
              USB_DP: "net.USB_DP_MCU",
              QSPI_SS: "net.QSPI_SS",
              QSPI_SCLK: "net.QSPI_SCLK",
              QSPI_SD0: "net.QSPI_SD0",
              QSPI_SD1: "net.QSPI_SD1",
              QSPI_SD2: "net.QSPI_SD2",
              QSPI_SD3: "net.QSPI_SD3",
            }
          : undefined),
      }}
    />
    {withCrystal && <Rp2040CrystalClock />}
    {withCrystal && (
      <Rp2040UsbFlashSupport withProgrammingButtons={withProgrammingButtons} />
    )}
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

export type Rp2040PhotodiodeBiscuitBoardProps = Pick<
  BiscuitBoardProps,
  | "autorouter"
  | "autorouterOptions"
  | "minTraceWidth"
  | "nominalTraceWidth"
  | "routingDisabled"
>

export const Rp2040PhotodiodeBiscuitBoardBase = ({
  withCrystal = false,
  withProgrammingButtons = false,
  ...props
}: Rp2040PhotodiodeBiscuitBoardProps & {
  withCrystal?: boolean
  withProgrammingButtons?: boolean
} = {}) => (
  <BiscuitBoard
    {...props}
    minTraceWidth={props.minTraceWidth ?? 0.1}
    nominalTraceWidth={props.nominalTraceWidth ?? 0.15}
    autorouterOptions={{
      gridClearance: 0.1,
      expandTraces: true,
      maxBlockersPerSearch: 1_024,
      maxRipsPerRoute: 1_000,
      maxTotalRips: 10_000,
      maxSearchStates: 2_000_000,
      routeOrder: "input",
      ...props.autorouterOptions,
    }}
  >
    <Rp2040UsbSupport
      withCrystal={withCrystal}
      withProgrammingButtons={withProgrammingButtons}
    />
    {withCrystal && withProgrammingButtons && <Rp2040ProgrammingButtons />}
    <PhotodiodeTransimpedanceAmplifier />
  </BiscuitBoard>
)

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
