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
  matrix: LensCalibrationMatrix
  sourcePointCount: number
  includedViaNumbers: number[]
  excludedViaNumbers: number[]
  rmsError: number
  maxResidualError: number
}

const BASIS_SIZE = 4

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
      throw new Error("Lens calibration matrix is singular")
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

const getBasis = (point: LensCalibrationPoint): LensCalibrationRow => [
  1,
  point.designX,
  point.designY,
  point.designX * point.designY,
]

const fitTarget = (
  points: LensCalibrationPoint[],
  target: "projectedX" | "projectedY",
): LensCalibrationRow => {
  const normalMatrix = Array.from({ length: BASIS_SIZE }, () =>
    Array(BASIS_SIZE).fill(0),
  )
  const normalVector = Array(BASIS_SIZE).fill(0)

  for (const point of points) {
    const basis = getBasis(point)
    for (let row = 0; row < BASIS_SIZE; row++) {
      normalVector[row] += basis[row] * point[target]
      for (let column = 0; column < BASIS_SIZE; column++) {
        normalMatrix[row][column] += basis[row] * basis[column]
      }
    }
  }

  return solveLinearSystem(normalMatrix, normalVector) as LensCalibrationRow
}

const fitMatrix = (points: LensCalibrationPoint[]): LensCalibrationMatrix => [
  fitTarget(points, "projectedX"),
  fitTarget(points, "projectedY"),
]

const getResidualError = (
  point: LensCalibrationPoint,
  matrix: LensCalibrationMatrix,
) => {
  const basis = getBasis(point)
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
  options: { sigmaThreshold?: number } = {},
): LensCalibrationFit => {
  const sigmaThreshold = options.sigmaThreshold ?? 3
  if (sourcePoints.length < BASIS_SIZE) {
    throw new Error(`Lens calibration requires at least ${BASIS_SIZE} points`)
  }

  let includedPoints = [...sourcePoints]
  const excludedViaNumbers: number[] = []

  while (includedPoints.length >= BASIS_SIZE) {
    const matrix = fitMatrix(includedPoints)
    const residuals = includedPoints.map((point) => ({
      point,
      error: getResidualError(point, matrix),
    }))
    const rmsError = Math.sqrt(
      residuals.reduce((sum, residual) => sum + residual.error ** 2, 0) /
        residuals.length,
    )
    const worstResidual = residuals.reduce((worst, residual) =>
      residual.error > worst.error ? residual : worst,
    )

    if (
      worstResidual.error <= sigmaThreshold * rmsError ||
      includedPoints.length === BASIS_SIZE
    ) {
      return {
        matrix,
        sourcePointCount: sourcePoints.length,
        includedViaNumbers: includedPoints.map((point) => point.viaNumber),
        excludedViaNumbers,
        rmsError,
        maxResidualError: worstResidual.error,
      }
    }

    excludedViaNumbers.push(worstResidual.point.viaNumber)
    includedPoints = includedPoints.filter(
      (point) => point !== worstResidual.point,
    )
  }

  throw new Error("Lens calibration could not retain enough fitting points")
}

export const deriveLensCalibrationFromCsv = (csv: string) =>
  deriveLensCalibration(parseLensCalibrationCsv(csv))
