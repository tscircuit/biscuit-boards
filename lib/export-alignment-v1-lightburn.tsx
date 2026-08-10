import { mkdir, rm } from "node:fs/promises"
import { resolve } from "node:path"
import { Circuit } from "@tscircuit/core"
import type { CircuitJson } from "circuit-json"
import { generateLightBurnSvg } from "lbrnts"
import { AlignmentV1 } from "../boards/alignment_v1"
import {
  ALIGNMENT_V1_LIGHTBURN_SVG_OPTIONS,
  createAlignmentV1LightBurnArtifacts,
} from "./alignment-v1-lightburn"

export interface AlignmentV1LightBurnExportResult {
  outputDirectory: string
  toolingPointCount: number
  viaPointCount: number
}

export const exportAlignmentV1LightBurn =
  async (): Promise<AlignmentV1LightBurnExportResult> => {
    const outputDirectory = resolve(
      import.meta.dir,
      "../dist/lightburn/alignment_v1",
    )
    const layerDirectory = resolve(outputDirectory, "layers")
    const circuit = new Circuit()
    circuit.add(<AlignmentV1 />)
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

    const { project, layerFiles, toolingPoints, viaPoints } =
      createAlignmentV1LightBurnArtifacts(circuitJson)

    await rm(outputDirectory, { force: true, recursive: true })
    await mkdir(layerDirectory, { recursive: true })

    await Promise.all([
      Bun.write(
        resolve(outputDirectory, "alignment_v1.circuit.json"),
        JSON.stringify(circuitJson, null, 2),
      ),
      Bun.write(
        resolve(outputDirectory, "alignment_v1.lbrn2"),
        project.getString(),
      ),
      Bun.write(
        resolve(outputDirectory, "alignment_v1.lightburn.svg"),
        generateLightBurnSvg(project, ALIGNMENT_V1_LIGHTBURN_SVG_OPTIONS),
      ),
      ...layerFiles.map((layerFile) =>
        Bun.write(
          resolve(layerDirectory, layerFile.fileName),
          layerFile.content,
        ),
      ),
      Bun.write(
        resolve(outputDirectory, "manifest.json"),
        JSON.stringify(
          {
            source: "boards/alignment_v1.tsx",
            files: {
              circuit_json: "alignment_v1.circuit.json",
              combined_lightburn: "alignment_v1.lbrn2",
              preview: "alignment_v1.lightburn.svg",
              operations: layerFiles.map((layerFile) => ({
                path: `layers/${layerFile.fileName}`,
                name: layerFile.cutSettingName,
                shape_count: layerFile.shapeCount,
              })),
            },
            layers: {
              tooling: { name: "T1", points: toolingPoints },
              vias: { name: "Via Points", points: viaPoints },
            },
          },
          null,
          2,
        ),
      ),
    ])

    return {
      outputDirectory,
      toolingPointCount: toolingPoints.length,
      viaPointCount: viaPoints.length,
    }
  }
