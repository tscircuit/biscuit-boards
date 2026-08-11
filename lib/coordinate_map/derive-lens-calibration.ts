import {
  evaluateThinPlateSpline,
  type ThinPlateSplineModel,
  thinPlateSplineRadialBasis,
} from "./thin-plate-spline"

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
  model: ThinPlateSplineModel
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
const THIN_PLATE_AFFINE_SIZE = 3
export const DEFAULT_LENS_CALIBRATION_REGULARIZATION = 1

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

const getBilinearBasis = (point: LensCalibrationPoint): LensCalibrationRow => [
  1,
  point.designX,
  point.designY,
  point.designX * point.designY,
]

const fitBilinearTarget = (
  points: LensCalibrationPoint[],
  target: "projectedX" | "projectedY",
): LensCalibrationRow => {
  const normalMatrix = Array.from({ length: BILINEAR_BASIS_SIZE }, () =>
    Array(BILINEAR_BASIS_SIZE).fill(0),
  )
  const normalVector = Array(BILINEAR_BASIS_SIZE).fill(0)

  for (const point of points) {
    const basis = getBilinearBasis(point)
    for (let row = 0; row < BILINEAR_BASIS_SIZE; row++) {
      normalVector[row] += basis[row] * point[target]
      for (let column = 0; column < BILINEAR_BASIS_SIZE; column++) {
        normalMatrix[row][column] += basis[row] * basis[column]
      }
    }
  }

  return solveLinearSystem(normalMatrix, normalVector) as LensCalibrationRow
}

const fitBilinearMatrix = (
  points: LensCalibrationPoint[],
): LensCalibrationMatrix => [
  fitBilinearTarget(points, "projectedX"),
  fitBilinearTarget(points, "projectedY"),
]

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

const fitThinPlateSplineModel = (
  points: LensCalibrationPoint[],
  regularization: number,
): ThinPlateSplineModel => {
  const centerX =
    points.reduce((sum, point) => sum + point.designX, 0) / points.length
  const centerY =
    points.reduce((sum, point) => sum + point.designY, 0) / points.length
  const scale = Math.sqrt(
    points.reduce(
      (sum, point) =>
        sum + (point.designX - centerX) ** 2 + (point.designY - centerY) ** 2,
      0,
    ) / points.length,
  )

  if (scale < 1e-12) {
    throw new Error("Lens calibration points have no spatial extent")
  }

  const controlPoints = points.map(
    (point) =>
      [
        (point.designX - centerX) / scale,
        (point.designY - centerY) / scale,
      ] as const,
  )
  const systemSize = points.length + THIN_PLATE_AFFINE_SIZE
  const system = Array.from({ length: systemSize }, () =>
    Array(systemSize).fill(0),
  )

  for (let row = 0; row < points.length; row++) {
    for (let column = 0; column < points.length; column++) {
      const deltaX = controlPoints[row][0] - controlPoints[column][0]
      const deltaY = controlPoints[row][1] - controlPoints[column][1]
      system[row][column] = thinPlateSplineRadialBasis(
        deltaX ** 2 + deltaY ** 2,
      )
    }

    system[row][row] += regularization
    system[row][points.length] = 1
    system[row][points.length + 1] = controlPoints[row][0]
    system[row][points.length + 2] = controlPoints[row][1]
    system[points.length][row] = 1
    system[points.length + 1][row] = controlPoints[row][0]
    system[points.length + 2][row] = controlPoints[row][1]
  }

  const trailingZeros = Array(THIN_PLATE_AFFINE_SIZE).fill(0)
  const xCoefficients = solveLinearSystem(system, [
    ...points.map((point) => point.projectedX),
    ...trailingZeros,
  ])
  const yCoefficients = solveLinearSystem(system, [
    ...points.map((point) => point.projectedY),
    ...trailingZeros,
  ])

  return {
    kind: "thin-plate-spline",
    regularization,
    normalization: { centerX, centerY, scale },
    controlPoints,
    xWeights: xCoefficients.slice(0, points.length),
    yWeights: yCoefficients.slice(0, points.length),
    xAffine: xCoefficients.slice(points.length) as [number, number, number],
    yAffine: yCoefficients.slice(points.length) as [number, number, number],
  }
}

const getThinPlateSplineResidualError = (
  point: LensCalibrationPoint,
  model: ThinPlateSplineModel,
) => {
  const projected = evaluateThinPlateSpline(model, {
    x: point.designX,
    y: point.designY,
  })
  return Math.hypot(
    projected.x - point.projectedX,
    projected.y - point.projectedY,
  )
}

const getRms = (values: number[]) =>
  Math.sqrt(values.reduce((sum, value) => sum + value ** 2, 0) / values.length)

const getLeaveOneOutRmsError = (
  points: LensCalibrationPoint[],
  regularization: number,
) =>
  getRms(
    points.map((point, heldOutIndex) => {
      const trainingPoints = points.filter(
        (_, candidateIndex) => candidateIndex !== heldOutIndex,
      )
      return getThinPlateSplineResidualError(
        point,
        fitThinPlateSplineModel(trainingPoints, regularization),
      )
    }),
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
  options: { regularization?: number; sigmaThreshold?: number } = {},
): LensCalibrationFit => {
  const regularization =
    options.regularization ?? DEFAULT_LENS_CALIBRATION_REGULARIZATION
  const sigmaThreshold = options.sigmaThreshold ?? 3
  if (sourcePoints.length < THIN_PLATE_AFFINE_SIZE + 1) {
    throw new Error(
      `Lens calibration requires at least ${THIN_PLATE_AFFINE_SIZE + 1} points`,
    )
  }
  if (regularization < 0) {
    throw new Error("Lens calibration regularization cannot be negative")
  }

  let includedPoints = [...sourcePoints]
  const excludedViaNumbers: number[] = []

  while (includedPoints.length >= THIN_PLATE_AFFINE_SIZE + 1) {
    const model = fitThinPlateSplineModel(includedPoints, regularization)
    const residuals = includedPoints.map((point) => ({
      point,
      error: getThinPlateSplineResidualError(point, model),
    }))
    const rmsError = getRms(residuals.map((residual) => residual.error))
    const worstResidual = residuals.reduce((worst, residual) =>
      residual.error > worst.error ? residual : worst,
    )

    if (
      worstResidual.error <= sigmaThreshold * rmsError ||
      includedPoints.length === THIN_PLATE_AFFINE_SIZE + 1
    ) {
      const matrix = fitBilinearMatrix(includedPoints)
      return {
        model,
        matrix,
        sourcePointCount: sourcePoints.length,
        includedViaNumbers: includedPoints.map((point) => point.viaNumber),
        excludedViaNumbers,
        rmsError,
        maxResidualError: worstResidual.error,
        leaveOneOutRmsError: getLeaveOneOutRmsError(
          includedPoints,
          regularization,
        ),
        baselineBilinearRmsError: getRms(
          includedPoints.map((point) =>
            getBilinearResidualError(point, matrix),
          ),
        ),
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
