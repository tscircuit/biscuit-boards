import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import "bun-match-svg"
import type { CircuitJson } from "circuit-json"
import {
  generateLightBurnSvg,
  type LightBurnBaseElement,
  LightBurnProject,
  ShapePath,
} from "lbrnts"
import { Stm32c071BiscuitBoard } from "../examples/stm32c071"
import { createBiscuitBoardLightburnArtifacts } from "../lib/biscuit-board-lightburn"
import {
  applyLightBurnLensDistortion,
  createLensDistortedLightBurnProject,
  designToProjected,
  LENS_DISTORTION_MAX_SEGMENT_LENGTH_MM,
} from "../lib/lightburn-lens-distortion"

const getFirstPath = (project: LightBurnProject): ShapePath => {
  const pending = [...project.children]

  while (pending.length > 0) {
    const element = pending.shift()
    if (element instanceof ShapePath) return element
    pending.push(...((element?.getChildren() ?? []) as LightBurnBaseElement[]))
  }

  throw new Error("Expected the LightBurn project to contain a path")
}

test("subdivides lines before applying nonlinear lens distortion", () => {
  const project = new LightBurnProject({
    children: [
      new ShapePath({
        verts: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
        ],
        prims: [{ type: 0 }],
        isClosed: false,
      }),
    ],
  })
  const distorted = createLensDistortedLightBurnProject(project, { x: 0, y: 0 })
  const path = getFirstPath(distorted)
  const expectedSegmentCount = 10 / LENS_DISTORTION_MAX_SEGMENT_LENGTH_MM

  expect(path.verts).toHaveLength(expectedSegmentCount + 1)
  expect(path.prims).toHaveLength(expectedSegmentCount)
  expect(path.prims.every((prim) => prim.type === 0)).toBe(true)

  for (let index = 0; index < path.verts.length; index++) {
    const expected = designToProjected({
      x: index * LENS_DISTORTION_MAX_SEGMENT_LENGTH_MM,
      y: 0,
    })
    expect(path.verts[index].x).toBeCloseTo(expected.x, 10)
    expect(path.verts[index].y).toBeCloseTo(expected.y, 10)
  }
})

test("flattens Bezier curves before applying nonlinear lens distortion", () => {
  const project = new LightBurnProject({
    children: [
      new ShapePath({
        verts: [
          { x: 0, y: 0, c0x: 0, c0y: 5 },
          { x: 10, y: 0, c1x: 10, c1y: 5 },
        ],
        prims: [{ type: 1 }],
        isClosed: false,
      }),
    ],
  })
  const path = getFirstPath(
    createLensDistortedLightBurnProject(project, { x: 0, y: 0 }),
  )

  expect(path.verts.length).toBeGreaterThan(2)
  expect(path.prims).toHaveLength(path.verts.length - 1)
  expect(path.prims.every((prim) => prim.type === 0)).toBe(true)
  expect(path.verts.every((vert) => vert.c0x === undefined)).toBe(true)
  expect(path.verts.every((vert) => vert.c1x === undefined)).toBe(true)
  expect(path.verts[0].x).toBeCloseTo(designToProjected({ x: 0, y: 0 }).x, 10)
  expect(path.verts.at(-1)?.x).toBeCloseTo(
    designToProjected({ x: 10, y: 0 }).x,
    10,
  )
})

test("snapshots the lens-distorted STM32C071 LightBurn project", async () => {
  const circuit = new Circuit()
  circuit.add(<Stm32c071BiscuitBoard />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson() as CircuitJson
  const errors = circuitJson.filter((element) => element.type.endsWith("error"))
  expect(errors).toEqual([])

  const { project, lensDistortionProject } =
    await createBiscuitBoardLightburnArtifacts(circuitJson)
  const lensDistortionXml = lensDistortionProject.getString()
  const originalVertex = getFirstPath(project).verts[0]
  const distortedVertex = getFirstPath(lensDistortionProject).verts[0]
  const board = circuitJson.find((element) => element.type === "pcb_board")

  expect(board).toBeDefined()
  expect(originalVertex).toBeDefined()
  expect(distortedVertex).toBeDefined()
  expect(distortedVertex).not.toEqual(originalVertex)
  expect(lensDistortionXml).not.toMatch(/Value="(?:true|false)"/)

  const boardOrigin = {
    x: (board?.width ?? 0) / 2 - (board?.center.x ?? 0),
    y: (board?.height ?? 0) / 2 - (board?.center.y ?? 0),
  }
  const distortedBoardOrigin = applyLightBurnLensDistortion(
    boardOrigin,
    boardOrigin,
  )
  const expectedDistortedVertex = designToProjected({
    x: originalVertex.x - boardOrigin.x,
    y: originalVertex.y - boardOrigin.y,
  })

  const expectedDistortedBoardOrigin = designToProjected({ x: 0, y: 0 })
  expect(distortedBoardOrigin.x).toBeCloseTo(expectedDistortedBoardOrigin.x, 9)
  expect(distortedBoardOrigin.y).toBeCloseTo(expectedDistortedBoardOrigin.y, 9)
  expect(distortedVertex.x).toBeCloseTo(expectedDistortedVertex.x, 9)
  expect(distortedVertex.y).toBeCloseTo(expectedDistortedVertex.y, 9)

  const lensDistortionSvg = generateLightBurnSvg(lensDistortionProject, {
    margin: 2,
    width: 1400,
    height: 900,
    defaultStrokeWidth: 0.1,
  })
  await expect(lensDistortionSvg).toMatchSvgSnapshot(import.meta.path)
}, 30_000)
