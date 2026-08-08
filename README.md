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
package. The standalone router runs Pipeline7, then attracts its vias to unused
compatible `netIsAssignable` holes. A collision-aware post-processing stage
reroutes and pushes trace legs away from pads and foreign copper while the vias
move. Its output validator rejects any remaining non-prefabricated layer
transition and emits selected holes as existing-copper transitions rather than
new manufactured vias.

The checked-in `@tscircuit/core` dependency patch is the buildable bridge for
[`tscircuit/core#3067`](https://github.com/tscircuit/core/pull/3067). It can be
removed once that assignable-via handoff is released by core.

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
