import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
} as const

export const ZX_PZ1_0_2_2PWZ = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C41370696"],
      }}
      manufacturerPartNumber="ZX_PZ1_0_2_2PWZ"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.49999899999988884mm"
            pcbY="1.799970999999914mm"
            width="0.5599937999999999mm"
            height="2.3999951999999998mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="0.4999990000000025mm"
            pcbY="1.799970999999914mm"
            width="0.5599937999999999mm"
            height="2.3999951999999998mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-0.49999899999988884mm"
            pcbY="-1.7999710000000277mm"
            width="0.5599937999999999mm"
            height="2.3999951999999998mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.4999990000000025mm"
            pcbY="-1.7999710000000277mm"
            width="0.5599937999999999mm"
            height="2.3999951999999998mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 0.999998000000005, y: 0.5353303999997934 },
              { x: 0.999998000000005, y: -0.5353049999999939 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.9999979999998914, y: 0.5353303999997934 },
              { x: -0.9999979999998914, y: -0.5353049999999939 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=c12a94457e3f410186a108354c85cebe&pn=C41370696",
        rotationOffset: { x: 0, y: 0, z: 0 },
        positionOffset: { x: 1.1368683772161603e-13, y: 0, z: 0.4 },
      }}
      {...props}
    />
  )
}
