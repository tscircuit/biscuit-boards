import { mkdir, rm } from "node:fs/promises"
import { basename, extname, isAbsolute, relative, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { Circuit } from "@tscircuit/core"
import type { CircuitJson, PcbSmtPad } from "circuit-json"
import {
  CutSetting,
  generateLightBurnSvg,
  type LightBurnProject,
  ShapePath,
} from "lbrnts"
import { type ComponentType, createElement, isValidElement } from "react"
import {
  BISCUIT_BOARD_LIGHTBURN_COPPER_MARGIN_MM,
  createBiscuitBoardLightburnArtifacts,
} from "../lib/biscuit-board-lightburn"
import { createLensDistortedLightBurnProject } from "../lib/lightburn-lens-distortion"

const SOLDERPASTE_SCALE = 0.7
const SOLDERPASTE_OFFSET_PERCENT = 0.3
const TOP_PAD_LAYER_INDEX = 3
const SOLDERPASTE_LAYER_INDEX = 17
const SOLDERPASTE_LAYER_NAME = "Solderpaste Layer"
const SOLDERPASTE_OFFSET_LAYER_NAME = "Solderpaste Layer - 30% Offset"

type Point = { x: number; y: number }

const scaleAround = (value: number, center: number) =>
  center + (value - center) * SOLDERPASTE_SCALE

const getPadCenter = (
  pad: Exclude<PcbSmtPad, { shape: "circle" }>,
  boardOrigin: { x: number; y: number },
) => {
  if (pad.shape !== "polygon") {
    return {
      x: pad.x + boardOrigin.x,
      y: pad.y + boardOrigin.y,
    }
  }

  const xCoordinates = pad.points.map((point) => point.x)
  const yCoordinates = pad.points.map((point) => point.y)
  return {
    x:
      (Math.min(...xCoordinates) + Math.max(...xCoordinates)) / 2 +
      boardOrigin.x,
    y:
      (Math.min(...yCoordinates) + Math.max(...yCoordinates)) / 2 +
      boardOrigin.y,
  }
}

const cloneScaledPadPath = (
  source: ShapePath,
  center: { x: number; y: number },
) =>
  new ShapePath({
    cutIndex: SOLDERPASTE_LAYER_INDEX,
    verts: source.verts.map((vert) => ({
      ...vert,
      x: scaleAround(vert.x, center.x),
      y: scaleAround(vert.y, center.y),
      ...(vert.c0x === undefined
        ? {}
        : { c0x: scaleAround(vert.c0x, center.x) }),
      ...(vert.c0y === undefined
        ? {}
        : { c0y: scaleAround(vert.c0y, center.y) }),
      ...(vert.c1x === undefined
        ? {}
        : { c1x: scaleAround(vert.c1x, center.x) }),
      ...(vert.c1y === undefined
        ? {}
        : { c1y: scaleAround(vert.c1y, center.y) }),
    })),
    prims: source.prims.map((prim) => ({ ...prim })),
    isClosed: source.isClosed,
    locked: source.locked,
    xform: [...source.xform],
  })

const pointsAreEqual = (first: Point, second: Point) =>
  Math.hypot(first.x - second.x, first.y - second.y) <= 1e-9

const cross = (first: Point, second: Point) =>
  first.x * second.y - first.y * second.x

const getPathBounds = (path: ShapePath) => {
  const xCoordinates = path.verts.map((vert) => vert.x)
  const yCoordinates = path.verts.map((vert) => vert.y)
  const minX = Math.min(...xCoordinates)
  const maxX = Math.max(...xCoordinates)
  const minY = Math.min(...yCoordinates)
  const maxY = Math.max(...yCoordinates)
  return { width: maxX - minX, height: maxY - minY }
}

const cloneInsetPadPath = (source: ShapePath) => {
  const points = source.verts.map(({ x, y }) => ({ x, y }))
  if (
    points.length > 1 &&
    pointsAreEqual(points[0], points[points.length - 1])
  ) {
    points.pop()
  }
  if (points.length < 3) {
    throw new Error("Cannot offset a pad path with fewer than three vertices")
  }

  const signedArea = points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length]
    return area + point.x * next.y - next.x * point.y
  }, 0)
  if (Math.abs(signedArea) <= 1e-12) {
    throw new Error("Cannot offset a zero-area pad path")
  }

  const bounds = getPathBounds(source)
  const offsetDistance =
    Math.min(bounds.width, bounds.height) * SOLDERPASTE_OFFSET_PERCENT
  const orientation = Math.sign(signedArea)
  const insetPoints = points.map((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length]
    const next = points[(index + 1) % points.length]
    const previousDirection = {
      x: point.x - previous.x,
      y: point.y - previous.y,
    }
    const nextDirection = {
      x: next.x - point.x,
      y: next.y - point.y,
    }
    const previousLength = Math.hypot(previousDirection.x, previousDirection.y)
    const nextLength = Math.hypot(nextDirection.x, nextDirection.y)
    if (previousLength <= 1e-12 || nextLength <= 1e-12) {
      throw new Error("Cannot offset a pad path with duplicate vertices")
    }

    const previousNormal = {
      x: (-orientation * previousDirection.y) / previousLength,
      y: (orientation * previousDirection.x) / previousLength,
    }
    const nextNormal = {
      x: (-orientation * nextDirection.y) / nextLength,
      y: (orientation * nextDirection.x) / nextLength,
    }
    const previousOffsetPoint = {
      x: point.x + previousNormal.x * offsetDistance,
      y: point.y + previousNormal.y * offsetDistance,
    }
    const nextOffsetPoint = {
      x: point.x + nextNormal.x * offsetDistance,
      y: point.y + nextNormal.y * offsetDistance,
    }
    const determinant = cross(previousDirection, nextDirection)

    if (Math.abs(determinant) <= 1e-12) {
      return {
        x: (previousOffsetPoint.x + nextOffsetPoint.x) / 2,
        y: (previousOffsetPoint.y + nextOffsetPoint.y) / 2,
      }
    }

    const betweenOffsetLines = {
      x: nextOffsetPoint.x - previousOffsetPoint.x,
      y: nextOffsetPoint.y - previousOffsetPoint.y,
    }
    const distanceAlongPrevious =
      cross(betweenOffsetLines, nextDirection) / determinant
    return {
      x: previousOffsetPoint.x + previousDirection.x * distanceAlongPrevious,
      y: previousOffsetPoint.y + previousDirection.y * distanceAlongPrevious,
    }
  })
  const closedInsetPoints = [...insetPoints, { ...insetPoints[0] }]

  return new ShapePath({
    cutIndex: SOLDERPASTE_LAYER_INDEX,
    verts: closedInsetPoints,
    prims: closedInsetPoints.map(() => ({ type: 0 })),
    isClosed: true,
    locked: source.locked,
    xform: [...source.xform],
  })
}

const cloneSolderpasteCutSetting = (source: CutSetting, name: string) =>
  new CutSetting({
    type: source.type,
    index: SOLDERPASTE_LAYER_INDEX,
    name,
    priority: source.priority,
    minPower: source.minPower,
    maxPower: source.maxPower,
    minPower2: source.minPower2,
    maxPower2: source.maxPower2,
    speed: source.speed,
    kerf: source.kerf,
    zOffset: source.zOffset,
    enablePowerRamp: source.enablePowerRamp,
    rampLength: source.rampLength,
    numPasses: source.numPasses,
    zPerPass: source.zPerPass,
    perforate: source.perforate,
    dotMode: source.dotMode,
    scanOpt: source.scanOpt,
    interval: source.interval,
    angle: source.angle,
    overScanning: source.overScanning,
    lineAngle: source.lineAngle,
    crossHatch: source.crossHatch,
    wobbleEnable: source.wobbleEnable,
    anglePerPass: source.anglePerPass,
    frequency: source.frequency,
    qPulseWidth: source.qPulseWidth,
  })

const addSolderpasteLayer = (
  project: LightBurnProject,
  circuitJson: CircuitJson,
  boardOrigin: { x: number; y: number },
  options: {
    layerName: string
    createPadPath: (source: ShapePath, center: Point) => ShapePath
  },
) => {
  const topPadCutSetting = project.children.find(
    (child): child is CutSetting =>
      child instanceof CutSetting && child.index === TOP_PAD_LAYER_INDEX,
  )
  if (!topPadCutSetting) return 0

  const topSmtPads = circuitJson.filter(
    (element): element is PcbSmtPad =>
      element.type === "pcb_smtpad" && (element.layer ?? "top") === "top",
  )
  const topPadPaths = project.children.filter(
    (child): child is ShapePath =>
      child instanceof ShapePath && child.cutIndex === TOP_PAD_LAYER_INDEX,
  )
  if (topPadPaths.length < topSmtPads.length) {
    throw new Error(
      `Ablate Top Pads contains ${topPadPaths.length} paths for ${topSmtPads.length} top SMT pads`,
    )
  }

  const solderpastePaths = topSmtPads.flatMap((pad, index) =>
    pad.shape === "circle"
      ? []
      : [
          options.createPadPath(
            topPadPaths[index],
            getPadCenter(pad, boardOrigin),
          ),
        ],
  )
  if (solderpastePaths.length === 0) return 0

  const topPadCutSettingIndex = project.children.indexOf(topPadCutSetting)
  project.children.splice(
    topPadCutSettingIndex + 1,
    0,
    cloneSolderpasteCutSetting(topPadCutSetting, options.layerName),
  )
  project.children.push(...solderpastePaths)
  return solderpastePaths.length
}

const removeSolderpasteLayer = (project: LightBurnProject) => {
  project.children = project.children.filter(
    (child) =>
      !(
        child instanceof CutSetting && child.index === SOLDERPASTE_LAYER_INDEX
      ) &&
      !(
        child instanceof ShapePath && child.cutIndex === SOLDERPASTE_LAYER_INDEX
      ),
  )
}

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

const { fabricationCircuitJson, project, layerFiles } =
  await createBiscuitBoardLightburnArtifacts(circuitJson)
const baseProjectString = project.getString()
const baseProjectPreview = generateLightBurnSvg(project, {
  margin: 2,
  width: 1400,
  height: 900,
  defaultStrokeWidth: 0.1,
})
const board = fabricationCircuitJson.find(
  (element) => element.type === "pcb_board",
)
if (!board || board.width === undefined || board.height === undefined) {
  throw new Error("LightBurn export requires a rectangular board")
}
const boardOrigin = {
  x: board.width / 2 - board.center.x,
  y: board.height / 2 - board.center.y,
}
const solderpasteShapeCount = addSolderpasteLayer(
  project,
  fabricationCircuitJson,
  boardOrigin,
  {
    layerName: SOLDERPASTE_LAYER_NAME,
    createPadPath: cloneScaledPadPath,
  },
)
const lensDistortionProject = createLensDistortedLightBurnProject(
  project,
  boardOrigin,
)
removeSolderpasteLayer(project)
const offsetSolderpasteShapeCount = addSolderpasteLayer(
  project,
  fabricationCircuitJson,
  boardOrigin,
  {
    layerName: SOLDERPASTE_OFFSET_LAYER_NAME,
    createPadPath: cloneInsetPadPath,
  },
)
const offsetLensDistortionProject = createLensDistortedLightBurnProject(
  project,
  boardOrigin,
)
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
    baseProjectString,
  ),
  Bun.write(
    resolve(outputDirectory, `${boardName}.lightburn-lensdistortion.lbrn2`),
    lensDistortionProject.getString(),
  ),
  Bun.write(
    resolve(
      outputDirectory,
      `${boardName}.lightburn-lensdistortion-solderpaste-30-percent-offset.lbrn2`,
    ),
    offsetLensDistortionProject.getString(),
  ),
  Bun.write(
    resolve(outputDirectory, `${boardName}.lightburn.svg`),
    baseProjectPreview,
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
          solderpasteOffsetLightburn: `${boardName}.lightburn-lensdistortion-solderpaste-30-percent-offset.lbrn2`,
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
  `Exported ${sourcePath} with ${layerFiles.length} LightBurn operation file(s), ${solderpasteShapeCount} scaled solderpaste shape(s), and ${offsetSolderpasteShapeCount} offset solderpaste shape(s) to ${outputDirectory}`,
)
