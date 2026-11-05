# Independent review: A / D rendering isolation

Reviewer did not implement product changes. Fixed baseline `5fca33c5f1bf7be66e8b44e33b057b2fea4c5c31`; candidate `7e7e9f94992d862f23470fed57c8e9de328a51e0`, tree `39a3de0b189eba4a0939203651b1f5e4e65f4a3e`. Inspected separate checkout and detached candidate worktree. Current provisional overall PARTIAL, P2 closure UNKNOWN and merge recommendation NO pending browser evidence.

## Independent executed evidence

- `node independent-review/material-ad.mjs ./src/phase3b.js --expect-bad`: baseline 10 assertions, 6 FAIL and 4 PASS. Expected-bad command exit0 verifies intended original-material failure, not product acceptance.
- `node independent-review/material-ad.mjs ./independent-review/candidate/phase3b.mjs`: exact candidate blob; 10 PASS, exit0. Shared original material remains unchanged, imported vertex colors are not destructively mutated, shadow flags restore, generated UV removes, existing UV preserves identity/bytes, 20 repeated toggles preserve original. Synthetic Three.Mesh runtime, not hardware or browser.
- `npm test` in isolated candidate worktree: 36 PASS,0 fail/skip, exit0. Existing implementation-authored tests rerun independently, not 36 newly independent cases.
- Baseline→candidate changed-file inspection: no public or production changes; old evidence unchanged, new evidence files added. Model positions/shapes/classification files unchanged.
- Public browser script SHA256 `51d4306a47fb4b0b86cc7dcd6da6f465ae18d3b2aeddd40b20d0ceeb496b6653` matches reviewer-authored initial script.

## Cause and repair analysis

Old `syncWestern` guards model visibility by restored comparison, but applies material/light/fog/shadows using landscape and drama only. A after C+D inherits drama=true, so that path is directly reachable. Candidate gates D by active landscape + restored comparison + drama, and applies symmetric base lighting/fog/background/shadow restoration. UI disables are supplementary, not the enforcement.

`createSurfaceFinish` formerly changed imported material.vertexColors and both shadow flags even when disabled. Candidate retains source material and clones neutral C material when appearanceEvidence requires suppressing D vertex colors; D uses a separate clone. It restores per-mesh shadow flags and UV state. This is supported by independent runtime tests, not merely static inspection.

## Browser review contract

Independent script reads actual scene, lights, terrain materials through read-only instrumentation. It does not reuse product's allowed/enabled predicate as oracle. It drives real automated mouse and keyboard APIs; no hardware touch claim. Same test executes baseline, candidate and injected D-light/fog recurrence, each Chromium/WebKit ×4 widths ×2 motions (16 conditions). A screenshots compare same canvas/camera/dimensions with exact bytes, tolerance0. Scripts also check C-only,2x,resize,exit and pageerror.

Initial expected-failure acceptance checked only that intended A assertion failed. Parent review correctly identified it could conceal a later execution abort. Revised script requires16 rows, all stages completed, and only allowlisted A rendering discrepancies. This is a test-harness correction, not a new product defect. Original script/results will be preserved. Runtime evidence is still pending; no browser PASS is claimed here.

Independent browser script does not itself cover404/stale replies or fixed cross-sections; those require separately identified existing regression evidence. Historical truth, exact position/construction, hardware Safari/VoiceOver/site check remain UNKNOWN/NOT_TESTED. P3 texture repetition, wide WebKit cost and initial timeout cause are not resolved by this patch.
