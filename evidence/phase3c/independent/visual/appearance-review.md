# Independent before/after appearance review

Artifact: 13462460071, run 42125592154, job 127588822163. Input location: `appearance-performance/appearance`. Parent verified ZIP SHA-256 `cfd9e80ddbae4ab08825240ed7a5c9b9562d937d9391c8a61923b8916459005c`; ZIP digest not independently repeated here. This reviewer independently matched both source hashes in results.json (src/main.js and src/phase3b.js) to the current working product. All 12 before/after pairs have exactly identical recorded camera, target and canvas dimensions; pair file hashes are saved separately in appearance-independent-checks.json. This is a visually judged comparison, not a zero-pixel-equality requirement.

## Actual visual review
Inspected all 24 before/after images in contact sheets: Chromium/WebKit, 390/1280, wb-earth/wb-wood/wb-moat. Opened native-resolution Chromium-1280 wb-wood-after and WebKit-1280 wb-earth-after additionally. No proxy based solely on automation status was used.

## Findings
- Improvement: conspicuous small checkerboard/diagonal repetition on red soil, bare ground and grass is substantially suppressed in both engines and widths. Moat walls, dividing ridges and relative depth remain legible; no new hole, floating ground or lost silhouette is apparent in these particular views.
- P3 APPEARANCE-01: replacement soil/grass reads as large, relatively uniform color fields. Polygon facets and broad horizontal material bands remain prominent. Texture repetition improved, but these screenshots do not demonstrate photorealism or rich soil detail. Examples: all wb-earth-after and wb-moat-after captures, especially WebKit-1280-wb-earth-after.png.
- P3 APPEARANCE-02: gate/fence timber remains nearly black in the shown lighting. Edges and boards can be distinguished, but grain, weathering and material variation are difficult to read, especially on phone width. Example: chromium-1280-wb-wood-after.png and both 390 wb-wood-after captures. This is an appearance-quality limitation, not evidence of broken navigation or incorrect research classification.
- No P1/P2 identified by this narrow appearance inspection. That does not establish absence of defects in uninspected viewpoints.

## Recommendation and limits
PASS for the narrow claim that prominent repeated texture patterning was reduced without an obvious silhouette regression in these same-camera views. PARTIAL for the broader landscape-realism goal; retain both P3 items. Suggested follow-up: increase restrained low-frequency soil variation and readable wood contrast without reintroducing tiled noise, then repeat these same poses.

These are existing western viewpoints, not the new eight guided inner-castle stations. New station usability/support/visibility, sustained FPS, GPU memory, real Safari/touch/VoiceOver and field correspondence are NOT_TESTED by this artifact. No overall merge recommendation or final browser PASS is inferred from this review. Performance results are separate and were not assessed in this visual-only review.
