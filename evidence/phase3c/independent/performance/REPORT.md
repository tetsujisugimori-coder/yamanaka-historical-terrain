# Independent performance / rendering review

## Evidence and verdict

Run42125592154/job127588822163/artifact13462460071, synthetic merge a366ec5d73616ec0ef1281a462b5d9c32a7749e5 versus ed22133f766aa1a2256dcebbb0413ec11d479106. 72 successful executions are not 72 performance acceptances. Original performance outcome FAIL/P2 requiring investigation; corrected working source reviewed below, runtime verification pending. Initial recorded product hashes matched this workspace before the new P2 fixes. Full tree provenance is being checked by parent.

Same engine/width has exactly equal initial camera, target and canvas across variants/trials/qualities. I visually opened WebKit1280 base-balanced, candidate-balanced, candidate-light and Chromium1280 candidate-balanced. Frames align, but new terrain is black in the latter three. Renderer workload deliberately differs because optional patch is loaded only for candidate. Both run full D landscape; modes preserve prior shadow policy. This is a same-view before/after product comparison, not isolated geometry or material causality.

| Engine/width/quality | Input+2RAF median ms before→after | Change | Ready median ms before→after |
|---|---:|---:|---:|
| chromium/390/balanced | 629 → 752 | +19.5% | 2026 → 2474 |
| chromium/390/light | 641 → 750 | +17.0% | 2035 → 2387 |
| chromium/390/high | 835 → 921 | +10.3% | 2075 → 2347 |
| chromium/1280/balanced | 1267 → 1367 | +7.9% | 2874 → 3290 |
| chromium/1280/light | 1000 → 1165 | +16.5% | 2966 → 3247 |
| chromium/1280/high | 1250 → 1375 | +10.0% | 2858 → 3298 |
| webkit/390/balanced | 342 → 509 | +48.8% | 1506 → 1999 |
| webkit/390/light | 341 → 506 | +48.4% | 1503 → 1962 |
| webkit/390/high | 406 → 573 | +41.1% | 1524 → 1971 |
| webkit/1280/balanced | 666 → 867 | +30.2% | 1943 → 2493 |
| webkit/1280/light | 562 → 766 | +36.4% | 1996 → 2498 |
| webkit/1280/high | 648 → 860 | +32.6% | 1912 → 2490 |

Each cell: 3 new-context trials, 8 input samples each. Medians pooled across24 samples; no independence or confidence-interval claim. Fixed base-before-candidate execution order permits runner drift/cache confounding; prefer alternating variants for a stricter follow-up.

Ready timing begins at landscape-enter click after regional initial readiness. It is not page startup. Candidate includes an extra user-style inner-load click, GLB parse, clipping and rendering; ready comparison measures added workflow, not pure parser speed. All ready measurements begin balanced regardless of the row quality label. Quality-switch +2RAF time is separate: WebKit1280 roughly241–256→499–507ms. Do not interpret those row-ready numbers as quality-specific startup.

Capacity: optional GLB507,052bytes, +1.686% over existing landscape/nishinomaru/phase3b30,067,616bytes. Old GLBs unchanged. After eight inputs, submitted renderer triangles390:485,332→450,462(-7.2%), drawcalls22→24; 1280:503,836→470,898(-6.5%), drawcalls31→38. These are actual final-render diagnostics, not total asset triangle counts or averaged GPU work.

## P2 findings and cause separation

1. WebKit1280 input+2RAF rises30–36%, including light mode (+204ms) with shadows off; 390 balanced rises49%. Shadows alone cannot explain the regression. Fewer submitted triangles also rules out simply attributing it to increased face count. No sustained FPS/GPU-memory acceptance is inferred. Chromium uses SwiftShader; WebKit reported string Apple GPU on Linux does not establish physical Apple GPU/iPhone performance.

2. Black new terrain visible at left foreground in same-pose candidate frames, absent in base. Reproduces with WebKit light (shadow disabled) and Chromium balanced. Actual phase3c GLB has no COLOR_0 in all7 meshes; runtime enabled vertexColors solely from truthy provenance string. Three MeshStandardMaterial does not supply ShaderMaterial default color values. Independent actual-GLB state test confirms former guard would enable absent attribute on all7 new and409/412 old western meshes. This is a concrete material-input defect, not a request to brighten lights.

3. Code path ArrowRight→beginCameraIntent→beginIntent→restoreCurrentPresentation→syncLandscape (finish application and syncInner index selection)→sectionExhibit.sync→render, then controls.update/change→render, then explicit render. Therefore old path produces3 renders per key. The key benchmark station is null, so supportedPose triangle scans do NOT run; cutout construction is WeakMap-cached, not regenerated each key. Added material/draw cost is repeated by this path. Source inspection establishes redundant work; exact cost attribution awaits timed diagnosis.

## Working fix review

Independent fix-check.mjs checks actual419 imported western/new meshes: supplied-color meshes retain D vertex colors, all missing-color meshes disable them, and C reset disables appearance colors. Ready-camera path still increments intent generation, skips only unnecessary restoration when ready, and preserves restoration when pending. No new P1/P2 defect identified in those changes. Hashes recorded in fix-check.json; these are working-file checks, not final-commit approval. Black-pixel correction still needs new screenshots.

diagnosis script review: restores only prior camera-intent and Arrow handler while retaining fixed materials/geometry; records separate dispatch, render-body wall-time and RAF wait; checks1 versus3 render calls,0 versus1 sync/restore; same fixed600px canvas, WebKit1280, light quality, three trials per2x2 optional-patch/surface-finish condition. This is suitable causal isolation for camera path. finish=false disables surface finish and associated lighting, but leaves state.drama=true D flags/people: label it surface-finish OFF, not all D OFF. Measurements are wall time, not GPU kernel time. All picture/latency acceptance remains pending on rerun.

## Required next evidence

- New screenshot same counterexample + actual missing-color fault reintroduction rejection.
- Diagnosis results showing render counts and dispatch/time reduction, with source hashes and matching pose.
- Rerun ordinary before/after performance after correction, ideally alternating variants.
- Keep sustained FPS, physical input latency, GPU memory and real Safari NOT_TESTED.

Overall merge recommendation at this stage: NO until rendering P2 and measured-performance regression are re-evaluated. Earlier geometric PASS remains narrow and does not overrule these newer findings. No product files edited by reviewer.

Coordination: root implementer took over product fixes because worker concurrency slots were unavailable; this reviewer remained independent and edited only review evidence. Root subsequently corrected diagnosis wording to explicitly distinguish surface-finish/lighting OFF from all-D OFF. The wording-only script change after fix-check hashes is not a new measured run.

## Final candidate code recheck, before runtime artifacts

Frozen HEAD `47b8a80d2f7f08a50a0e0cfe9b4d89d7b2d07700`, tree `5e44d4b1a310a45c9de1176939c6c60fb16b76d1`: reran independent actual419-mesh vertex-color/C-reset and ready/pending intent checks successfully. `final-code-check.json` records hashes. Product code hashes equal previously reviewed corrective working files. Diagnosis script's final wording now correctly limits OFF to surface finish/lighting/fog, with D flags/people retained. No new code P1/P2 found. Public data/production unchanged since independently reviewed standalone packaging, as documented in technical/final-applicability.json. Runtime performance and black-pixel closure await run42152881096 artifacts; prior failure evidence is retained.

## Performance harness v3 change review (uncommitted, no runtime claim)

Reviewed separate navigation-to-initial-ready timer and alternating base/candidate ordering. Syntax check passes; enumerating2 engines×2widths×3trials×3qualities×2variants gives72 unique cases. Trial1 reverses ordering; trial0/2 are base-first, so residual2:1 order imbalance is disclosed, not called full counterbalancing. New timer covers goto/load plus observed initial-ready completion, separate from existing landscape-entry readyMs; all these times precede row quality selection. Fixed600px CSS is injected after navigation readiness, so initial-navigation timing must not be described as the fixed600px comparison unless startup canvas/pose is separately captured and shown equal. Suggested recording pre-CSS navigationReadyPose for this check. No P1/P2 collection defect found. Version3 results must remain separate from currently running version2 artifacts.
