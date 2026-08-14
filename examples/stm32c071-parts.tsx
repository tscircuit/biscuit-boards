import type { ChipProps, ConnectorProps } from "@tscircuit/props"
import { Fragment } from "react"

const stm32Pins = {
  pin1: ["PB7"],
  pin2: ["PC14", "OSCX_IN"],
  pin3: ["PC15", "OSCX_OUT"],
  pin4: ["VDD", "VDDA", "VDD_VDDA"],
  pin5: ["VSS", "VSSA", "GND", "VSS_VSSA"],
  pin6: ["PF2", "NRST"],
  pin7: ["PA0"],
  pin8: ["PA1"],
  pin9: ["PA2"],
  pin10: ["PA3"],
  pin11: ["PA4"],
  pin12: ["PA5"],
  pin13: ["PA6"],
  pin14: ["PA7"],
  pin15: ["PA8"],
  pin16: ["PA11", "PA9", "USB_DM"],
  pin17: ["PA12", "PA10", "USB_DP"],
  pin18: ["PA13", "SWDIO"],
  pin19: ["PA14", "BOOT0", "SWCLK"],
  pin20: ["PB3", "PB4", "PB5", "PB6"],
} as const

const Tssop20Footprint = () => {
  const pitch = 0.65
  const leftPins = Array.from({ length: 10 }, (_, index) => ({
    pin: index + 1,
    y: (4.5 - index) * pitch,
  }))
  const rightPins = Array.from({ length: 10 }, (_, index) => ({
    pin: 20 - index,
    y: (4.5 - index) * pitch,
  }))

  return (
    <footprint>
      {leftPins.map(({ pin, y }) => (
        <Fragment key={`pin${pin}`}>
          <smtpad
            portHints={[`pin${pin}`]}
            pcbX="-2.85mm"
            pcbY={y}
            width="1.5mm"
            height="0.38mm"
            shape="rect"
          />
        </Fragment>
      ))}
      {rightPins.map(({ pin, y }) => (
        <Fragment key={`pin${pin}`}>
          <smtpad
            portHints={[`pin${pin}`]}
            pcbX="2.85mm"
            pcbY={y}
            width="1.5mm"
            height="0.38mm"
            shape="rect"
          />
        </Fragment>
      ))}
      <silkscreenrect width="4.7mm" height="6.8mm" />
      <silkscreencircle pcbX="-1.7mm" pcbY="2.55mm" radius="0.25mm" />
    </footprint>
  )
}

export const STM32C071FBP6 = (props: ChipProps<typeof stm32Pins>) => (
  <chip
    pinLabels={stm32Pins}
    pinAttributes={{
      VDD_VDDA: { requiresPower: true, mustBeConnected: true },
      VSS_VSSA: { requiresGround: true, mustBeConnected: true },
    }}
    manufacturerPartNumber="STM32C071FBP6"
    supplierPartNumbers={{ digikey: ["497-STM32C071FBP6-ND"] }}
    footprint={<Tssop20Footprint />}
    {...props}
  />
)

const swdPins = {
  pin1: ["V3V3", "3V3"],
  pin2: ["SWDIO"],
  pin3: ["GND"],
  pin4: ["SWCLK"],
  pin5: ["NRST", "RESET"],
} as const

const JstPhSideEntryFootprint = () => {
  const pinCount = 5
  const bodyWidth = 13.9
  const mountingX = bodyWidth / 2 - 0.9

  return (
    <footprint insertionDirection="from_y_pos">
      {Array.from({ length: pinCount }, (_, index) => {
        const pin = index + 1
        const x = (index - (pinCount - 1) / 2) * 2
        return (
          <Fragment key={`pin${pin}`}>
            <smtpad
              portHints={[`pin${pin}`]}
              pcbX={x}
              pcbY="-2.25mm"
              width="1.2mm"
              height="3mm"
              shape="rect"
            />
          </Fragment>
        )
      })}
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
      <silkscreentext text="{NAME}" pcbY="4.5mm" fontSize="1mm" />
    </footprint>
  )
}

export const S5B_PH_SM4_TB = (props: ConnectorProps) => (
  <connector
    pinLabels={swdPins}
    manufacturerPartNumber="S5B-PH-SM4-TB"
    supplierPartNumbers={{ digikey: ["455-S5B-PH-SM4-TBCT-ND"] }}
    footprint={<JstPhSideEntryFootprint />}
    {...props}
  />
)

const JstShTopEntryFootprint = () => (
  <footprint insertionDirection="from_z_pos">
    {Array.from({ length: 5 }, (_, index) => {
      const pin = index + 1
      return (
        <Fragment key={`pin${pin}`}>
          <smtpad
            portHints={[`pin${pin}`]}
            pcbX={index - 2}
            pcbY="-1.325mm"
            width="0.6mm"
            height="1.8mm"
            shape="rect"
          />
        </Fragment>
      )
    })}
    <smtpad
      pcbX="-3mm"
      pcbY="1.325mm"
      width="1.2mm"
      height="1.8mm"
      shape="rect"
    />
    <smtpad
      pcbX="3mm"
      pcbY="1.325mm"
      width="1.2mm"
      height="1.8mm"
      shape="rect"
    />
    <silkscreenrect width="7mm" height="4.2mm" />
    <silkscreentext text="{NAME}" pcbY="2.8mm" fontSize="0.7mm" />
  </footprint>
)

/** Compact five-pin, 1 mm-pitch JST SH top-entry SWD connector. */
export const BM05B_SRSS_TB = (props: ConnectorProps) => (
  <connector
    pinLabels={swdPins}
    manufacturerPartNumber="BM05B-SRSS-TB"
    footprint={<JstShTopEntryFootprint />}
    {...props}
  />
)

const JstSurTopEntryFootprint = () => (
  <footprint insertionDirection="from_z_pos">
    {Array.from({ length: 5 }, (_, index) => {
      const pin = index + 1
      return (
        <Fragment key={`pin${pin}`}>
          <smtpad
            portHints={[`pin${pin}`]}
            pcbX={(index - 2) * 0.8}
            pcbY="-0.85mm"
            width="0.5mm"
            height="1.2mm"
            shape="rect"
          />
        </Fragment>
      )
    })}
    <smtpad
      pcbX="-2.75mm"
      pcbY="0.85mm"
      width="0.7mm"
      height="1.7mm"
      shape="rect"
    />
    <smtpad
      pcbX="2.75mm"
      pcbY="0.85mm"
      width="0.7mm"
      height="1.7mm"
      shape="rect"
    />
    <silkscreenrect width="6.2mm" height="2.7mm" />
    <silkscreentext text="{NAME}" pcbY="2mm" fontSize="0.6mm" />
  </footprint>
)

/** Ultra-compact five-pin, 0.8 mm-pitch JST SUR top-entry SWD connector. */
export const BM05B_SURS_TF = (props: ConnectorProps) => (
  <connector
    pinLabels={swdPins}
    manufacturerPartNumber="BM05B-SURS-TF"
    footprint={<JstSurTopEntryFootprint />}
    {...props}
  />
)
