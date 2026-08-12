import { mkdir, rm } from "node:fs/promises"
import { basename, extname, isAbsolute, relative, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { Circuit } from "@tscircuit/core"
import type { CircuitJson } from "circuit-json"
import { generateLightBurnSvg } from "lbrnts"
import { createElement, isValidElement, type ComponentType } from "react"
import {
  BISCUIT_BOARD_LIGHTBURN_COPPER_MARGIN_MM,
  createBiscuitBoardLightburnArtifacts,
} from "../lib/biscuit-board-lightburn"

const circuitFileArgument = Bun.argv[2]
if (!circuitFileArgument) {
  console.error(
    "Usage: bun run scripts/export-lightburn.tsx <circuit-file.tsx>",
  )
  process.exit(1)
}

const workingDirectory = process.cwd()
const circuitFilePath = isAbsolute(circuitFileArgument)
  ? circuitFileArgument
  : resolve(workingDirectory, circuitFileArgument)
if (!(await Bun.file(circuitFilePath).exists())) {
  throw new Error(`Circuit file does not exist: ${circuitFilePath}`)
}

const boardName = basename(circuitFilePath, extname(circuitFilePath)).replace(
  /[^a-zA-Z0-9._-]+/g,
  "-",
)
if (!boardName) throw new Error("Could not derive an output name")

const outputDirectory = resolve(
  import.meta.dir,
  `../dist/lightburn/${boardName}`,
)
const layerDirectory = resolve(outputDirectory, "layers")
const circuitModule = (await import(pathToFileURL(circuitFilePath).href)) as {
  default?: unknown
}
const circuitExport = circuitModule.default
const circuitElement =
  typeof circuitExport === "function"
    ? createElement(circuitExport as ComponentType)
    : circuitExport

if (!isValidElement(circuitElement)) {
  throw new Error(
    `Circuit file must default-export a React component or element: ${circuitFilePath}`,
  )
}

const circuit = new Circuit()
circuit.add(circuitElement)
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

const { fabricationCircuitJson, project, lensDistortionProject, layerFiles } =
  await createBiscuitBoardLightburnArtifacts(circuitJson)
const hasBottomLayers = layerFiles.some((file) =>
  file.cutSettingName.includes("Bottom"),
)
const sourcePath = relative(workingDirectory, circuitFilePath)

// This directory contains generated, gitignored artifacts only. Replacing it
// prevents removed/renamed LightBurn operations from lingering between runs.
await rm(outputDirectory, { force: true, recursive: true })
await mkdir(layerDirectory, { recursive: true })

await Promise.all([
  Bun.write(
    resolve(outputDirectory, `${boardName}.circuit.json`),
    JSON.stringify(circuitJson, null, 2),
  ),
  Bun.write(
    resolve(outputDirectory, `${boardName}.lightburn.circuit.json`),
    JSON.stringify(fabricationCircuitJson, null, 2),
  ),
  Bun.write(
    resolve(outputDirectory, `${boardName}.lightburn.lbrn2`),
    project.getString(),
  ),
  Bun.write(
    resolve(outputDirectory, `${boardName}.lightburn-lensdistortion.lbrn2`),
    lensDistortionProject.getString(),
  ),
  Bun.write(
    resolve(outputDirectory, `${boardName}.lightburn.svg`),
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
        source: sourcePath,
        copperAblationMarginMm: BISCUIT_BOARD_LIGHTBURN_COPPER_MARGIN_MM,
        constraints: {
          layers: hasBottomLayers ? ["top", "bottom"] : ["top"],
          bottomLayerMirrored: hasBottomLayers,
          holesOrBoardCuts: false,
          unusedPrefabricatedVias: false,
        },
        files: {
          circuitJson: `${boardName}.circuit.json`,
          lightburnCircuitJson: `${boardName}.lightburn.circuit.json`,
          combinedLightburn: `${boardName}.lightburn.lbrn2`,
          lensDistortionLightburn: `${boardName}.lightburn-lensdistortion.lbrn2`,
          preview: `${boardName}.lightburn.svg`,
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
  `Exported ${sourcePath} with ${layerFiles.length} LightBurn operation file(s) to ${outputDirectory}`,
)
