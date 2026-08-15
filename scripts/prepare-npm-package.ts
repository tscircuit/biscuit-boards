import { access, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

const packageJsonPath = resolve("package.json")
const backupPath = resolve(".package.json.prepack")

try {
  await access(backupPath)
  throw new Error(
    "Refusing to prepare npm package while .package.json.prepack exists",
  )
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
}

const sourcePackageJson = await readFile(packageJsonPath, "utf8")
const publishedPackageJson = JSON.parse(sourcePackageJson)

await writeFile(backupPath, sourcePackageJson)

delete publishedPackageJson.overrides
delete publishedPackageJson.patchedDependencies
delete publishedPackageJson.trustedDependencies
publishedPackageJson.files = ["dist"]
publishedPackageJson.dependencies = Object.fromEntries(
  ["@tscircuit/core", "@tscircuit/props"].map((dependencyName) => [
    dependencyName,
    publishedPackageJson.dependencies[dependencyName],
  ]),
)

await writeFile(
  packageJsonPath,
  `${JSON.stringify(publishedPackageJson, null, 2)}\n`,
)
