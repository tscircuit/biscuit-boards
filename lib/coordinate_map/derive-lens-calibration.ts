import {
  type AffineRow,
  evaluateInverseDistanceWeighted,
  type InverseDistanceWeightedModel,
} from "./inverse-distance-weighted"

export type LensCalibrationPoint = {
  viaNumber: number
  designX: number
  designY: number
  projectedX: number
  projectedY: number
}

export type LensCalibrationRow = [number, number, number, number]
export type LensCalibrationMatrix = [LensCalibrationRow, LensCalibrationRow]

export type LensCalibrationFit = {
  model: InverseDistanceWeightedModel
  /** Retained for compatibility and as a bilinear error baseline. */
  matrix: LensCalibrationMatrix
  sourcePointCount: number
  includedViaNumbers: number[]
  excludedViaNumbers: number[]
  rmsError: number
  maxResidualError: number
  leaveOneOutRmsError: number
  baselineBilinearRmsError: number
}

const BILINEAR_BASIS_SIZE = 4
const AFFINE_BASIS_SIZE = 3
export const LENS_CALIBRATION_IDW_POWER = 2

const solveLinearSystem = (matrix: number[][], vector: number[]): number[] => {
  const augmented = matrix.map((row, index) => [...row, vector[index]])

  for (let column = 0; column < matrix.length; column++) {
    let pivotRow = column
    for (let row = column + 1; row < matrix.length; row++) {
      if (
        Math.abs(augmented[row][column]) > Math.abs(augmented[pivotRow][column])
      ) {
        pivotRow = row
      }
    }
    if (Math.abs(augmented[pivotRow][column]) < 1e-12) {
      throw new Error("Lens calibration system is singular")
    }

    ;[augmented[column], augmented[pivotRow]] = [
      augmented[pivotRow],
      augmented[column],
    ]
    const pivot = augmented[column][column]
    for (let index = column; index <= matrix.length; index++) {
      augmented[column][index] /= pivot
    }
    for (let row = 0; row < matrix.length; row++) {
      if (row === column) continue
      const factor = augmented[row][column]
      for (let index = column; index <= matrix.length; index++) {
        augmented[row][index] -= factor * augmented[column][index]
      }
    }
  }

  return augmented.map((row) => row[matrix.length])
}

const fitTarget = (
  points: LensCalibrationPoint[],
  target: "projectedX" | "projectedY",
  getBasis: (point: LensCalibrationPoint) => number[],
  basisSize: number,
) => {
  const normalMatrix = Array.from({ length: basisSize }, () =>
    Array(basisSize).fill(0),
  )
  const normalVector = Array(basisSize).fill(0)
  for (const point of points) {
    const basis = getBasis(point)
    for (let row = 0; row < basisSize; row++) {
      normalVector[row] += basis[row] * point[target]
      for (let column = 0; column < basisSize; column++) {
        normalMatrix[row][column] += basis[row] * basis[column]
      }
    }
  }
  return solveLinearSystem(normalMatrix, normalVector)
}

const getBilinearBasis = (point: LensCalibrationPoint) => [
  1,
  point.designX,
  point.designY,
  point.designX * point.designY,
]
const getAffineBasis = (point: LensCalibrationPoint) => [
  1,
  point.designX,
  point.designY,
]

const fitBilinearMatrix = (
  points: LensCalibrationPoint[],
): LensCalibrationMatrix => [
  fitTarget(
    points,
    "projectedX",
    getBilinearBasis,
    BILINEAR_BASIS_SIZE,
  ) as LensCalibrationRow,
  fitTarget(
    points,
    "projectedY",
    getBilinearBasis,
    BILINEAR_BASIS_SIZE,
  ) as LensCalibrationRow,
]

const fitAffineMatrix = (
  points: LensCalibrationPoint[],
): readonly [AffineRow, AffineRow] => {
  const x = fitTarget(
    points,
    "projectedX",
    getAffineBasis,
    AFFINE_BASIS_SIZE,
  )
  const y = fitTarget(
    points,
    "projectedY",
    getAffineBasis,
    AFFINE_BASIS_SIZE,
  )
  return [
    [x[0], x[1], x[2]],
    [y[0], y[1], y[2]],
  ]
}

const fitInverseDistanceWeightedModel = (
  points: LensCalibrationPoint[],
): InverseDistanceWeightedModel => {
  const seenDesignPoints = new Set<string>()
  for (const point of points) {
    const key = `${point.designX}:${point.designY}`
    if (seenDesignPoints.has(key)) {
      throw new Error(`Duplicate lens calibration design coordinate: ${key}`)
    }
    seenDesignPoints.add(key)
  }

  const affine = fitAffineMatrix(points)
  return {
    kind: "inverse-distance-weighted-residuals",
    power: LENS_CALIBRATION_IDW_POWER,
    affine,
    controlPoints: points.map((point) => [
      point.designX,
      point.designY,
      point.projectedX -
        (affine[0][0] +
          affine[0][1] * point.designX +
          affine[0][2] * point.designY),
      point.projectedY -
        (affine[1][0] +
          affine[1][1] * point.designX +
          affine[1][2] * point.designY),
    ]),
  }
}

const getModelResidualError = (
  point: LensCalibrationPoint,
  model: InverseDistanceWeightedModel,
) => {
  const projected = evaluateInverseDistanceWeighted(model, {
    x: point.designX,
    y: point.designY,
  })
  return Math.hypot(
    projected.x - point.projectedX,
    projected.y - point.projectedY,
  )
}

const getBilinearResidualError = (
  point: LensCalibrationPoint,
  matrix: LensCalibrationMatrix,
) => {
  const basis = getBilinearBasis(point)
  const projectedX = basis.reduce(
    (sum, value, index) => sum + value * matrix[0][index],
    0,
  )
  const projectedY = basis.reduce(
    (sum, value, index) => sum + value * matrix[1][index],
    0,
  )
  return Math.hypot(
    projectedX - point.projectedX,
    projectedY - point.projectedY,
  )
}

const getRms = (values: number[]) =>
  Math.sqrt(values.reduce((sum, value) => sum + value ** 2, 0) / values.length)

const getLeaveOneOutRmsError = (points: LensCalibrationPoint[]) =>
  getRms(
    points.map((point, heldOutIndex) =>
      getModelResidualError(
        point,
        fitInverseDistanceWeightedModel(
          points.filter((_, index) => index !== heldOutIndex),
        ),
      ),
    ),
  )

export const parseLensCalibrationCsv = (
  csv: string,
): LensCalibrationPoint[] => {
  const [headerLine, ...dataLines] = csv.trim().split(/\r?\n/)
  const headers = headerLine.split(",").map((header) => header.trim())
  const requiredHeaders = [
    "VIA NUMBER",
    "CIRCUIT JSON X",
    "CIRCUIT JSON Y",
    "PROJECTED X",
    "PROJECTED Y",
  ]
  const indexes = requiredHeaders.map((header) => headers.indexOf(header))
  if (indexes.some((index) => index < 0)) {
    throw new Error("Lens calibration CSV is missing a required column")
  }

  return dataLines.filter(Boolean).map((line, lineIndex) => {
    const values = line.split(",").map((value) => value.trim())
    const numbers = indexes.map((index) => Number(values[index]))
    if (numbers.some((value) => !Number.isFinite(value))) {
      throw new Error(
        `Invalid lens calibration value on CSV line ${lineIndex + 2}`,
      )
    }
    return {
      viaNumber: numbers[0],
      designX: numbers[1],
      designY: numbers[2],
      projectedX: numbers[3],
      projectedY: numbers[4],
    }
  })
}

export const deriveLensCalibration = (
  sourcePoints: LensCalibrationPoint[],
): LensCalibrationFit => {
  if (sourcePoints.length < 4) {
    throw new Error("Lens calibration requires at least 4 points")
  }
  const model = fitInverseDistanceWeightedModel(sourcePoints)
  const residuals = sourcePoints.map((point) =>
    getModelResidualError(point, model),
  )
  const matrix = fitBilinearMatrix(sourcePoints)

  return {
    model,
    matrix,
    sourcePointCount: sourcePoints.length,
    includedViaNumbers: sourcePoints.map((point) => point.viaNumber),
    excludedViaNumbers: [],
    rmsError: getRms(residuals),
    maxResidualError: Math.max(...residuals),
    leaveOneOutRmsError: getLeaveOneOutRmsError(sourcePoints),
    baselineBilinearRmsError: getRms(
      sourcePoints.map((point) => getBilinearResidualError(point, matrix)),
    ),
  }
}

export const deriveLensCalibrationFromCsv = (csv: string) =>
  deriveLensCalibration(parseLensCalibrationCsv(csv))
