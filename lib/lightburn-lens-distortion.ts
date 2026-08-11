import {
  LightBurnProject,
  type Mat,
  ShapeBase,
  ShapeGroup,
  ShapePath,
  type Vert,
} from "lbrnts"
import {
  BISCUIT_BOARD_LENS_CALIBRATION_FIT,
  BISCUIT_BOARD_LENS_CALIBRATION_MATRIX,
  BISCUIT_BOARD_LENS_CALIBRATION_MODEL,
} from "./coordinate_map/lens-calibration-generated"
import {
  evaluateThinPlateSpline,
  evaluateThinPlateSplineWithJacobian,
} from "./coordinate_map/thin-plate-spline"

export type Point = {
  x: number
  y: number
}

const [xCoefficients, yCoefficients] = BISCUIT_BOARD_LENS_CALIBRATION_MATRIX

/** @deprecated The LightBurn export now uses BISCUIT_BOARD_LENS_CALIBRATION_MODEL. */
export const BISCUIT_BOARD_LENS_CALIBRATION = {
  a0: xCoefficients[0],
  a1: xCoefficients[1],
  a2: xCoefficients[2],
  a3: xCoefficients[3],
  b0: yCoefficients[0],
  b1: yCoefficients[1],
  b2: yCoefficients[2],
  b3: yCoefficients[3],
} as const

export {
  BISCUIT_BOARD_LENS_CALIBRATION_FIT,
  BISCUIT_BOARD_LENS_CALIBRATION_MATRIX,
  BISCUIT_BOARD_LENS_CALIBRATION_MODEL,
}

const IDENTITY_MATRIX: Mat = [1, 0, 0, 1, 0, 0]

/** Convert a commanded design coordinate to its measured laser coordinate. */
export const designToProjected = (point: Point): Point =>
  evaluateThinPlateSpline(BISCUIT_BOARD_LENS_CALIBRATION_MODEL, point)

/**
 * Invert the calibrated laser projection with Newton iteration.
 *
 * The TPS affine part provides the initial estimate, then the full analytic
 * TPS Jacobian is included in each update.
 */
export const projectedToDesign = (
  projected: Point,
  options: {
    maxIterations?: number
    tolerance?: number
  } = {},
): Point => {
  const maxIterations = options.maxIterations ?? 20
  const tolerance = options.tolerance ?? 1e-10
  const { normalization, xAffine, yAffine } =
    BISCUIT_BOARD_LENS_CALIBRATION_MODEL
  const offsetX = projected.x - xAffine[0]
  const offsetY = projected.y - yAffine[0]
  const affineDeterminant = xAffine[1] * yAffine[2] - xAffine[2] * yAffine[1]

  if (Math.abs(affineDeterminant) < 1e-12) {
    throw new Error("Calibration affine matrix is singular")
  }

  const normalizedX =
    (yAffine[2] * offsetX - xAffine[2] * offsetY) / affineDeterminant
  const normalizedY =
    (-yAffine[1] * offsetX + xAffine[1] * offsetY) / affineDeterminant
  let x = normalization.centerX + normalizedX * normalization.scale
  let y = normalization.centerY + normalizedY * normalization.scale

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const { point: predicted, jacobian } = evaluateThinPlateSplineWithJacobian(
      BISCUIT_BOARD_LENS_CALIBRATION_MODEL,
      { x, y },
    )
    const errorX = predicted.x - projected.x
    const errorY = predicted.y - projected.y

    if (Math.hypot(errorX, errorY) <= tolerance) return { x, y }

    const [j00, j01, j10, j11] = jacobian
    const determinant = j00 * j11 - j01 * j10

    if (Math.abs(determinant) < 1e-12) {
      throw new Error("Calibration inverse is locally singular")
    }

    const deltaX = (j11 * errorX - j01 * errorY) / determinant
    const deltaY = (-j10 * errorX + j00 * errorY) / determinant

    x -= deltaX
    y -= deltaY
  }

  const finalPrediction = designToProjected({ x, y })
  const finalError = Math.hypot(
    finalPrediction.x - projected.x,
    finalPrediction.y - projected.y,
  )

  if (finalError > tolerance) {
    throw new Error(
      `Calibration inverse did not converge; residual=${finalError}`,
    )
  }

  return { x, y }
}

const applyMatrix = (matrix: Mat, point: Point): Point => {
  const [a, b, c, d, tx, ty] = matrix
  return {
    x: a * point.x + c * point.y + tx,
    y: b * point.x + d * point.y + ty,
  }
}

const composeMatrices = (parent: Mat, child: Mat): Mat => {
  const [pa, pb, pc, pd, ptx, pty] = parent
  const [ca, cb, cc, cd, ctx, cty] = child

  return [
    pa * ca + pc * cb,
    pb * ca + pd * cb,
    pa * cc + pc * cd,
    pb * cc + pd * cd,
    pa * ctx + pc * cty + ptx,
    pb * ctx + pd * cty + pty,
  ]
}

/**
 * Convert a board-local LightBurn position to its measured/projected position.
 *
 * The generated project uses a top-left origin, while the calibration design
 * frame is centered on the board. Removing the LightBurn origin restores the
 * design coordinate before applying the fitted forward transform, including
 * its translation.
 */
export const applyLightBurnLensDistortion = (
  point: Point,
  boardOrigin: Point,
): Point => {
  const centeredPoint = {
    x: point.x - boardOrigin.x,
    y: point.y - boardOrigin.y,
  }
  return designToProjected(centeredPoint)
}

const distortVert = (vert: Vert, matrix: Mat, boardOrigin: Point): Vert => {
  const distorted = applyLightBurnLensDistortion(
    applyMatrix(matrix, vert),
    boardOrigin,
  )
  const output: Vert = { ...vert, ...distorted }

  if (vert.c0x !== undefined && vert.c0y !== undefined) {
    const controlPoint = applyLightBurnLensDistortion(
      applyMatrix(matrix, { x: vert.c0x, y: vert.c0y }),
      boardOrigin,
    )
    output.c0x = controlPoint.x
    output.c0y = controlPoint.y
  }

  if (vert.c1x !== undefined && vert.c1y !== undefined) {
    const controlPoint = applyLightBurnLensDistortion(
      applyMatrix(matrix, { x: vert.c1x, y: vert.c1y }),
      boardOrigin,
    )
    output.c1x = controlPoint.x
    output.c1y = controlPoint.y
  }

  return output
}

const distortShape = (
  shape: ShapeBase,
  parentMatrix: Mat,
  boardOrigin: Point,
) => {
  const matrix = composeMatrices(parentMatrix, shape.xform)
  shape.xform = [...IDENTITY_MATRIX]

  if (shape instanceof ShapePath) {
    shape.verts = shape.verts.map((vert) =>
      distortVert(vert, matrix, boardOrigin),
    )
    return
  }

  if (shape instanceof ShapeGroup) {
    for (const child of shape.children) {
      if (child instanceof ShapeBase) distortShape(child, matrix, boardOrigin)
    }
    return
  }

  throw new Error(
    `Unsupported LightBurn shape for lens distortion: ${shape.token}`,
  )
}

const cloneShape = (shape: ShapeBase): ShapeBase => {
  if (shape instanceof ShapePath) {
    return new ShapePath({
      verts: shape.verts.map((vert) => ({ ...vert })),
      prims: shape.prims.map((prim) => ({ ...prim })),
      isClosed: shape.isClosed,
      cutIndex: shape.cutIndex,
      locked: shape.locked,
      xform: [...shape.xform],
    })
  }

  if (shape instanceof ShapeGroup) {
    const cloned = new ShapeGroup()
    cloned.cutIndex = shape.cutIndex
    cloned.locked = shape.locked
    cloned.xform = [...shape.xform]
    cloned.children = shape.children.map((child) =>
      child instanceof ShapeBase ? cloneShape(child) : child,
    )
    return cloned
  }

  throw new Error(`Unsupported LightBurn shape for cloning: ${shape.token}`)
}

/** Clone a LightBurn project and apply forward lens distortion to every path. */
export const createLensDistortedLightBurnProject = (
  project: LightBurnProject,
  boardOrigin: Point,
): LightBurnProject => {
  const cloned = new LightBurnProject({
    appVersion: project.appVersion,
    formatVersion: project.formatVersion,
    materialHeight: project.materialHeight,
    mirrorX: project.mirrorX,
    mirrorY: project.mirrorY,
    children: project.children.map((child) =>
      child instanceof ShapeBase ? cloneShape(child) : child,
    ),
  })

  for (const child of cloned.children) {
    if (child instanceof ShapeBase) {
      distortShape(child, IDENTITY_MATRIX, boardOrigin)
    }
  }

  return cloned
}
