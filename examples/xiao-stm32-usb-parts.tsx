import type { ChipProps, ConnectorProps } from "@tscircuit/props"
import { Fragment } from "react"

const usbPins = {
  pin1: ["GND"],
  pin2: ["VBUS", "V5"],
  pin3: ["CC1"],
  pin4: ["DPLUS", "USB_DP"],
  pin5: ["DMINUS", "USB_DM"],
  pin6: ["CC2"],
} as const

const UsbCUsb2ModuleFootprint = () => (
  <footprint insertionDirection="from_y_pos">
    {Array.from({ length: 6 }, (_, index) => (
      <Fragment key={`usb-pin-${index + 1}`}>
        <smtpad
          portHints={[`pin${index + 1}`]}
          pcbX={(index - 2.5) * 1.1}
          pcbY="-2.4mm"
          width="0.6mm"
          height="1.5mm"
          shape="rect"
        />
      </Fragment>
    ))}
    <hole pcbX="-3.8mm" diameter="0.7mm" />
    <hole pcbX="3.8mm" diameter="0.7mm" />
    <silkscreenrect width="9mm" height="6mm" />
    <silkscreentext text="USB-C" pcbY="0.6mm" fontSize="0.65mm" />
  </footprint>
)

/** Compact six-pin USB-C USB2 module used to validate the XIAO via field. */
export const UsbCUsb2Module = (props: ConnectorProps) => (
  <connector
    pinLabels={usbPins}
    manufacturerPartNumber="GENERIC-USB-C-USB2-6PIN-MODULE"
    footprint={<UsbCUsb2ModuleFootprint />}
    {...props}
  />
)

const ldoPins = {
  pin1: ["GND"],
  pin2: ["VIN"],
  pin3: ["VOUT", "V3V3"],
} as const

const Sot23Footprint = () => (
  <footprint>
    <smtpad
      portHints={["pin1"]}
      pcbX="-1.45mm"
      pcbY="-0.95mm"
      width="1.2mm"
      height="0.7mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin2"]}
      pcbX="-1.45mm"
      pcbY="0.95mm"
      width="1.2mm"
      height="0.7mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin3"]}
      pcbX="1.45mm"
      width="1.2mm"
      height="0.7mm"
      shape="rect"
    />
    <silkscreenrect width="3mm" height="3mm" />
    <silkscreencircle pcbX="-0.9mm" pcbY="-0.9mm" radius="0.18mm" />
  </footprint>
)

export const XC6206P332MR = (props: ChipProps<typeof ldoPins>) => (
  <chip
    pinLabels={ldoPins}
    pinAttributes={{
      VIN: { requiresPower: true, mustBeConnected: true },
      VOUT: { requiresPower: true, mustBeConnected: true },
      GND: { requiresGround: true, mustBeConnected: true },
    }}
    manufacturerPartNumber="XC6206P332MR-G"
    supplierPartNumbers={{ jlcpcb: ["C5446"] }}
    footprint={<Sot23Footprint />}
    {...props}
  />
)
