# Phase3F: reconciling preserved evidence with a new C geometry generation

The first submitted HEAD `b8e3c81f8feb8f940c5d0fbdffac238f8f3cbd11` passed its new physical-terrain CI matrix (16 conditions) and independent raw-mesh review. That did **not** make all regression workflows pass. The failures below remain preserved in their original GitHub Actions artifacts and in the Phase3F evidence archive. They are not relabeled as successful tests.

## Old and new C must have separate oracles

In run 42376113267, `review-fixes` failed four restored-rampart cases: preserved metadata height 577.6500244140625m was compared directly with the new C mesh height 577.800048828125m. Actual camera targets agreed exactly with the new mesh at both scales and both engines. The metadata remains immutable and is now checked against its own original `nishinomaru.glb`; the displayed camera remains checked independently against `phase3f.glb` with the unchanged tolerances.

The same run's `fixed-sections` job failed 12 label cases because it required a new C section to equal the old submission's C profile. The replacement assertions keep exact equality of the A profile, verify the original C profile against the original GLB, and verify the new C profile against the independently decoded new GLB. Coverage, labels, keyboard focus, exaggeration invariance and overflow assertions remain. A new numerical test explicitly rejects cross-generation matches and corrupted heights, rather than weakening an epsilon or accepting arbitrary change.

## Distinguish metadata rejection from missing physical support

Run 42376113189's `inner-observation` and legacy `independent-visual` jobs completed their ordinary 16 conditions, but each timed out on two missing-support fault cases. Changing only the old metadata eye coordinate now triggers the new metadata-consistency guard *before* optional terrain loading. The old test incorrectly waited for loaded=true.

The missing-support fault now changes the matching eye in both metadata generations, so it reaches the real no-surface guard. The camera and target must not move. A separate mismatch case changes only one generation and verifies explicit rejection, no optional geometry, unchanged camera/target and continued use of the existing terrain. Product guards and timeouts are not relaxed.

## Scope

These follow-up changes affect regression checkers, their negative controls and explanatory metadata only. They do not alter product JS, mesh bytes, native masters, dependencies or historical evidence. The overly broad `topology and XY unchanged` prose is corrected in the generation recipe and both output metadata files: Nishinomaru topology is retained; the inner earthbridge has conforming local subdivision; old outside-region geometry and edit-boundary vertices remain exact.

Final-HEAD tests and CI must be run again. Old-HEAD successes cannot substitute for the final-HEAD gate, and historical failures remain part of the record.

## Independent checker defect found during re-review
The reviewer reproduced an actual false success in the common section oracle: NaN or Infinity in a segment could return normally with maxError=NaN because JavaScript comparisons did not reject it. The shared verifier now rejects non-finite profile dimensions, coordinates, segment endpoints/heights and oracle output, zero/reversed spans and empty results. The 1mm tolerance is unchanged. A same-input RED/GREEN record and grouped negative tests preserve this finding; it was a verifier defect, not a proven product terrain failure.
