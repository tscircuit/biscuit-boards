import { rename } from "node:fs/promises"
import { resolve } from "node:path"

await rename(resolve(".package.json.prepack"), resolve("package.json"))
