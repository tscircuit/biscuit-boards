# biscuit-boards

Prefabricated copper-clad boards for ordinary tscircuit TSX.

```tsx
import { BiscuitBoard } from "@tsci/tscircuit.biscuit-boards";

export default () => (
  <BiscuitBoard>
    <chip name="U1" footprint="soic8" />
    {/* components and traces */}
  </BiscuitBoard>
);
```

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

The via field uses 74 candidates in five routing corridors. A 2x3 escape grid
sits between J1/J3 and the board center. Mirrored nine-via columns at
x=+/-28.5 mm sit between the original LaunchPad headers and the new edge
headers. Dual-row upper and lower bands extend from x=-33.5 mm through
x=14.5 mm; the two pads nearest the left mounting holes are omitted for
clearance. Standard upward-facing 1x10 pin headers sit flush with the left and
right board edges, with their rows centered at x=+/-36.23 mm. Their 20 breakout
pins are explicitly marked unconnected until a signal map is chosen.
The central chips/sensors bay and the upper and lower connector/interface bays
remain free of prefabricated via pads. Dedicated upper-right and lower-right
edge bays also remain open for connectors that need outside-board access.
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
claims 15 of the 74 prefabricated vias, at these positions in millimeters:

```text
(-12.795,-4) (-12.795,0) (-12.795,4)
(-8.795,-4) (-8.795,0) (-8.795,4)
(-28.5,12) (28.5,8)
(-13.5,-21.5) (-9.5,-25.5) (-5.5,-25.5) (-5.5,-21.5)
(-1.5,-21.5) (2.5,-21.5) (-9.5,21.5)
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

The 58 assignable fixed vias use 4 mm pitch in the established clustered clad
style: closed upper- and lower-left edge clusters, two inset left clusters, a
central routing field, an ICSP escape cluster, and split right-edge rails. The
header rows and original clad mounting holes remain open. The bare template and
its checked-in PCB snapshot are in
[`examples/arduino-shield-clad.tsx`](./examples/arduino-shield-clad.tsx).

```sh
bun run build:arduino-shield
bun run snapshot:arduino-shield
bun test tests/arduino-shield-clad.test.tsx
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
