import {
  LightBurnProject,
  type Mat,
  type Prim,
  ShapeBase,
  ShapeGroup,
  ShapePath,
  type Vert,
} from "lbrnts"
import {
  evaluateInverseDistanceWeighted,
  evaluateInverseDistanceWeightedWithJacobian,
} from "./coordinate_map/inverse-distance-weighted"
import {
  BISCUIT_BOARD_LENS_CALIBRATION_FIT,
  BISCUIT_BOARD_LENS_CALIBRATION_MATRIX,
  BISCUIT_BOARD_LENS_CALIBRATION_MODEL,
} from "./coordinate_map/lens-calibration-generated"

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
export const LENS_DISTORTION_MAX_SEGMENT_LENGTH_MM = 0.5
const POINT_EQUALITY_EPSILON_MM = 1e-9

/** Convert a commanded design coordinate to its measured laser coordinate. */
export const designToProjected = (point: Point): Point =>
  evaluateInverseDistanceWeighted(BISCUIT_BOARD_LENS_CALIBRATION_MODEL, point)

/**
 * Invert the calibrated laser projection with Newton iteration over the
 * smooth inverse-distance-weighted correction field.
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
  const [affineX, affineY] = BISCUIT_BOARD_LENS_CALIBRATION_MODEL.affine
  const [a0, a1, a2] = affineX
  const [b0, b1, b2] = affineY
  const offsetX = projected.x - a0
  const offsetY = projected.y - b0
  const affineDeterminant = a1 * b2 - a2 * b1

  if (Math.abs(affineDeterminant) < 1e-12) {
    throw new Error("Calibration affine matrix is singular")
  }

  let x = (b2 * offsetX - a2 * offsetY) / affineDeterminant
  let y = (-b1 * offsetX + a1 * offsetY) / affineDeterminant

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const { point: predicted, jacobian } =
      evaluateInverseDistanceWeightedWithJacobian(
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

    x -= (j11 * errorX - j01 * errorY) / determinant
    y -= (-j10 * errorX + j00 * errorY) / determinant
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

const getDistance = (first: Point, second: Point) =>
  Math.hypot(second.x - first.x, second.y - first.y)

const pointsAreEqual = (first: Point, second: Point) =>
  getDistance(first, second) <= POINT_EQUALITY_EPSILON_MM

const getMidpoint = (first: Point, second: Point): Point => ({
  x: (first.x + second.x) / 2,
  y: (first.y + second.y) / 2,
})

const appendPoint = (points: Point[], point: Point) => {
  if (
    points.length === 0 ||
    !pointsAreEqual(points[points.length - 1], point)
  ) {
    points.push(point)
  }
}

const appendTessellatedLine = (
  points: Point[],
  start: Point,
  end: Point,
  maxSegmentLength: number,
) => {
  const segmentCount = Math.max(
    1,
    Math.ceil(getDistance(start, end) / maxSegmentLength),
  )
  for (let step = 1; step <= segmentCount; step++) {
    const progress = step / segmentCount
    appendPoint(points, {
      x: start.x + (end.x - start.x) * progress,
      y: start.y + (end.y - start.y) * progress,
    })
  }
}

const appendTessellatedCubic = (
  points: Point[],
  start: Point,
  control0: Point,
  control1: Point,
  end: Point,
  maxSegmentLength: number,
  depth = 0,
) => {
  const controlPolygonLength =
    getDistance(start, control0) +
    getDistance(control0, control1) +
    getDistance(control1, end)

  if (controlPolygonLength <= maxSegmentLength || depth >= 20) {
    appendPoint(points, end)
    return
  }

  const startToControl0 = getMidpoint(start, control0)
  const control0ToControl1 = getMidpoint(control0, control1)
  const control1ToEnd = getMidpoint(control1, end)
  const leftControl = getMidpoint(startToControl0, control0ToControl1)
  const rightControl = getMidpoint(control0ToControl1, control1ToEnd)
  const midpoint = getMidpoint(leftControl, rightControl)

  appendTessellatedCubic(
    points,
    start,
    startToControl0,
    leftControl,
    midpoint,
    maxSegmentLength,
    depth + 1,
  )
  appendTessellatedCubic(
    points,
    midpoint,
    rightControl,
    control1ToEnd,
    end,
    maxSegmentLength,
    depth + 1,
  )
}

const tessellateAndDistortPath = (
  shape: ShapePath,
  matrix: Mat,
  boardOrigin: Point,
  maxSegmentLength: number,
): { verts: Vert[]; prims: Prim[] } => {
  if (shape.verts.length === 0) return { verts: [], prims: [] }

  const worldPoints: Point[] = []
  appendPoint(worldPoints, applyMatrix(matrix, shape.verts[0]))

  for (let index = 0; index < shape.prims.length; index++) {
    const startVert = shape.verts[index]
    const endVert = shape.verts[(index + 1) % shape.verts.length]
    if (!startVert || !endVert) {
      throw new Error(
        "LightBurn path primitive does not have matching vertices",
      )
    }

    const start = applyMatrix(matrix, startVert)
    const end = applyMatrix(matrix, endVert)
    if (shape.prims[index].type === 1) {
      const control0 = applyMatrix(matrix, {
        x: startVert.c0x ?? startVert.x,
        y: startVert.c0y ?? startVert.y,
      })
      const control1 = applyMatrix(matrix, {
        x: endVert.c1x ?? endVert.x,
        y: endVert.c1y ?? endVert.y,
      })
      appendTessellatedCubic(
        worldPoints,
        start,
        control0,
        control1,
        end,
        maxSegmentLength,
      )
    } else {
      appendTessellatedLine(worldPoints, start, end, maxSegmentLength)
    }
  }

  if (shape.isClosed && worldPoints.length > 1) {
    if (!pointsAreEqual(worldPoints[0], worldPoints[worldPoints.length - 1])) {
      appendTessellatedLine(
        worldPoints,
        worldPoints[worldPoints.length - 1],
        worldPoints[0],
        maxSegmentLength,
      )
    }
    if (pointsAreEqual(worldPoints[0], worldPoints[worldPoints.length - 1])) {
      worldPoints.pop()
    }
  }

  const verts = worldPoints.map((point) =>
    applyLightBurnLensDistortion(point, boardOrigin),
  )
  const primitiveCount = shape.isClosed
    ? verts.length
    : Math.max(0, verts.length - 1)

  return {
    verts,
    prims: Array.from({ length: primitiveCount }, () => ({ type: 0 })),
  }
}

const distortShape = (
  shape: ShapeBase,
  parentMatrix: Mat,
  boardOrigin: Point,
  maxSegmentLength: number,
) => {
  const matrix = composeMatrices(parentMatrix, shape.xform)
  shape.xform = [...IDENTITY_MATRIX]

  if (shape instanceof ShapePath) {
    const tessellated = tessellateAndDistortPath(
      shape,
      matrix,
      boardOrigin,
      maxSegmentLength,
    )
    shape.verts = tessellated.verts
    shape.prims = tessellated.prims
    return
  }

  if (shape instanceof ShapeGroup) {
    for (const child of shape.children) {
      if (child instanceof ShapeBase) {
        distortShape(child, matrix, boardOrigin, maxSegmentLength)
      }
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
  options: { maxSegmentLength?: number } = {},
): LightBurnProject => {
  const maxSegmentLength =
    options.maxSegmentLength ?? LENS_DISTORTION_MAX_SEGMENT_LENGTH_MM
  if (!Number.isFinite(maxSegmentLength) || maxSegmentLength <= 0) {
    throw new Error(
      "Lens distortion maxSegmentLength must be a finite number greater than 0",
    )
  }
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
      distortShape(child, IDENTITY_MATRIX, boardOrigin, maxSegmentLength)
    }
  }

  return cloned
}
