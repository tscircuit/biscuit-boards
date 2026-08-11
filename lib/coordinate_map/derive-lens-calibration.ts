import {
  evaluatePiecewiseLinear,
  type PiecewiseLinearControlPoint,
  type PiecewiseLinearEdge,
  type PiecewiseLinearModel,
  type PiecewiseLinearTriangle,
} from "./piecewise-linear"

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
  model: PiecewiseLinearModel
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

type TriangulationPoint = {
  x: number
  y: number
}

type MutableTriangle = [number, number, number]

const BILINEAR_BASIS_SIZE = 4
const AFFINE_BASIS_SIZE = 3

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

const fitAffineTarget = (
  points: LensCalibrationPoint[],
  target: "projectedX" | "projectedY",
): [number, number, number] => {
  const normalMatrix = Array.from({ length: AFFINE_BASIS_SIZE }, () =>
    Array(AFFINE_BASIS_SIZE).fill(0),
  )
  const normalVector = Array(AFFINE_BASIS_SIZE).fill(0)

  for (const point of points) {
    const basis = [1, point.designX, point.designY]
    for (let row = 0; row < AFFINE_BASIS_SIZE; row++) {
      normalVector[row] += basis[row] * point[target]
      for (let column = 0; column < AFFINE_BASIS_SIZE; column++) {
        normalMatrix[row][column] += basis[row] * basis[column]
      }
    }
  }

  return solveLinearSystem(normalMatrix, normalVector) as [
    number,
    number,
    number,
  ]
}

const fitAffineMatrix = (points: LensCalibrationPoint[]) =>
  [
    fitAffineTarget(points, "projectedX"),
    fitAffineTarget(points, "projectedY"),
  ] as const

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

const getSignedDoubleArea = (
  first: TriangulationPoint,
  second: TriangulationPoint,
  third: TriangulationPoint,
) =>
  (second.x - first.x) * (third.y - first.y) -
  (second.y - first.y) * (third.x - first.x)

const orientCounterClockwise = (
  points: TriangulationPoint[],
  triangle: MutableTriangle,
): MutableTriangle =>
  getSignedDoubleArea(
    points[triangle[0]],
    points[triangle[1]],
    points[triangle[2]],
  ) >= 0
    ? triangle
    : [triangle[1], triangle[0], triangle[2]]

const circumcircleContains = (
  points: TriangulationPoint[],
  triangle: MutableTriangle,
  pointIndex: number,
) => {
  const first = points[triangle[0]]
  const second = points[triangle[1]]
  const third = points[triangle[2]]
  const denominator =
    2 *
    (first.x * (second.y - third.y) +
      second.x * (third.y - first.y) +
      third.x * (first.y - second.y))

  if (Math.abs(denominator) < 1e-12) return false

  const firstSquared = first.x ** 2 + first.y ** 2
  const secondSquared = second.x ** 2 + second.y ** 2
  const thirdSquared = third.x ** 2 + third.y ** 2
  const centerX =
    (firstSquared * (second.y - third.y) +
      secondSquared * (third.y - first.y) +
      thirdSquared * (first.y - second.y)) /
    denominator
  const centerY =
    (firstSquared * (third.x - second.x) +
      secondSquared * (first.x - third.x) +
      thirdSquared * (second.x - first.x)) /
    denominator
  const radiusSquared = (centerX - first.x) ** 2 + (centerY - first.y) ** 2
  const point = points[pointIndex]
  const distanceSquared = (centerX - point.x) ** 2 + (centerY - point.y) ** 2

  return distanceSquared <= radiusSquared + Math.max(1, radiusSquared) * 1e-10
}

/** Deterministic Bowyer-Watson Delaunay triangulation for the small CSV set. */
const triangulate = (
  sourcePoints: LensCalibrationPoint[],
): PiecewiseLinearTriangle[] => {
  const calibrationPoints = sourcePoints.map((point) => ({
    x: point.designX,
    y: point.designY,
  }))
  const minX = Math.min(...calibrationPoints.map((point) => point.x))
  const maxX = Math.max(...calibrationPoints.map((point) => point.x))
  const minY = Math.min(...calibrationPoints.map((point) => point.y))
  const maxY = Math.max(...calibrationPoints.map((point) => point.y))
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const extent = Math.max(maxX - minX, maxY - minY)

  if (extent < 1e-12) {
    throw new Error("Lens calibration points have no spatial extent")
  }

  const superTriangleStart = calibrationPoints.length
  const points = [
    ...calibrationPoints,
    { x: centerX - 20 * extent, y: centerY - extent },
    { x: centerX, y: centerY + 20 * extent },
    { x: centerX + 20 * extent, y: centerY - extent },
  ]
  let triangles: MutableTriangle[] = [
    orientCounterClockwise(points, [
      superTriangleStart,
      superTriangleStart + 1,
      superTriangleStart + 2,
    ]),
  ]
  const insertionOrder = calibrationPoints
    .map((_, index) => index)
    .sort(
      (firstIndex, secondIndex) =>
        points[firstIndex].x - points[secondIndex].x ||
        points[firstIndex].y - points[secondIndex].y ||
        firstIndex - secondIndex,
    )

  for (const pointIndex of insertionOrder) {
    const badTriangleIndexes = new Set<number>()
    for (let index = 0; index < triangles.length; index++) {
      if (circumcircleContains(points, triangles[index], pointIndex)) {
        badTriangleIndexes.add(index)
      }
    }

    const boundaryEdges = new Map<
      string,
      { edge: readonly [number, number]; count: number }
    >()
    for (const triangleIndex of badTriangleIndexes) {
      const triangle = triangles[triangleIndex]
      for (const edge of [
        [triangle[0], triangle[1]],
        [triangle[1], triangle[2]],
        [triangle[2], triangle[0]],
      ] as const) {
        const key =
          edge[0] < edge[1] ? `${edge[0]}:${edge[1]}` : `${edge[1]}:${edge[0]}`
        const existing = boundaryEdges.get(key)
        if (existing) existing.count++
        else boundaryEdges.set(key, { edge, count: 1 })
      }
    }

    triangles = triangles.filter((_, index) => !badTriangleIndexes.has(index))
    for (const { edge, count } of boundaryEdges.values()) {
      if (count !== 1) continue
      const triangle: MutableTriangle = [edge[0], edge[1], pointIndex]
      if (
        Math.abs(
          getSignedDoubleArea(
            points[triangle[0]],
            points[triangle[1]],
            points[triangle[2]],
          ),
        ) < 1e-12
      ) {
        continue
      }
      triangles.push(orientCounterClockwise(points, triangle))
    }
  }

  return triangles
    .filter((triangle) =>
      triangle.every((pointIndex) => pointIndex < superTriangleStart),
    )
    .map(
      (triangle) =>
        [...triangle].sort(
          (first, second) => first - second,
        ) as MutableTriangle,
    )
    .sort(
      (first, second) =>
        first[0] - second[0] || first[1] - second[1] || first[2] - second[2],
    )
}

const getHullEdges = (
  triangles: readonly PiecewiseLinearTriangle[],
): PiecewiseLinearEdge[] => {
  const edges = new Map<string, { edge: PiecewiseLinearEdge; count: number }>()

  for (const triangle of triangles) {
    for (const edge of [
      [triangle[0], triangle[1]],
      [triangle[1], triangle[2]],
      [triangle[2], triangle[0]],
    ] as const) {
      const sortedEdge = [...edge].sort((first, second) => first - second) as [
        number,
        number,
      ]
      const key = `${sortedEdge[0]}:${sortedEdge[1]}`
      const existing = edges.get(key)
      if (existing) existing.count++
      else edges.set(key, { edge: sortedEdge, count: 1 })
    }
  }

  return [...edges.values()]
    .filter(({ count }) => count === 1)
    .map(({ edge }) => edge)
    .sort((first, second) => first[0] - second[0] || first[1] - second[1])
}

const fitPiecewiseLinearModel = (
  points: LensCalibrationPoint[],
): PiecewiseLinearModel => {
  const seenDesignPoints = new Set<string>()
  for (const point of points) {
    const key = `${point.designX}:${point.designY}`
    if (seenDesignPoints.has(key)) {
      throw new Error(`Duplicate lens calibration design coordinate: ${key}`)
    }
    seenDesignPoints.add(key)
  }

  const controlPoints: PiecewiseLinearControlPoint[] = points.map((point) => [
    point.designX,
    point.designY,
    point.projectedX,
    point.projectedY,
  ])
  const triangles = triangulate(points)
  if (triangles.length === 0) {
    throw new Error("Lens calibration points cannot form a triangle")
  }

  for (const triangle of triangles) {
    const designArea = getSignedDoubleArea(
      { x: controlPoints[triangle[0]][0], y: controlPoints[triangle[0]][1] },
      { x: controlPoints[triangle[1]][0], y: controlPoints[triangle[1]][1] },
      { x: controlPoints[triangle[2]][0], y: controlPoints[triangle[2]][1] },
    )
    const projectedArea = getSignedDoubleArea(
      { x: controlPoints[triangle[0]][2], y: controlPoints[triangle[0]][3] },
      { x: controlPoints[triangle[1]][2], y: controlPoints[triangle[1]][3] },
      { x: controlPoints[triangle[2]][2], y: controlPoints[triangle[2]][3] },
    )
    if (Math.abs(projectedArea) < 1e-12 || designArea * projectedArea <= 0) {
      throw new Error("Lens calibration contains a folded projected triangle")
    }
  }

  const affineMatrix = fitAffineMatrix(points)

  return {
    kind: "piecewise-linear-delaunay",
    extrapolation: "convex-hull-affine",
    extrapolationJacobian: [
      affineMatrix[0][1],
      affineMatrix[0][2],
      affineMatrix[1][1],
      affineMatrix[1][2],
    ],
    controlPoints,
    triangles,
    hullEdges: getHullEdges(triangles),
  }
}

const getPiecewiseLinearResidualError = (
  point: LensCalibrationPoint,
  model: PiecewiseLinearModel,
) => {
  const projected = evaluatePiecewiseLinear(model, {
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

const getLeaveOneOutRmsError = (points: LensCalibrationPoint[]) =>
  getRms(
    points.map((point, heldOutIndex) => {
      const trainingPoints = points.filter(
        (_, candidateIndex) => candidateIndex !== heldOutIndex,
      )
      return getPiecewiseLinearResidualError(
        point,
        fitPiecewiseLinearModel(trainingPoints),
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
): LensCalibrationFit => {
  if (sourcePoints.length < 4) {
    throw new Error("Lens calibration requires at least 4 points")
  }

  const model = fitPiecewiseLinearModel(sourcePoints)
  const residuals = sourcePoints.map((point) =>
    getPiecewiseLinearResidualError(point, model),
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
