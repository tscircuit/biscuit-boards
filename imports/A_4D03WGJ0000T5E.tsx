import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["pin5"],
  pin6: ["pin6"],
  pin7: ["pin7"],
  pin8: ["pin8"]
} as const

export const A_4D03WGJ0000T5E = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C1952"
  ]
}}
      manufacturerPartNumber="A_4D03WGJ0000T5E"
      footprint={<footprint>
        <smtpad portHints={["pin5"]} pcbX="1.1998959999999954mm" pcbY="0.9000489999999957mm" width="0.6500114mm" height="0.7999983999999999mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="1.1998959999999954mm" pcbY="-0.9000489999999957mm" width="0.6500114mm" height="0.7999983999999999mm" shape="rect" />
<smtpad portHints={["pin6"]} pcbX="0.40005000000000024mm" pcbY="0.9000489999999957mm" width="0.49999899999999997mm" height="0.7999983999999999mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="0.40005000000000024mm" pcbY="-0.9000489999999957mm" width="0.49999899999999997mm" height="0.7999983999999999mm" shape="rect" />
<smtpad portHints={["pin7"]} pcbX="-0.40005000000000024mm" pcbY="0.9000489999999957mm" width="0.49999899999999997mm" height="0.7999983999999999mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="-0.40005000000000024mm" pcbY="-0.9000489999999957mm" width="0.49999899999999997mm" height="0.7999983999999999mm" shape="rect" />
<smtpad portHints={["pin8"]} pcbX="-1.1998959999999954mm" pcbY="0.9000489999999957mm" width="0.6500114mm" height="0.7999983999999999mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="-1.1998959999999954mm" pcbY="-0.9000489999999957mm" width="0.6500114mm" height="0.7999983999999999mm" shape="rect" />
<silkscreenpath route={[{"x":1.8695670000000035,"y":-0.45001179999999863},{"x":1.8695670000000035,"y":-1.4497811999999897},{"x":-1.870328999999991,"y":-1.450035200000002},{"x":-1.870328999999991,"y":-0.409905199999983}]} />
<silkscreenpath route={[{"x":-1.8699480000000008,"y":0.44996100000000183},{"x":-1.8699480000000008,"y":1.4697710000000086},{"x":1.8699480000000008,"y":1.4700250000000068},{"x":1.8699480000000008,"y":0.4297171999999989}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=551b3dd0a237409fa823f51b33d3f6d1&pn=C1952",
        rotationOffset: { x: 180, y: 0, z: 0 },
        positionOffset: { x: 0, y: 1.4210854715202004e-14, z: 1.5999984 },
      }}
      {...props}
    />
  )
}