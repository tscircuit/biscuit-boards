import { copyFile, mkdir, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, dirname, extname, isAbsolute, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { Circuit } from "@tscircuit/core"
import type { CircuitJson, PcbBoard } from "circuit-json"
import { type ComponentType, createElement, isValidElement } from "react"
import { addFullCopperPours } from "./lib/add-full-copper-pours"
import { getBoardsMissingFullCopperRegions } from "./lib/verify-full-copper-gerber"

const circuitFileArgument = Bun.argv[2]
if (!circuitFileArgument) {
  console.error(
    "Usage: bun run export:gerbers <circuit-file.tsx|circuit.json> [output.zip]",
  )
  process.exit(1)
}

const workingDirectory = process.cwd()
const circuitFilePath = isAbsolute(circuitFileArgument)
  ? circuitFileArgument
  : resolve(workingDirectory, circuitFileArgument)
const circuitFile = Bun.file(circuitFilePath)
if (!(await circuitFile.exists())) {
  throw new Error(`Circuit file does not exist: ${circuitFilePath}`)
}

const boardName = basename(circuitFilePath, extname(circuitFilePath)).replace(
  /[^a-zA-Z0-9._-]+/g,
  "-",
)
if (!boardName) throw new Error("Could not derive an output name")

const outputArgument = Bun.argv[3]
const outputPath = outputArgument
  ? isAbsolute(outputArgument)
    ? outputArgument
    : resolve(workingDirectory, outputArgument)
  : resolve(workingDirectory, `dist/gerbers/${boardName}.zip`)
if (extname(outputPath).toLowerCase() !== ".zip") {
  throw new Error(`Gerber output must be a .zip file: ${outputPath}`)
}

const temporaryDirectory = await mkdtemp(resolve(tmpdir(), "gerber-export-"))
const temporaryArchivePath = resolve(temporaryDirectory, `${boardName}.zip`)
const temporaryCircuitPath = resolve(
  temporaryDirectory,
  `${boardName}.circuit.json`,
)
const tsciPath = resolve(import.meta.dir, "../node_modules/.bin/tsci")

try {
  let circuitJson: CircuitJson
  if (extname(circuitFilePath).toLowerCase() === ".json") {
    circuitJson = (await circuitFile.json()) as CircuitJson
  } else {
    const circuitModule = (await import(
      pathToFileURL(circuitFilePath).href
    )) as {
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
    circuitJson = circuit.getCircuitJson() as CircuitJson
  }
  const pcbBoards = circuitJson.filter(
    (element): element is PcbBoard => element.type === "pcb_board",
  )
  const fabricationCircuitJson = addFullCopperPours(circuitJson)
  await Bun.write(temporaryCircuitPath, JSON.stringify(fabricationCircuitJson))

  const exportProcess = Bun.spawn(
    [
      tsciPath,
      "export",
      temporaryCircuitPath,
      "--format",
      "gerbers",
      "--output",
      basename(temporaryArchivePath),
      "--disable-parts-engine",
    ],
    { cwd: workingDirectory, stderr: "inherit", stdout: "inherit" },
  )
  const exportExitCode = await exportProcess.exited
  if (exportExitCode !== 0) {
    throw new Error(`Gerber export failed with exit code ${exportExitCode}`)
  }
  if (!(await Bun.file(temporaryArchivePath).exists())) {
    throw new Error(`Gerber exporter did not create ${temporaryArchivePath}`)
  }

  const removeMaskProcess = Bun.spawn(
    ["zip", "-d", temporaryArchivePath, "F_Mask.gbr", "B_Mask.gbr"],
    { stderr: "inherit", stdout: "inherit" },
  )
  const removeMaskExitCode = await removeMaskProcess.exited
  if (removeMaskExitCode !== 0) {
    throw new Error(
      `Failed to remove solder-mask layers with exit code ${removeMaskExitCode}`,
    )
  }

  for (const layer of ["F_Cu.gbr", "B_Cu.gbr"]) {
    const inspectProcess = Bun.spawn(
      ["unzip", "-p", temporaryArchivePath, layer],
      { stderr: "inherit", stdout: "pipe" },
    )
    const gerber = await new Response(inspectProcess.stdout).text()
    if ((await inspectProcess.exited) !== 0) {
      throw new Error(`Could not inspect ${layer} in ${temporaryArchivePath}`)
    }
    const missingFullCopperBoards = getBoardsMissingFullCopperRegions(
      gerber,
      pcbBoards,
    )
    if (missingFullCopperBoards.length > 0) {
      throw new Error(
        `${layer} does not contain board-outline-sized solid copper for: ${missingFullCopperBoards
          .map((pcbBoard) => pcbBoard.pcb_board_id)
          .join(", ")}`,
      )
    }
  }
  console.log(
    `Verified full-board top and bottom copper for ${pcbBoards.length} board(s)`,
  )

  await mkdir(dirname(outputPath), { recursive: true })
  await copyFile(temporaryArchivePath, outputPath)
} finally {
  await rm(temporaryDirectory, { force: true, recursive: true })
}

console.log(`Exported solder-mask-free Gerbers to ${outputPath}`)
