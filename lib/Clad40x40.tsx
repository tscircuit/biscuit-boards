import type { AutorouterProp } from "@tscircuit/props"
import type { ReactNode } from "react"

export const CLAD_40X40_WIDTH = 40
export const CLAD_40X40_HEIGHT = 40

export interface Clad40x40Props {
  children?: ReactNode
  autorouter?: AutorouterProp
  /** Enforced minimum trace width in millimeters. */
  minTraceWidth?: number
  routingDisabled?: boolean
}

/** A bare two-layer 40 mm x 40 mm copper clad. */
export const Clad40x40 = ({
  children,
  autorouter,
  minTraceWidth,
  routingDisabled = false,
}: Clad40x40Props) => (
  <board
    name="Clad40x40"
    title="40 mm x 40 mm copper clad"
    width={`${CLAD_40X40_WIDTH}mm`}
    height={`${CLAD_40X40_HEIGHT}mm`}
    borderRadius="1.5mm"
    layers={2}
    minTraceWidth={`${minTraceWidth ?? 0.15}mm`}
    autorouter={autorouter}
    routingDisabled={routingDisabled}
  >
    <pcbnotedimension
      from={{
        x: -CLAD_40X40_WIDTH / 2,
        y: CLAD_40X40_HEIGHT / 2 + 2.5,
      }}
      to={{
        x: CLAD_40X40_WIDTH / 2,
        y: CLAD_40X40_HEIGHT / 2 + 2.5,
      }}
      text={`${CLAD_40X40_WIDTH}mm`}
    />
    <pcbnotedimension
      from={{
        x: CLAD_40X40_WIDTH / 2 + 2.5,
        y: -CLAD_40X40_HEIGHT / 2,
      }}
      to={{
        x: CLAD_40X40_WIDTH / 2 + 2.5,
        y: CLAD_40X40_HEIGHT / 2,
      }}
      text={`${CLAD_40X40_HEIGHT}mm`}
    />

    {children}
  </board>
)
