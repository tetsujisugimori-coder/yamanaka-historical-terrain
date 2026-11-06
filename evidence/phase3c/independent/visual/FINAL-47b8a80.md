# Final independent browser and visual review

## Verdict
PASS for the scoped Phase3C browser/visual acceptance, with P3 limitations and explicit NOT_TESTED items below. P2 VISUAL-03 (black terrain patch) CLOSED. Scoped merge recommendation: YES from this browser/visual review; this is not an overall source/history/geometry/performance sign-off or permission to merge.

Candidate HEAD: 47b8a80d2f7f08a50a0e0cfe9b4d89d7b2d07700. Tree: 5e44d4b1a310a45c9de1176939c6c60fb16b76d1. Executed PR synthetic merge: c239f2b36f9aa119b7c4eaf156bf47d7aa16a2e7, identical tree.

Artifact: 13473859588, run 42152881096, supplied ZIP SHA-256 5b62dc797e8f0866bcb86d43634829fbdf2830b75aa3ec2eb30f5b2b77f47d1a. Parent verified ZIP; this reviewer independently verified the extracted evidence. Artifact path: `phase3c-artifacts/42152881096/phase3c-independent-visual`. Existing historical report files bundled in that artifact are not treated as fresh results.

## Independent executed test evidence and audit
Reviewer-authored browser script executed in CI, separate from producer assertions. Actual scene objects were exposed by read-only instrumentation; independent Three.js ray intersections, material/geometry attribute checks and hashes were used, not the producer's support predicate or producer test PASS.

- Normal: 22/22 PASS: 16 Chromium/WebKit × 375/390/765/1280 × normal/reduced-motion matrix rows, plus 404, missing-support and WebGL-unavailable cases in each engine.
- All 128 recorded station comparisons independently re-audited from actual probe data. C and C+D eye height is 1.7m above nearest supporting visible triangle within 0.002m, with identical preserved A/C/C+D camera. No enabled-vertex-color/attribute-count mismatch found.
- The normal script also exercised touch-emulated taps or focused Enter, stationary-eye arrow look, legacy facility presence, both fixed-section SVGs, quality settings, 2× height support, resize overflow, error absence, material/UV/index restoration, and explicit unsupported-A rendering behavior.
- Both normal and negative source manifests match all 14 local files, 28 individual SHA-256 checks. The negative source manifest intentionally describes fixed on-disk sources, with the explicit mutation flag identifying the intercepted old line.
- Negative: two Chromium/WebKit 390/reduce runs failed exactly with `VERTEX_COLOR_WITHOUT_ATTRIBUTE`. Parsed actual error payloads each identify 19 visible meshes lacking colors, including all seven new inner-patch meshes. All have color count 0 and positive position count. No timeout or unrelated failure is counted as expected rejection. Separate verdict: EXPECTED_REJECTION.
- Numeric/hash audit saved in final-artifact-audit.json.

## P2 closure chain
Old C+D wide-view PNGs visibly showed the black patch; old material code enabled vertex colors without COLOR_0. The fixed source requires an actual color attribute. Fixed normal operations pass the independent live-object oracle. Reintroducing exactly the old enabling line causes the expected independent failure in both browsers. Fixed Chromium-light and WebKit-balanced screenshots at the previous wide-view counterexamples show normal grass/soil instead of black. Together these establish cause-specific correction, rather than unexplained disappearance of symptoms. VISUAL-03 is CLOSED for the stated candidate.

## Actual image inspection
Reviewed all 32 supplied producer C+D low-view images, two engines, eight stations, 390/1280, plus original-resolution lookout, wide-view P2 counterexamples and wood images. Also opened independent C-mode original PNGs: Chromium-1280 lookout, WebKit-390 bridge, Chromium-390 koguchi-inside. The independent C images show plain terrain without the D appearance and retain readable shape. No local browser launch was retried. No PNG was copied or uploaded to Git.

The bridge route and flanking terrain, lookout elevation, outside/inside koguchi bank visibility change, western gateway narrowing and moat ridge depth are legible. Full per-station assessment is in fixed-images-review-47b8a80.md.

## Important A comparison limitation
Only Nishinomaru's selected pose is compatible with A support. The other seven stations have materially different A ground and are intentionally hidden at preserved camera position; this occurred consistently in all 16 matrix conditions (112 unsupported A station states). Their camera is preserved and an explanation is shown rather than manufacturing a common floor. This is a verified safe limitation, not successful visual A/C comparison at every station. Do not claim all eight support same-camera A display.

## Remaining findings
- P1: none identified within tested scope.
- P2: none open in this browser/visual review; VISUAL-03 closed.
- P3 APPEARANCE-01 remains: uniform soil/grass fields and polygon facets limit realism, despite reduced texture repetition.
- P3 FRAMING-01 remains: 390px lookout framing crops the lateral relationship; looking around is needed.
- Earlier P3 APPEARANCE-02 dark wood is resolved in corrected images; do not repeat the old near-black appearance as current.

## Exact limits / NOT_TESTED
Automated WebKit is not physical Safari. Real iPhone/iPad/macOS Safari, physical touch ergonomics, VoiceOver/full accessibility audit, persistent FPS, GPU memory, field correspondence and historical accuracy are NOT_TESTED by this review. Fixed-section controls were checked, but independent numeric section/terrain preservation belongs to the technical reviewer. Center-ray obstruction data are recorded and paired with image inspection, not a complete all-direction visibility proof. No free walking/continuous traversability or combat-simulation eligibility was certified. This conclusion applies to the identified candidate and tree; later product changes require applicability reassessment.
