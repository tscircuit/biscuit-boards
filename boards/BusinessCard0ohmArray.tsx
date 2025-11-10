// import { XiaoBoardFootprint } from "../lib/XiaoBoardFootprint"
import { A_4D03WGJ0000T5E as ResistorArray0603 } from "../imports/A_4D03WGJ0000T5E"
import { DF40C_100DS_0_4V_51_ as CM5100PinConnector } from "../imports/DF40C_100DS_0_4V_51_"

const Via = (props: { pcbX: number | string; pcbY: number | string }) => (
  <via
    netIsAssignable
    pcbX={props.pcbX}
    pcbY={props.pcbY}
    fromLayer={"top"}
    toLayer={"bottom"}
    holeDiameter={"0.2mm"}
    outerDiameter={"0.4mm"}
  />
)

const range = (start: number, end: number, inc = 1) => {
  return Array.from({ length: (end - start) / inc }, (_, i) => start + i * inc)
}

const ViaZone = (props: {
  minX: number
  maxX: number
  minY: number
  maxY: number
  spacing: number
}) => {
  const xRange = range(props.minX, props.maxX, props.spacing)
  const yRange = range(props.minY, props.maxY, props.spacing)
  const centeringOffsetX =
    (props.maxX - props.minX - (xRange.length - 1) * props.spacing) / 2
  const centeringOffsetY =
    (props.maxY - props.minY - (yRange.length - 1) * props.spacing) / 2

  return (
    <>
      <pcbnoterect
        color="blue"
        width={props.maxX - props.minX}
        height={props.maxY - props.minY}
        pcbPositionAnchor="center"
        pcbX={props.minX + (props.maxX - props.minX) / 2}
        pcbY={props.minY + (props.maxY - props.minY) / 2}
      />
      {xRange.flatMap((x) =>
        yRange.map((y) => (
          <Via
            key={`${x},${y}`}
            pcbX={x + centeringOffsetX}
            pcbY={y + centeringOffsetY}
          />
        )),
      )}
    </>
  )
}

const boardWidthMm = 75
const boardHeightMm = 55
export default () => (
  <board
    width={`${boardWidthMm}mm`}
    height={`${boardHeightMm}mm`}
    borderRadius="2mm"
  >
    {/* <chip footprint="qfp80" name="U1" pcbX={-6} /> */}
    {/* <chip
      footprint={<XiaoBoardFootprint variant="Receiver" />}
      name="U1"
      pcbX={-6}
      pcbY={-18}
    /> */}
    <silkscreentext
      text="UP"
      pcbX={boardWidthMm / 2 - 10}
      pcbY={25.5}
      layer="top"
      fontSize="2mm"
    />
    <hole
      pcbX={boardWidthMm / 2 - 2.5}
      pcbY={boardHeightMm / 2 - 2.5}
      diameter="2.2mm"
    />
    <hole
      pcbX={boardWidthMm / 2 - 2.5 - 4}
      pcbY={boardHeightMm / 2 - 2.5}
      diameter="2.2mm"
    />
    <hole
      pcbX={boardWidthMm / 2 - 2.5}
      pcbY={-boardHeightMm / 2 + 2.5}
      diameter="2.2mm"
    />
    <hole
      pcbX={-boardWidthMm / 2 + 2.5}
      pcbY={-boardHeightMm / 2 + 2.5}
      diameter="2.2mm"
    />
    <hole
      pcbX={-boardWidthMm / 2 + 2.5}
      pcbY={boardHeightMm / 2 - 2.5}
      diameter="2.2mm"
    />
    <net name="GND" />
    <copperpour
      connectsTo="net.GND"
      layer="top"
      coveredWithSolderMask
      name="PourTop"
    />
    <copperpour
      connectsTo="net.GND"
      layer="bottom"
      coveredWithSolderMask
      name="PourBottom"
    />
    <pcbnotedimension
      from={{ x: -boardWidthMm / 2, y: boardHeightMm / 2 + 2.5 }}
      to={{ x: boardWidthMm / 2, y: boardHeightMm / 2 + 2.5 }}
      text={`${boardWidthMm}mm`}
    />
    <pcbnotedimension
      from={{ x: boardWidthMm / 2 + 2.5, y: -boardHeightMm / 2 }}
      to={{ x: boardWidthMm / 2 + 2.5, y: boardHeightMm / 2 }}
      text={`${boardHeightMm}mm`}
    />
    <ResistorArray0603
      name="R1"
      pcbX={-boardWidthMm / 2 + 8}
      pcbY={-boardHeightMm / 2 + 8}
    />
    <ResistorArray0603
      name="R2"
      pcbX={-boardWidthMm / 2 + 8}
      pcbY={boardHeightMm / 2 - 8}
    />
    <ResistorArray0603 name="R3" pcbX={-5} pcbY={6} />
    <ResistorArray0603 name="R4" pcbX={-5} pcbY={-6} />
    <ResistorArray0603 name="R5" pcbX={-11.5} pcbY={6} />
    <ResistorArray0603 name="R6" pcbX={-11.5} pcbY={-6} />
    <ResistorArray0603 name="R7" pcbX={-18} pcbY={6} />
    <ResistorArray0603 name="R8" pcbX={-18} pcbY={-6} />

    <ResistorArray0603 name="R9" pcbX={14} pcbY={21} />
    <ResistorArray0603 name="R10" pcbX={22} pcbY={21} />

    {range(0, 5).map((n) => (
      <ResistorArray0603
        name={`RR_${n + 1}`}
        pcbX={boardWidthMm / 2 - 6}
        pcbY={boardHeightMm / 2 - 11.5 - n * 8}
        pcbRotation="90deg"
      />
    ))}
  </board>
)
