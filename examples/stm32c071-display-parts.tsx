import type { ConnectorProps, PushButtonProps } from "@tscircuit/props"
import { Fragment } from "react"

// Additional component models used by the display-board example.

const displayPins = {
  pin1: ["GND"],
  pin2: ["V3V3", "3V3"],
  pin3: ["SCL"],
  pin4: ["SDA"],
} as const

const FemaleHeader2x4Footprint = () => {
  const pads = [-3.81, -1.27, 1.27, 3.81].map((x, index) => ({
    pin: index + 1,
    x,
  }))

  return (
    <footprint insertionDirection="from_z_pos">
      {pads.map(({ pin, x }) => (
        <Fragment key={`pin${pin}`}>
          <smtpad
            portHints={[`pin${pin}`]}
            pcbX={x}
            width="1.2mm"
            height="6mm"
            shape="rect"
          />
        </Fragment>
      ))}
      <silkscreenrect width="10.4mm" height="7mm" />
      <silkscreencircle pcbX="-4.45mm" pcbY="-2.8mm" radius="0.22mm" />
    </footprint>
  )
}

export const FemalePinHeader2x4 = (props: ConnectorProps) => (
  <connector
    pinLabels={displayPins}
    manufacturerPartNumber="GENERIC-2X4-FEMALE-SMD-2.54MM"
    footprint={<FemaleHeader2x4Footprint />}
    {...props}
  />
)

const buttonPins = {
  pin1: ["A"],
  pin2: ["A_ALT"],
  pin3: ["B"],
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
  </footprint>
)

export const B3FS_1000P = (props: PushButtonProps<typeof buttonPins>) => (
  <pushbutton
    pinLabels={buttonPins}
    internallyConnectedPins={[
      ["pin1", "pin2"],
      ["pin3", "pin4"],
    ]}
    manufacturerPartNumber="B3FS-1000P"
    supplierPartNumbers={{ digikey: ["SW423CT-ND"] }}
    footprint={<B3fsFootprint />}
    {...props}
  />
)
