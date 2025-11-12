const pitch = 1
const boardSize = 10
const pinsPerSide = 8
const boardEdgeMargin = (boardSize - pitch * (pinsPerSide - 1)) / 2

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i)

const CastellatedHole = (props: {
  name: string
  pcbX: number | string
  pcbY: number | string
  facingDirection: "x+" | "x-" | "y+" | "y-"
}) => {
  const horz = props.facingDirection?.split("")[0] === "x"
  const vert = props.facingDirection?.split("")[0] === "y"
  return (
    <platedhole
      shape="circular_hole_with_rect_pad"
      holeDiameter={0.5}
      rectPadWidth={horz ? 0.6 : 0.6}
      rectPadHeight={vert ? 0.6 : 0.6}
      portHints={[props.name]}
      holeOffsetX={
        props.facingDirection === "x+"
          ? -0.25
          : props.facingDirection === "x-"
            ? 0.25
            : 0
      }
      holeOffsetY={
        props.facingDirection === "y+"
          ? -0.25
          : props.facingDirection === "y-"
            ? 0.25
            : 0
      }
      pcbX={props.pcbX}
      pcbY={props.pcbY}
    />
  )
}

export default () => (
  <board width={`${boardSize}mm`} height={`${boardSize}mm`} layers={4}>
    <pinout
      name="P"
      noSchematicRepresentation
      footprint={
        <footprint>
          {range(1, pinsPerSide)
            .map((n) => ({
              pinNumber: n,
              index: n - 1,
            }))
            .map(({ index, pinNumber }) => (
              <CastellatedHole
                facingDirection="x+"
                pcbX={-boardSize / 2 + 0.25}
                pcbY={boardSize / 2 - index - boardEdgeMargin}
                name={`pin${pinNumber}`}
              />
            ))}
          {range(1, pinsPerSide)
            .map((n) => ({
              pinNumber: pinsPerSide + n,
              index: n - 1,
            }))
            .map(({ index, pinNumber }) => (
              <CastellatedHole
                facingDirection="y-"
                pcbX={-boardSize / 2 + index + boardEdgeMargin}
                pcbY={boardSize / 2 - 0.25}
                name={`pin${pinNumber}`}
              />
            ))}
          {range(1, pinsPerSide)
            .map((n) => ({
              pinNumber: pinsPerSide * 2 + n,
              index: n - 1,
            }))
            .map(({ index, pinNumber }) => (
              <CastellatedHole
                facingDirection="x-"
                pcbX={boardSize / 2 - 0.25}
                pcbY={boardSize / 2 - index - boardEdgeMargin}
                name={`pin${pinNumber}`}
              />
            ))}
          {range(1, pinsPerSide)
            .map((n) => ({
              pinNumber: pinsPerSide * 3 + n,
              index: n - 1,
            }))
            .map(({ index, pinNumber }) => (
              <CastellatedHole
                facingDirection="y+"
                pcbX={boardSize / 2 - index - boardEdgeMargin}
                pcbY={-boardSize / 2 + 0.25}
                name={`pin${pinNumber}`}
              />
            ))}
        </footprint>
      }
    />
    {range(1, pinsPerSide).map((n) => (
      <trace from={`P.pin${n}`} to={`P.pin${pinsPerSide * 3 + 1 - n}`} />
    ))}
    {range(1, 6).map((n) => (
      <trace
        from={`P.pin${pinsPerSide + n}`}
        to={`P.pin${pinsPerSide * 3 + n}`}
      />
    ))}
  </board>
)
