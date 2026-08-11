import { expect, test } from "bun:test"
import { resolve } from "node:path"
import {
  deriveLensCalibrationFromCsv,
  parseLensCalibrationCsv,
} from "../lib/coordinate_map/derive-lens-calibration"
import {
  BISCUIT_BOARD_LENS_CALIBRATION_FIT,
  BISCUIT_BOARD_LENS_CALIBRATION_MATRIX,
  BISCUIT_BOARD_LENS_CALIBRATION_MODEL,
} from "../lib/coordinate_map/lens-calibration-generated"
import {
  designToProjected,
  projectedToDesign,
} from "../lib/lightburn-lens-distortion"

test("derives the checked-in lens calibration from the coordinate CSV", async () => {
  const csvPath = resolve(
    import.meta.dir,
    "../lib/coordinate_map/via-coordinate-map.csv",
  )
  const fit = deriveLensCalibrationFromCsv(await Bun.file(csvPath).text())

  expect(fit.model).toEqual(BISCUIT_BOARD_LENS_CALIBRATION_MODEL)
  for (let row = 0; row < 2; row++) {
    for (let column = 0; column < 4; column++) {
      expect(fit.matrix[row][column]).toBe(
        BISCUIT_BOARD_LENS_CALIBRATION_MATRIX[row][column],
      )
    }
  }
  expect(fit.sourcePointCount).toBe(
    BISCUIT_BOARD_LENS_CALIBRATION_FIT.sourcePointCount,
  )
  expect(fit.includedViaNumbers).toEqual([
    ...BISCUIT_BOARD_LENS_CALIBRATION_FIT.includedViaNumbers,
  ])
  expect(fit.excludedViaNumbers).toEqual([
    ...BISCUIT_BOARD_LENS_CALIBRATION_FIT.excludedViaNumbers,
  ])
  expect(fit.rmsError).toBe(BISCUIT_BOARD_LENS_CALIBRATION_FIT.rmsError)
  expect(fit.maxResidualError).toBe(
    BISCUIT_BOARD_LENS_CALIBRATION_FIT.maxResidualError,
  )
  expect(fit.leaveOneOutRmsError).toBe(
    BISCUIT_BOARD_LENS_CALIBRATION_FIT.leaveOneOutRmsError,
  )
  expect(fit.baselineBilinearRmsError).toBe(
    BISCUIT_BOARD_LENS_CALIBRATION_FIT.baselineBilinearRmsError,
  )
  expect(fit.includedViaNumbers).toHaveLength(15)
  expect(fit.excludedViaNumbers).toEqual([])
  expect(fit.model.triangles).toHaveLength(
    BISCUIT_BOARD_LENS_CALIBRATION_FIT.triangleCount,
  )
  expect(fit.model.hullEdges).toHaveLength(
    BISCUIT_BOARD_LENS_CALIBRATION_FIT.hullEdgeCount,
  )
  expect(fit.rmsError).toBe(0)
  expect(fit.baselineBilinearRmsError).toBeGreaterThan(1)
})

test("exactly interpolates every measured calibration point", async () => {
  const csvPath = resolve(
    import.meta.dir,
    "../lib/coordinate_map/via-coordinate-map.csv",
  )
  const points = parseLensCalibrationCsv(await Bun.file(csvPath).text())

  for (const point of points) {
    const designPoint = { x: point.designX, y: point.designY }
    const projectedPoint = designToProjected(designPoint)
    const recoveredPoint = projectedToDesign(projectedPoint)

    expect(projectedPoint.x).toBe(point.projectedX)
    expect(projectedPoint.y).toBe(point.projectedY)
    expect(recoveredPoint.x).toBeCloseTo(designPoint.x, 8)
    expect(recoveredPoint.y).toBeCloseTo(designPoint.y, 8)
  }
})

test("round-trips the full board region including affine extrapolation", () => {
  let maxRoundTripError = 0

  for (let x = -37.5; x <= 37.5; x += 2.5) {
    for (let y = -22.5; y <= 22.5; y += 2.5) {
      const projected = designToProjected({ x, y })
      const recovered = projectedToDesign(projected)
      maxRoundTripError = Math.max(
        maxRoundTripError,
        Math.hypot(recovered.x - x, recovered.y - y),
      )
    }
  }

  expect(maxRoundTripError).toBeLessThan(1e-10)
})
