import type {
  ChipProps,
  ConnectorProps,
  PushButtonProps,
} from "@tscircuit/props"
import { Fragment } from "react"
import { BiscuitBoard, type BiscuitBoardProps } from "../lib/BiscuitBoard"

const schSections = {
  usbPower: "usb_power",
  mcu: "mcu",
  clock: "clock",
  flash: "flash",
  status: "status",
  controls: "controls",
  photodiode: "photodiode",
} as const

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
  pin2: ["B"],
  pin3: ["A_ALT"],
  pin4: ["B_ALT"],
} as const

const B3fsFootprint = () => (
  <footprint insertionDirection="from_z_pos">
    <smtpad
      portHints={["pin1"]}
      pcbX="4.05mm"
      pcbY="-2.25mm"
      width="1.5mm"
      height="1.3mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin2"]}
      pcbX="-4.05mm"
      pcbY="-2.25mm"
      width="1.5mm"
      height="1.3mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin3"]}
      pcbX="4.05mm"
      pcbY="2.25mm"
      width="1.5mm"
      height="1.3mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin4"]}
      pcbX="-4.05mm"
      pcbY="2.25mm"
      width="1.5mm"
      height="1.3mm"
      shape="rect"
    />
    <silkscreenrect width="6.2mm" height="6.2mm" />
    <silkscreencircle radius="1.7mm" />
    <courtyardrect width="10.1mm" height="6.3mm" />
  </footprint>
)

const B3FS_1000P = (props: PushButtonProps<typeof buttonPins>) => (
  <pushbutton
    pinLabels={buttonPins}
    internallyConnectedPins={[
      ["pin1", "pin3"],
      ["pin2", "pin4"],
    ]}
    manufacturerPartNumber="B3FS-1000P"
    supplierPartNumbers={{ digikey: ["SW423CT-ND"] }}
    footprint={<B3fsFootprint />}
    {...props}
  />
)

// Vishay BPW34: 2.54 mm lead pitch with drilled through-hole pads.
const Bpw34Footprint = () => (
  <footprint insertionDirection="from_above">
    <platedhole
      portHints={["pin1", "anode"]}
      shape="circular_hole_with_rect_pad"
      holeDiameter="0.8mm"
      rectPadWidth="1.6mm"
      rectPadHeight="1.6mm"
      pcbX={0}
      pcbY={0}
    />
    <platedhole
      portHints={["pin2", "cathode"]}
      shape="circle"
      holeDiameter="0.8mm"
      outerDiameter="1.6mm"
      pcbX={2.54}
      pcbY={0}
    />
    <silkscreenrect pcbX={1.27} pcbY={0} width="5.4mm" height="4.3mm" />
    <courtyardrect pcbX={1.27} pcbY={0} width="5.8mm" height="4.7mm" />
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
      schSectionName={schSections.clock}
      frequency="12MHz"
      loadCapacitance="12pF"
      manufacturerPartNumber="X322512MSB4SI"
      supplierPartNumbers={{ jlcpcb: ["C9002"] }}
      pinVariant="four_pin"
      footprint={<Crystal3225Footprint />}
      pcbX={21.2}
      pcbY={0.8}
      connections={{
        pin1: "net.XIN",
        pin2: "net.GND",
        pin3: "net.XOUT",
        pin4: "net.GND",
      }}
    />
    <resistor
      name="R_XOUT"
      schSectionName={schSections.clock}
      resistance="1k"
      footprint="0603"
      pcbX={17.5}
      pcbY={1.75}
      connections={{ pin2: "net.XOUT" }}
    />
    <capacitor
      name="C_XIN"
      schSectionName={schSections.clock}
      capacitance="18pF"
      footprint="0603"
      pcbX={21}
      pcbY={-2.3}
      connections={{ pin1: "net.XIN", pin2: "net.GND" }}
    />
    <capacitor
      name="C_XOUT"
      schSectionName={schSections.clock}
      capacitance="18pF"
      footprint="0603"
      pcbX={25}
      pcbY={1.65}
      connections={{ pin1: "net.XOUT", pin2: "net.GND" }}
    />
    <trace
      name="CLOCK_XOUT_SERIES_IN"
      from=".U1 > .XOUT"
      to=".R_XOUT > .pin1"
      maxLength="4mm"
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

const Rp2040UsbFlashSupport = () => (
  <>
    <resistor
      name="R_USB_DM"
      schSectionName={schSections.usbPower}
      resistance="27"
      footprint="0603"
      pcbX={5.8}
      pcbY={4.4}
      connections={{ pin1: "net.USB_DM_CONN" }}
    />
    <resistor
      name="R_USB_DP"
      schSectionName={schSections.usbPower}
      resistance="27"
      footprint="0603"
      pcbX={5.8}
      pcbY={2.8}
      connections={{ pin1: "net.USB_DP_CONN" }}
    />
    <trace
      name="USB_DM_SERIES_TO_MCU"
      from=".R_USB_DM > .pin2"
      to=".U1 > .USB_DM"
      maxLength="5mm"
    />
    <trace
      name="USB_DP_SERIES_TO_MCU"
      from=".R_USB_DP > .pin2"
      to=".U1 > .USB_DP"
      maxLength="5mm"
    />

    <chip
      name="U_FLASH"
      schSectionName={schSections.flash}
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
      pcbX={2.039780348458317}
      pcbY={0.15}
      pcbRotation={180}
      connections={{
        CS: "net.QSPI_SS",
        IO1: "net.QSPI_SD1",
        IO2: "net.QSPI_SD2",
        GND: "net.GND",
        IO0: "net.QSPI_SD0",
        CLK: "net.QSPI_SCLK",
        VCC: "net.V3V3_FLASH",
      }}
    />
    <trace
      name="QSPI_SD3_TO_FLASH"
      from=".U1 > .QSPI_SD3"
      to=".U_FLASH > .IO3"
      maxLength="14mm"
      pcbRouteHints={[
        { x: 6, y: 1.3 },
        { x: 4, y: -1.5 },
        { x: 0.5, y: -1.5 },
      ]}
    />
    <capacitor
      name="C_FLASH"
      schSectionName={schSections.flash}
      capacitance="100nF"
      footprint="0603"
      pcbX={1.7724082588547496}
      pcbY={-4.8}
      pcbRotation={90}
      connections={{ pin1: "net.V3V3_FLASH", pin2: "net.GND" }}
    />
    <resistor
      name="R_POWER_LED"
      schSectionName={schSections.status}
      resistance="1k"
      footprint="0603"
      pcbX={20.67729272879607}
      pcbY={15.462605756372557}
      connections={{ pin1: "net.V3V3_STATUS", pin2: "net.POWER_LED_A" }}
    />
    <led
      name="D_POWER"
      schSectionName={schSections.status}
      color="green"
      footprint="0603"
      manufacturerPartNumber="GENERIC-0603-GREEN-LED"
      pcbX={25.342324616673597}
      pcbY={15.32025510302023}
      connections={{ anode: "net.POWER_LED_A", cathode: "net.GND" }}
    />
    <resistor
      name="R_USER_LED"
      schSectionName={schSections.status}
      resistance="1k"
      footprint="0603"
      pcbX={6.373903260227841}
      pcbY={24.414823963280423}
      connections={{ pin1: "net.USER_LED", pin2: "net.USER_LED_A" }}
    />
    <led
      name="D_USER"
      schSectionName={schSections.status}
      color="blue"
      footprint="0603"
      manufacturerPartNumber="GENERIC-0603-BLUE-LED"
      pcbX={6.308924492916013}
      pcbY={21.684614343444117}
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
      schSectionName={schSections.controls}
      resistance="1k"
      footprint="0603"
      pcbX={5.4556924878416435}
      pcbY={-5.470291990044046}
      pcbRotation={90}
      connections={{ pin1: "net.QSPI_SS", pin2: "net.BOOTSEL" }}
    />
    <B3FS_1000P
      name="SW_BOOTSEL"
      schSectionName={schSections.controls}
      pcbX={21.5}
      pcbY={-9.326788109515467}
      connections={{ A: "net.BOOTSEL", B_ALT: "net.GND" }}
    />
    <B3FS_1000P
      name="SW_RESET"
      schSectionName={schSections.controls}
      pcbX={-4.811672514377253}
      pcbY={12.284453124000493}
      connections={{ A: "net.RUN", B_ALT: "net.GND" }}
    />
    <silkscreentext
      text="BOOTSEL"
      fontSize="0.7mm"
      pcbX={21.5}
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
      schSectionName={schSections.photodiode}
      photo
      manufacturerPartNumber="BPW34"
      footprint={<Bpw34Footprint />}
      pcbX={27}
      pcbY={-18}
      pcbRotation={90}
      connections={{ anode: "net.GND", cathode: "net.PD_SUM" }}
    />

    <opamp
      name="U_TIA"
      schSectionName={schSections.photodiode}
      manufacturerPartNumber="OPA320AIDBVR"
      footprint="sot23_5"
      pcbX={19}
      pcbY={-17}
      pcbRotation={90}
      connections={{
        inverting_input: "net.PD_SUM",
        non_inverting_input: "net.PD_BIAS",
        output: "net.PD_ADC",
        positive_supply: "net.V3V3_ANALOG",
        negative_supply: "net.GND",
      }}
    />

    <resistor
      name="R_TIA"
      schSectionName={schSections.photodiode}
      resistance="100k"
      footprint="0603"
      pcbX={23}
      pcbY={-17}
      connections={{ pin1: "net.PD_ADC", pin2: "net.PD_SUM" }}
    />
    <capacitor
      name="C_TIA"
      schSectionName={schSections.photodiode}
      capacitance="15pF"
      footprint="0603"
      pcbX={23}
      pcbY={-20}
      connections={{ pin1: "net.PD_ADC", pin2: "net.PD_SUM" }}
    />

    <resistor
      name="R_BIAS_TOP"
      schSectionName={schSections.photodiode}
      resistance="100k"
      footprint="0603"
      pcbX={11}
      pcbY={-12.5}
      pcbRotation={90}
      connections={{ pin1: "net.V3V3_ANALOG", pin2: "net.PD_BIAS" }}
    />
    <resistor
      name="R_BIAS_BOTTOM"
      schSectionName={schSections.photodiode}
      resistance="100k"
      footprint="0603"
      pcbX={13.5}
      pcbY={-12.5}
      pcbRotation={90}
      connections={{ pin1: "net.PD_BIAS", pin2: "net.GND" }}
    />
    <capacitor
      name="C_BIAS"
      schSectionName={schSections.photodiode}
      capacitance="100nF"
      footprint="0603"
      pcbX={15.5}
      pcbY={-13.5}
      pcbRotation={90}
      connections={{ pin1: "net.PD_BIAS", pin2: "net.GND" }}
    />
    <capacitor
      name="C_TIA_SUPPLY"
      schSectionName={schSections.photodiode}
      capacitance="100nF"
      footprint="0603"
      pcbX={15}
      pcbY={-17}
      connections={{ pin1: "net.V3V3_ANALOG", pin2: "net.GND" }}
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
      schSectionName={schSections.usbPower}
      pcbX={-33}
      pcbY={0}
      pcbRotation={270}
      noConnect={[
        "SBU1",
        "SBU2",
        ...(withCrystal ? [] : (["DP_A", "DP_B", "DN_A", "DN_B"] as const)),
      ]}
      connections={{
        SHIELD1: "net.GND",
        SHIELD2: "net.GND",
        SHIELD3: "net.GND",
        SHIELD4: "net.GND",
        GND_A: "net.GND",
        GND_B: "net.GND",
        VBUS_A: "net.VBUS",
        VBUS_B: "net.VBUS",
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
      schSectionName={schSections.usbPower}
      resistance="5.1k"
      footprint="0603"
      pcbX={-14.002452168183709}
      pcbY={18.66257971969382}
      connections={{ pin1: "net.CC1", pin2: "net.GND" }}
    />
    <resistor
      name="R_CC2"
      schSectionName={schSections.usbPower}
      resistance="5.1k"
      footprint="0603"
      pcbX={-16}
      pcbY={-17}
      connections={{ pin1: "net.CC2", pin2: "net.GND" }}
    />
    <chip
      name="U_REG"
      schSectionName={schSections.usbPower}
      pinLabels={{
        pin1: ["VIN"],
        pin2: ["GND"],
        pin3: ["EN"],
        pin4: ["NC"],
        pin5: ["VOUT"],
      }}
      noConnect={["NC"]}
      manufacturerPartNumber="TLV75533PDBVR"
      footprint="sot23_5"
      pcbX={-24.433970258624246}
      pcbY={10.051457249215975}
      pcbRotation={180}
      connections={{
        VIN: "net.VBUS",
        GND: "net.GND",
        VOUT: "net.V3V3_REG",
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
      schSectionName={schSections.usbPower}
      capacitance="1uF"
      footprint="0603"
      pcbX={-20.5}
      pcbY={9.1}
    />
    <capacitor
      name="C_REG_OUT"
      schSectionName={schSections.usbPower}
      capacitance="10uF"
      footprint="0805"
      pcbX={-29}
      pcbY={9.1}
      pcbRotation={withProgrammingButtons ? 0 : 180}
    />
    <trace
      name="REGULATOR_INPUT_DECOUPLING"
      from=".C_REG_IN > .pin1"
      to=".U_REG > .VIN"
      maxLength="6mm"
    />
    <trace
      name="REGULATOR_OUTPUT_DECOUPLING"
      from=".C_REG_OUT > .pin1"
      to=".U_REG > .VOUT"
      maxLength="6mm"
    />
    <trace
      name="REGULATOR_INPUT_CAP_GROUND"
      from=".C_REG_IN > .pin2"
      to="net.GND"
      maxLength="6mm"
    />
    <trace
      name="REGULATOR_OUTPUT_CAP_GROUND"
      from=".C_REG_OUT > .pin2"
      to="net.GND"
      maxLength="6mm"
    />
    <resistor
      name="R_3V3_REG_FEED"
      schSectionName={schSections.usbPower}
      resistance="0"
      footprint="0603"
      pcbX={2}
      pcbY={15.5}
      connections={{ pin1: "net.V3V3_REG", pin2: "net.V3V3_CORE" }}
    />
    {withCrystal && (
      <resistor
        name="R_3V3_FLASH_FEED"
        schSectionName={schSections.mcu}
        resistance="0"
        footprint="0603"
        pcbX={3}
        pcbY={-8}
        connections={{ pin1: "net.V3V3_CORE", pin2: "net.V3V3_FLASH" }}
      />
    )}
    <resistor
      name="R_3V3_STATUS_FEED"
      schSectionName={schSections.mcu}
      resistance="0"
      footprint="0603"
      pcbX={15}
      pcbY={10}
      connections={{ pin1: "net.V3V3_CORE", pin2: "net.V3V3_STATUS" }}
    />
    <resistor
      name="R_3V3_ANALOG_FEED"
      schSectionName={schSections.photodiode}
      resistance="0"
      footprint="0603"
      pcbX={12}
      pcbY={-8}
      connections={{ pin1: "net.V3V3_CORE", pin2: "net.V3V3_ANALOG" }}
    />
    <Rp2040
      name="U1"
      schSectionName={schSections.mcu}
      pcbX={11.718003908900288}
      pcbY={1.9530006514833822}
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
        IOVDD1: "net.V3V3_CORE",
        IOVDD2: "net.V3V3_CORE",
        IOVDD3: "net.V3V3_CORE",
        IOVDD4: "net.V3V3_CORE",
        IOVDD5: "net.V3V3_CORE",
        IOVDD6: "net.V3V3_CORE",
        DVDD1: "net.V1V1",
        DVDD2: "net.V1V1",
        VREG_IN: "net.V3V3_CORE",
        VREG_VOUT: "net.V1V1",
        ADC_AVDD: "net.V3V3_CORE",
        USB_VDD: "net.V3V3_CORE",
        TESTEN: "net.GND",
        GND: "net.GND",
        RUN: "net.RUN",
        GPIO26_ADC0: "net.PD_ADC",
        GPIO25: "net.USER_LED",
        ...(withCrystal ? { XIN: "net.XIN" } : undefined),
        ...(withCrystal
          ? {
              QSPI_SS: "net.QSPI_SS",
              QSPI_SCLK: "net.QSPI_SCLK",
              QSPI_SD0: "net.QSPI_SD0",
              QSPI_SD1: "net.QSPI_SD1",
              QSPI_SD2: "net.QSPI_SD2",
            }
          : undefined),
      }}
    />
    {withCrystal && <Rp2040CrystalClock />}
    {withCrystal && <Rp2040UsbFlashSupport />}
    <resistor
      name="R_RUN"
      schSectionName={schSections.controls}
      resistance="10k"
      footprint="0603"
      pcbX={8}
      pcbY={11}
      connections={{ pin1: "net.RUN", pin2: "net.V3V3_STATUS" }}
    />
    <capacitor
      name="C_3V3_A"
      schSectionName={schSections.mcu}
      capacitance="100nF"
      footprint="0603"
      pcbX={9}
      pcbY={7.3}
      connections={{ pin1: "net.V3V3_CORE", pin2: "net.GND" }}
    />
    <capacitor
      name="C_VREG_IN"
      schSectionName={schSections.mcu}
      capacitance="1uF"
      footprint="0603"
      pcbX={3.5}
      pcbY={5.8}
      pcbRotation={90}
    />
    <capacitor
      name="C_IOVDD_TOP"
      schSectionName={schSections.mcu}
      capacitance="100nF"
      footprint="0603"
      pcbX={12.5}
      pcbY={7.5}
      connections={{ pin1: "net.V3V3_CORE", pin2: "net.GND" }}
    />
    <capacitor
      name="C_IOVDD_RIGHT"
      schSectionName={schSections.mcu}
      capacitance="100nF"
      footprint="0603"
      pcbX={18}
      pcbY={6.7}
      connections={{ pin1: "net.V3V3_CORE", pin2: "net.GND" }}
    />
    <capacitor
      name="C_IOVDD_BOTTOM"
      schSectionName={schSections.mcu}
      capacitance="100nF"
      footprint="0603"
      pcbX={11.5}
      pcbY={-3.4}
      connections={{ pin1: "net.V3V3_CORE", pin2: "net.GND" }}
    />
    <capacitor
      name="C_USB_IOVDD"
      schSectionName={schSections.mcu}
      capacitance="100nF"
      footprint="0603"
      pcbX={8}
      pcbY={-3.5}
      connections={{ pin1: "net.V3V3_CORE", pin2: "net.GND" }}
    />
    <capacitor
      name="C_V1V1"
      schSectionName={schSections.mcu}
      capacitance="1uF"
      footprint="0603"
      pcbX={5.5}
      pcbY={6.8}
      pcbRotation={90}
    />
    <trace
      name="VREG_INPUT_LOCAL_DECOUPLING"
      from=".C_VREG_IN > .pin1"
      to=".U1 > .VREG_IN"
      maxLength="5mm"
    />
    <trace
      name="VREG_OUTPUT_LOCAL_DECOUPLING"
      from=".C_V1V1 > .pin1"
      to=".U1 > .VREG_VOUT"
      maxLength="5mm"
    />
    <trace
      name="VREG_INPUT_CAP_GROUND"
      from=".C_VREG_IN > .pin2"
      to="net.GND"
      maxLength="8mm"
    />
    <trace
      name="VREG_OUTPUT_CAP_GROUND"
      from=".C_V1V1 > .pin2"
      to="net.GND"
      maxLength="8mm"
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
    minTraceWidth={props.minTraceWidth ?? 0.15}
    nominalTraceWidth={props.nominalTraceWidth ?? 0.15}
    autorouterOptions={{
      gridClearance: 0.1,
      expandTraces: true,
      maxBlockersPerSearch: 1_024,
      maxRipsPerRoute: 1_000,
      maxTotalRips: 30_000,
      maxSearchStates: 2_000_000,
      routeOrder: "adaptive",
      ...props.autorouterOptions,
    }}
  >
    <schematicsection name={schSections.usbPower} displayName="USB + Power" />
    <schematicsection name={schSections.mcu} displayName="RP2040 Core" />
    <schematicsection name={schSections.clock} displayName="12 MHz Clock" />
    <schematicsection name={schSections.flash} displayName="QSPI Flash" />
    <schematicsection name={schSections.status} displayName="Status LEDs" />
    <schematicsection
      name={schSections.controls}
      displayName="Programming Controls"
    />
    <schematicsection
      name={schSections.photodiode}
      displayName="Photodiode TIA"
    />

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
