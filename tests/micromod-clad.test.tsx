import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import {
  MICROMOD_CLAD_HEIGHT,
  MICROMOD_CLAD_OUTLINE,
  MICROMOD_CLAD_THICKNESS,
  MICROMOD_CLAD_VIA_HOLE_DIAMETER,
  MICROMOD_CLAD_VIA_PAD_DIAMETER,
  MICROMOD_CLAD_VIA_POSITIONS,
  MICROMOD_CLAD_WIDTH,
  MICROMOD_M2_BOTTOM_CONTACT_HEIGHT,
  MICROMOD_M2_CONTACT_NUMBERS,
  MICROMOD_M2_CONTACT_PITCH,
  MICROMOD_M2_CONTACT_WIDTH,
  MICROMOD_M2_EDGE_CONTACTS,
  MICROMOD_M2_KEY_CENTER_X,
  MICROMOD_M2_KEY_DEPTH,
  MICROMOD_M2_KEY_END_CONTACT,
  MICROMOD_M2_KEY_START_CONTACT,
  MICROMOD_M2_PIN_NAMES,
  MICROMOD_M2_SOLDER_PASTE_MARGIN,
  MICROMOD_M2_TOP_CONTACT_HEIGHT,
  MICROMOD_MOUNTING_NOTCH_CENTER_X,
  MICROMOD_MOUNTING_NOTCH_RADIUS,
  MicroModClad,
} from "../lib/micromod-clad"

const pointKey = (point: { x: number; y: number }) =>
  `${point.x.toFixed(3)},${point.y.toFixed(3)}`

test("creates the SparkFun MicroMod M.2 processor-card geometry", async () => {
  const circuit = new Circuit()
  circuit.add(<MicroModClad routingDisabled markEdgeConnectorNoConnect />)
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const board = circuitJson.find((element) => element.type === "pcb_board")
  const contacts = circuitJson.filter(
    (element) => element.type === "pcb_smtpad",
  )
  const rectangularContacts = contacts.filter(
    (contact) => contact.shape === "rect",
  )
  const vias = circuitJson.filter((element) => element.type === "pcb_via")
  const solderPaste = circuitJson.filter(
    (element) => element.type === "pcb_solder_paste",
  )
  const connectorIds = new Set(
    circuitJson.flatMap((element) =>
      element.type === "source_component" && element.name === "J_MICROMOD"
        ? [element.source_component_id]
        : [],
    ),
  )
  const connectorPorts = circuitJson.flatMap((element) =>
    element.type === "source_port" &&
    element.source_component_id !== undefined &&
    connectorIds.has(element.source_component_id)
      ? [element]
      : [],
  )
  const errorsAndWarnings = circuitJson.filter(
    (element) =>
      element.type.endsWith("error") || element.type.endsWith("warning"),
  )

  expect(board).toMatchObject({
    width: MICROMOD_CLAD_WIDTH,
    height: MICROMOD_CLAD_HEIGHT,
    thickness: MICROMOD_CLAD_THICKNESS,
    num_layers: 2,
  })
  expect(board && "outline" in board ? board.outline : undefined).toEqual(
    MICROMOD_CLAD_OUTLINE,
  )
  expect(Math.min(...MICROMOD_CLAD_OUTLINE.map(({ x }) => x))).toBe(-11)
  expect(Math.max(...MICROMOD_CLAD_OUTLINE.map(({ x }) => x))).toBe(11)
  expect(Math.min(...MICROMOD_CLAD_OUTLINE.map(({ y }) => y))).toBe(-11)
  expect(Math.max(...MICROMOD_CLAD_OUTLINE.map(({ y }) => y))).toBe(11)

  expect(MICROMOD_M2_CONTACT_NUMBERS).toEqual([
    ...Array.from({ length: 23 }, (_, index) => index + 1),
    ...Array.from({ length: 44 }, (_, index) => index + 32),
  ])
  expect(rectangularContacts).toHaveLength(67)
  expect(
    rectangularContacts.filter((contact) => contact.layer === "top"),
  ).toHaveLength(34)
  expect(
    rectangularContacts.filter((contact) => contact.layer === "bottom"),
  ).toHaveLength(33)
  expect(
    rectangularContacts.every(
      (contact) =>
        contact.width === MICROMOD_M2_CONTACT_WIDTH &&
        contact.is_covered_with_solder_mask === false &&
        contact.pcb_port_id !== undefined &&
        (contact.height === MICROMOD_M2_TOP_CONTACT_HEIGHT ||
          contact.height === MICROMOD_M2_BOTTOM_CONTACT_HEIGHT),
    ),
  ).toBe(true)
  expect(new Set(rectangularContacts.map(pointKey))).toEqual(
    new Set(MICROMOD_M2_EDGE_CONTACTS.map(pointKey)),
  )
  expect(MICROMOD_M2_SOLDER_PASTE_MARGIN).toBe(-MICROMOD_M2_CONTACT_WIDTH / 2)
  expect(solderPaste).toEqual([])
  expect(
    MICROMOD_M2_EDGE_CONTACTS.every(
      (contact) =>
        contact.x ===
        9.5 - contact.contactNumber * (MICROMOD_M2_CONTACT_PITCH / 2),
    ),
  ).toBe(true)

  const keyOutlinePoints = MICROMOD_CLAD_OUTLINE.filter(
    ({ x, y }) =>
      x >= MICROMOD_M2_KEY_CENTER_X - 0.6 &&
      x <= MICROMOD_M2_KEY_CENTER_X + 0.6 &&
      y <= -MICROMOD_CLAD_HEIGHT / 2 + MICROMOD_M2_KEY_DEPTH,
  )
  expect(Math.max(...keyOutlinePoints.map(({ y }) => y))).toBe(
    -MICROMOD_CLAD_HEIGHT / 2 + MICROMOD_M2_KEY_DEPTH,
  )
  const mountingNotchPoints = MICROMOD_CLAD_OUTLINE.filter(
    ({ x, y }) =>
      y > 0 &&
      x >= MICROMOD_MOUNTING_NOTCH_CENTER_X - MICROMOD_MOUNTING_NOTCH_RADIUS &&
      x <= MICROMOD_MOUNTING_NOTCH_CENTER_X + MICROMOD_MOUNTING_NOTCH_RADIUS,
  )
  expect(Math.min(...mountingNotchPoints.map(({ y }) => y))).toBe(
    MICROMOD_CLAD_HEIGHT / 2 - MICROMOD_MOUNTING_NOTCH_RADIUS,
  )

  expect(connectorPorts).toHaveLength(MICROMOD_M2_PIN_NAMES.length)
  expect(connectorPorts.every((port) => port.do_not_connect)).toBe(true)
  expect(MICROMOD_M2_KEY_END_CONTACT - MICROMOD_M2_KEY_START_CONTACT + 1).toBe(
    8,
  )

  expect(vias).toHaveLength(MICROMOD_CLAD_VIA_POSITIONS.length)
  expect(new Set(vias.map(pointKey))).toEqual(
    new Set(MICROMOD_CLAD_VIA_POSITIONS.map(pointKey)),
  )
  expect(
    vias.every(
      (via) =>
        via.hole_diameter === MICROMOD_CLAD_VIA_HOLE_DIAMETER &&
        via.outer_diameter === MICROMOD_CLAD_VIA_PAD_DIAMETER,
    ),
  ).toBe(true)
  expect(errorsAndWarnings).toEqual([])
})
