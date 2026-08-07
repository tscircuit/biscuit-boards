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

`BiscuitBoard` owns the fixed 75 mm x 55 mm outline, copper pours, mounting
holes, and assignable prefabricated vias. Its `<board>` uses a local
`autorouter.algorithmFn` backed by `AutoroutingPipelineSolver8` from the
standalone `@tscircuit/capacity-autorouter` package. Pipeline 8 uses
rip-and-replace pathing and permits layer changes only at the board's
prefabricated vias.

The complete STM32C071FBP6 + SWD + status LED circuit is in
[`examples/stm32c071.tsx`](./examples/stm32c071.tsx).

```sh
bun install
bun run typecheck
bun test
bun run build
bun run build:example
```
