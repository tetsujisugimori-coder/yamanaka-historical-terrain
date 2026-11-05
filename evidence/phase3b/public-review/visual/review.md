# Independent browser and visual review

**Scoped result: PASS; limited merge recommendation: YES.** No unresolved P1/P2 in the sampled browser and visual scope. This is a C reconstruction/illustrative landscape review, not confirmation of historic placement or a complete device certification.

Final reviewed implementation HEAD: `56ce3a1a1098d8852ebbb6ca829f53dbf15d9973`.
Reviewer: independent child agent `visual_review`; no product/server edits. Product hashes and timestamp are in [final/results.json](final/results.json). These hashes allow a later evidence-only commit to be checked against the reviewed implementation.

## Findings and repair confirmation

| Finding | Initial HEAD `36d8417` | Fixed HEAD `56ce3a1` |
| --- | --- | --- |
| P2: front gate station clips upper beam and outer outline | Reproduced at default direction, 1280 and 390 px | **CLOSED**. Low fixed eye remains; whole beam, both posts and both leaves fit. Independently viewed Chrome1280/390 and WebKit390 pixels. |
| P3: balanced shadows stay enabled after shrinking desktop to mobile | Canvas `[349,460]`, shadows `true` after resize | **CLOSED**. Independent wide-to-narrow-to-wide test disables and reenables shadows. |
| P3: fixed-station lower-right label describes unrelated old selected facility | Reproduced on gate/moat low images | **CLOSED**. Station selects its corresponding element; gate caption and diagnostic selection both identify `wb-gate`. Soil/wood stations map to moat/gate. |
| P3: conspicuous periodic checker texture | Visible across soil/grass/roof finish | **OPEN, nonblocking**. Variation, material distinction and contact shading improve; repeating pattern still limits naturalness. Track for a later visual pass. |

The gate RED images are preserved in [red-36d8417/](red-36d8417/). GREEN: [desktop gate](final/chrome-1280-wb-gate.png), [mobile gate](final/chrome-390-wb-gate.png), [automated WebKit gate](final/webkit-390-wb-gate.png). Same viewport and default station action were used before/after; eye, pitch and field of view intentionally changed as the repair.

## Pixel assessment

Viewed the three overview images in `browser/green-chrome-01`, the independent low views and final images. The new moat reads as one continuous deep trench with transverse single ridges, distinct from the older two-row shoji grid. The red-brown steep face, bottom and green shoulders remain readable at 390 px. Timber boards, posts, crossmembers, partly open leaves and fencing are identifiable; wood near-view reveals separate members with restrained grain. The candidate building is visually distinct and can be hidden separately.

Same-camera finish off/on images show added soil surface variation, changed light, wood shading and contact shadow below the candidate building. Examples: [finish off](final/chrome-1280-finish-before.png), [finish on](final/chrome-1280-finish-after.png), [soil near](final/chrome-390-wb-earth.png), [moat low](final/chrome-390-wb-moat.png), [wood near](final/chrome-1280-wb-wood.png). This comparison isolates the new appearance controls on unchanged new geometry; it is not an independently measured old-main performance comparison. The repeated texture pattern is the remaining visual weakness. No conspicuous floating post or large hole appears in the sampled views; this is pixel sampling, not exhaustive geometric intersection proof.

Mobile UI has readable light panels, controls without horizontal overflow, explicit C/UNKNOWN captions and a visible fixed-view explanation. The page is long and map controls precede the canvas, so mobile use requires scrolling. This did not prevent sampled operations.

## Independent final browser actions

[final-runner.mjs](final-runner.mjs), [final/results.json](final/results.json):

- Existing Chrome at 1280 and 390 px, existing automated WebKit at 390 px; reduced motion enabled. All **PASS**.
- Explicit station-ID wait for all five new default stations, then screenshots.
- Arrow key changes direction while fixed eye stays fixed.
- A mode hides new models while preserving fixed eye, look, selected element and field of view.
- Building toggle hides the independent candidate and keeps its C/unknown explanation and selection.
- Appearance off/on preserves camera; responsive balanced-shadow policy toggles in both resize directions.
- No document horizontal overflow or uncaught page exception in these samples.
- Independent optional-model fault: first `phase3b.glb` request returns 404; warning and facility explanation remain usable; A/C transition makes a second request and restores the model, clearing the warning. **PASS**, exactly two GLB requests, recovery image saved.

## Review limits and retained initial history

Initial sample also opened Chrome375/765 and WebKit390, but generic ready waiting was insufficient for some station screenshots. `review-runner.mjs` and `results.json` retain that history; they are not claimed as a full PASS matrix. The corrected initial run explicitly awaited station IDs at Chrome1280/390 and its RED evidence is preserved. All final assertions and screenshots use explicit waits.

Final independent sampling does **not** certify the full 375/390/765/1280 x two-engine x normal/reduced matrix. It does not independently reverify WebGL unavailable state, delayed-response races, full touch swipes, old-main performance, all terrain intersections, real iPhone Safari, VoiceOver, historical georeferencing or dimensions. Implementation-authored tests and other reviewers' results must be reported separately. No hardware Safari success is claimed.

Recorded UTC: 2026-11-05T11:03Z. Final browser process completed at 2026-11-05T11:01:38Z; all browsers closed before performance measurement.
