import { mkdir, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, relative, resolve } from "node:path"
import { Resvg } from "@resvg/resvg-js"
import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { extractIndividualBoardCircuits } from "./lib/extract-individual-board-circuits"

const workingDirectory = process.cwd()
const distDirectory = resolve(workingDirectory, "dist")
const gerberDirectory = resolve(distDirectory, "gerbers")
const tsciPath = resolve(import.meta.dir, "../node_modules/.bin/tsci")
const gerberExporterPath = resolve(import.meta.dir, "export-gerbers.ts")

// Add a built circuit's dist-relative directory here to publish its Gerbers.
const gerberCircuitNames = new Set([
  "examples/arduino-shield-clad",
  "examples/biscuit-board-usb-led",
  "examples/boosterpack-clad",
  "examples/breadboard-clad",
  "examples/breadboard-clad-0.8mm-vias",
  "examples/clad-32x32",
  "examples/clad-40x40",
  "examples/clad-panel",
  "examples/feather-clad-with-pin-headers",
  "examples/four-board-clad-panel",
  "examples/rp2040",
  "examples/rp2040-photodiode-crystal-buttons",
  "examples/stm32-stepper-biscuit-board",
  "examples/stm32c071",
  "examples/stm32c071-display-arduino-shield",
  "examples/stm32c071-display-boosterpack",
  "examples/xiao-clad-with-perforated-pin-headers",
  "examples/xiao-clad-with-pin-headers",
  "examples/xiao-pair-clad-panel",
  "examples/xiao-stm32-usb",
])

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
const circuitDownloads: Array<{
  boards: Array<{
    gerberHref: string
    screenshotHref: string
    title: string
  }>
  circuitName: string
  gerberHref: string
}> = []
const temporaryDirectory = await mkdtemp(
  resolve(tmpdir(), "biscuit-board-site-"),
)

try {
  for await (const circuitJsonPath of circuitJsonGlob.scan({
    cwd: distDirectory,
    absolute: true,
  })) {
    const circuitName = relative(distDirectory, dirname(circuitJsonPath))
    if (!gerberCircuitNames.has(circuitName)) continue

    const circuitJson = (await Bun.file(circuitJsonPath).json()) as CircuitJson
    const gerberPath = resolve(gerberDirectory, `${circuitName}.zip`)
    await runCommand([
      process.execPath,
      gerberExporterPath,
      circuitJsonPath,
      gerberPath,
    ])

    const individualBoards = extractIndividualBoardCircuits(circuitJson)
    const boardDownloads: (typeof circuitDownloads)[number]["boards"] = []

    if (individualBoards.length > 1) {
      for (const individualBoard of individualBoards) {
        const relativeBoardPath = `${circuitName}/boards/${individualBoard.fileStem}`
        const boardCircuitJsonPath = resolve(
          temporaryDirectory,
          `${relativeBoardPath}.circuit.json`,
        )
        const boardGerberPath = resolve(
          gerberDirectory,
          `${relativeBoardPath}.zip`,
        )
        const boardScreenshotPath = resolve(
          gerberDirectory,
          `${relativeBoardPath}.png`,
        )
        await mkdir(dirname(boardCircuitJsonPath), { recursive: true })
        await Bun.write(
          boardCircuitJsonPath,
          JSON.stringify(individualBoard.circuitJson),
        )
        await runCommand([
          process.execPath,
          gerberExporterPath,
          boardCircuitJsonPath,
          boardGerberPath,
        ])

        const pcbSvg = convertCircuitJsonToPcbSvg(individualBoard.circuitJson, {
          backgroundColor: "#111827",
          matchBoardAspectRatio: true,
          showPcbNotes: false,
          width: 1200,
        })
        await mkdir(dirname(boardScreenshotPath), { recursive: true })
        const boardScreenshot = new Resvg(pcbSvg).render().asPng()
        await Bun.write(boardScreenshotPath, boardScreenshot)

        boardDownloads.push({
          title: individualBoard.title,
          gerberHref: `/gerbers/${relativeBoardPath}.zip`,
          screenshotHref: `/gerbers/${relativeBoardPath}.png`,
        })
      }
    }

    circuitDownloads.push({
      boards: boardDownloads,
      circuitName,
      gerberHref: `/gerbers/${circuitName}.zip`,
    })
  }
} finally {
  await rm(temporaryDirectory, { force: true, recursive: true })
}

circuitDownloads.sort((a, b) => a.circuitName.localeCompare(b.circuitName))
const gerberListItems = circuitDownloads
  .map(
    ({ boards, circuitName, gerberHref }) => `<li>
      <h2>${escapeHtml(circuitName)}</h2>
      <p><a href="${escapeHtml(gerberHref)}">Download ${
        boards.length > 0 ? "panel" : "board"
      } Gerbers</a></p>
      ${
        boards.length > 0
          ? `<div class="boards">${boards
              .map(
                ({ gerberHref, screenshotHref, title }) => `<article>
                  <img src="${escapeHtml(screenshotHref)}" alt="${escapeHtml(title)} PCB preview" loading="lazy">
                  <h3>${escapeHtml(title)}</h3>
                  <a href="${escapeHtml(gerberHref)}">Download board Gerbers</a>
                </article>`,
              )
              .join("\n")}</div>`
          : ""
      }
    </li>`,
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
    <style>
      :root { color-scheme: dark; font-family: system-ui, sans-serif; }
      body { background: #030712; color: #f9fafb; margin: 0; }
      main { margin: 0 auto; max-width: 1200px; padding: 2rem; }
      a { color: #7dd3fc; }
      ul { list-style: none; padding: 0; }
      li { border-top: 1px solid #374151; padding: 1.5rem 0; }
      .boards { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
      article { background: #111827; border: 1px solid #374151; border-radius: .5rem; padding: 1rem; }
      article img { aspect-ratio: 4 / 3; background: #111827; display: block; object-fit: contain; width: 100%; }
      h2, h3 { overflow-wrap: anywhere; }
    </style>
  </head>
  <body>
    <main>
      <h1>Biscuit Board Gerbers</h1>
      <p>Fabrication ZIPs with top and bottom copper pours and no solder mask. Panels also include a Gerber ZIP and PCB preview for every individual board.</p>
      <ul>${gerberListItems}</ul>
    </main>
  </body>
</html>
`,
)

const individualBoardCount = circuitDownloads.reduce(
  (total, circuit) => total + circuit.boards.length,
  0,
)
console.log(
  `Gerber downloads available at /gerbers/ (${circuitDownloads.length} configured circuits, ${individualBoardCount} individual panel boards)`,
)
