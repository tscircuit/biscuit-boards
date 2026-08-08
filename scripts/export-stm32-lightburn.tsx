import { mkdir, rm } from "node:fs/promises"
import { resolve } from "node:path"
import { Circuit } from "@tscircuit/core"
import type { CircuitJson } from "circuit-json"
import { generateLightBurnSvg } from "lbrnts"
import { Stm32c071BiscuitBoard } from "../examples/stm32c071"
import {
  BISCUIT_BOARD_LIGHTBURN_COPPER_MARGIN_MM,
  createBiscuitBoardLightburnArtifacts,
} from "../lib/biscuit-board-lightburn"

const outputDirectory = resolve(import.meta.dir, "../dist/lightburn/stm32c071")
const layerDirectory = resolve(outputDirectory, "layers")

const circuit = new Circuit()
circuit.add(<Stm32c071BiscuitBoard />)
await circuit.renderUntilSettled()

const circuitJson = circuit.getCircuitJson() as CircuitJson
const renderErrors = circuitJson.filter((element) =>
  element.type.endsWith("error"),
)
if (renderErrors.length > 0) {
  throw new Error(
    `Circuit render produced ${renderErrors.length} error(s): ${JSON.stringify(renderErrors, null, 2)}`,
  )
}

const { fabricationCircuitJson, project, layerFiles } =
  await createBiscuitBoardLightburnArtifacts(circuitJson)

// This directory contains generated, gitignored artifacts only. Replacing it
// prevents removed/renamed LightBurn operations from lingering between runs.
await rm(outputDirectory, { force: true, recursive: true })
await mkdir(layerDirectory, { recursive: true })

await Promise.all([
  Bun.write(
    resolve(outputDirectory, "stm32c071.circuit.json"),
    JSON.stringify(circuitJson, null, 2),
  ),
  Bun.write(
    resolve(outputDirectory, "stm32c071.lightburn.circuit.json"),
    JSON.stringify(fabricationCircuitJson, null, 2),
  ),
  Bun.write(
    resolve(outputDirectory, "stm32c071.lightburn.lbrn2"),
    project.getString(),
  ),
  Bun.write(
    resolve(outputDirectory, "stm32c071.lightburn.svg"),
    generateLightBurnSvg(project, {
      margin: 2,
      width: 1400,
      height: 900,
      defaultStrokeWidth: 0.1,
    }),
  ),
  ...layerFiles.map((file) =>
    Bun.write(resolve(layerDirectory, file.fileName), file.content),
  ),
  Bun.write(
    resolve(outputDirectory, "manifest.json"),
    JSON.stringify(
      {
        source: "examples/stm32c071.tsx",
        copperAblationMarginMm: BISCUIT_BOARD_LIGHTBURN_COPPER_MARGIN_MM,
        constraints: {
          layers: ["top"],
          holesOrBoardCuts: false,
          unusedPrefabricatedVias: false,
        },
        files: {
          circuitJson: "stm32c071.circuit.json",
          lightburnCircuitJson: "stm32c071.lightburn.circuit.json",
          combinedLightburn: "stm32c071.lightburn.lbrn2",
          preview: "stm32c071.lightburn.svg",
          operations: layerFiles.map((file) => ({
            path: `layers/${file.fileName}`,
            name: file.cutSettingName,
            shapeCount: file.shapeCount,
          })),
        },
      },
      null,
      2,
    ),
  ),
])

console.log(
  `Exported STM32C071 Circuit JSON and ${layerFiles.length} LightBurn operation file(s) to ${outputDirectory}`,
)
