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
trace-edge conflict lists. Its final
post-processing stage enforces the configured copper clearance and simplifies
whole stair-step runs into clearance-safe Manhattan/45° paths. A final
obstacle-aware expansion stage then targets 0.3 mm copper by default, widening
in place or moving traces around neighboring copper and pads where needed. It
may retain a narrower neck where the board cannot safely accommodate 0.3 mm,
and it never introduces a non-prefabricated via. Override the target with the
`nominalTraceWidth` prop; `minTraceWidth` remains the hard routing minimum.

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

The via field mirrors the original clad's clustered/open-edge language with 48
candidates. The two closed 3x2 left-corner clusters keep their original
coordinates. The upper-left and six-column bottom bands sit one standard 4 mm
via pitch from those corner clusters and against the top and bottom edges. The
right-edge rail is omitted, while a 2x3 escape cluster sits immediately to the
right of the left LaunchPad header. The routed example is in
[`examples/stm32c071-display-boosterpack.tsx`](./examples/stm32c071-display-boosterpack.tsx).
It places the STM32C071, display connector, both buttons, status LEDs, SWD
connector, bulk capacitor, and the two LaunchPad headers within the outline.

The complete example routes all 36 PCB traces, including all five J_SWD pads
and both bulk-capacitor pads, with no router or clearance errors. SWDIO and
SWCLK use two deterministic escape traces whose channels are reserved from the
board autorouter; the other 34 traces are autorouted. The solved route claims
10 of the 48 prefabricated vias, at these positions in millimeters:

```text
(-14,-4) (-14,0) (-14,4)
(-9.5,-21.5) (-5.5,-21.5) (-1.5,-21.5)
(-5.5,21.5) (12.75,21.5) (24.75,21.5) (24.75,25.5)
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
ROUTE_SWD_AND_BULK=0 bun run analyze:boosterpack
bun test tests/boosterpack-clad.test.tsx
```

## LightBurn export

Generate the routed Circuit JSON and all laser-ready files for the STM32 board
with one command:

```sh
bun run export:lightburn
```

The output is written to `dist/lightburn/stm32c071/` and includes the original
Circuit JSON, a LightBurn-prepared Circuit JSON, a combined `.lbrn2` project,
a forward-calibrated `*-lensdistortion.lbrn2` companion, an SVG preview, a
manifest, and separate `.lbrn2` files for each operation.

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

The fabrication preparation is deliberately top-side and drill-free. It
removes board holes, cutouts, unused prefabricated vias, and all through-board
LightBurn operations. A prefabricated via is included only when a routed trace
uses it; it is emitted as solid copper so the laser ablates around the via
without trying to cut its existing hole. Top pads are emitted as a fill/scan
operation, and routed copper receives a 0.5 mm clipped ablation band by
default.

```sh
bun install
bun run generate:lens-calibration
bun run typecheck
bun test
bun run snapshot:stm32
bun run snapshot:rp2040
bun run build
bun run build:example
bun run export:lightburn
```
