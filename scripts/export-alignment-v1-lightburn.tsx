import { exportAlignmentV1LightBurn } from "../lib/export-alignment-v1-lightburn"

const { outputDirectory, toolingPointCount, viaPointCount } =
  await exportAlignmentV1LightBurn()

console.log(
  `Exported ${toolingPointCount} tooling points and ${viaPointCount} via points to ${outputDirectory}`,
)
