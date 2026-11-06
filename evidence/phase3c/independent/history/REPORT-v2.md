# Independent history/geography v2 applicability review

Exact local target HEAD: **c71edbf440ddada2acf0e74501c47afad1772adc**.
Exact target tree: **f49d1348354df2a147609e43558f42ac9c06c498**.
Date: 2026-11-05 UTC. Prior v1 report is preserved unchanged in REPORT.md; it is not current geometry approval.

## Judgment

**PASS for source-claim handling and the checked v2 geographic/model metadata; PARTIAL for historical accuracy. Scoped merge recommendation YES for this history/source review only.** No P1/P2 found in this scope. No independent browser, whole-project release or field-accuracy approval is implied.

The defensive relationship is supported by printed p78 of the city's preservation plan; the particular 13m spacing, height, alignment, opening and bridge are still C design assumptions, not a source-derived reconstruction. The manifest now makes this distinction explicit. Reference dimensions stay UNKNOWN and separate from model dimensions. No tower, unsupported B category or conflation with sc-gate/wb-gate was introduced. Source p102 bridge uncertainty is retained. Rights remain factual summaries/links only, not a municipal open-license claim.

## Independent rechecks

Read the immutable v1→v2 diff of the new manifest and production documentation. Re-ran a separately implemented Python struct-based GLB decoder pinned to the exact v2 Git commit, not to mutable working files. `check-delivery-v2.py` does not import authoring or runtime modules and does not use producer self-test outputs. Results and all checked hashes are in `delivery-check-v2.json`.

- Actual GLB: 7,342 triangles; three unique C IDs; metre/CRS metadata; only surface nodes and no tower nodes. Existing gate IDs are not reused.
- Independently interpolated all three feature anchor heights from raw GLB triangles. Differences from manifest: exactly 0 at stored precision.
- Independently measured lookout centre(-76,-16) to entrance(-77,-29): **13.0384048104m**, replacing 71.007m in v1. The labelled C spacing now allows a compact demonstrative relationship without claiming surveyed adjacency.
- Independently computed longitudinal plane gradients for **296 actual neck triangles** fully contained in N[-31,-27]. Maximum: **0.49761962890625m/m**. Independent centreline samples agree with a steadily graded surface, replacing v1's local abrupt rise. These are model properties, not historical walking capability or accessibility.
- Checked updated wording: p102 restriction specifically concerns **見張台の土塁上** and directs visitors to current site restrictions; it no longer asserts the entire lookout is prohibited.

## V1 findings disposition

- P3-H1: addressed by geometry relocation and explicit role-versus-position evidence scope. Exact archaeological spacing remains UNKNOWN.
- P3-H2: abrupt inherited longitudinal transition corrected in the independently sampled new mesh. Residual limitation: approximately 0.498m/m is still steep. Preserve the explicit absence of walkability/accessibility claims; no military simulation conclusion follows.
- P3-H3: addressed by narrowed source attribution.

P1: none found. P2: none found. P3: no new history/source defect; steepness and unregistered geometry remain disclosed model limitations, not new archaeological findings.

## Exact reviewed bytes (SHA256)

- public/data/phase3c.glb: 810c858a08259b85399530a07faa762da56921613d6c09ef60eaee72f77fbfc4
- public/data/phase3c.json: 17a0e4bf21214248402b850e8878aea790d10a01b0818a113f6302436daa03a9
- production/phase3c/recipe.json: 17a0e4bf21214248402b850e8878aea790d10a01b0818a113f6302436daa03a9
- docs/phase3c-production.md: 87aaacc838141952bae17cb08f6cb9581c111b8a2904ce361506295719f51328

A differently numbered remote commit can inherit this review **only after its tree is independently shown equal to the target tree**, or the exact reviewed files and relevant surrounding source changes are reassessed. Remote publication/tree equality itself was NOT_TESTED by this reviewer.

## Explicit scope limits

Primary-page retrieval/visual confirmation is recorded in source-research.md and unchanged by v2. No new historical-dimension evidence was discovered. Source dates, no control points, unknown archaeological registration and original rights limits remain unchanged.

NOT_TESTED by this reviewer: browser framing and actual visual experience, screen captures, runtime A/C/D restoration, ray/sightline visibility, native authoring reopen, full seam/overlap/section regression, performance, real Safari, VoiceOver and site access/field survey. Producer sightline checks were not treated as this reviewer's independent browser or geometry-visibility approval. The other reviewers retain those gates.
