export type Point2 = {
  x: number
  y: number
}

export type AffineRow = readonly [offset: number, x: number, y: number]

export type InverseDistanceWeightedControlPoint = readonly [
  designX: number,
  designY: number,
  residualX: number,
  residualY: number,
]

export type InverseDistanceWeightedModel = {
  kind: "inverse-distance-weighted-residuals"
  power: number
  affine: readonly [AffineRow, AffineRow]
  controlPoints: readonly InverseDistanceWeightedControlPoint[]
}

export type InverseDistanceWeightedEvaluation = {
  point: Point2
  jacobian: readonly [number, number, number, number]
}

const CONTROL_POINT_EPSILON_SQUARED = 1e-18

/**
 * Shepard interpolation of measured residuals over a global affine fit.
 *
 * Using inverse-square weights makes the field exact at every control point,
 * continuously differentiable, and free of triangulation boundaries.
 */
export const evaluateInverseDistanceWeightedWithJacobian = (
  model: InverseDistanceWeightedModel,
  point: Point2,
): InverseDistanceWeightedEvaluation => {
  const [affineX, affineY] = model.affine
  const affinePoint = {
    x: affineX[0] + affineX[1] * point.x + affineX[2] * point.y,
    y: affineY[0] + affineY[1] * point.x + affineY[2] * point.y,
  }
  const affineJacobian = [
    affineX[1],
    affineX[2],
    affineY[1],
    affineY[2],
  ] as const

  if (model.controlPoints.length === 0) {
    return { point: affinePoint, jacobian: affineJacobian }
  }

  const distances = model.controlPoints.map((controlPoint) => {
    const deltaX = point.x - controlPoint[0]
    const deltaY = point.y - controlPoint[1]
    return { deltaX, deltaY, squared: deltaX ** 2 + deltaY ** 2 }
  })
  const minimumDistanceSquared = Math.min(
    ...distances.map((distance) => distance.squared),
  )

  if (minimumDistanceSquared <= CONTROL_POINT_EPSILON_SQUARED) {
    const controlPoint =
      model.controlPoints[
        distances.findIndex(
          (distance) => distance.squared === minimumDistanceSquared,
        )
      ]
    return {
      point: {
        x: affinePoint.x + controlPoint[2],
        y: affinePoint.y + controlPoint[3],
      },
      // For inverse-square Shepard weights, the residual derivative tends to
      // zero at a control point, leaving the affine Jacobian.
      jacobian: affineJacobian,
    }
  }

  // Normalize by the largest raw weight. The common scale cancels from both
  // the weighted average and its derivative, and prevents large intermediates
  // very close to a calibration point.
  const weights = distances.map(
    (distance) =>
      (minimumDistanceSquared / distance.squared) ** (model.power / 2),
  )
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0)
  let residualX = 0
  let residualY = 0
  for (let index = 0; index < model.controlPoints.length; index++) {
    residualX += weights[index] * model.controlPoints[index][2]
    residualY += weights[index] * model.controlPoints[index][3]
  }
  residualX /= weightSum
  residualY /= weightSum

  let residualXDerivativeX = 0
  let residualXDerivativeY = 0
  let residualYDerivativeX = 0
  let residualYDerivativeY = 0
  for (let index = 0; index < model.controlPoints.length; index++) {
    const distance = distances[index]
    const weight = weights[index]
    const weightDerivativeX =
      (-model.power * distance.deltaX * weight) / distance.squared
    const weightDerivativeY =
      (-model.power * distance.deltaY * weight) / distance.squared
    const residualDeltaX = model.controlPoints[index][2] - residualX
    const residualDeltaY = model.controlPoints[index][3] - residualY

    residualXDerivativeX += weightDerivativeX * residualDeltaX
    residualXDerivativeY += weightDerivativeY * residualDeltaX
    residualYDerivativeX += weightDerivativeX * residualDeltaY
    residualYDerivativeY += weightDerivativeY * residualDeltaY
  }

  return {
    point: {
      x: affinePoint.x + residualX,
      y: affinePoint.y + residualY,
    },
    jacobian: [
      affineJacobian[0] + residualXDerivativeX / weightSum,
      affineJacobian[1] + residualXDerivativeY / weightSum,
      affineJacobian[2] + residualYDerivativeX / weightSum,
      affineJacobian[3] + residualYDerivativeY / weightSum,
    ],
  }
}

export const evaluateInverseDistanceWeighted = (
  model: InverseDistanceWeightedModel,
  point: Point2,
): Point2 => evaluateInverseDistanceWeightedWithJacobian(model, point).point
