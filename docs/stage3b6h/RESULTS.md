# Stage 3-B6h — pre-submission evidence

Status: PARTIAL / independent safety review limited PASS / new formal CI NOT_TESTED / merge NO.

## Changes
- Inner supervisor: checkpoint/final JSON write+validate+atomic replace, separate firstFailure/cleanupFailure, explicit PID birth snapshots and audit failures, finalization on operation errors.
- Outer watchdog: fixed six-second wait, TimeoutExpired capture, actual byte logs saved throughout execution, finite owned-descendant cleanup and separate child/descendant audit.
- Worker: atomic result checkpoints, initial failure retained across close failure, fixed-category stderr fallback if recording fails. A later successful write cannot erase record failure.
- Node harness: outer stdout/stderr/status persists even on timeout/error.
- Artifact collection: `.work/stage3b6g` copied in always-run step; required evidence checked separately from test result. Manifest sealing/verification and upload are independently always-run. Upload never promotes FAIL.

## Tests performed during implementation
The old six-mode process controls passed locally. New failure controls exercise missing/malformed worker result, forced kill, final record failure, stdout creation failure, audit incompleteness, actual TimeoutExpired partial non-ASCII/no output and outer timeout cleanup. Actual worker control flow with a synthetic runtime separately verifies initial operation failure plus close failure; no real browser launches in this test.

Injected stalled-supervisor comparison uses the same six-second fault against the fixed old harness and new watchdog: old TimeoutExpired fails before saving partial bytes; new watchdog records timeout and partial bytes and audits cleanup. This is evidence-contract RED→GREEN, not reproduction or resolution of the old CI root cause; the timed-out trial remains failed.

Intermediate history: initial full suite lacked installed dependencies and failed; offline npm cache unavailable. Ordinary locked npm ci then succeeded without changing dependency/lock. Full suite726/726, build, generated verification and protected212 originals/22 models/230 paths passed before the final added worker-close case. A later synthetic worker test initially expected the wrong error code; actual checkpoint was OPERATION_FAILED, assertion was corrected to the actual fixed code and rerun. Final exact-version totals are reported separately after independent review.

## Limits
Previous formal finite-process gateFAIL/browser acceptanceFAIL remain. Some old artifacts have no manifest and cannot establish complete coverage. Process enumeration or record failure is never normal success. Host/kernel halt can prevent both recording and upload. Same-system independent AI review is not organizational independence.

## Final local pre-submission gate
- Final full Node suite727/727 PASS, fail0/skip0. Independent focused8/8 PASS.
- Six established process controls plus14 recording/outer/worker controls. Artifact collection adds normal/missing/changed/extra/manifest/generation controls and the same independent missing5/exit-mismatch regressions. These are controlled synthetic evidence tests, not browser acceptance.
- Independent P2 findings: outer orphan detection disappeared after successful cleanup; missing required B6h raw files accepted by collector; outer supervisor nonzero exit not checked. All three were corrected and the same counterexamples independently replayed. Outer pre-cleanup snapshot and OUTER_CHILD_RESIDUAL now persist; required raw file/content/exit checks are explicit. New P1/P2 remaining:0 within reviewed source scope.
- Current GitHub confirms old dedicated jobs/artifact metadata. Four existing local dedicated originals were CRC/manifest/set/size/SHA revalidated against current official metadata. All four contain no `.work/stage3b6g` entries. Existing local `.work` results are local trials, not the lost official execution. The completed hosted-runner files not uploaded have no accessible retained recovery source: NOT_RECOVERABLE within surveyed artifacts, existence elsewhere UNKNOWN. No original record was recreated.
- Pre-submit evidence safety gate is limited PASS. New formal CI: NOT_TESTED. New formal raw-artifact retrieval: NOT_TESTED. This session’s independent Library readback of old priority artifact14321924744: limited PASS (744571 bytes, full bytes/SHA/CRC344/manifest343 match); new formal artifact readback: NOT_TESTED. Old formal finite-processFAIL and browserFAIL remain historical facts and are not replaced by this local PASS.

Pre-push ordering correction: collection/required-record validation now runs before the unchanged default-success browser step. A failed collection therefore blocks browser while always-run sealing/upload remain reachable. The old ordering allowed this validation only after browser; a static order counterexample rejects that layout. This additional correction is not evidence that old CI encountered this path.
