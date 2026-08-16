# biscuit-boards

Prefabricated copper-clad boards for ordinary tscircuit TSX.

```sh
bun add biscuitboard
```

```tsx
import { BiscuitBoard } from "biscuitboard"

export default () => (
  <BiscuitBoard>
    <chip name="U1" footprint="soic8" />
    {/* components and traces */}
  </BiscuitBoard>
)
```

Generate a Gerber ZIP without the front or back solder-mask layers with:

```sh
bun run export:gerbers:no-solder-mask examples/breadboard-clad.tsx
```

The archive defaults to `dist/gerbers/<board-name>.zip`. Pass a second argument
to choose another ZIP path.

`BiscuitBoard` owns the fixed 75 mm x 55 mm outline, mounting holes, and
assignable prefabricated vias. Copper pours are intentionally disabled. Its
`<board>` uses a local
`autorouter.algorithmFn` backed by the standalone
[`@tscircuit/biscuit-board-autorouter`](https://github.com/tscircuit/biscuit-board-autorouter)
package. Its graph generator creates cross-layer hyperedges only at
`netIsAssignable` multi-layer obstacles, and its output validator rejects any
other layer transition. Each prefabricated-via crossing stays in one
`pcb_trace.route` as a `via` point between its top and bottom wire segments;
the existing board via is claimed instead of manufacturing a duplicate. The
router uses negotiated rip-and-replace with history costs and precomputed
trace-edge conflict lists. Its routing post-processing enforces the configured
copper clearance. A mandatory pre-expansion beautification stage then
increases spacing between foreign-net traces, consolidates same-net copper,
and replaces corners with the largest clearance-safe 45° chamfers available.
A final obstacle-aware expansion stage targets 0.3 mm copper by default,
widening in place or moving traces around neighboring copper and pads where
needed. It may retain a narrower neck where the board cannot safely accommodate
0.3 mm, and it never introduces a non-prefabricated via. Override the target
with the `nominalTraceWidth` prop; `minTraceWidth` remains the hard routing
minimum.

The complete STM32C071FBP6 + SWD + status LED circuit is in
[`examples/stm32c071.tsx`](./examples/stm32c071.tsx). Its checked-in
`tsci snapshot` artifacts cover both the routed PCB and schematic views. The
denser [`examples/rp2040.tsx`](./examples/rp2040.tsx) example uses the RP2040
module from `@tsci/seveibar.common` and is also checked in with solved PCB and
schematic snapshots.

## 40 mm square clad

[`Clad40x40`](./lib/Clad40x40.tsx) is a two-layer 40 mm x 40 mm clad without
pin headers. It has one centered 2 mm mounting hole plus a second 2 mm mounting
hole at the top-right, inset 3 mm from both edges. Three centered concentric
square rings provide 72 assignable prefabricated vias. The vias use 0.3 mm
drills and 0.6 mm pads at 1.3 mm pitch, matching the XIAO clad's via geometry.

```tsx
import { Clad40x40 } from "@tsci/tscircuit.biscuit-boards";

export default () => <Clad40x40 />;
```

The preview and checked-in PCB snapshot are in
[`examples/clad-40x40.tsx`](./examples/clad-40x40.tsx).

```sh
bun run build:clad-40x40
bun run snapshot:clad-40x40
bun test tests/clad-40x40.test.tsx
```

## 32 mm square corner-via clad

[`Clad32x32`](./lib/Clad32x32.tsx) is a two-layer 32 mm x 32 mm clad with four
2 mm mounting holes, each inset 3 mm from its corner, and no center mounting
hole. Four two-via-wide L-shaped fields provide 64 assignable prefabricated
vias. The fields sit close to the mounting holes, with 1.3 mm of copper
clearance, and leave 18.2 mm openings at the middle of every side for edge
connectors. The vias use 0.3 mm drills, 0.6 mm pads, and a 1.3 mm pitch.

```tsx
import { Clad32x32 } from "@tsci/tscircuit.biscuit-boards";

export default () => <Clad32x32 />;
```

The preview and checked-in PCB snapshot are in
[`examples/clad-32x32.tsx`](./examples/clad-32x32.tsx).

```sh
bun run build:clad-32x32
bun run snapshot:clad-32x32
bun test tests/clad-32x32.test.tsx
```

## Combined clad panel

[`CladPanel`](./lib/CladPanel.tsx) places the breadboard clad at the upper-left
and the Arduino UNO R3 shield at the upper-right. The 32 mm square clad replaces
one standard and one perforated XIAO below the breadboard; the remaining
standard and perforated XIAOs sit above it, with the Feather alongside. The TI
BoosterPack remains at the lower-right. The resulting fabrication panel remains
158 mm x 118 mm, with 2 mm board gaps and 3 mm edge rails. The default
`outline_routing` panelization method creates continuous routed cutouts around
every board without tabs or mouse bites.

```sh
bun run build:clad-panel
bun run snapshot:clad-panel
bun test tests/clad-panel.test.tsx
```

The preview entry point is [`examples/clad-panel.tsx`](./examples/clad-panel.tsx).

## Additional fabrication panels

[`FourBoardCladPanel`](./lib/four-board-clad-panel.tsx) is a 2x2 grid containing
two breadboard clads, one BoosterPack clad, and one Arduino shield clad.
[`XiaoPairCladPanel`](./lib/xiao-pair-clad-panel.tsx) places one standard XIAO
clad beside one perforated XIAO clad. Both use 2 mm routed gaps, 3 mm edge
padding, 2 mm tabs, and mouse bites by default.

```sh
bun run build:four-board-clad-panel
bun run build:xiao-pair-clad-panel
bun run snapshot:four-board-clad-panel
bun run snapshot:xiao-pair-clad-panel
```

Their preview entry points are
[`examples/four-board-clad-panel.tsx`](./examples/four-board-clad-panel.tsx)
and [`examples/xiao-pair-clad-panel.tsx`](./examples/xiao-pair-clad-panel.tsx).

## TI BoosterPack clad feasibility layout

[`BoosterPackClad`](./lib/BoosterPackClad.tsx) is an initial prefabricated-via
clad with a TI 40-pin BoosterPack-compatible header pattern. It retains the
existing clad's 75 mm x 55 mm outline and the exact same five 2.2 mm mounting
holes. The board is therefore larger than the 2000 mil x 1700 mil maximum
outline in TI SLAA542, while the mating geometry remains at the specified
2.54 mm header pitch and 1800 mil (45.72 mm) outer-column spacing. It uses two
downward-facing 2x10 male headers for the target LaunchPad mating arrangement;
TI's generic stacking recommendation normally describes downward-facing female
BoosterPack headers.

The via field uses 289 candidates at 1.3 mm pitch. Four L-shaped corner fields
have 4 mm-wide arms; their vertical arms are 14 mm long, and the upper and
lower pairs leave a symmetric 39.468 mm opening in the center. A compact 5x5
escape grid is centered at x=-12.795 mm, 2 mm left of the midpoint between
J1/J3 and the board center. Candidates within 1 mm copper-edge clearance of a
mounting hole are omitted. A standard upward-facing 1x18 pin header sits flush
with the left board edge and extends to the top and bottom mounting-hole
keepouts. Vias that would overlap its body are omitted, and all 18 breakout
pins are explicitly marked unconnected until a signal map is chosen. Each
prefabricated via uses a 0.3 mm finished hole and a 0.6 mm copper pad, leaving
0.7 mm between neighboring pads. The central chips/sensors bay and centered
upper and lower connector openings remain free for component placement and
outside-board access.
The bare template preview is in
[`examples/boosterpack-clad.tsx`](./examples/boosterpack-clad.tsx), and the
routed example is in
[`examples/stm32c071-display-boosterpack.tsx`](./examples/stm32c071-display-boosterpack.tsx).
It places the STM32C071, display connector, both buttons, status LEDs, SWD
connector, bulk capacitor, and the two LaunchPad headers within the outline.

The complete example routes all 36 PCB traces, including all five J_SWD pads
and both bulk-capacitor pads, with no router or clearance errors. SWDIO, SWCLK,
and SWD reset use three deterministic escape traces whose channels are reserved
from the board autorouter; the other 33 traces are autorouted. The solved route
claims 19 of the 289 prefabricated vias, at these positions in millimeters:

```text
(-31.6,-13.7) (-27.7,25.4)
(-22.5,21.5) (-22.5,22.8) (-21.2,22.8)
(-19.9,-21.5) (-19.9,21.5) (-19.9,22.8)
(-15.395,-1.3) (-15.395,0)
(-14.095,-1.3) (-14.095,0) (-14.095,1.3)
(-12.795,-2.6) (-12.795,-1.3)
(-11.495,2.6) (-10.195,1.3) (-10.195,2.6)
(19.9,21.5)
```

Every router-generated layer change uses one of those fixed via locations; no
new manufactured vias are introduced. LaunchPad 3V3 and GND are connected to
the example circuit. The remaining LaunchPad signal pads are explicitly marked
unconnected until a signal mapping is chosen, rather than being silently left
dangling. Unused MCU GPIO/oscillator pads are likewise explicit no-connects;
the pushbuttons' duplicate terminals are declared as internally connected by
the component model. Set `ROUTE_SWD_AND_BULK=0` only to compare against the
reduced routing experiment.

```sh
bun run build:boosterpack
bun run analyze:boosterpack
bun run snapshot:boosterpack
bun run snapshot:boosterpack-clad
ROUTE_SWD_AND_BULK=0 bun run analyze:boosterpack
bun test tests/boosterpack-clad.test.tsx
```

## Arduino UNO R3 shield clad

[`ArduinoShieldClad`](./lib/ArduinoShieldClad.tsx) is a 75 mm x 55 mm
prefabricated-via clad for Arduino UNO R3-compatible shields. It retains the
existing clad outline and all five original 2.2 mm mounting holes. The complete
UNO R3 mating pattern is shifted left by one 2.54 mm header pitch so the
upper-right clad hole clears the D0-D7 header. Relative placement remains
official UNO R3 geometry for the 1x8 power header, 1x6 analog header, 1x8
D0-D7 header, 1x10 R3 digital/AREF/I2C header, and 2x3 ICSP socket.

The 262 assignable fixed vias use 0.3 mm drills, 0.6 mm copper pads, and 1.3 mm
center-to-center pitch. The clustered layout has upper- and lower-left edge
fields, two inset left fields, a central routing field spanning -19 to -3 mm,
and split right-edge rails. The area immediately left of ICSP, the header rows, and
the original clad mounting holes remain open. The bare template and its
checked-in PCB snapshot are in
[`examples/arduino-shield-clad.tsx`](./examples/arduino-shield-clad.tsx).

The routed
[`examples/stm32c071-display-arduino-shield.tsx`](./examples/stm32c071-display-arduino-shield.tsx)
example adds the complete STM32C071 display/button/SWD circuit. It takes 3.3 V
and ground from the Arduino power header, while all unused Arduino and MCU pins
are explicit no-connects. The display connector is shifted clear of the central
via field, and the SWD connector sits above the lower shield-header row.

```sh
bun run build:arduino-shield
bun run build:arduino-display
bun run snapshot:arduino-shield
bun run snapshot:arduino-display
bun test tests/arduino-shield-clad.test.tsx
bun test tests/arduino-shield-display.test.tsx
```

## Seeed Studio XIAO form-factor clad

[`XiaoCladWithPinHeaders`](./lib/xiao-clad.tsx) is a two-layer 17.8 mm x 21 mm
clad matching the classic Seeed Studio XIAO outline. It includes the standard
two rows of seven through-hole headers at 2.54 mm pin pitch and 15.24 mm row
spacing, and the USB end is marked `UP` on top silkscreen. Its 26 fixed
through-vias use 0.3 mm drills and 0.6 mm pads. They form two 1 x 13 columns on a
1.3 mm pitch, leaving the central component field open while clearing the header
pads.

The populated clad preview has a checked-in PCB snapshot:

```sh
bun run snapshot:xiao-clad-with-pin-headers
bun test tests/xiao-clad.test.tsx
```

[`XiaoCladWithPerforatedPinHeaders`](./lib/xiao-clad-with-perforated-pin-headers.tsx)
keeps the same XIAO
outline and 2x7 header centers, but extends each pin into a 2.13 mm x 2 mm copper
pad with a 0.7 mm perforation centered on the corresponding side edge. This
creates the through-hole-plus-edge-notch geometry used by castellated XIAO
modules while retaining compatibility with ordinary 2.54 mm pin headers.
The bare preview and its checked-in PCB snapshot are in
[`examples/xiao-clad-with-perforated-pin-headers.tsx`](./examples/xiao-clad-with-perforated-pin-headers.tsx).

```sh
bun run snapshot:xiao-clad-with-perforated-pin-headers
```

[`examples/xiao-stm32-usb.tsx`](./examples/xiao-stm32-usb.tsx) validates the
via placement with a routed STM32C071 USB device. It includes a compact USB-C
USB2 module, two 5.1 kOhm CC pulldowns, a 3.3 V LDO, input/output capacitors,
and bottom-side MCU decoupling. All 16 PCB traces route without router or
clearance errors, and the solution claims two fixed vias at `(-5.8, 3.7)` and
`(5.8, -5.4)` mm. No manufactured vias are added.

```sh
bun run build:xiao-stm32-usb
bun run snapshot:xiao-stm32-usb
```

## Adafruit Feather form-factor clad

[`FeatherCladWithPinHeaders`](./lib/feather-clad.tsx) is a two-layer 22.86 mm x
50.8 mm clad following the
[classic Adafruit Feather specification](https://learn.adafruit.com/adafruit-feather/feather-specification).
With USB at the top, it provides the standard 16-pin left header and 12-pin
right header at 2.54 mm pin pitch and 20.32 mm row spacing, plus four 2.54 mm
mounting holes. Its 53 fixed through-vias use 0.3 mm drills and 0.6 mm pads on a
1.3 mm pitch. The left 1 x 31 and right 1 x 22 columns leave the central
component field and the header-free upper-right region open. The USB edge is
marked `UP` on top silkscreen.

The populated clad preview has a checked-in PCB snapshot:

```sh
bun run build:feather-clad-with-pin-headers
bun run snapshot:feather-clad-with-pin-headers
bun test tests/feather-clad.test.tsx
```

## Breadboard clad

[`BreadboardClad`](./lib/breadboard-clad.tsx) is a laser-routable 75 mm x
55 mm plug-in prototyping board. It provides 210 individually routable female
header sockets labeled A1 through J21, with the standard 2.54 mm terminal pitch
and a 7.62 mm DIP channel. Unlike a solderless breadboard, none of these
sockets are connected in groups: the consuming tscircuit design defines every
connection, allowing the corresponding copper traces to be laser cut for a
particular circuit.

The 148 assignable prefabricated vias have 0.3 mm holes and 0.6 mm pads. Two
21-via rows sit beyond the terminal fields, two 21-via rows run through the
central DIP channel, and four two-via-wide L-shaped corner fields provide 64
additional vias. The socket grid remains clear.
`BreadboardTerminalHeaders` exposes terminal aliases such as `A1` and `J21`.
The bare preview is in
[`examples/breadboard-clad.tsx`](./examples/breadboard-clad.tsx).

```sh
bun run build:breadboard-clad
bun run snapshot:breadboard-clad:update
bun test tests/breadboard-clad.test.tsx
```

## Stainless-steel stencil blank

[`mechanical/biscuit-board-stencil.step`](./mechanical/biscuit-board-stencil.step)
is a millimeter-scale AP214 STEP model for a 0.12 mm thick stainless-steel
stencil blank. It follows the standard 75 mm x 55 mm clad outline, including
the 2 mm corner radius and all five 2.2 mm mounting holes at the exact
`BISCUIT_BOARD_MOUNTING_HOLE_POSITIONS` coordinates.

Regenerate the checked-in model with `manifold-3d` and `manifold-to-step`:

```sh
bun run export:stencil-step mechanical/biscuit-board-stencil.step
```

The generator verifies the model bounds, expected solid volume, and five-hole
topology before writing the file. This model is a mechanical blank and does
not contain board-specific solder-paste apertures.

## LightBurn export

Generate routed Circuit JSON and laser-ready files for any circuit entry file
that has a default component export:

```sh
bun run export:lightburn examples/stm32c071-display.tsx
```

Output is written to `dist/lightburn/<circuit-file-name>/`. For example, the
command above writes to `dist/lightburn/stm32c071-display/` and includes the
original Circuit JSON, a LightBurn-prepared Circuit JSON, a combined `.lbrn2`
project containing every populated board side, a forward-calibrated
`*-lensdistortion.lbrn2` companion, an SVG preview, a manifest, and separate
`.lbrn2` files for each operation. Bottom layers are mirrored for flipped-board
machining and omitted entirely when the circuit has no bottom-side geometry.

The lens-distortion companion converts top-left LightBurn coordinates to the
board-centered design frame, then applies a smooth Shepard-style
inverse-distance-weighted calibration. A global affine fit preserves the board
translation, rotation, and scale; measured residual corrections are blended
using inverse-square distance weights. Each measured coordinate is matched
exactly without triangle boundaries or nearest-neighbor membership changes.

The control points and affine baseline are generated from
[`lib/coordinate_map/via-coordinate-map.csv`](./lib/coordinate_map/via-coordinate-map.csv)
with `bun run generate:lens-calibration`. The current CSV fit uses all 51 points
and has effectively zero residual at those calibration coordinates. Every
control point participates in the weighted blend, so the correction remains
continuous inside and outside the measured region as more CSV rows are added.

Before applying the nonlinear transform, straight lines and Bezier curves are
flattened to line segments no longer than 0.5 mm. This ensures the calibration
is sampled along the complete path instead of transforming only its endpoints
and curve handles.

The fabrication preparation is deliberately drill-free. It removes board
holes, cutouts, unused prefabricated vias, and all through-board LightBurn
operations. A prefabricated via is included only when a routed trace uses it;
it is emitted as solid copper so the laser ablates around the via without
trying to cut its existing hole. Pads are emitted as a fill/scan operation,
and routed copper receives a 0.15 mm clipped ablation band by default. Bottom
geometry is mirrored for machining after the board is flipped.

```sh
bun install
bun run generate:lens-calibration
bun run typecheck
bun test
bun run snapshot:stm32
bun run snapshot:rp2040
bun run build
bun run build:example
bun run export:lightburn examples/stm32c071-display.tsx
```
