import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "@tscircuit/core"
import { BiscuitBoardAutorouter } from "../lib/biscuit-board-autorouter"

test("routes a layer change only through a prefabricated assignable via", () => {
  const input: SimpleRouteJson = {
    bounds: { minX: -8, maxX: 8, minY: -3, maxY: 6 },
    layerCount: 2,
    minTraceWidth: 0.15,
    obstacles: [
      {
        type: "rect",
        width: 0.54,
        height: 0.64,
        center: { x: -5.5, y: 0 },
        layers: ["top"],
        componentId: "left-component",
        connectedTo: ["left-pad", "signal"],
      },
      {
        type: "rect",
        width: 0.54,
        height: 0.64,
        center: { x: 5.5, y: 0 },
        layers: ["bottom"],
        componentId: "right-component",
        connectedTo: ["right-pad", "signal"],
      },
      {
        type: "rect",
        width: 0.3,
        height: 0.3,
        center: { x: 0, y: 4 },
        layers: ["top", "bottom"],
        connectedTo: ["pcb_via_prefab"],
        netIsAssignable: true,
      },
    ],
    connections: [
      {
        name: "signal",
        pointsToConnect: [
          {
            x: -5.5,
            y: 0,
            layer: "top",
            pointId: "left-pad",
          },
          {
            x: 5.5,
            y: 0,
            layer: "bottom",
            pointId: "right-pad",
          },
        ],
      },
    ],
  }

  const traces = new BiscuitBoardAutorouter(input).solveSync()
  const routedVias = traces.flatMap((trace) =>
    trace.route.filter((segment) => segment.route_type === "via"),
  )
  const existingCopperTransitions = traces.flatMap((trace) =>
    trace.route.filter(
      (segment) => segment.route_type === "through_obstacle",
    ),
  )

  expect(routedVias).toEqual([])
  expect(existingCopperTransitions).toEqual([
    expect.objectContaining({
      start: { x: 0, y: 4 },
      end: { x: 0, y: 4 },
      from_layer: "top",
      to_layer: "bottom",
    }),
  ])
})
