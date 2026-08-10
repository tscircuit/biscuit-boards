# biscuit-boards

Prefabricated copper-clad boards for ordinary tscircuit TSX.

```tsx
import { BiscuitBoard } from "@tsci/tscircuit.biscuit-boards"

export default () => (
  <BiscuitBoard>
    <chip name="U1" footprint="soic8" />
    {/* components and traces */}
  </BiscuitBoard>
)
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

## LightBurn export

Generate the routed Circuit JSON and all laser-ready files for the STM32 board
with one command:

```sh
bun run export:lightburn
```

The output is written to `dist/lightburn/stm32c071/` and includes the original
Circuit JSON, a LightBurn-prepared Circuit JSON, a combined `.lbrn2` project,
an SVG preview, a manifest, and separate `.lbrn2` files for each operation.

The fabrication preparation is deliberately top-side and drill-free. It
removes board holes, cutouts, unused prefabricated vias, and all through-board
LightBurn operations. A prefabricated via is included only when a routed trace
uses it; it is emitted as solid copper so the laser ablates around the via
without trying to cut its existing hole. Top pads are emitted as a fill/scan
operation, and routed copper receives a 0.5 mm clipped ablation band by
default.

```sh
bun install
bun run typecheck
bun test
bun run snapshot:stm32
bun run snapshot:rp2040
bun run build
bun run build:example
bun run export:lightburn
```
