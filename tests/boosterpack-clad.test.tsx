import { expect, test } from "bun:test"
import {
  checkEachPcbTraceNonOverlapping,
  checkPadTraceClearance,
  checkViaTraceClearance,
} from "@tscircuit/checks"
import { Circuit } from "@tscircuit/core"
import { Stm32c071DisplayBoosterPackClad } from "../examples/stm32c071-display-boosterpack"
import { BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS } from "../lib/BiscuitBoard"
import {
  BOOSTERPACK_CLAD_HEIGHT,
  BOOSTERPACK_CLAD_PLACEMENT_ZONES,
  BOOSTERPACK_CLAD_VIA_POSITIONS,
  BOOSTERPACK_CLAD_WIDTH,
  BOOSTERPACK_HEADER_CENTER_X,
} from "../lib/BoosterPackClad"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

test("uses the BiscuitBoard outline and TI 40-pin header geometry", async () => {
  const circuit = new Circuit()
  circuit.add(<Stm32c071DisplayBoosterPackClad routingDisabled />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const board = circuitJson.find((element) => element.type === "pcb_board")
  const platedHoles = circuitJson.filter(
    (element) => element.type === "pcb_plated_hole",
  )
  const mountingHoles = circuitJson.filter(
    (element) => element.type === "pcb_hole",
  )
  const vias = circuitJson.filter((element) => element.type === "pcb_via")
  const topLeftEdgeVias = vias.filter(
    (via) =>
      via.x >= -21.5 && via.x <= 14.5 && (via.y === 21.5 || via.y === 25.5),
  )
  const bottomEdgeVias = vias.filter(
    (via) =>
      via.x >= -21.5 && via.x <= 14.5 && (via.y === -25.5 || via.y === -21.5),
  )
  const rightEdgeVias = vias.filter((via) => via.x === 32.5)
  const leftRoutingRailCenterX =
    (-BOOSTERPACK_CLAD_WIDTH / 2 - BOOSTERPACK_HEADER_CENTER_X) / 2
  const leftRoutingRailVias = vias.filter(
    (via) =>
      (via.x === leftRoutingRailCenterX - 2 ||
        via.x === leftRoutingRailCenterX + 2) &&
      via.y >= -16 &&
      via.y <= 16,
  )
  const innerEscapeColumnOffsetX = BOOSTERPACK_HEADER_CENTER_X / 2
  const leftInnerEscapeColumnVias = vias.filter(
    (via) => via.x === -innerEscapeColumnOffsetX && via.y >= -4 && via.y <= 4,
  )
  const rightInnerEscapeColumnVias = vias.filter(
    (via) => via.x === innerEscapeColumnOffsetX && via.y >= -4 && via.y <= 4,
  )
  const viaPadRadius = 0.6
  const placementZoneIntrusions = vias.flatMap((via) =>
    BOOSTERPACK_CLAD_PLACEMENT_ZONES.filter(
      (zone) =>
        via.x + viaPadRadius >= zone.minX &&
        via.x - viaPadRadius <= zone.maxX &&
        via.y + viaPadRadius >= zone.minY &&
        via.y - viaPadRadius <= zone.maxY,
    ).map((zone) => ({ via: pointKey(via), zone: zone.name })),
  )
  const sourceComponentNames = new Map(
    circuitJson.flatMap((element) =>
      element.type === "source_component"
        ? [[element.source_component_id, element.name] as const]
        : [],
    ),
  )
  const componentsOutsidePlacementZones = circuitJson.flatMap((element) =>
    element.type === "pcb_component" &&
    !element.source_component_id.startsWith("source_manually_placed_via_") &&
    !BOOSTERPACK_CLAD_PLACEMENT_ZONES.some(
      (zone) =>
        element.center.x >= zone.minX &&
        element.center.x <= zone.maxX &&
        element.center.y >= zone.minY &&
        element.center.y <= zone.maxY,
    )
      ? [sourceComponentNames.get(element.source_component_id)]
      : [],
  )
  const topRightClusterVias = vias.filter(
    (via) => via.x >= 12.75 && via.x <= 24.75 && via.y >= 21.5 && via.y <= 25.5,
  )
  const launchpadSourceComponentIds = new Set(
    circuitJson.flatMap((element) =>
      element.type === "source_component" &&
      element.name.startsWith("J_LAUNCHPAD_")
        ? [element.source_component_id]
        : [],
    ),
  )
  const launchpadPcbComponentIds = new Set(
    circuitJson.flatMap((element) =>
      element.type === "pcb_component" &&
      launchpadSourceComponentIds.has(element.source_component_id)
        ? [element.pcb_component_id]
        : [],
    ),
  )
  const launchpadPorts = circuitJson.filter(
    (element) =>
      element.type === "pcb_port" &&
      element.pcb_component_id !== undefined &&
      launchpadPcbComponentIds.has(element.pcb_component_id),
  )

  expect(board).toMatchObject({
    width: BOOSTERPACK_CLAD_WIDTH,
    height: BOOSTERPACK_CLAD_HEIGHT,
    num_layers: 2,
  })
  expect(platedHoles).toHaveLength(40)
  expect(mountingHoles).toHaveLength(
    BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS.length,
  )
  expect(new Set(mountingHoles.map((hole) => pointKey(hole)))).toEqual(
    new Set(BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS.map(pointKey)),
  )
  expect(launchpadPorts).toHaveLength(40)
  expect(vias).toHaveLength(BOOSTERPACK_CLAD_VIA_POSITIONS.length)
  expect(vias).toHaveLength(73)
  expect(topLeftEdgeVias).toHaveLength(20)
  expect(bottomEdgeVias).toHaveLength(20)
  expect(new Set(bottomEdgeVias.map((via) => via.x)).size).toBe(10)
  expect(vias.some((via) => via.x === -21.5 && via.y === 21.5)).toBe(true)
  expect(Math.min(...topLeftEdgeVias.map((via) => via.x)) - -25.5).toBe(4)
  expect(Math.min(...bottomEdgeVias.map((via) => via.x)) - -25.5).toBe(4)
  expect(vias.some((via) => via.x === 14.5 && via.y === -25.5)).toBe(true)
  expect(topRightClusterVias).toHaveLength(2)
  expect(rightEdgeVias).toHaveLength(9)
  expect(leftRoutingRailVias).toHaveLength(18)
  expect(leftInnerEscapeColumnVias).toHaveLength(3)
  expect(rightInnerEscapeColumnVias).toHaveLength(3)
  expect(
    (Math.min(...leftRoutingRailVias.map((via) => via.x)) +
      Math.max(...leftRoutingRailVias.map((via) => via.x))) /
      2,
  ).toBe(leftRoutingRailCenterX)
  expect(
    (Math.min(...leftInnerEscapeColumnVias.map((via) => via.x)) +
      Math.max(...leftInnerEscapeColumnVias.map((via) => via.x))) /
      2,
  ).toBe(-innerEscapeColumnOffsetX)
  expect(
    (Math.min(...rightInnerEscapeColumnVias.map((via) => via.x)) +
      Math.max(...rightInnerEscapeColumnVias.map((via) => via.x))) /
      2,
  ).toBe(innerEscapeColumnOffsetX)
  expect(rightInnerEscapeColumnVias.map(pointKey).sort()).toEqual(
    leftInnerEscapeColumnVias
      .map((via) => pointKey({ x: -via.x, y: via.y }))
      .sort(),
  )
  expect(placementZoneIntrusions).toEqual([])
  expect(componentsOutsidePlacementZones).toEqual([])
  expect(
    circuitJson.some(
      (element) =>
        element.type === "source_component" && element.name === "SW_BTN1",
    ),
  ).toBe(true)
  expect(
    circuitJson.some(
      (element) =>
        element.type === "source_component" && element.name === "SW_BTN2",
    ),
  ).toBe(true)
  expect(
    circuitJson.some(
      (element) =>
        element.type === "source_component" && element.name === "U_MCU",
    ),
  ).toBe(true)
}, 30_000)

test("routes the complete STM32 display/button/SWD circuit on fixed vias", async () => {
  const circuit = new Circuit()
  circuit.add(<Stm32c071DisplayBoosterPackClad />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter((element) => element.type.endsWith("error"))
  const traces = circuitJson.filter((element) => element.type === "pcb_trace")
  const sourceTraces = circuitJson.filter(
    (element) => element.type === "source_trace",
  )
  const sourceComponents = circuitJson.filter(
    (element) => element.type === "source_component",
  )
  const jSwdId = circuitJson
    .flatMap((element) =>
      element.type === "source_component" && element.name === "J_SWD"
        ? [element.source_component_id]
        : [],
    )
    .at(0)
  const cBulkId = circuitJson
    .flatMap((element) =>
      element.type === "source_component" && element.name === "C_BULK"
        ? [element.source_component_id]
        : [],
    )
    .at(0)
  const requiredPortIds = new Set(
    circuitJson.flatMap((element) =>
      element.type === "source_port" &&
      (element.source_component_id === jSwdId ||
        element.source_component_id === cBulkId)
        ? [element.source_port_id]
        : [],
    ),
  )
  const tracedPortIds = new Set(
    sourceTraces.flatMap((trace) => trace.connected_source_port_ids),
  )
  const functionallyConnectedPortIds = new Set(tracedPortIds)
  for (const component of sourceComponents) {
    for (const connectedGroup of component.internally_connected_source_port_ids ??
      []) {
      if (connectedGroup.some((portId) => tracedPortIds.has(portId))) {
        for (const portId of connectedGroup) {
          functionallyConnectedPortIds.add(portId)
        }
      }
    }
  }
  const functionalComponentIds = new Set(
    sourceComponents.flatMap((component) =>
      component.source_component_id.startsWith("source_manually_placed_via_")
        ? []
        : [component.source_component_id],
    ),
  )
  const unintentionallyDanglingPorts = circuitJson.flatMap((element) =>
    element.type === "source_port" &&
    functionalComponentIds.has(element.source_component_id ?? "") &&
    !element.do_not_connect &&
    !functionallyConnectedPortIds.has(element.source_port_id)
      ? [element.source_port_id]
      : [],
  )
  const swdSignalPortIds = new Set(
    circuitJson.flatMap((element) =>
      element.type === "source_port" &&
      element.source_component_id === jSwdId &&
      [2, 4, 5].includes(element.pin_number ?? -1)
        ? [element.source_port_id]
        : [],
    ),
  )
  const swdSignalSourceTraceIds = new Set(
    sourceTraces.flatMap((trace) =>
      trace.connected_source_port_ids.some((portId) =>
        swdSignalPortIds.has(portId),
      )
        ? [trace.source_trace_id]
        : [],
    ),
  )
  const routedSourceTraceIds = new Set(
    traces.map((trace) => trace.source_trace_id),
  )
  const allowedViaPositions = new Set(
    BOOSTERPACK_CLAD_VIA_POSITIONS.map(pointKey),
  )
  const routedPrefabVias = traces.flatMap((trace) =>
    trace.route.filter((point) => point.route_type === "via"),
  )
  const clearanceErrors = [
    ...checkEachPcbTraceNonOverlapping(circuitJson, { minClearance: 0.1 }),
    ...checkPadTraceClearance(circuitJson, { minClearance: 0.1 }),
    ...checkViaTraceClearance(circuitJson, { minClearance: 0.1 }),
  ]

  expect(errors).toEqual([])
  expect(clearanceErrors).toEqual([])
  expect(unintentionallyDanglingPorts).toEqual([])
  expect(requiredPortIds.size).toBe(7)
  expect(
    [...requiredPortIds].every((portId) => tracedPortIds.has(portId)),
  ).toBe(true)
  expect(swdSignalSourceTraceIds.size).toBe(3)
  expect(swdSignalPortIds.size).toBe(3)
  expect(
    [...swdSignalSourceTraceIds].every((traceId) =>
      routedSourceTraceIds.has(traceId),
    ),
  ).toBe(true)
  expect(traces).toHaveLength(36)
  expect(routedPrefabVias.length).toBeGreaterThan(0)
  expect(
    routedPrefabVias.every((via) => allowedViaPositions.has(pointKey(via))),
  ).toBe(true)
}, 60_000)
