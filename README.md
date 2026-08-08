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
other layer transition. The router uses negotiated rip-and-replace with
history costs and precomputed trace-edge conflict lists. Its final
post-processing stage enforces 0.2 mm copper clearance and simplifies whole
stair-step runs into clearance-safe Manhattan/45° paths.

The complete STM32C071FBP6 + SWD + status LED circuit is in
[`examples/stm32c071.tsx`](./examples/stm32c071.tsx). Its checked-in
`tsci snapshot` artifacts cover both the routed PCB and schematic views.

```sh
bun install
bun run typecheck
bun test
bun run snapshot:stm32
bun run build
bun run build:example
```
