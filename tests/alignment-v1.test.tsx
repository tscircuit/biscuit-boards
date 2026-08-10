import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import "bun-match-svg"
import type { CircuitJson } from "circuit-json"
import { generateLightBurnSvg } from "lbrnts"
import AlignmentV1, { ALIGNMENT_V1_VIA_POSITIONS } from "../boards/alignment_v1"
import {
  ALIGNMENT_V1_LIGHTBURN_SVG_OPTIONS,
  createAlignmentV1LightBurnArtifacts,
} from "../lib/alignment-v1-lightburn"

test("renders alignment_v1 and exports its LightBurn layers", async () => {
  const circuit = new Circuit()
  circuit.add(<AlignmentV1 />)

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson() as CircuitJson
  const vias = circuitJson.filter((element) => element.type === "pcb_via")

  expect(ALIGNMENT_V1_VIA_POSITIONS).toHaveLength(21)
  expect(vias).toHaveLength(ALIGNMENT_V1_VIA_POSITIONS.length)
  expect(
    vias.map((via) =>
      via.type === "pcb_via" ? { x: via.x, y: via.y } : undefined,
    ),
  ).toEqual([...ALIGNMENT_V1_VIA_POSITIONS])

  const { project, layerFiles, toolingPoints, viaPoints } =
    createAlignmentV1LightBurnArtifacts(circuitJson)
  expect(toolingPoints).toEqual([
    { x: -31.5, y: -21.5 },
    { x: -31.5, y: 21.5 },
    { x: 26.75, y: 23.5 },
    { x: 32.5, y: 22 },
    { x: 32.5, y: -22 },
  ])
  expect(viaPoints).toHaveLength(16)
  expect(
    layerFiles.map(({ cutIndex, cutSettingName, shapeCount }) => ({
      cutIndex,
      cutSettingName,
      shapeCount,
    })),
  ).toEqual([
    { cutIndex: 30, cutSettingName: "T1", shapeCount: 5 },
    { cutIndex: 6, cutSettingName: "Via Points", shapeCount: 16 },
  ])

  const lightBurnSvg = generateLightBurnSvg(
    project,
    ALIGNMENT_V1_LIGHTBURN_SVG_OPTIONS,
  )
  expect(lightBurnSvg.match(/stroke="black"/g)).toHaveLength(5)
  expect(lightBurnSvg.match(/stroke="#00FFFF"/g)).toHaveLength(16)
  await expect(lightBurnSvg).toMatchSvgSnapshot(import.meta.path)
})
