# Stage 3-A: fixed CAD delivery to Yamanaka

Issue #37. Base main `42ed7bbe1b1f839535ed66c76c75d1ade2ce2cc8`, source parts main `1cc50d1a6d1af8164cada51124cb02279dbe316c`. Unmerged #26/#31/#34/#35/#36 are not adopted or changed. Detailed initial HEAD/tree and dependencies: `evidence/stage3a/start-state.json`.

## Version and research mapping

`public/parts/cad/pin.json` fixes PAL-ASSEMBLY B0/B1/B2 to source commit, all bytes, units (metres), glTF east/up/south and research snapshot. B2 legitimately inherits unchanged B1 components. Original FreeCAD/STEP/Blender/TechDraw project files and editable research ledger remain exclusively in castle-3d-parts. Exported GLB/SVG and derived read-only research caches are delivery artifacts, not another editable source of truth.

Reimport: clone castle-3d-parts, checkout the exact source commit, run `node scripts/stage3a-import.mjs ../castle-stage3a-source`; then `npm run verify:cad`. Intentional upstream updates require an explicit pin/review change including the approval digest in the importer. `npm run build` refuses changed pins/assets before Vite. No runtime access to upstream main.

The existing Stage2C manifest, stable part IDs and upstream validators are reused. Every GLB mesh is checked against the CAD manifest bounds. Every fetched resource is SHA256 checked. Research record/snapshot references and held/reference_only decisions are validated. The cache contains 27 SRC/OBS/VER/CMP/HYP/DEC records and links to fixed upstream files. Missing evidence fails closed, not a silent fallback to approved history.

## Placement and coordinate contract

Placement `yamanaka-stage3a-palisade-01`, castle yamanaka, area nishinomaru-comparison: E=-20m, N=0m, yaw selectable 0/45/90 degrees. This is the prior v0 comparison location, not evidence of a 1590 fence. Geometry is already glTF east/up/south; no additional axis rotation. CAD footprint is centered along east, then translated to the location and rotated once around world up. Scale is exactly 1 regardless of terrain exaggeration.

The ground anchor and every post center/four corners raycast the active real terrain triangles. Whole assembly remains rigid. Signed clearance, maximum float/burial, face index and world ground heights are recorded in placement diagnostics. No terrain or CAD deformation and no hidden per-post adaptation. Contact residuals remain reported rather than called construction-ready.

Component shape/dimensions are trial D, placement hypothesis is C. CAD is visible only in C+D, not A or C-only. v0 remains explicit exclusive comparison. Collision uses the same visible meshes and current placement; changing geometry stops active walking. Original v0 dimensions and assets remain unchanged.

## UI and evidence boundaries

B0/B1/B2, component list, CAD-projection SVG and terrain mesh use the same Stage2C IDs. List/SVG/3D selection is bidirectional. native TechDraw SVG has viewing/download only, explicitly no bidirectional selection. Native exports are fixed source exports, not a newly generated CAD drawing.

Panels retain revision/selection/tab/visibility/yaw in the URL and restore on history navigation/reload. Latest-load epoch discards delayed responses; explicit retry supported. The information panel and glTF parsing are independent of renderer creation, so drawings and research remain available without WebGL. Mobile tabs, keyboard selection and list selection avoid relying on small meshes.

Existence, shape, dimension and placement grounds are separately explained. Trial 2.2/2.4m values are not Yamanaka measurements. Approximately30cm archaeological posthole diameter is not a timber dimension. Historical certainty remains UNKNOWN and technical checks do not promote it.

## Reproduce verification

- `npm test`, `npm run build` (offline asset verification first).
- Start `npm run dev -- --port 4391 --strictPort`, set `TEST_URL=http://127.0.0.1:4391`.
- `node scripts/stage3a-browser.mjs`: Chromium/WebKit ×375/390/765/1280×normal/reduced, revision/contact/list/SVG/URL/history/classification/exclusive-legacy checks and PNGs.
- `node scripts/stage3a-faults.mjs`: missing/corrupt GLB, altered manifest/SVG, missing research, reversed load completion, retry, WebGL unavailable.
- `PHASE3H_EVIDENCE=evidence/stage3a/regression node scripts/phase3h-browser.mjs`: prior H regression including eight guides, sections, walking and A/C/D. Explicit legacy mode preserves the original five-post comparison checks.
- `node scripts/stage3a-preservation.mjs`: all previous public/production/evidence blobs equal main.
- Serve main42ed7bbe on4390 and current on4391; `node scripts/stage3a-performance.mjs` records alternating cold/partial reload 3-trial comparison. No performance improvement is asserted. JS heap endpoints are not peak/GPU memory; software browser rendering is not physical device FPS.

CI runs against the PR head with raw artifacts. Independent reviewer must inspect the final head and raw CI artifacts, not just this document. Local focused checks are not the final16-condition acceptance.

## Current acceptance and scope

Implementation submitted for validation. Final CI and independent evidence review are pending; limited merge recommendation **NO pending final gates**. Physical iPhone Safari, physical touch, GPU internals and historical configuration are NOT_TESTED/UNKNOWN. No merge, Draft release, formal review posting or Pages publication is performed. New gate/entrance components belong to Stage3-B.
