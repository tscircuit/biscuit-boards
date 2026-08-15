import assert from "node:assert/strict"
import { createRequire } from "node:module"

const expectedExports = [
  "ArduinoShieldClad",
  "BiscuitBoard",
  "BoosterPackClad",
  "BreadboardClad",
  "Clad40x40",
  "FeatherCladWithPinHeaders",
  "XiaoCladWithPerforatedPinHeaders",
  "XiaoCladWithPinHeaders",
  "createBiscuitBoardAutorouter",
] as const

const esmBundle = await import("../dist/npm.js")
const require = createRequire(import.meta.url)
const cjsBundle = require("../dist/npm.cjs")

for (const exportName of expectedExports) {
  assert.equal(
    typeof esmBundle[exportName],
    "function",
    `ESM bundle is missing ${exportName}`,
  )
  assert.equal(
    typeof cjsBundle[exportName],
    "function",
    `CommonJS bundle is missing ${exportName}`,
  )
}

console.log(
  `Verified ${expectedExports.length} public exports in ESM and CommonJS bundles`,
)
