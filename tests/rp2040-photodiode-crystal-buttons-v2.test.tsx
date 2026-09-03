import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import {
  RP2040_PHOTODIODE_V2_COMPONENT_POSITIONS,
  Rp2040PhotodiodeCrystalButtonsBiscuitBoardV2,
} from "../examples/rp2040-photodiode-crystal-buttons-v2"
import { BISCUIT_BOARD_V2_VIA_POSITIONS } from "../lib/biscuit-board-v2"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

test("routes the RP2040 photodiode circuit using only V2 prefab vias", async () => {
  const circuit = new Circuit()
  circuit.add(<Rp2040PhotodiodeCrystalButtonsBiscuitBoardV2 />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter((element) => element.type.endsWith("error"))
  const vias = circuitJson.filter((element) => element.type === "pcb_via")
  const allowedViaPositions = new Set(
    BISCUIT_BOARD_V2_VIA_POSITIONS.map(pointKey),
  )

  expect(errors).toEqual([])
  expect(vias).toHaveLength(BISCUIT_BOARD_V2_VIA_POSITIONS.length)
  expect(
    vias.every(
      (via) =>
        via.net_is_assignable === true &&
        allowedViaPositions.has(pointKey(via)),
    ),
  ).toBe(true)

  const pcbComponentsBySourceId = new Map(
    circuitJson.flatMap((element) =>
      element.type === "pcb_component"
        ? [[element.source_component_id, element] as const]
        : [],
    ),
  )
  const componentPositions = new Map(
    circuitJson.flatMap((element) => {
      if (element.type !== "source_component" || !element.name) return []
      const pcbComponent = pcbComponentsBySourceId.get(
        element.source_component_id,
      )
      return pcbComponent
        ? [
            [
              element.name,
              { x: pcbComponent.center.x, y: pcbComponent.center.y },
            ] as const,
          ]
        : []
    }),
  )

  for (const componentName of [
    "U1",
    "U_FLASH",
    "U_TIA",
    "SW_BOOTSEL",
    "SW_RESET",
  ] as const) {
    expect(componentPositions.get(componentName)).toEqual(
      RP2040_PHOTODIODE_V2_COMPONENT_POSITIONS[componentName],
    )
  }
  expect(componentPositions.get("D_PHOTO")).toEqual({
    x: RP2040_PHOTODIODE_V2_COMPONENT_POSITIONS.D_PHOTO.x,
    y: RP2040_PHOTODIODE_V2_COMPONENT_POSITIONS.D_PHOTO.y + 1.27,
  })
  expect(componentPositions.get("D_USER")).toEqual({
    x: 10.308924492916013,
    y: 21.684614343444117,
  })
}, 120_000)
