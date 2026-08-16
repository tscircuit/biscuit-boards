import { expect, test } from "bun:test"
import type { GenericLocalAutorouter, SimpleRouteJson } from "@tscircuit/core"
import { createPrefabricatedViaAutorouter } from "../lib/create-prefabricated-via-autorouter"

test("routes imported footprint terminals with sub-micron coordinate noise", async () => {
  const noisyTerminal = { x: 8.500002999999879, y: -21.99998440000013 }
  const resistorTerminal = { x: 5.175, y: -17 }
  const input: SimpleRouteJson = {
    bounds: { minX: -37.5, maxX: 37.5, minY: -27.5, maxY: 27.5 },
    layerCount: 2,
    minTraceWidth: 0.15,
    nominalTraceWidth: 0.15,
    obstacles: [
      {
        type: "rect",
        width: 0.6999986,
        height: 1.1999975999999999,
        center: noisyTerminal,
        layers: ["top"],
        connectedTo: ["source_trace_0", "pcb_port_158"],
      },
      {
        type: "rect",
        width: 0.8,
        height: 0.95,
        center: resistorTerminal,
        layers: ["top"],
        connectedTo: ["source_trace_0", "pcb_port_153"],
      },
    ],
    connections: [
      {
        name: "source_trace_0",
        width: 0.15,
        nominalTraceWidth: 0.15,
        pointsToConnect: [
          {
            ...noisyTerminal,
            layer: "top",
            pointId: "pcb_port_158",
          },
          {
            ...resistorTerminal,
            layer: "top",
            pointId: "pcb_port_153",
          },
        ],
      },
    ],
  }
  const autorouterConfig = createPrefabricatedViaAutorouter({
    width: 75,
    height: 55,
    edgeClearance: 0.5,
    nominalTraceWidth: 0.3,
  })
  if (!autorouterConfig.algorithmFn) {
    throw new Error("Wrapper did not supply an autorouter algorithm")
  }
  const autorouter = (await autorouterConfig.algorithmFn(
    input,
  )) as GenericLocalAutorouter
  const getOutputSimpleRouteJson =
    autorouter.getOutputSimpleRouteJson?.bind(autorouter)
  if (!getOutputSimpleRouteJson) {
    throw new Error("Autorouter cannot produce SimpleRouteJson")
  }

  const output = await new Promise<SimpleRouteJson>((resolve, reject) => {
    autorouter.on("complete", () => {
      const routeJson = getOutputSimpleRouteJson()
      if (routeJson) resolve(routeJson)
      else reject(new Error("Autorouter did not produce SimpleRouteJson"))
    })
    autorouter.on("error", ({ error }) => reject(error))
    autorouter.start()
  })

  expect(output.traces).toHaveLength(1)
})
