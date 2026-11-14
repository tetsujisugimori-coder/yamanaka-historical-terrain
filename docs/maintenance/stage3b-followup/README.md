# PR42 limited-view follow-up (2026-11-14)

Baseline: `9d8a4cc336a87871b2aac49519a08b64ba3adf75` (product `c94483a`, then review document only). Main was `c0ba33b52c86b252ef570467b7b5058fb33d87d2`. The dedicated worktree preserves the existing branch history. No original data/GLB, Pages, historical boundaries, or old failed evidence is modified.

## Fixed checks and evidence meaning

- Existing production matrix: Chromium/WebKit × 375/390/765/1280 × normal/reduced motion = 16 conditions. Existing 6 acquisition faults + 2 old-detail/new-view races remain separate.
- Additional detail starts: each engine × A/C/C+D = 6 conditions, each 22 model detail transitions. Each checks selected ID/description/route, actual mesh POSITION and full visible ancestor chain, and a viewport PNG. A PNG alone is not a proof that all target pixels are unobstructed.
- Separate hidden-model control: each engine, normal and one-factor modified production JS copy. Same actual visibility oracle must accept normal and reject hidden geometry for the intended reason. Same-state screenshots must be stable; normal/hidden differ with unchanged camera. Not ordinary user operation.
- Separate delayed-operation runner: initial acquisition/retry UI reachability; old inner/connected GLB held while new western detail completes; old response released and operation terminal observed; exact state plus viewport image comparison. Native context-loss/teardown followed by pending response is a fault injection, not ordinary UI or OS crash.
- UI-unreachable close/reversed-retry/restore scenarios remain NOT_TESTED with evidence and explanation. No hidden/disabled button is force-clicked. Their absence is not full five-path PASS. No arbitrary sleep substitutes for operation completion.
- HTTP entity bytes of index/JS/CSS/JSON and corresponding build bytes are stored and compared, including URL/status. Compressed wire bytes are not claimed. Source, actual checkout HEAD/tree, PR/base SHA, parents and run/attempt are distinct.

## Reproduced defects and targeted changes

1. R42-P2-05: unmodified Chromium A→overview→detail kept `current` for ic-lookout, wb-gate, dc-gate and sc-people; respective groups hidden. Four original trace/PNG/JSON records retained. Detail now explicitly uses restored C, adding D when metadata or actual component category requires it. `sc-vegetation` has umbrella C metadata but D GLB components; no asset/category data was rewritten.
2. Independent control: category-C OFF still returned completed while actual target invisible. Display settings are preserved, not silently enabled. Detail reports not-completed and visible reason plus existing control/retry instructions; reason is recomputed during synchronization.
3. Delayed inner GLB: state/camera unchanged but stale response attached geometry and changed pixels. Resource acquisition is shared separately from per-operation live-scene authorization; only the latest valid waiter may attach. Connected assets use the same boundary. No automatic retry.
4. Intermediate shared-promise fix rejected a newer waiter for the same resource. This counterexample is retained; each waiter now authorizes after shared acquisition, not through the original waiter's operation.

## Scope and resource budget

Initial overlay free ~49 GB, >3.9M free inodes. Dedicated temp/evidence only; no cleanup of old environment. Production evidence allowance 1 GiB with >=2 GiB free guard; supplementary evidence separate. Local WebKit lacks system libraries and is NOT_TESTED there; official CI provides dependencies. Local dev/dirty-tree preliminary evidence never substitutes final production HEAD acceptance.

Stage 3-B overall HOLD/PARTIAL remains separate. Eleven historical regions, source accuracy, runtime-wide coverage, continuous walking, history stress, performance, Safari hardware, touch, VoiceOver and physical durability remain outside this acceptance. Draft maintained; no merge/publication.

CI runs Chromium and WebKit in two isolated jobs (maximum concurrency 2), each fixed at 60 minutes, with separate original artifacts. This changes scheduling only: the combined 16 normal conditions and supplementary condition counts are unchanged. No retry or timeout increase is introduced.

## First submitted-head regression record

`eb91adf` exploration workflow 43581806025 failed only its `pending-reset` async test: after reset it waited 30 seconds for `phase3c.loaded`, which means attached scene metadata, despite describing cache-only completion. The 16 exploration matrix conditions, three fault controls, and missing-asset case passed. The failed original ZIP is retained, SHA256 `ba8eec9fc4ae8012362acf9da6870c9705da2150238685ae9ddf45904cc40a6b` (3,262,119 bytes).

The follow-up separates actual acquisition completion from each waiting operation's terminal `stale-discarded`/`attached`/`failed` status. The existing async test retains the controlled HTTP delay and reset, then requires response completion, the matching acquisition, the matching old operation terminal, no attached inner scene, and unchanged complete state/comparison/camera/target/fov. Timeout is unchanged; no wait is simply removed and no failed result is reclassified as PASS. This correction is reviewed independently and must run at the new submitted HEAD.

The first production run `43581806065` also remains FAIL: each engine's eight viewport/motion conditions and three start-mode conditions stopped at `sc-vegetation`. The oracle incorrectly required all eight batches to be visible, contrary to the existing `docs/phase3b.md` rule excluding old vegetation overlapping the newer western terrain. Original GLB inspection independently identifies eight batches: four overlapping and four non-overlapping. No GLB or placement is changed. The revised oracle permits an exclusion only for this feature, the original overlap flag, visible ancestors and actual visible replacement-terrain geometry; all non-excluded geometry must remain visible and at least one batch must be visible. All-hidden, forged reasons, another feature, hidden ancestor and absent western geometry are rejected. The UI states the four visible/four excluded groups and explains that terrain is not replacement trees. A dev Chromium supplementary check accepts the intended 8/4/4 state and rejects category-off/all-hidden controls; final production acceptance is separate.

Both failed production original ZIPs were independently audited as VERIFIED_FAILURE, not technical PASS: each 538 ZIP entries/537 manifest files, 25 source references, 338 captured HTTP bodies and 24 trace archives. The original failures remain preserved. Follow-up unit tests: 398 PASS; build PASS with the existing bundle-size warning. Final-head CI and archive results are recorded separately on PR42/Issue41.

The next submitted head `ea4ec6e` passed production run `43583845406` (30 cases plus separate controls), but inner workflow `43583845386` retained four stale-success/stale-failure timeouts (both engines). Its old completion wait likewise required either attached inner metadata or a changed visible failure flag after a newer castle-view operation. Neither is permitted for the stale waiter. The same controlled 200/404 response cases now bind the pending acquisition sequence and waiter ID, observe HTTP completion and both terminal states, require acquired/failed versus stale-discarded separately, and preserve the exact state/camera/target/fov/comparison plus no inner scene objects. The 45-second timeout and operation sequence are unchanged. This is a test-contract correction, not a new product change; the original FAIL ZIP is retained and new final-head formal CI is required.
