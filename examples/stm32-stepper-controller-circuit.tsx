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

const JstPhSideEntryFootprint = ({ pinCount }: { pinCount: number }) => {
  const bodyWidth = pinCount * 2 + 3.9
  const mountingX = bodyWidth / 2 - 0.9
  return (
    <footprint insertionDirection="from_y_pos">
      {Array.from({ length: pinCount }, (_, index) => (
        <Fragment key={`pin-${index + 1}`}>
          <smtpad
            portHints={[`pin${index + 1}`]}
            pcbX={(index - (pinCount - 1) / 2) * 2}
            pcbY="-2.25mm"
            width="1.2mm"
            height="3mm"
            shape="rect"
          />
        </Fragment>
      ))}
      <smtpad
        pcbX={-mountingX}
        pcbY="1mm"
        width="2.4mm"
        height="3.4mm"
        shape="rect"
      />
      <smtpad
        pcbX={mountingX}
        pcbY="1mm"
        width="2.4mm"
        height="3.4mm"
        shape="rect"
      />
      <silkscreenrect pcbY="0.75mm" width={bodyWidth} height="6mm" />
    </footprint>
  )
}

const motorPins = {
  pin1: ["B1"],
  pin2: ["B2"],
  pin3: ["A2"],
  pin4: ["A1"],
} as const
const powerPins = { pin1: ["VM"], pin2: ["GND"] } as const
const MotorConnector = (props: ConnectorProps) => (
  <connector
    pinLabels={motorPins}
    manufacturerPartNumber="S4B-PH-SM4-TB"
    footprint={<JstPhSideEntryFootprint pinCount={4} />}
    {...props}
  />
)
const PowerConnector = (props: ConnectorProps) => (
  <connector
    pinLabels={powerPins}
    manufacturerPartNumber="S2B-PH-SM4-TB"
    footprint={<JstPhSideEntryFootprint pinCount={2} />}
    {...props}
  />
)

/** STM32 STEP/DIR + SPI controller for one TMC5130A-driven bipolar stepper. */
export const Stm32StepperControllerCircuit = () => {
  const p = {
    power: [-10, 24.8, 0],
    motor: [24, 2, 90],
    swd: [20, -21.5, 180],
    mcu: [10, -12, 90],
    driver: [8, 5, 0],
    reg: [-8, 13, 0],
    regIn: [-12, 13, 0],
    regOut: [-4, 13, 0],
    mcuCap: [9.35, -16.2, 0],
    vmBulk: [-2, 20, 90],
    vmDec: [2, 20, 0],
    fiveV: [15, 6, 0],
    vccRes: [17, 8.5, 90],
    vccCap: [17, 12, 90],
    chargePump: [13.5, 10, 90],
    vcp: [9.75, 10.8, 180],
    vsa: [6, 12, 0],
    vio: [1.5, 3.25, 180],
    senseA: [4, 14, 0],
    senseB: [11.5, -1.5, 0],
  }
  const at = (v: number[]) => ({ pcbX: v[0], pcbY: v[1], pcbRotation: v[2] })

  return (
    <>
      <net name="VM" isPowerNet />
      <net name="V3V3" isPowerNet />

      <PowerConnector name="J_PWR" {...at(p.power)} />
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
