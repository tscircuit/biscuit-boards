import { copyFile, mkdir, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  relative,
  resolve,
} from "node:path"

const circuitFileArgument = Bun.argv[2]
if (!circuitFileArgument) {
  console.error(
    "Usage: bun run export:gerbers:no-solder-mask <circuit-file.tsx> [output.zip]",
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

const outputArgument = Bun.argv[3]
const outputPath = outputArgument
  ? isAbsolute(outputArgument)
    ? outputArgument
    : resolve(workingDirectory, outputArgument)
  : resolve(workingDirectory, `dist/gerbers/${boardName}.zip`)
if (extname(outputPath).toLowerCase() !== ".zip") {
  throw new Error(`Gerber output must be a .zip file: ${outputPath}`)
}

const temporaryDirectory = await mkdtemp(resolve(tmpdir(), "panelize-gerbers-"))
const temporaryArchivePath = resolve(temporaryDirectory, `${boardName}.zip`)
const tsciPath = resolve(import.meta.dir, "../node_modules/.bin/tsci")

try {
  const exportProcess = Bun.spawn(
    [
      tsciPath,
      "export",
      circuitFilePath,
      "--format",
      "gerbers",
      "--output",
      relative(dirname(circuitFilePath), temporaryArchivePath),
      "--disable-parts-engine",
    ],
    {
      cwd: workingDirectory,
      stderr: "inherit",
      stdout: "inherit",
    },
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
    {
      stderr: "inherit",
      stdout: "inherit",
    },
  )
  const removeMaskExitCode = await removeMaskProcess.exited
  if (removeMaskExitCode !== 0) {
    throw new Error(
      `Failed to remove solder-mask layers with exit code ${removeMaskExitCode}`,
    )
  }

  await mkdir(dirname(outputPath), { recursive: true })
  await copyFile(temporaryArchivePath, outputPath)
} finally {
  await rm(temporaryDirectory, { force: true, recursive: true })
}

console.log(`Exported solder-mask-free Gerbers to ${outputPath}`)
