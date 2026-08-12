import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import "bun-match-svg"
import type { CircuitJson, PcbTrace, PcbVia } from "circuit-json"
import { generateLightBurnSvg } from "lbrnts"
import { Stm32c071BiscuitBoard } from "../examples/stm32c071"
import { BISCUIT_BOARD_VIA_POSITIONS } from "../lib/BiscuitBoard"
import {
  createBiscuitBoardLightburnArtifacts,
  prepareCircuitJsonForBiscuitBoardLightburn,
} from "../lib/biscuit-board-lightburn"

test("exports the STM32C071 board as drill-free top-side LightBurn operations", async () => {
  const circuit = new Circuit()
  circuit.add(<Stm32c071BiscuitBoard />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson() as CircuitJson
  const errors = circuitJson.filter((element) => element.type.endsWith("error"))
  expect(errors).toEqual([])

  const { fabricationCircuitJson, project, layerFiles } =
    await createBiscuitBoardLightburnArtifacts(circuitJson)
  const lightburnXml = project.getString()
  const operationNames = layerFiles.map((file) => file.cutSettingName)

  expect(
    circuitJson.filter((element) => element.type === "pcb_via"),
  ).toHaveLength(BISCUIT_BOARD_VIA_POSITIONS.length)
  expect(
    circuitJson.filter((element) => element.type === "pcb_hole"),
  ).toHaveLength(5)
  expect(
    fabricationCircuitJson.filter(
      (element) => element.type === "pcb_hole" || element.type === "pcb_cutout",
    ),
  ).toEqual([])
  expect(
    fabricationCircuitJson.filter((element) => element.type === "pcb_via"),
  ).toEqual([])

  expect(operationNames.toSorted()).toEqual(
    [
      "Ablate Around Top Copper",
      "Ablate Top Copper Outline",
      "Ablate Top Pads",
    ].toSorted(),
  )
  expect(layerFiles.every((file) => file.shapeCount > 0)).toBe(true)
  const padOperation = layerFiles.find(
    (file) => file.cutSettingName === "Ablate Top Pads",
  )
  const copperMarginOperation = layerFiles.find(
    (file) => file.cutSettingName === "Ablate Around Top Copper",
  )
  expect(padOperation?.shapeCount).toBe(
    circuitJson.filter(
      (element) => element.type === "pcb_smtpad" && element.layer === "top",
    ).length,
  )
  expect(padOperation?.content).toContain('<CutSetting type="Scan">')
  expect(copperMarginOperation?.content).toContain('<CutSetting type="Scan">')
  expect(lightburnXml).not.toContain("Cut Through Board")
  expect(lightburnXml).not.toContain("Hole Punch")
  expect(lightburnXml).not.toContain("Bottom")
  expect(lightburnXml).not.toMatch(/CutIndex="2"/)

  const via = circuitJson.find(
    (element): element is PcbVia => element.type === "pcb_via",
  )
  const trace = circuitJson.find(
    (element): element is PcbTrace => element.type === "pcb_trace",
  )
  expect(via).toBeDefined()
  expect(trace).toBeDefined()

  const circuitJsonWithUsedVia = circuitJson.map((element) =>
    element === trace && via
      ? {
          ...trace,
          connectsTo: [
            ...((
              trace as PcbTrace & {
                connectsTo?: string[]
              }
            ).connectsTo ?? []),
            via.pcb_via_id,
          ],
        }
      : element,
  ) as CircuitJson
  const usedViaOutput = prepareCircuitJsonForBiscuitBoardLightburn(
    circuitJsonWithUsedVia,
  ).filter((element): element is PcbVia => element.type === "pcb_via")

  expect(usedViaOutput).toHaveLength(1)
  expect(usedViaOutput[0]).toMatchObject({
    pcb_via_id: via?.pcb_via_id,
    pcb_trace_id: trace?.pcb_trace_id,
    hole_diameter: 0,
  })

  const lightburnSvg = generateLightBurnSvg(project, {
    margin: 2,
    width: 1400,
    height: 900,
    defaultStrokeWidth: 0.1,
  })
  await expect(lightburnSvg).toMatchSvgSnapshot(import.meta.path)
}, 30_000)
