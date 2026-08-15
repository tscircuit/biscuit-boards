import assert from "node:assert/strict"
import { mkdir } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import Module from "manifold-3d"
import { manifoldToStep } from "manifold-to-step"
import {
  BISCUIT_BOARD_HEIGHT,
  BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS,
  BISCUIT_BOARD_WIDTH,
} from "../lib/BiscuitBoard"

const STENCIL_THICKNESS = 0.12
const CORNER_RADIUS = 2
const MOUNTING_HOLE_DIAMETER = 2.2
const CIRCLE_SEGMENTS = 96

const outputPath = resolve(
  process.argv[2] ?? "dist/mechanical/biscuit-board-stencil.step",
)

const wasm = await Module()
wasm.setup()

const { Manifold } = wasm

// Build a 75 mm x 55 mm rounded sheet matching the clad outline. The two
// overlapping bars and four corner cylinders form an exact rounded rectangle
// before the standard clad mounting-hole pattern is subtracted.
let stencil = Manifold.cube(
  [
    BISCUIT_BOARD_WIDTH - 2 * CORNER_RADIUS,
    BISCUIT_BOARD_HEIGHT,
    STENCIL_THICKNESS,
  ],
  true,
).add(
  Manifold.cube(
    [
      BISCUIT_BOARD_WIDTH,
      BISCUIT_BOARD_HEIGHT - 2 * CORNER_RADIUS,
      STENCIL_THICKNESS,
    ],
    true,
  ),
)

for (const x of [
  -BISCUIT_BOARD_WIDTH / 2 + CORNER_RADIUS,
  BISCUIT_BOARD_WIDTH / 2 - CORNER_RADIUS,
]) {
  for (const y of [
    -BISCUIT_BOARD_HEIGHT / 2 + CORNER_RADIUS,
    BISCUIT_BOARD_HEIGHT / 2 - CORNER_RADIUS,
  ]) {
    stencil = stencil.add(
      Manifold.cylinder(
        STENCIL_THICKNESS,
        CORNER_RADIUS,
        CORNER_RADIUS,
        CIRCLE_SEGMENTS,
        true,
      ).translate([x, y, 0]),
    )
  }
}

for (const { x, y } of BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS) {
  const hole = Manifold.cylinder(
    STENCIL_THICKNESS * 3,
    MOUNTING_HOLE_DIAMETER / 2,
    MOUNTING_HOLE_DIAMETER / 2,
    CIRCLE_SEGMENTS,
    true,
  ).translate([x, y, 0])
  stencil = stencil.subtract(hole)
}

if (stencil.isEmpty()) {
  throw new Error("Stencil boolean operations produced an empty solid")
}

const bounds = stencil.boundingBox()
const size = bounds.max.map((value, index) => value - bounds.min[index]!)
const expectedVolume =
  (BISCUIT_BOARD_WIDTH * BISCUIT_BOARD_HEIGHT -
    (4 - Math.PI) * CORNER_RADIUS ** 2 -
    BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS.length *
      Math.PI *
      (MOUNTING_HOLE_DIAMETER / 2) ** 2) *
  STENCIL_THICKNESS

assert.deepEqual(size, [
  BISCUIT_BOARD_WIDTH,
  BISCUIT_BOARD_HEIGHT,
  STENCIL_THICKNESS,
])
assert.equal(stencil.genus(), BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS.length)
assert.ok(Math.abs(stencil.volume() - expectedVolume) < 0.01)

await mkdir(dirname(outputPath), { recursive: true })
await Bun.write(outputPath, manifoldToStep(stencil))

console.log(`Wrote ${outputPath}`)
console.log(`Bounds: ${size.join(" x ")} mm`)
console.log(`Through-holes: ${stencil.genus()}`)
console.log(`Volume: ${stencil.volume().toFixed(6)} mm^3`)

stencil.delete()
