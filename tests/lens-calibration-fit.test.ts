import { expect, test } from "bun:test"
import { resolve } from "node:path"
import { deriveLensCalibrationFromCsv } from "../lib/coordinate_map/derive-lens-calibration"
import {
  BISCUIT_BOARD_LENS_CALIBRATION_FIT,
  BISCUIT_BOARD_LENS_CALIBRATION_MATRIX,
} from "../lib/coordinate_map/lens-calibration-generated"

test("derives the checked-in lens calibration from the coordinate CSV", async () => {
  const csvPath = resolve(
    import.meta.dir,
    "../lib/coordinate_map/via-coordinate-map.csv",
  )
  const fit = deriveLensCalibrationFromCsv(await Bun.file(csvPath).text())

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
  expect(fit.excludedViaNumbers).toEqual([10])
  expect(fit.rmsError).toBeLessThan(1.2)
})
