import { mkdir } from "node:fs/promises"
import { dirname, relative, resolve } from "node:path"

const workingDirectory = process.cwd()
const distDirectory = resolve(workingDirectory, "dist")
const gerberDirectory = resolve(distDirectory, "gerbers")
const tsciPath = resolve(import.meta.dir, "../node_modules/.bin/tsci")
const gerberExporterPath = resolve(import.meta.dir, "export-gerbers.ts")

const runCommand = async (command: string[]) => {
  const childProcess = Bun.spawn(command, {
    cwd: workingDirectory,
    stderr: "inherit",
    stdout: "inherit",
  })
  const exitCode = await childProcess.exited
  if (exitCode !== 0) {
    throw new Error(`${command.join(" ")} failed with exit code ${exitCode}`)
  }
}

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  )

await runCommand([tsciPath, "build", "--site"])
await mkdir(gerberDirectory, { recursive: true })

const circuitJsonGlob = new Bun.Glob("**/circuit.json")
const gerberLinks: Array<{ circuitName: string; href: string }> = []

for await (const circuitJsonPath of circuitJsonGlob.scan({
  cwd: distDirectory,
  absolute: true,
})) {
  const circuitName = relative(distDirectory, dirname(circuitJsonPath))
  const gerberPath = resolve(gerberDirectory, `${circuitName}.zip`)
  await runCommand([
    process.execPath,
    gerberExporterPath,
    circuitJsonPath,
    gerberPath,
  ])
  gerberLinks.push({ circuitName, href: `./${circuitName}.zip` })
}

gerberLinks.sort((a, b) => a.circuitName.localeCompare(b.circuitName))
const gerberListItems = gerberLinks
  .map(
    ({ circuitName, href }) =>
      `<li><a href="${escapeHtml(href)}">${escapeHtml(circuitName)}</a></li>`,
  )
  .join("\n")

await Bun.write(
  resolve(gerberDirectory, "index.html"),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Biscuit Board Gerbers</title>
  </head>
  <body>
    <main>
      <h1>Biscuit Board Gerbers</h1>
      <p>Fabrication ZIPs with top and bottom copper pours and no solder mask.</p>
      <ul>${gerberListItems}</ul>
    </main>
  </body>
</html>
`,
)

console.log(`Gerber downloads available at /gerbers/ (${gerberLinks.length})`)
