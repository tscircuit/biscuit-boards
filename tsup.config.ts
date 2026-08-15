import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["npm.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  external: ["react", "react/jsx-runtime"],
  noExternal: ["@tscircuit/biscuit-board-autorouter"],
})
