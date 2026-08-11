export type Point2 = {
  x: number
  y: number
}

export type ThinPlateSplineModel = {
  kind: "thin-plate-spline"
  regularization: number
  normalization: {
    centerX: number
    centerY: number
    scale: number
  }
  controlPoints: readonly (readonly [number, number])[]
  xWeights: readonly number[]
  yWeights: readonly number[]
  xAffine: readonly [number, number, number]
  yAffine: readonly [number, number, number]
}

export type ThinPlateSplineEvaluation = {
  point: Point2
  jacobian: readonly [number, number, number, number]
}

/** Thin-plate spline radial basis U(r) = r^2 log(r^2). */
export const thinPlateSplineRadialBasis = (distanceSquared: number) =>
  distanceSquared === 0 ? 0 : distanceSquared * Math.log(distanceSquared)

export const evaluateThinPlateSplineWithJacobian = (
  model: ThinPlateSplineModel,
  point: Point2,
): ThinPlateSplineEvaluation => {
  const { centerX, centerY, scale } = model.normalization
  const normalizedX = (point.x - centerX) / scale
  const normalizedY = (point.y - centerY) / scale

  let x =
    model.xAffine[0] +
    model.xAffine[1] * normalizedX +
    model.xAffine[2] * normalizedY
  let y =
    model.yAffine[0] +
    model.yAffine[1] * normalizedX +
    model.yAffine[2] * normalizedY
  let dXByX = model.xAffine[1] / scale
  let dXByY = model.xAffine[2] / scale
  let dYByX = model.yAffine[1] / scale
  let dYByY = model.yAffine[2] / scale

  for (let index = 0; index < model.controlPoints.length; index++) {
    const [controlX, controlY] = model.controlPoints[index]
    const deltaX = normalizedX - controlX
    const deltaY = normalizedY - controlY
    const distanceSquared = deltaX ** 2 + deltaY ** 2
    const basis = thinPlateSplineRadialBasis(distanceSquared)

    x += model.xWeights[index] * basis
    y += model.yWeights[index] * basis

    if (distanceSquared > 0) {
      const derivativeFactor = (2 * (Math.log(distanceSquared) + 1)) / scale
      const basisDerivativeX = deltaX * derivativeFactor
      const basisDerivativeY = deltaY * derivativeFactor

      dXByX += model.xWeights[index] * basisDerivativeX
      dXByY += model.xWeights[index] * basisDerivativeY
      dYByX += model.yWeights[index] * basisDerivativeX
      dYByY += model.yWeights[index] * basisDerivativeY
    }
  }

  return {
    point: { x, y },
    jacobian: [dXByX, dXByY, dYByX, dYByY],
  }
}

export const evaluateThinPlateSpline = (
  model: ThinPlateSplineModel,
  point: Point2,
): Point2 => evaluateThinPlateSplineWithJacobian(model, point).point
