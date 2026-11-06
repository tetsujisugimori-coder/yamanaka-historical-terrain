# Static visual-review applicability: 47b8a80

Reviewed local HEAD `47b8a80d2f7f08a50a0e0cfe9b4d89d7b2d07700`, tree `5e44d4b1a310a45c9de1176939c6c60fb16b76d1`.

## Changes since reviewed 05a0df3
- src/phase3b.js now enables vertex colors only when the geometry has a color attribute. This addresses the specific black-patch cause identified in VISUAL-03.
- src/main.js avoids redundant ready-state resynchronization for camera intents and a second render on ordinary arrow navigation. This affects interaction/performance pathways and requires fresh browser evidence.
- src/phase3c.js, src/reading.js and src/style.css have no diff against that earlier reviewed candidate.

Older A/D artifact source-equivalence was valid for 05a0df3, not an exact-source claim for this candidate. Its findings remain historical evidence; fresh current-state isolation and interaction tests are needed. The old 24-image western-view appearance comparison remains useful for the specific texture-repeat improvement, but its recorded main/phase3b hashes no longer exactly match. It cannot close the black-patch P2 or certify final visuals.

## Independent oracle/negative validation
Static check found exactly one mutation anchor and verified that replacing it changes the fixed code back to the old vertexColors=true line. No product code was edited. Browser script syntax check passed.

The oracle directly inspects each visible mesh's actual material.vertexColors and geometry color/position attribute counts; it does not ask the product whether the material is valid. Missing or truncated vertex colors are rejected. The old defect is reinserted only into the material enabling line, not into the oracle. Normal mode preserves 16 matrix cases plus 6 fault cases. Negative mode runs Chromium/WebKit at 390/reduce only, writes separately, and requires exactly two failures containing the dedicated VERTEX_COLOR_WITHOUT_ATTRIBUTE signature. Timeouts, launch failure, missing mutation anchor, or unrelated errors cannot count as EXPECTED_REJECTION.

Limitations: the oracle does not validate every possible color attribute format/value defect or MultiMaterial configuration. Current target meshes use single materials, so these limitations do not weaken detection of this specific missing-COLOR_0 failure. Normal scripted screenshots are C-only at guided points; corrected C+D patch appearance must also be checked from supplied author/performance screenshots.

## Current disposition
P2 VISUAL-03 remains OPEN pending actual fixed candidate runtime results, expected negative rejection, and corrected C+D screenshots. New low-view screenshots remain NOT_TESTED until supplied. No local browser retry, product edit, Git mutation, screenshot copy into Git, or external publication was performed. Final visual recommendation remains NO pending these checks.
