import type { CircuitJson } from "circuit-json"

/**
 * Clad wrappers identify their board in Circuit JSON with a title containing
 * "clad". The source board remains present when components are added on top,
 * so populated clad designs are included as well as bare clads.
 */
export const isCladCircuit = (circuitJson: CircuitJson) =>
  circuitJson.some(
    (element) =>
      element.type === "source_board" && /\bclad\b/i.test(element.title ?? ""),
  )
