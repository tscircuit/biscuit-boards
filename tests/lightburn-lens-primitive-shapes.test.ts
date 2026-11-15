import { expect, test } from "bun:test"
import {
  LightBurnProject,
  ShapeEllipse,
  ShapeGroup,
  ShapePath,
  ShapeRect,
} from "lbrnts"
import { createLensDistortedLightBurnProject } from "../lib/lightburn-lens-distortion"

const collectPaths = (project: LightBurnProject): ShapePath[] => {
  const paths: ShapePath[] = []
  const pending = [...project.children]
  while (pending.length > 0) {
    const element = pending.shift()
    if (element instanceof ShapePath) paths.push(element)
    if (element instanceof ShapeGroup) pending.push(...element.children)
  }
  return paths
}

test("lens-distorts LightBurn rect and ellipse primitives instead of throwing", () => {
  const rect = new ShapeRect()
  rect.w = 8
  rect.h = 4
  rect.xform = [1, 0, 0, 1, 2, 3]

  const rounded = new ShapeRect()
  rounded.w = 6
  rounded.h = 6
  rounded.cr = 1

  const ellipse = new ShapeEllipse()
  ellipse.rx = 3
  ellipse.ry = 2

  const groupedRect = new ShapeRect()
  groupedRect.w = 2
  groupedRect.h = 2
  const group = new ShapeGroup()
  group.children = [groupedRect]

  const project = new LightBurnProject({
    children: [rect, rounded, ellipse, group],
  })

  expect(() =>
    createLensDistortedLightBurnProject(project, { x: 0, y: 0 }),
  ).not.toThrow()

  const paths = collectPaths(
    createLensDistortedLightBurnProject(project, { x: 0, y: 0 }),
  )
  expect(paths).toHaveLength(4)
  expect(paths.every((path) => path.verts.length > 3)).toBe(true)
  expect(
    paths.every((path) => path.prims.every((prim) => prim.type === 0)),
  ).toBe(true)

  const undistortedCorner = { x: 2, y: 3 }
  expect(paths[0]?.verts[0]).not.toEqual(undistortedCorner)
})
