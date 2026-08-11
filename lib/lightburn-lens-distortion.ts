import {
  LightBurnProject,
  type Mat,
  ShapeBase,
  ShapeGroup,
  ShapePath,
  type Vert,
} from "lbrnts"

export type Point = {
  x: number
  y: number
}

export const BISCUIT_BOARD_LENS_CALIBRATION = {
  a0: 83.66565681264,
  a1: 1.022144660036,
  a2: 0.01678365109326,
  a3: -0.0002221269589856,
  b0: 72.09742260279,
  b1: -0.003090470993456,
  b2: 1.012978612848,
  b3: -0.001311585142779,
} as const

const IDENTITY_MATRIX: Mat = [1, 0, 0, 1, 0, 0]

/** Convert a commanded design coordinate to its measured laser coordinate. */
export const designToProjected = (point: Point): Point => {
  const { x, y } = point
  const { a0, a1, a2, a3, b0, b1, b2, b3 } = BISCUIT_BOARD_LENS_CALIBRATION

  return {
    x: a0 + a1 * x + a2 * y + a3 * x * y,
    y: b0 + b1 * x + b2 * y + b3 * x * y,
  }
}

/**
 * Invert the calibrated laser projection with Newton iteration.
 *
 * The affine part provides the initial estimate, then the bilinear terms are
 * included in each Jacobian update.
 */
export const projectedToDesign = (
  projected: Point,
  options: {
    maxIterations?: number
    tolerance?: number
  } = {},
): Point => {
  const maxIterations = options.maxIterations ?? 10
  const tolerance = options.tolerance ?? 1e-10
  const { a0, a1, a2, a3, b0, b1, b2, b3 } = BISCUIT_BOARD_LENS_CALIBRATION
  const offsetX = projected.x - a0
  const offsetY = projected.y - b0
  const affineDeterminant = a1 * b2 - a2 * b1

  if (Math.abs(affineDeterminant) < 1e-12) {
    throw new Error("Calibration affine matrix is singular")
  }

  let x = (b2 * offsetX - a2 * offsetY) / affineDeterminant
  let y = (-b1 * offsetX + a1 * offsetY) / affineDeterminant

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const predicted = designToProjected({ x, y })
    const errorX = predicted.x - projected.x
    const errorY = predicted.y - projected.y

    if (Math.hypot(errorX, errorY) <= tolerance) return { x, y }

    const j00 = a1 + a3 * y
    const j01 = a2 + a3 * x
    const j10 = b1 + b3 * y
    const j11 = b2 + b3 * x
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

const correctVert = (vert: Vert, matrix: Mat, boardOrigin: Point): Vert => {
  const corrected = applyLightBurnLensDistortion(
    applyMatrix(matrix, vert),
    boardOrigin,
  )
  const output: Vert = { ...vert, ...corrected }

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

const correctShape = (
  shape: ShapeBase,
  parentMatrix: Mat,
  boardOrigin: Point,
) => {
  const matrix = composeMatrices(parentMatrix, shape.xform)
  shape.xform = [...IDENTITY_MATRIX]

  if (shape instanceof ShapePath) {
    shape.verts = shape.verts.map((vert) =>
      correctVert(vert, matrix, boardOrigin),
    )
    return
  }

  if (shape instanceof ShapeGroup) {
    for (const child of shape.children) {
      if (child instanceof ShapeBase) correctShape(child, matrix, boardOrigin)
    }
    return
  }

  throw new Error(
    `Unsupported LightBurn shape for lens correction: ${shape.token}`,
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
      correctShape(child, IDENTITY_MATRIX, boardOrigin)
    }
  }

  return cloned
}
