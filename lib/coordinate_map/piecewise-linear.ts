export type Point2 = {
  x: number
  y: number
}

export type PiecewiseLinearControlPoint = readonly [
  designX: number,
  designY: number,
  projectedX: number,
  projectedY: number,
]

export type PiecewiseLinearTriangle = readonly [
  firstIndex: number,
  secondIndex: number,
  thirdIndex: number,
]

export type PiecewiseLinearEdge = readonly [
  firstIndex: number,
  secondIndex: number,
]

export type PiecewiseLinearModel = {
  kind: "piecewise-linear-delaunay"
  extrapolation: "convex-hull-affine"
  extrapolationJacobian: readonly [number, number, number, number]
  controlPoints: readonly PiecewiseLinearControlPoint[]
  triangles: readonly PiecewiseLinearTriangle[]
  hullEdges: readonly PiecewiseLinearEdge[]
}

export type PiecewiseLinearDirection =
  | "design-to-projected"
  | "projected-to-design"

export type PiecewiseLinearEvaluation = {
  point: Point2
  jacobian: readonly [number, number, number, number]
  triangleIndex: number
  extrapolated: boolean
}

const BARYCENTRIC_EPSILON = 1e-9

const getSourcePoint = (
  controlPoint: PiecewiseLinearControlPoint,
  direction: PiecewiseLinearDirection,
): Point2 =>
  direction === "design-to-projected"
    ? { x: controlPoint[0], y: controlPoint[1] }
    : { x: controlPoint[2], y: controlPoint[3] }

const getTargetPoint = (
  controlPoint: PiecewiseLinearControlPoint,
  direction: PiecewiseLinearDirection,
): Point2 =>
  direction === "design-to-projected"
    ? { x: controlPoint[2], y: controlPoint[3] }
    : { x: controlPoint[0], y: controlPoint[1] }

const getBarycentricWeights = (
  point: Point2,
  first: Point2,
  second: Point2,
  third: Point2,
): readonly [number, number, number] => {
  const denominator =
    (second.y - third.y) * (first.x - third.x) +
    (third.x - second.x) * (first.y - third.y)

  if (Math.abs(denominator) < 1e-12) {
    throw new Error("Piecewise-linear calibration triangle is degenerate")
  }

  const firstWeight =
    ((second.y - third.y) * (point.x - third.x) +
      (third.x - second.x) * (point.y - third.y)) /
    denominator
  const secondWeight =
    ((third.y - first.y) * (point.x - third.x) +
      (first.x - third.x) * (point.y - third.y)) /
    denominator

  return [firstWeight, secondWeight, 1 - firstWeight - secondWeight]
}

const isInsideTriangle = (weights: readonly number[]) =>
  weights.every((weight) => weight >= -BARYCENTRIC_EPSILON)

const getClosestPointOnSegment = (
  point: Point2,
  start: Point2,
  end: Point2,
): { point: Point2; parameter: number; distanceSquared: number } => {
  const deltaX = end.x - start.x
  const deltaY = end.y - start.y
  const lengthSquared = deltaX ** 2 + deltaY ** 2
  if (lengthSquared === 0) {
    return {
      point: start,
      parameter: 0,
      distanceSquared: (point.x - start.x) ** 2 + (point.y - start.y) ** 2,
    }
  }

  const projection = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) /
        lengthSquared,
    ),
  )
  const closestX = start.x + projection * deltaX
  const closestY = start.y + projection * deltaY
  return {
    point: { x: closestX, y: closestY },
    parameter: projection,
    distanceSquared: (point.x - closestX) ** 2 + (point.y - closestY) ** 2,
  }
}

const getTriangleJacobian = (
  source: readonly [Point2, Point2, Point2],
  target: readonly [Point2, Point2, Point2],
): readonly [number, number, number, number] => {
  const sourceX1 = source[1].x - source[0].x
  const sourceY1 = source[1].y - source[0].y
  const sourceX2 = source[2].x - source[0].x
  const sourceY2 = source[2].y - source[0].y
  const targetX1 = target[1].x - target[0].x
  const targetY1 = target[1].y - target[0].y
  const targetX2 = target[2].x - target[0].x
  const targetY2 = target[2].y - target[0].y
  const determinant = sourceX1 * sourceY2 - sourceX2 * sourceY1

  if (Math.abs(determinant) < 1e-12) {
    throw new Error("Piecewise-linear calibration triangle is degenerate")
  }

  return [
    (targetX1 * sourceY2 - targetX2 * sourceY1) / determinant,
    (-targetX1 * sourceX2 + targetX2 * sourceX1) / determinant,
    (targetY1 * sourceY2 - targetY2 * sourceY1) / determinant,
    (-targetY1 * sourceX2 + targetY2 * sourceX1) / determinant,
  ]
}

const getExtrapolationJacobian = (
  model: PiecewiseLinearModel,
  direction: PiecewiseLinearDirection,
): readonly [number, number, number, number] => {
  if (direction === "design-to-projected") {
    return model.extrapolationJacobian
  }

  const [j00, j01, j10, j11] = model.extrapolationJacobian
  const determinant = j00 * j11 - j01 * j10
  if (Math.abs(determinant) < 1e-12) {
    throw new Error("Piecewise-linear extrapolation matrix is singular")
  }
  return [
    j11 / determinant,
    -j01 / determinant,
    -j10 / determinant,
    j00 / determinant,
  ]
}

export const evaluatePiecewiseLinearWithJacobian = (
  model: PiecewiseLinearModel,
  point: Point2,
  direction: PiecewiseLinearDirection = "design-to-projected",
): PiecewiseLinearEvaluation => {
  for (let index = 0; index < model.triangles.length; index++) {
    const triangle = model.triangles[index]
    const source = triangle.map((controlPointIndex) =>
      getSourcePoint(model.controlPoints[controlPointIndex], direction),
    ) as [Point2, Point2, Point2]
    const weights = getBarycentricWeights(point, ...source)

    if (isInsideTriangle(weights)) {
      const target = triangle.map((controlPointIndex) =>
        getTargetPoint(model.controlPoints[controlPointIndex], direction),
      ) as [Point2, Point2, Point2]
      return {
        point: {
          x: weights.reduce(
            (sum, weight, weightIndex) => sum + weight * target[weightIndex].x,
            0,
          ),
          y: weights.reduce(
            (sum, weight, weightIndex) => sum + weight * target[weightIndex].y,
            0,
          ),
        },
        jacobian: getTriangleJacobian(source, target),
        triangleIndex: index,
        extrapolated: false,
      }
    }
  }

  let selectedEdge: PiecewiseLinearEdge | undefined
  let selectedClosest:
    | { point: Point2; parameter: number; distanceSquared: number }
    | undefined

  for (const edge of model.hullEdges) {
    const sourceStart = getSourcePoint(model.controlPoints[edge[0]], direction)
    const sourceEnd = getSourcePoint(model.controlPoints[edge[1]], direction)
    const closest = getClosestPointOnSegment(point, sourceStart, sourceEnd)
    if (
      !selectedClosest ||
      closest.distanceSquared < selectedClosest.distanceSquared
    ) {
      selectedEdge = edge
      selectedClosest = closest
    }
  }

  if (!selectedEdge || !selectedClosest) {
    throw new Error("Piecewise-linear calibration contains no hull edges")
  }

  const sourceStart = getSourcePoint(
    model.controlPoints[selectedEdge[0]],
    direction,
  )
  const sourceEnd = getSourcePoint(
    model.controlPoints[selectedEdge[1]],
    direction,
  )
  const targetStart = getTargetPoint(
    model.controlPoints[selectedEdge[0]],
    direction,
  )
  const targetEnd = getTargetPoint(
    model.controlPoints[selectedEdge[1]],
    direction,
  )
  const targetDeltaX = targetEnd.x - targetStart.x
  const targetDeltaY = targetEnd.y - targetStart.y
  const boundaryTarget = {
    x: targetStart.x + selectedClosest.parameter * targetDeltaX,
    y: targetStart.y + selectedClosest.parameter * targetDeltaY,
  }
  const extrapolationDelta = {
    x: point.x - selectedClosest.point.x,
    y: point.y - selectedClosest.point.y,
  }
  const extrapolationJacobian = getExtrapolationJacobian(model, direction)
  const [j00, j01, j10, j11] = extrapolationJacobian

  let jacobian = extrapolationJacobian
  if (
    selectedClosest.parameter > BARYCENTRIC_EPSILON &&
    selectedClosest.parameter < 1 - BARYCENTRIC_EPSILON
  ) {
    const sourceDeltaX = sourceEnd.x - sourceStart.x
    const sourceDeltaY = sourceEnd.y - sourceStart.y
    const sourceLengthSquared = sourceDeltaX ** 2 + sourceDeltaY ** 2
    const projection00 = sourceDeltaX ** 2 / sourceLengthSquared
    const projection01 = (sourceDeltaX * sourceDeltaY) / sourceLengthSquared
    const projection11 = sourceDeltaY ** 2 / sourceLengthSquared

    jacobian = [
      (targetDeltaX * sourceDeltaX) / sourceLengthSquared +
        j00 * (1 - projection00) -
        j01 * projection01,
      (targetDeltaX * sourceDeltaY) / sourceLengthSquared -
        j00 * projection01 +
        j01 * (1 - projection11),
      (targetDeltaY * sourceDeltaX) / sourceLengthSquared +
        j10 * (1 - projection00) -
        j11 * projection01,
      (targetDeltaY * sourceDeltaY) / sourceLengthSquared -
        j10 * projection01 +
        j11 * (1 - projection11),
    ]
  }

  return {
    point: {
      x:
        boundaryTarget.x +
        j00 * extrapolationDelta.x +
        j01 * extrapolationDelta.y,
      y:
        boundaryTarget.y +
        j10 * extrapolationDelta.x +
        j11 * extrapolationDelta.y,
    },
    jacobian,
    triangleIndex: -1,
    extrapolated: true,
  }
}

export const evaluatePiecewiseLinear = (
  model: PiecewiseLinearModel,
  point: Point2,
  direction: PiecewiseLinearDirection = "design-to-projected",
): Point2 => evaluatePiecewiseLinearWithJacobian(model, point, direction).point
