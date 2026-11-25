# B6h independent local safety review

Decision: limited PASS for the 11 code/workflow/test files fixed in reviewed-files.json. No remaining observed P1/P2 in the non-browser finite-process/evidence scope. This is not official CI, browser acceptance, or merge approval. Documentation is excluded from this byte-fixed decision.

Separate AI worker from implementation, same platform/shared workspace/inherited context. Independent reviewer execution, not an independently isolated organization or machine.

## Findings
- P2-1 CLOSED: outer watchdog previously hid a detached child after parent exit 0. Same live fixture now retains OUTER_CHILD_RESIDUAL and preCleanupSnapshot, separately successful cleanup and empty residuals. Evidence outer-orphan.json / outer-orphan-fixed.json; replay.py retains fixture.
- P2-2 CLOSED: collector accepted missing partial timeout bytes, first B6h checkpoint, worker stdout/stderr. Same deletion counterexample now INCOMPLETE, unchanged 14-case suite baseline PASS. Evidence missing-records.json / missing-records-fixed.json.
- P2-3 CLOSED: normal/non-normal outer exits were unchecked. Harness and collector now require normal 0 / fault 1. Changing normal exit only to 7 is rejected. Original finding was static, not an executed pre-fix RED. Evidence exit-mismatch-fixed.json.

## Final replay
Command: node --test tests/stage3b6g.test.mjs tests/stage3b6h-records.test.mjs tests/stage3b6h-artifacts.test.mjs
Exit 0; 8 tests PASS; 0 fail/cancel/skip. Raw stdout/stderr/exit: replay-final8.*. Includes six original process controls, fourteen recording/outer cases, manifest and always-collection checks, and persisted collection regression normal plus five missing-record faults and exit mismatch. Synthetic collection fixtures are labeled, not process-execution evidence. git diff --check passed.

No source edits, push, real browser, workflow dispatch, merge or Draft release by reviewer.

## Limits
Linux controlled-descendant fixture mechanism, not hostile-process sandbox. Process creation stalls and host/job loss are not universally bounded or recoverable by always upload. Collection PASS is completeness under declared contract, not process/browser success. Preserve prior official finite-process FAIL, browser FAIL, cause UNKNOWN and Stage 3-B HOLD. Final documentation, delivered preservation and official CI remain separate gates.
## Additional pre-push ordering review
P2-4 CLOSED in static/non-browser scope: required-record collection previously ran after browser. Collection now precedes the unchanged default-success browser step; nonzero collector failure blocks browser and always sealing/upload remain. The same order predicate rejects the prior sequence and accepts the new sequence. Workflow change is only movement of that collection block. Focused eight tests independently rerun:8 PASS,exit0,no skipped tests. This does not establish formal CI/browser success or resolve old failure cause. Exact revised11 code/workflow/test bytes are fixed in reviewed-files-rev2.json. Reviewer acknowledges prior review missed this ordering defect; prior limited decisions are superseded for changed files.
