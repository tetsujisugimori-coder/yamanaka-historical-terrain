# Independent history/geography delivery review

Target commit: **573dc70e90fb58f38271b1eff08efe4179ee3ccb**.
Reviewer: separate history/geography agent, not the production author.
Date: 2026-11-05 UTC.

## Judgment

**PARTIAL** for historical/geographic accuracy, as intended for a C candidate. **YES, narrowly scoped to the change's historical-claim and source-handling review**: no P1/P2 found in those claims. This is not whole-project merge approval, browser approval, verified visitor walkability, or archaeological reconstruction approval. Technical/browser reviewer findings and final CI remain independent gates.

## Actual independent checks

1. Read the complete task, repository AGENTS.md, existing source ledger, Phase2A/3B documentation, the new phase3c manifest and production documentation.
2. Independently retrieved the city's preservation plan, extracted its text and visually inspected printed p78/PDF86 and p102/PDF110. Printed p66 and p68 were text-inspected; the colophon gives 2023-03-10. City 1301 survey history and city copyright terms were independently opened. Evidence and precise source limits are in `source-research.md`. Primary material is not redistributed.
3. `check-delivery.py` reads immutable Git blobs from the exact target commit, independently decodes GLB JSON/binary accessors using Python struct, converts glTF E/up/south to E/N/height, enumerates actual triangles and independently interpolates anchor heights. It imports no authoring/runtime module and does not rely on producer assertions. Results are in `delivery-check.json`.
4. Delivered GLB has 7,342 triangles, three distinct IDs (`ic-lookout`, `ic-bridge`, `ic-koguchi`), seven surface nodes, C metadata, EPSG:6676 and 1m/unit metadata, no node transforms and no tower node. Old `sc-gate`/`wb-gate` IDs are not reused. Global bounds E[-100,-68], N[-45,50] match the manifest. All three manifest anchor heights match independently sampled triangles exactly at stored precision.
5. Source-reference dimensions remain UNKNOWN and separate from explicit model parameters. The 12×16m lookout footprint is a local shaping parameter, not the full ID partition bounds (32×35m). Likewise bridge/entrance partition bounds include surrounding connecting surfaces. Neither is treated here as a surveyed footprint.
6. Manifest and documentation keep control points at zero and residual/position unknown. Modern A terrain is not promoted to a historical surface; new shape is C and appearances are separately labeled D. No B declaration or historical building claim was found. Rights explicitly distinguish municipal source material from original model/code, with no copied source PDF/image found among these new source artifacts.

## Source claim assessment

- City 1301 supports named investigation areas and general earthen bridges, not model coordinates/dimensions. Investigation dates are not construction dates; manifest correctly retains uncertainty.
- Plan p78 supports lookout entrance and western defensive-forecourt relationship. Plan p102 supports uncertainty of a wood-bridge or similar connection because pier evidence was not detected. The new manifest's caveat correctly prevents generic earth-bridge evidence from authenticating its chosen centreline.
- An elevated small enclosure is not evidence of a tower. None was added.
- New entrance is explicitly distinct from the existing crown-beam gate and western entrance. Nishiyagura's southeast-corner opening has not been asserted as proof of this entrance orientation.
- Current access restrictions are not overridden by virtual views. One wording nuance remains below.

## Findings

P1: none found within reviewed scope.

P2: none found within reviewed scope.

P3-H1 — **Demonstration of relative facility placement remains limited.** Independently measured lookout/entrance anchor separation is 71.007m, with the entrance approximately 71m south of the lookout. Primary p78 supports an entrance at the west-end lookout, but provides no georeferenced distance. The model explicitly labels positions schematic, so this is not a false surveyed-position claim; nonetheless its layout should not be used as spatial evidence for the primary source relationship. Prefer an explicit visitor-facing statement that the lookout–entrance distance/adjacency is schematic. No claim that 71m is historically false is made.

P3-H2 — **Bridge candidate must remain an observation example, not a route model.** Independent centreline samples rise from 557.205m at E=-88 to 569.832m at E=-82 (N=-35), approximately 12.63m in 6m horizontally. Existing warnings and instant observation relocation correctly prevent historical walkability claims; a 6m clear neck is a lateral model parameter, not evidence of a passable longitudinal route. Preserve this limitation in visitor explanation and future simulation reuse.

P3-H3 — **Access wording precision.** The plan p102 says the earthwork top is prohibited to enter. The manifest paraphrase broadens this to lookout-top/earthwork. This is conservative for visitors, not an authorization error, but future wording should attribute the restriction specifically to the earthwork top described in the 2023 plan rather than assert a newly verified blanket current prohibition.

## UNKNOWN / NOT_TESTED

- UNKNOWN: archaeological coordinates, plan-to-DEM control points and residuals, historical shape dates, absolute historical heights, exact bridge form and centreline, facility dimensions and surface/architecture materials.
- NOT_TESTED by this reviewer: field survey, current park access on the ground, measured visibility to landscape landmarks, browser images/interactions, A/D runtime material-state restoration, native Blender/QGIS reopen, comprehensive seam/overlap geometry, fixed-section regression, performance, real Safari and VoiceOver. Other reviewers may test these; their reports are not substituted for this agent's independent checks.
- This reviewer did not independently reconstruct the 12×16m shaping kernel or verify every maximum cut/addition parameter. Raw bounds, IDs, categories, anchor support and centreline samples were checked directly.

## Reassessment rule

The script deliberately pins the reviewed commit. Any change to source claims, manifest, GLB or positioning requires reassessment; this report does not automatically apply to a later HEAD. Documentation-only or evidence-only additions may be assessed by a recorded diff check.
