import type { ChipProps, ConnectorProps } from "@tscircuit/props"
import { Fragment } from "react"
import { S5B_PH_SM4_TB, STM32C071FBP6 } from "./stm32c071-parts"

const gnd = { displayName: "GND", schDisplayLabel: "GND" } as const
const vm = { displayName: "VM (6-18V)", schDisplayLabel: "VM" } as const
const v3v3 = { displayName: "3V3", schDisplayLabel: "3V3" } as const

const tmc5130Pins = {
  pin1: ["TST_MODE"],
  pin2: ["CLK"],
  pin3: ["CSN_CFG3"],
  pin4: ["SCK_CFG2"],
  pin5: ["SDI_CFG1"],
  pin6: ["NC_GND1"],
  pin7: ["SDO_CFG0"],
  pin8: ["STEP"],
  pin9: ["DIR"],
  pin10: ["VCC_IO"],
  pin11: ["SD_MODE"],
  pin12: ["SPI_MODE"],
  pin13: ["GNDP1"],
  pin14: ["DNC1"],
  pin15: ["OB1"],
  pin16: ["DNC2"],
  pin17: ["BRB"],
  pin18: ["DNC3"],
  pin19: ["OB2"],
  pin20: ["DNC4"],
  pin21: ["VS1"],
  pin22: ["DNC5"],
  pin23: ["DCO"],
  pin24: ["DCEN"],
  pin25: ["DCIN"],
  pin26: ["DIAG0"],
  pin27: ["DIAG1"],
  pin28: ["SWSEL"],
  pin29: ["DRV_ENN"],
  pin30: ["AIN_IREF"],
  pin31: ["NC_GND2"],
  pin32: ["GNDA"],
  pin33: ["5VOUT"],
  pin34: ["VCC"],
  pin35: ["CPO"],
  pin36: ["NC_GND3"],
  pin37: ["CPI"],
  pin38: ["VCP"],
  pin39: ["VSA"],
  pin40: ["VS2"],
  pin41: ["DNC6"],
  pin42: ["OA2"],
  pin43: ["DNC7"],
  pin44: ["BRA"],
  pin45: ["DNC8"],
  pin46: ["OA1"],
  pin47: ["DNC9"],
  pin48: ["GNDP2"],
  pin49: ["EP_GND"],
} as const

/** Analog Devices TQFP48-EP, 7 mm body, 0.5 mm pitch. */
const Tmc5130Tqfp48EpFootprint = () => {
  const pitch = 0.5
  const offset = 4.15
  const pads = Array.from({ length: 12 }, (_, index) => ({
    delta: (5.5 - index) * pitch,
    left: index + 1,
    bottom: index + 13,
    right: index + 25,
    top: index + 37,
  }))
  return (
    <footprint>
      {pads.map(({ delta, left, bottom, right, top }) => (
        <Fragment key={`side-${left}`}>
          <smtpad
            portHints={[`pin${left}`]}
            pcbX={-offset}
            pcbY={delta}
            width="1.5mm"
            height="0.28mm"
            shape="rect"
          />
          <smtpad
            portHints={[`pin${bottom}`]}
            pcbX={-delta}
            pcbY={-offset}
            width="0.28mm"
            height="1.5mm"
            shape="rect"
          />
          <smtpad
            portHints={[`pin${right}`]}
            pcbX={offset}
            pcbY={-delta}
            width="1.5mm"
            height="0.28mm"
            shape="rect"
          />
          <smtpad
            portHints={[`pin${top}`]}
            pcbX={delta}
            pcbY={offset}
            width="0.28mm"
            height="1.5mm"
            shape="rect"
          />
        </Fragment>
      ))}
      <smtpad portHints={["pin49"]} width="4.5mm" height="4.5mm" shape="rect" />
      <silkscreenrect width="7.2mm" height="7.2mm" />
      <silkscreencircle pcbX="-3.2mm" pcbY="3.2mm" radius="0.25mm" />
    </footprint>
  )
}

export const TMC5130A_TA = (props: ChipProps<typeof tmc5130Pins>) => (
  <chip
    pinLabels={tmc5130Pins}
    pinAttributes={{
      VCC_IO: { requiresPower: true, mustBeConnected: true },
      VS1: { requiresPower: true, mustBeConnected: true },
      VS2: { requiresPower: true, mustBeConnected: true },
      VSA: { requiresPower: true, mustBeConnected: true },
      VCC: { requiresPower: true, mustBeConnected: true },
      GNDP1: { requiresGround: true, mustBeConnected: true },
      GNDP2: { requiresGround: true, mustBeConnected: true },
      GNDA: { requiresGround: true, mustBeConnected: true },
      EP_GND: { requiresGround: true, mustBeConnected: true },
    }}
    manufacturerPartNumber="TMC5130A-TA"
    supplierPartNumbers={{ digikey: ["175-TMC5130A-TA-ND"] }}
    footprint={<Tmc5130Tqfp48EpFootprint />}
    {...props}
  />
)

const regulatorPins = {
  pin1: ["IN"],
  pin2: ["GND"],
  pin3: ["EN"],
  pin4: ["NC"],
  pin5: ["OUT"],
} as const
const LDK320M33R = (props: ChipProps<typeof regulatorPins>) => (
  <chip
    pinLabels={regulatorPins}
    pinAttributes={{
      IN: { requiresPower: true, mustBeConnected: true },
      GND: { requiresGround: true, mustBeConnected: true },
      OUT: { requiresPower: true, mustBeConnected: true },
    }}
    manufacturerPartNumber="LDK320M33R"
    footprint="sot23_5"
    {...props}
  />
)

/** Amphenol EconoStik 10129380 single-row vertical SMT header. */
const Amphenol10129380Footprint = () => (
  <footprint insertionDirection="from_z_pos">
    {[
      { pin: 1, x: -3.81, y: -1.8 },
      { pin: 2, x: -1.27, y: 1.8 },
      { pin: 3, x: 1.27, y: -1.8 },
      { pin: 4, x: 3.81, y: 1.8 },
    ].map(({ pin, x, y }) => (
      <smtpad
        key={`pin-${pin}`}
        portHints={[`pin${pin}`]}
        pcbX={x}
        pcbY={y}
        width="1.27mm"
        height="2.2mm"
        shape="rect"
      />
    ))}
    <silkscreenrect width="10.16mm" height="2.54mm" />
    <silkscreencircle pcbX="-6.35mm" pcbY="-1.27mm" radius="0.15mm" />
  </footprint>
)

/** Tensility 54-00164 right-angle 5.5 x 2.1 mm SMT barrel jack. */
const Tensility5400164Footprint = () => (
  <footprint insertionDirection="from_x_neg">
    {[
      { pin: 1, x: -2.35, y: 5.5 },
      { pin: undefined, x: 2.15, y: 5.5 },
      { pin: 2, x: -2.35, y: -5.5 },
      { pin: 3, x: 2.15, y: -5.5 },
    ].map(({ pin, x, y }) => (
      <smtpad
        key={`pad-${x}-${y}`}
        {...(pin === undefined ? {} : { portHints: [`pin${pin}`] })}
        pcbX={x}
        pcbY={y}
        width="2mm"
        height="2mm"
        shape="rect"
      />
    ))}
    <hole pcbX="-2.35mm" diameter="1.6mm" />
    <hole pcbX="2.15mm" diameter="1.8mm" />
    <silkscreenrect width="14.7mm" height="9mm" />
  </footprint>
)

const motorPins = {
  pin1: ["A1"],
  pin2: ["A2"],
  pin3: ["B2"],
  pin4: ["B1"],
} as const
const powerPins = {
  pin1: ["A", "VM"],
  pin2: ["B", "GND"],
  pin3: ["C", "SWITCH"],
} as const
const MotorConnector = (props: ConnectorProps) => (
  <connector
    pinLabels={motorPins}
    manufacturerPartNumber="10129380-904001ALF"
    supplierPartNumbers={{ digikey: ["609-10129380-904001ALFCT-ND"] }}
    footprint={<Amphenol10129380Footprint />}
    {...props}
  />
)
const PowerConnector = (props: ConnectorProps) => (
  <connector
    pinLabels={powerPins}
    manufacturerPartNumber="54-00164"
    supplierPartNumbers={{ digikey: ["839-54-00164CT-ND"] }}
    footprint={<Tensility5400164Footprint />}
    {...props}
  />
)

/** STM32 STEP/DIR + SPI controller for one TMC5130A-driven bipolar stepper. */
export const Stm32StepperControllerCircuit = () => {
  const p = {
    power: [-12.038527824766255, 20.723335950715512, 270],
    motor: [27.303165891949014, 1.7578516800016324, 270],
    swd: [21.146671901431024, -22.07333595071551, 180],
    mcu: [10.764447934287347, -11.42666404928449, 90],
    driver: [8.741161310184516, 4.694228442484313, 0],
    reg: [3.1302176116840883, -2.5239536746818594, 0],
    regIn: [-12, 10, 0],
    regOut: [-4, 10, 0],
    mcuCap: [9.35, -17.028151928811283, 0],
    vmBulk: [-2.0637039945239444, 20.318519972619725, 90],
    vmDec: [2.9576114373282607, 20.445927961667614, 0],
    fiveV: [16.024798585599854, 5.151799802871402, 0],
    vccRes: [18.15456803671207, 8.95085646826217, 90],
    vccCap: [18.114433482165268, 13.4381919039748, 90],
    chargePump: [13.878612153922816, 10.897700539147213, 90],
    vcp: [10.638334751675409, 11.836835777731235, 180],
    vsa: [4.040048306141241, 11.792632844453749, 0],
    vio: [-7.930625160416103, 10.046173457029411, 180],
    senseA: [4.256867497564862, 15.361935192258315, 0],
    senseB: [13.01988086050558, -3.475845118657247, 0],
  }
  const at = (v: number[]) => ({ pcbX: v[0], pcbY: v[1], pcbRotation: v[2] })

  return (
    <>
      <net name="VM" isPowerNet />
      <net name="V3V3" isPowerNet />

      <PowerConnector name="J_PWR" noConnect={["SWITCH"]} {...at(p.power)} />
      <MotorConnector name="J_MOTOR" {...at(p.motor)} />
      <S5B_PH_SM4_TB name="J_SWD" {...at(p.swd)} />
      <STM32C071FBP6
        name="U_MCU"
        {...at(p.mcu)}
        noConnect={[
          "PB7",
          "OSCX_IN",
          "OSCX_OUT",
          "PA0",
          "PA1",
          "PA2",
          "PA3",
          "USB_DM",
        ]}
      />
      <TMC5130A_TA
        name="U_DRIVER"
        {...at(p.driver)}
        noConnect={[
          "DNC1",
          "DNC2",
          "DNC3",
          "DNC4",
          "DNC5",
          "DNC6",
          "DNC7",
          "DNC8",
          "DNC9",
          "DCO",
          "DIAG0",
          "DIAG1",
          "AIN_IREF",
        ]}
      />
      <LDK320M33R name="U_REG" {...at(p.reg)} noConnect={["NC"]} />

      <capacitor
        name="C_REG_IN"
        capacitance="1uF"
        footprint="0603"
        {...at(p.regIn)}
      />
      <capacitor
        name="C_REG_OUT"
        capacitance="1uF"
        footprint="0603"
        {...at(p.regOut)}
      />
      <capacitor
        name="C_MCU"
        capacitance="100nF"
        footprint="0603"
        {...at(p.mcuCap)}
      />
      <capacitor
        name="C_VM_BULK"
        capacitance="100uF"
        footprint="1210"
        {...at(p.vmBulk)}
      />
      <capacitor
        name="C_VM"
        capacitance="100nF"
        footprint="0603"
        {...at(p.vmDec)}
      />
      <capacitor
        name="C_5VOUT"
        capacitance="4.7uF"
        footprint="0805"
        {...at(p.fiveV)}
      />
      <resistor
        name="R_VCC"
        resistance="2.2ohm"
        footprint="0603"
        {...at(p.vccRes)}
      />
      <capacitor
        name="C_VCC"
        capacitance="470nF"
        footprint="0603"
        {...at(p.vccCap)}
      />
      <capacitor
        name="C_CP"
        capacitance="22nF"
        footprint="0603"
        {...at(p.chargePump)}
      />
      <capacitor
        name="C_VCP"
        capacitance="100nF"
        footprint="0603"
        {...at(p.vcp)}
      />
      <capacitor
        name="C_VSA"
        capacitance="100nF"
        footprint="0603"
        {...at(p.vsa)}
      />
      <capacitor
        name="C_VIO"
        capacitance="100nF"
        footprint="0603"
        {...at(p.vio)}
      />
      <resistor
        name="R_SENSE_A"
        resistance="0.22ohm"
        footprint="1206"
        {...at(p.senseA)}
      />
      <resistor
        name="R_SENSE_B"
        resistance="0.22ohm"
        footprint="1206"
        {...at(p.senseB)}
      />

      <silkscreentext
        text="6-18V"
        pcbX={p.power[0]}
        pcbY={21.5}
        pcbRotation={0}
        fontSize="0.65mm"
      />
      <silkscreentext
        text="TMC5130A"
        pcbX={p.driver[0]}
        pcbY={p.driver[1] + 6}
        fontSize="0.65mm"
      />
      <silkscreentext
        text="SWD"
        pcbX={p.swd[0]}
        pcbY={-16.7}
        fontSize="0.7mm"
      />

      <trace from=".J_PWR > .VM" to="net.VM" {...vm} />
      <trace from=".J_PWR > .GND" to="net.GND" {...gnd} />
      <trace from=".U_REG > .IN" to="net.VM" {...vm} />
      <trace from=".U_REG > .EN" to="net.VM" {...vm} />
      <trace from=".U_REG > .GND" to="net.GND" {...gnd} />
      <trace from=".U_REG > .OUT" to="net.V3V3" {...v3v3} />
      <trace from=".C_REG_IN > .pin1" to="net.VM" {...vm} />
      <trace from=".C_REG_IN > .pin2" to="net.GND" {...gnd} />
      <trace from=".C_REG_OUT > .pin1" to="net.V3V3" {...v3v3} />
      <trace from=".C_REG_OUT > .pin2" to="net.GND" {...gnd} />
      <trace from=".U_MCU > .VDD_VDDA" to="net.V3V3" {...v3v3} />
      <trace from=".U_MCU > .VSS_VSSA" to="net.GND" {...gnd} />
      <trace from=".C_MCU > .pin1" to="net.V3V3" {...v3v3} />
      <trace from=".C_MCU > .pin2" to="net.GND" {...gnd} />
      <trace from=".J_SWD > .V3V3" to="net.V3V3" {...v3v3} />
      <trace from=".J_SWD > .GND" to="net.GND" {...gnd} />
      <trace from=".J_SWD > .SWDIO" to=".U_MCU > .SWDIO" />
      <trace from=".J_SWD > .SWCLK" to=".U_MCU > .SWCLK" />
      <trace from=".J_SWD > .NRST" to=".U_MCU > .NRST" />

      <trace from=".U_DRIVER > .VS1" to="net.VM" width="0.3mm" {...vm} />
      <trace
        from=".U_DRIVER > .VS2"
        to=".U_DRIVER > .VS1"
        width="0.3mm"
        {...vm}
      />
      <trace from=".U_DRIVER > .VSA" to="net.VM" {...vm} />
      <trace from=".U_DRIVER > .VCC_IO" to="net.V3V3" {...v3v3} />
      <trace from=".U_DRIVER > .GNDP1" to="net.GND" width="0.2mm" {...gnd} />
      <trace from=".U_DRIVER > .GNDP2" to="net.GND" width="0.2mm" {...gnd} />
      <trace from=".U_DRIVER > .GNDA" to="net.GND" {...gnd} />
      <trace from=".U_DRIVER > .EP_GND" to="net.GND" width="0.2mm" {...gnd} />
      <trace from=".U_DRIVER > .NC_GND1" to="net.GND" {...gnd} />
      <trace from=".U_DRIVER > .NC_GND2" to="net.GND" {...gnd} />
      <trace from=".U_DRIVER > .NC_GND3" to="net.GND" {...gnd} />

      <trace from=".C_VM_BULK > .pin1" to="net.VM" {...vm} />
      <trace from=".C_VM_BULK > .pin2" to="net.GND" {...gnd} />
      <trace from=".C_VM > .pin1" to="net.VM" {...vm} />
      <trace from=".C_VM > .pin2" to="net.GND" {...gnd} />
      <trace from=".U_DRIVER > .5VOUT" to=".C_5VOUT > .pin1" maxLength="5mm" />
      <trace from=".C_5VOUT > .pin2" to="net.GND" maxLength="20mm" {...gnd} />
      <trace from=".U_DRIVER > .5VOUT" to=".R_VCC > .pin1" />
      <trace from=".R_VCC > .pin2" to=".U_DRIVER > .VCC" />
      <trace from=".C_VCC > .pin1" to=".U_DRIVER > .VCC" maxLength="10mm" />
      <trace from=".C_VCC > .pin2" to="net.GND" maxLength="20mm" {...gnd} />
      <trace from=".U_DRIVER > .CPO" to=".C_CP > .pin1" maxLength="8mm" />
      <trace from=".C_CP > .pin2" to=".U_DRIVER > .CPI" maxLength="8mm" />
      <trace from=".C_VCP > .pin1" to=".U_DRIVER > .VCP" maxLength="8mm" />
      <trace
        from=".C_VCP > .pin2"
        to=".U_DRIVER > .VS2"
        maxLength="8mm"
        {...vm}
      />
      <trace from=".C_VSA > .pin1" to="net.VM" {...vm} />
      <trace from=".C_VSA > .pin2" to="net.GND" maxLength="20mm" {...gnd} />
      <trace from=".C_VIO > .pin1" to="net.V3V3" maxLength="6mm" {...v3v3} />
      <trace from=".C_VIO > .pin2" to="net.GND" maxLength="20mm" {...gnd} />

      <trace from=".U_DRIVER > .BRA" to=".R_SENSE_A > .pin1" width="0.3mm" />
      <trace from=".R_SENSE_A > .pin2" to="net.GND" width="0.2mm" {...gnd} />
      <trace from=".U_DRIVER > .BRB" to=".R_SENSE_B > .pin1" width="0.3mm" />
      <trace from=".R_SENSE_B > .pin2" to="net.GND" width="0.2mm" {...gnd} />
      <trace
        name="MOTOR_A1"
        from=".U_DRIVER > .OA1"
        to=".J_MOTOR > .A1"
        width="0.3mm"
      />
      <trace
        name="MOTOR_A2"
        from=".U_DRIVER > .OA2"
        to=".J_MOTOR > .A2"
        width="0.3mm"
      />
      <trace
        name="MOTOR_B1"
        from=".U_DRIVER > .OB1"
        to=".J_MOTOR > .B1"
        width="0.2mm"
      />
      <trace
        name="MOTOR_B2"
        from=".U_DRIVER > .OB2"
        to=".J_MOTOR > .B2"
        width="0.2mm"
      />

      <trace name="STEP" from=".U_MCU > .PA6" to=".U_DRIVER > .STEP" />
      <trace name="DIR" from=".U_MCU > .PA5" to=".U_DRIVER > .DIR" />
      <trace name="SPI_CS" from=".U_MCU > .PA4" to=".U_DRIVER > .CSN_CFG3" />
      <trace name="SPI_SCK" from=".U_MCU > .PA7" to=".U_DRIVER > .SCK_CFG2" />
      <trace name="SPI_MOSI" from=".U_MCU > .PA12" to=".U_DRIVER > .SDI_CFG1" />
      <trace name="SPI_MISO" from=".U_DRIVER > .SDO_CFG0" to=".U_MCU > .PB3" />
      <trace
        name="DRIVER_ENABLE"
        from=".U_MCU > .PA8"
        to=".U_DRIVER > .DRV_ENN"
      />
      <trace from=".U_DRIVER > .SD_MODE" to="net.V3V3" {...v3v3} />
      <trace from=".U_DRIVER > .SPI_MODE" to="net.V3V3" {...v3v3} />
      <trace from=".U_DRIVER > .SWSEL" to="net.GND" {...gnd} />
      <trace from=".U_DRIVER > .DCEN" to="net.GND" {...gnd} />
      <trace from=".U_DRIVER > .DCIN" to="net.GND" {...gnd} />
      <trace from=".U_DRIVER > .TST_MODE" to="net.GND" {...gnd} />
      <trace from=".U_DRIVER > .CLK" to="net.GND" {...gnd} />
    </>
  )
}
