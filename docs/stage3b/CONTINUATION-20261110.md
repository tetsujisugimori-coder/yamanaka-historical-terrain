# Issue #41 continuation after PR #38 adoption

## Current verified upstream

- main HEAD: 842d5378bb1fad648f225b79933763b8e87b6afa
- main tree: c8c6bf0a266574f14107be956a0f2db373b7a9c8
- PR #38 merged 2026-11-10T11:03:06Z, reviewed branch head 666aa9cb8ccc159b716fa0d3ac1699cbdaf24310.
- PR #40 remains Draft/open, head 340b05a4c947e343076f76513535bf7d7d477f21; not imported.
- Issue #41 remains open. No duplicate issue was created.
- Previously submitted branch ref still points at old base 5adb7156. No Stage 3-B tree/remote commit/Draft PR or final CI exists.

## Safe local continuation completed

Original worktree and its prior evidence remain intact. A separate local branch based on adopted main received the previous Stage 3-B patch. Four main.js integration conflicts were resolved by preserving both CAD and overview imports, CAD support-cache disposal plus overview disposal, CAD diagnostics plus overview diagnostics, and both panel bindings. No CAD/terrain source was changed.

The previous 185-file manifest correctly rejected the adopted exploration.js change. Its old version is retained as preserved-inputs-pr36-baseline.json. The current manifest was independently recomputed from the published main Git objects and now covers 212 original inputs, including adopted CAD delivery files. All 212 match. This is a new baseline, not suppression of a Stage 3-B edit.

Targeted CAD/overview tests: 56/56 PASS. Build PASS with existing large-chunk warning. Final full regression/browser16/CI/independent reacceptance for this new integration remain NOT_TESTED.

## Differences from the renewed request and remaining implementation

1. Historical reference: 11 regions are still unplaced. Official named relations exist, but no independently verified control points or residuals. No source-grounded plan can yet be drawn at an asserted location. Historic accuracy and numeric transform agreement stay separate.
2. Region/model linkage: five saved GLBs and 22 envelopes are covered. Adopted CAD B0/B1/B2, runtime shrubs and legacy palisade placements need separate runtime-position audit. Existing CAD fixed upstream commit is 1cc50d1a6d1af8164cada51124cb02279dbe316c. Their known ground-support uncertainty must remain visible.
3. Evidence categories: add explicit region/model A/B/C/D and facility type, latest update, model references, and mismatch distance/direction fields only where independently comparable positions exist. UNKNOWN is required otherwise.
4. Work states: old schema has 制作済み/制作中/制作予定/未着手/UNKNOWN. Renewed request adds 実装済み/資料調査中/位置未確定 and visual status differentiation. Historic certainty must not masquerade as implementation completion. Current work sign describes software location-audit UI, not all-region reconstruction.
5. Navigation: current model detail/overview transition exists, but prior observation pose restoration and explicit overview/free-walk switch need implementation and race/cancellation tests. Existing eight stations and walking remain inherited, not newly reaccepted.
6. Faults: extend tests for units/axes, delayed requests, rapid interactions, reloading and browser-history consistency. Existing schema rejects malformed CRS, coordinates, identity and unsupported certification.
7. Performance: measure load/render/input impact under matched conditions. PR #40 must not be presumed available; no optimization claim can be made from current data.
8. Publication: the prior explicit 26-file approval still did not pass connection review. Do not retry that same write or switch routes merely because the task was repeated. Any future submission requires a supported resolution of that specific blocker; local changes do not imply publishability.

## Current acceptance

PARTIAL. Full Stage 3-B completion NO. Limited merge recommendation NO pending renewed-request changes, final tests and independent review. The UI does not yet establish which entire historic regions are reconstructed versus untouched; it shows bounded model-data presence and explicitly unknown historical locations/status.

## Local follow-up implementation (not submitted)

- Added 実装済み / 資料調査中 / 位置未確定 to evidence-required work states, with textual status labels and solid/dashed styles. Existing unknown regional statuses remain UNKNOWN rather than being inferred from model presence.
- Added region-to-model semantic audit links. Their geographic agreement remains UNKNOWN. Model research categories come from existing metadata; unavailable facility types remain UNKNOWN. Distance/direction fields are null, not zero, because no independently located historical counterpart exists.
- Added a return-to-prior-camera control, restoring view/layers/selection/comparison and camera pose as ordinary observation. It deliberately does not resume a prior walking loop or imply restoration of station-mode identity. Added an explicit entry to the existing free-walk handler; its existing surface/safety checks still apply.
- Repeated data acquisition uses a separate generation token; late responses cannot replace newer data. Rebuilding disposes prior overlay geometry/materials and labels rather than duplicating them.
- CAD B0/B1/B2 fixed hashes and actual GLB positions were decoded: 14 meshes and 336 vertices per revision. See cad-local-audit.json. This is an asset-local audit and a documented configured anchor, NOT a runtime supporting-surface/placement remeasurement. Runtime CAD envelopes, vegetation and legacy placement remain NOT_TESTED.
- Node-only parse/validate cost was measured in ten predeclared alternating blocks of 1000 iterations. Median per-iteration parse was about 0.201 ms; parse plus validation about 0.238 ms. See data-cost.json for all samples and conditions. This is not a browser load/render/input comparison or a performance improvement claim; those remain NOT_TESTED.
- No submission retry or alternate publishing route was used. The earlier publication-review blocker remains unchanged. Independent re-review could not be restarted due to the agent thread limit; no independent acceptance is claimed for this follow-up.

Local full regression after follow-up: 389 tests PASS; build PASS (large-chunk warning); 212 protected files unchanged. Browser run: Chromium eight matrix conditions FAIL at the old global asset-fetch assertion, two acquisition fault cases PASS; WebKit NOT_TESTED because system libraries are unavailable in this invocation. Adopted PR38 now loads CAD GLBs before overview activation; the old PR36-based assertion incorrectly demanded every startup request be regional.glb. The runner now preserves initial requests separately and tests only overview-triggered requests. This correction has NOT been rerun, and no browser acceptance is claimed. Further browser launches paused to avoid contention with another task's diagnosis.
