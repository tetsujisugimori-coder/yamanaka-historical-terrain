# PR36 landscape metrics reconnect (#39)

Baseline: main 5adb7156acda3968827ff39d5e6f40c4ac837ec5, tree ee91f0f2742b9686ad40b001864b0408251dbbfa. Metrics source: PR34 ee3c3def2565b088c978694469ed86d10d92c75c. PR26/31/34/35 remain untouched. No optimization, landscape edits, merge or Pages publication.

## Migration inventory
- src/main.js: observational wrappers and diagnostic snapshot, separated fetch/parse. The existing PR36 model selection, retry-on-failed-promise eviction, intent controller, synchronous renderer and geometry construction are retained. The timed loader uses the same GLTFLoader.parseAsync on fetched bytes; HTTP/decode errors propagate. This is not an unconditional replacement of the old main.js.
- src/landscape.js: only geometry/material timing callbacks; no geometry or material computation changes.
- src/performance.js: bounded observation from PR34, unused frame scheduler intentionally omitted.
- PR34 runner/config/analyzer/contract tests reused and updated for **observer-free PR36 baseline**, not the former coarse-observer baseline. Old benchmark/accounting helpers remain diagnostic dependencies only; legacy diagnostic injection anchors adapted to wrapped functions.
- All public/production assets are unchanged from PR36. Old #34 raw evidence is not copied as new evidence. The landscape-only separation test runs against its hash-bound accepted baseline; new tests enforce current synchronous rendering and asset preservation.

## Preregistered experiment
6 blocks × I/A/AD × cold/reload-partial =36 trials, fixed order in config. I is exact merged PR36 with no new observer; A is normal bounded observation; AD enables detailed spans. 1280×900, DPR1, no-preference. Same assets, scene, facility task, browser, and cache method. Start with fresh context then reload within it; not complete OS/network cache isolation. Actual served build and GLB/JSON hashes verified. Hash fetches after measured interval warm reload-partial cache equally across variants. Do not compare these results directly with historical PR34.

Initial page ready is separate from landscape→inner→walk start/exit→2RAF task. Monotonic clock intervals, union of overlapping stages, mixed geometry/material and UNKNOWN residual. Renderer submission is CPU command submission; 2RAF is a presentation opportunity proxy, neither establishes GPU completion. Original 72% was CPU sampling share, not full waiting-time share. No zero-overhead or performance-improvement claim.

## Acceptance and limitations
Strict complete trial/order/identity/hash/environment/counter/stage checks and negative controls; existing 16 Chromium/WebKit conditions and raw geometry/interaction evidence; independent review. Final HEAD CI and artifact identities separate from local pre-publication runs. Physical Safari/touch/GPU/full-cache-control/device performance remain NOT_TESTED. Metrics acceptance does not certify faster operation or historical reconstruction.
