const pitch = 1
const boardSize = 10
const pinsPerSide = 8
const boardEdgeMargin = (boardSize - pitch * (pinsPerSide - 1)) / 2

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i)

const LGAPad = (props: {
  name: string
  pcbX: number | string
  pcbY: number | string
}) => {
  return (
    <smtpad
      shape="rect"
      width={0.6}
      height={0.6}
      portHints={[props.name]}
      pcbX={props.pcbX}
      pcbY={props.pcbY}
      layer="bottom"
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
          {/* Left side (x-) */}
          {range(1, pinsPerSide)
            .map((n) => ({
              pinNumber: n,
              index: n - 1,
            }))
            .map(({ index, pinNumber }) => (
              <LGAPad
                pcbX={-boardSize / 2 + boardEdgeMargin}
                pcbY={boardSize / 2 - boardEdgeMargin - index * pitch}
                name={`pin${pinNumber}`}
              />
            ))}
          {/* Top side (y+) */}
          {range(1, pinsPerSide)
            .map((n) => ({
              pinNumber: pinsPerSide + n,
              index: n - 1,
            }))
            .map(({ index, pinNumber }) => (
              <LGAPad
                pcbX={-boardSize / 2 + boardEdgeMargin + index * pitch}
                pcbY={boardSize / 2 - boardEdgeMargin}
                name={`pin${pinNumber}`}
              />
            ))}
          {/* Right side (x+) */}
          {range(1, pinsPerSide)
            .map((n) => ({
              pinNumber: pinsPerSide * 2 + n,
              index: n - 1,
            }))
            .map(({ index, pinNumber }) => (
              <LGAPad
                pcbX={boardSize / 2 - boardEdgeMargin}
                pcbY={boardSize / 2 - boardEdgeMargin - index * pitch}
                name={`pin${pinNumber}`}
              />
            ))}
          {/* Bottom side (y-) */}
          {range(1, pinsPerSide)
            .map((n) => ({
              pinNumber: pinsPerSide * 3 + n,
              index: n - 1,
            }))
            .map(({ index, pinNumber }) => (
              <LGAPad
                pcbX={boardSize / 2 - boardEdgeMargin - index * pitch}
                pcbY={-boardSize / 2 + boardEdgeMargin}
                name={`pin${pinNumber}`}
              />
            ))}
        </footprint>
      }
    />
    {/* Bridge traces connecting opposite sides */}
    {range(1, pinsPerSide).map((n) => (
      <trace from={`P.pin${n}`} to={`P.pin${pinsPerSide * 2 + n}`} />
    ))}
    {range(1, pinsPerSide).map((n) => (
      <trace
        from={`P.pin${pinsPerSide + n}`}
        to={`P.pin${pinsPerSide * 3 + 1 - n}`}
      />
    ))}
  </board>
)
