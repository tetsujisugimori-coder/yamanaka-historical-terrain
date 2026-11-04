# PR #8 independent review — submission 7e79e63

Distinct reviewer, separate clean clone; implementation source and old evidence were not edited. Review result: **PARTIAL / changes requested / scope-limited merge recommendation NO**. The central numerical geometry contract passed the independent checks below. Two product-facing findings remain; this is not an approving GitHub review.

## Identity and scope

- PR: https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/pull/8 ; Issue #7 OPEN.
- HEAD `7e79e63b50fbcf8d9b5125e864309f5dc3d7f571`, tree `7c5163448f26fe49320bcf2535553a99d1ff69e4`.
- base/main `5f54eacea3f9fed702e8caf10a3acda0c243ac14`.
- Separate clone: `../review-yamanaka`, detached at exact submission. `AGENTS.md` read; no repository `.agents` skills were present. Main and original working directories were not changed. Protected 156 original production/public-data/evidence/attribution files compared byte for byte to base: PASS.
- New review evidence only in this folder. No merge, Draft release, deployment, formal approval, Issue closure, QGIS/Blender regeneration, physical-device claim, or change of historical uncertainty.

## P2-01 — canceling a pending view through facility selection leaves the section overlay removed

Location: `src/main.js:53`, `src/main.js:103`, `src/main.js:116`, `src/main.js:119-124`; integration with `src/section-exhibit.js:43` (`sync`).

Repro on Chromium 141.0.7390.37 and Playwright WebKit 26.0, 390×960:

1. Load normally; select moat, wait for both A/C section data, click “3Dで断面を見る”. The visible reconstructed model has three section markers and 672 line-buffer numbers.
2. Hold the real `moat-study.glb` response with an explicit route gate, then click the separate “障子堀の断面教材” view.
3. While that response is held, select the existing reconstruction facility `nm-moat` in the reading list. This cancels the pending view and returns readiness to the current reconstructed model.
4. Release the older response as either the actual GLB success or a deliberate 404. Wait for response and two animation frames.

Observed in all four engine×outcome cases: `state.ready=true`, `view=reconstruction`, `section.status=ready`, latest selected facility retained, but section line buffer length **0**, marker count **0**, and visible explanation still **“3D切替中：対応線・点を非表示にしています。”**. Graph and dimensions remain visible. Toggle exaggeration and `sync()` recreates the 672-number line and three markers. The first recording and the repeat are retained. The repeated acceptance runner exits **1** and records 4 FAIL, not a successful regression test.

Root cause: `setView()` clears overlays through `sync()` with readiness false. `beginIntent()` restores readiness and the app status when the user cancels that pending intent, but does not synchronize the section presentation. `chooseFeature()` takes no `setView()` path for a reconstruction facility when the current view is already reconstruction. The canceled promise correctly returns without later synchronizing anything. Thus the new section state remains stuck in its earlier loading presentation.

Impact: ordinary facility selection during a slow view switch permanently removes the graph-to-3D correspondence until another unrelated sync action. Violates the requested section/facility/loading consistency and absence of mixed presentation.

Recommended fix: centralize restoration of the current visible model's readiness/panels/section overlay when a pending view is superseded, including the path where a facility selection does not start another load. Do not accept old responses or refocus from them. Recheck related reconstruction-control visibility during this restoration.

Acceptance: same four gated cases restore section lines, S/E/selected marker, and truthful visibility text immediately after latest facility selection; no further toggle needed; they remain correct after stale success/404. Reapply independent surface checks to restored buffers. Existing delayed C/A/Reset/camera cases must stay green.

Evidence: `cancel-overlay.json`, `cancel-overlay.log`, `cancel-overlay.mjs`, `cancel-*-graph.png`, `cancel-*-3d.png`; first recording in `cancel-initial/`. The normal baseline is in `independent-browser.json` and normal images.

## P2-02 — common C-defined points are labeled as A's bottom/crest in the exhibit

Location: `src/sections.js:3-4`; `src/section-exhibit.js:12`, `:39-41`.

The PR and `docs/fixed-sections.md` explain that the representative point names are based on C's shape and are correspondence positions, not an identification of A's actual ditch floor or rampart crest. That distinction is absent from the exhibit itself, including its expanded explanation. The shared button “堀底” displays A 570.3m and the prominent A differences 1.9m/2.6m without saying that these are C-defined matching-point differences. The A minimum on this same section is actually **569.6699829101562m at S+16m**, while the named floor point is **570.3130065917969m at S+10.5m**. Similarly “土塁頂部” displays A 570.7m on a declining A slope; this is the C crest's horizontal position, not A's crest.

Repro: choose either section at any tested width and read the representative buttons, selected-point sentence, and dimension labels. Same text and measurements in both engines/1×/2×. This is a semantic measurement-definition problem; the sampled heights themselves are numerically correct.

Impact: a museum visitor can read the A values as actual current ditch depth or crest height. Repository-only caveats do not accompany the displayed numbers. This undermines the requested separation of observed geometry, reconstruction assumptions, and measured values.

Recommended fix: visibly state next to the point list/dimensions that names and fixed locations are chosen from C, A reports its surface at those same horizontal coordinates, and these values are not A's extrema or an identification of real remains. Prefer correspondence-aware labels in the A differences. Retain common coordinates and current calculations; no invented replacement geometry is requested.

Acceptance: both sections' mobile/PC visible text and accessible reading make this definition clear without visiting GitHub or relying on a collapsed disclosure. Verify unchanged numbers/coordinates and no historical promotion. Screenshots `*-moat-graph.png`, `*-rampart-graph.png`; raw values and points `static.json`, `independent-browser.json`.

## Independent execution and numerical method

`oracle.mjs` independently parses GLB chunks/accessors, checks node-transform assumptions, indexes whole triangle bounding boxes, tests horizontal containment by oriented edges, and solves the triangle plane equation. It imports neither product sampling/intersection/coordinate helpers nor the submitted oracle. Source geometry is the immutable actual `castle.glb` / `nishinomaru.glb`, not DEM or vertex-only nearest sampling. Overlapping ground is the highest valid nonvertical triangle. Numeric tolerance fixed before comparing: **0.001m**, for floating-point/export agreement only, not survey accuracy.

`review-browser.mjs` obtains actual Three.js scene objects, matrix-world-transformed line buffers and marker positions through read-only observation, in addition to profile data. Main module response instrumentation exposes the scene and counts model requests; it does not change product files or set product state. Representative points use real tap/click and keyboard Enter with focused buttons. There are no synchronization locks or forced recorder flushes. Deterministic network gates, rather than an arbitrary delay, drive race tests. The separate P2-01 repro uses the original module without that scene instrumentation.

- **62/62 independent browser observations PASS**: 48 engine×375/390/1280×2 sections×A/C×1×/2×, six facility/camera/hidden-layer/Reset observations, eight gated delayed C success/404 with latest A selection and Reset alternatives.
- Each two-section pass checks 1,767 A/C sample values: exact segment endpoints/interiors plus independent 0.113m spacing, declared endpoints/distance/orientation, rendered buffers/markers, and 1×/2× invariance. Maximum graph error **1.1368683772161603e-13m**. Maximum real-height-equivalent rendered buffer error **0.000024414062522737368m**. A/C profiles and measurements invariant under exaggeration.
- **16 independent live controls PASS as controls**: four normal 2× observations accepted; 12 injected faults rejected for geometry reason (height +0.1m → graph surface mismatch; E/N swap → rendered line surface mismatch; double exaggeration → rendered line surface mismatch). Both engines, both sections, same oracle/tolerance. These are synthetic faults, not discovered product failures.
- **6 independent static case groups PASS**: hand-derived triangle interior/shared boundary/endpoints/outside; real gap not bridged; crossing overlapping planes highest envelope; vertical face excluded; all 222 retained samples against own actual-GLB oracle; 156 protected files unchanged. Synthetic tests call the function under test but calculate expectations by hand. No actual hole exists in the two chosen continuous sections; missing/overlap/vertical semantics are exercised with explicit constructed meshes.
- Saved sample maxima: A_webTriangle difference **1.1368683772161603e-13m**, C generator-sample difference **0.00002954483034045552m**. A_1m is not used as the rendered-surface oracle. Generator and immutable provenance inspected; native projects not regenerated.
- Submitted unit suite rerun **26/26**, normal build and Pages-subpath build **exit 0**. Existing bundle-size warning remains.
- Built repository-subpath runner independently rerun **8/8** PASS on Chromium/WebKit, 390/1280, both sections. This runner is submitted code, uses its submitted oracle, and is not represented as the independent geometric oracle above.
- Submitted pending-C runner independently rerun **4/4** PASS (two engines × actual success/404 with section/VE changes); initial wrong-cwd runner failure preserved separately.
- Previous browser regression reruns: **248/248 result rows PASS**, all nine runner exits 0. The nine result JSON files contain 16 normal, 2 interaction, 10 fallback, 16 phase2a, 12 phase2a fallback, 72 initial-camera, 112 prior review-fixes, 4 Reset/cancellation, and 4 existing built-subpath rows. See `regression-exits.json` and fresh JSON/PNG under `runtime/evidence/`. No submitted result file is counted as a reviewer execution. These legacy passes do not cover or cancel out the four new P2-01 failures. Final counts are summarized in `execution-summary.json`. An initial summary expected 248 before the last four had run and correctly exited 1; that intermediate 244-row summary is retained as `initial-summary-244.json`.

## Sections, coordinates, dimensions and visual check

Moat: S(-66,-10)→E(-38,-10)m, west→east, 28m. Rampart: S(-15,15)→E(-45,15)m, east→west, 30m. Both align with retained sample northings and traverse the relevant C geometry. EPSG:6676 local east/north metres, origin E44862.121277226666/N-93478.07235405142; glTF east/up/south converted with north=-z. Vertical zero is the model reference; datum correction/absolute-survey validity remains UNKNOWN. All measured numbers are model dimensions.

Own A/C point heights in `static.json` reproduce the displayed rounded values. Moat west/east differences are separate: A 1.8590/2.6230m, C 1.380249/1.380249m at the fixed correspondence points. Rampart correspondence difference is A -5.353992m / C +2.5m, horizontal 16m. These numbers do not establish actual historical dimensions; P2-02 concerns their exhibit labels.

24 normal new screenshots captured. Directly inspected representative Chromium/WebKit PC and narrow graph/3D images for both shapes; graph axes, units, line types and text fallback are legible, 3D endpoints and selected point are visible, no required hover, and graph aspect ratio is explicitly separated from 3D exaggeration. Browser operations also verify no document horizontal overflow at all three widths and keyboard selection/focus. The 3D labels sit visually above their on-surface endpoint markers; overlay lines/marker centers themselves match the surface. Depth testing is disabled as a legibility aid and is documented, not an occlusion/visibility analysis.

The official municipal article https://www.city.mishima.shizuoka.jp/site/kyoudoshiryoukan/36489.html was read and supports the cited 0.35m, 1.8m and approximately 58-degree example. The exhibit distinguishes that example from C's production parameters and model measurements. No source photos/reports were redistributed. Geometric agreement does not prove historical placement, reconstruction accuracy, or a real sightline.

## CI and limitations

GitHub readback for exact HEAD/tree: PR Validate run **41895354976**, attempt 1, **5/5 jobs success**; Pages build run **41895354988 success**, deploy **skipped**. `ci.json` records identity. A separate push Validate run **41895189063** was initially in progress and ended **cancelled** at final readback; do not turn that into PASS. Before cancellation, its fixed-sections job had been at browser installation, not product comparison. Cancellation cause/actor was not independently established. `all-ci-runs.json` records it separately. No workflow run or deployment was initiated by this reviewer.

Windows, Node v24.20.0, package-lock Playwright 1.56.1, Chromium 141.0.7390.37 and Playwright WebKit 26.0. Fixed existing browser binaries were reused read-only; implementation source was a separate clone. Initial network/sandbox/CA acquisition issues were environment setup issues, not product results. npm ci succeeded with OS trust (`NODE_OPTIONS=--use-system-ca`), no TLS verification bypass. Initial browser-observer runner used untransformed imports and timed out before product initialization; its log is preserved and the runner corrected to observe Vite-transformed module responses. The subsequent 62 observations are fresh.

Physical iPhone Safari, VoiceOver, real OS touch/capture behavior, field survey, datum correction, historical location/accuracy, full visibility analysis and native QGIS/Blender reload/regeneration **NOT_TESTED/NOT_RERUN**. Prior crash/timeout root causes remain UNKNOWN. Issues #1/#4/#5 were independently read and remain OPEN. PR #8 remains Draft. No source fixes were made by the reviewer. Coordinator should return the two findings to implementation and request the same-case rereview before changing the scope-limited NO recommendation.

## Reproduction

Run from parent workspace: `node review-evidence/geometry-static.mjs`, start separate clone Vite at port 4347, then `node review-evidence/review-browser.mjs`, `node review-evidence/negative-browser.mjs`, `node review-evidence/cancel-overlay.mjs`. Set PLAYWRIGHT_BROWSERS_PATH to the fixed 1.56.1 browser installation. P2-01 currently exits 1 by design because the product does not satisfy the acceptance. Normal and negative-control runners exit 0 only when all required observations/expected rejections are present.

Existing runners were copied to `runtime/scripts` to avoid overwriting historical evidence; only local port URLs were adapted from 4317→4347 and subpath preview 4320→4350. Runtime src/public/index were copies of this exact submitted source. `pending-C` was run from the clean Git clone with an absolute new evidence destination. Submitted unit/build checks and source preservation were executed in the clone. No modifications to implementation or old evidence are required for these steps.
