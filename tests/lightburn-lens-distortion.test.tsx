import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import "bun-match-svg"
import type { CircuitJson } from "circuit-json"
import {
  generateLightBurnSvg,
  type LightBurnBaseElement,
  type LightBurnProject,
  ShapePath,
} from "lbrnts"
import { Stm32c071BiscuitBoard } from "../examples/stm32c071"
import { createBiscuitBoardLightburnArtifacts } from "../lib/biscuit-board-lightburn"
import {
  BISCUIT_BOARD_LENS_CALIBRATION,
  designToProjected,
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

test("snapshots the lens-corrected STM32C071 LightBurn project", async () => {
  const circuit = new Circuit()
  circuit.add(<Stm32c071BiscuitBoard />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson() as CircuitJson
  const errors = circuitJson.filter((element) => element.type.endsWith("error"))
  expect(errors).toEqual([])

  const { project, lensDistortionProject } =
    await createBiscuitBoardLightburnArtifacts(circuitJson)
  const originalVertex = getFirstPath(project).verts[0]
  const correctedVertex = getFirstPath(lensDistortionProject).verts[0]
  const board = circuitJson.find((element) => element.type === "pcb_board")

  expect(board).toBeDefined()
  expect(originalVertex).toBeDefined()
  expect(correctedVertex).toBeDefined()
  expect(correctedVertex).not.toEqual(originalVertex)

  const boardOrigin = {
    x: (board?.width ?? 0) / 2 - (board?.center.x ?? 0),
    y: (board?.height ?? 0) / 2 - (board?.center.y ?? 0),
  }
  const projectedCorrectedVertex = designToProjected({
    x: correctedVertex.x - boardOrigin.x,
    y: correctedVertex.y - boardOrigin.y,
  })

  expect(projectedCorrectedVertex.x).toBeCloseTo(
    BISCUIT_BOARD_LENS_CALIBRATION.a0 + originalVertex.x - boardOrigin.x,
    9,
  )
  expect(projectedCorrectedVertex.y).toBeCloseTo(
    BISCUIT_BOARD_LENS_CALIBRATION.b0 + originalVertex.y - boardOrigin.y,
    9,
  )

  const lensDistortionSvg = generateLightBurnSvg(lensDistortionProject, {
    margin: 2,
    width: 1400,
    height: 900,
    defaultStrokeWidth: 0.1,
  })
  await expect(lensDistortionSvg).toMatchSvgSnapshot(import.meta.path)
}, 30_000)
