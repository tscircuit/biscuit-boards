import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"]
} as const

export const HoT_0_45_1_5__8_2_0R_I = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C500755"
  ]
}}
      manufacturerPartNumber="HoT_0_45_1_5__8_2_0R_I"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-4.050029999999879mm" pcbY="0mm" width="1.6999966mm" height="1.9999959999999999mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="4.050030000000106mm" pcbY="0mm" width="1.6999966mm" height="1.9999959999999999mm" shape="rect" />
<silkscreenpath route={[{"x":-2.9694377999999233,"y":-1.0159999999999627},{"x":2.9688282000000754,"y":-1.0159999999999627}]} />
<silkscreenpath route={[{"x":2.9693869999999833,"y":1.0160000000000764},{"x":-2.9688789999999017,"y":1.0160000000000764}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=61092166bc3e4784b94582095478d41c&pn=C500755",
        rotationOffset: { x: 180, y: 0, z: 0 },
        positionOffset: { x: -0.000025399999913133797, y: 0, z: 1.55999848 },
      }}
      {...props}
    />
  )
}