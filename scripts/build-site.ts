import { resolve } from "node:path"

const workingDirectory = process.cwd()
const tsciPath = resolve(import.meta.dir, "../node_modules/.bin/tsci")

const childProcess = Bun.spawn([tsciPath, "build", "--site"], {
  cwd: workingDirectory,
  stderr: "inherit",
  stdout: "inherit",
})
const exitCode = await childProcess.exited

if (exitCode !== 0) {
  throw new Error(`Site build failed with exit code ${exitCode}`)
}
