# Stage 3-B6i: investigation and implementation log

Base: `8168c3552b820d2da5a666e205e27c55fbd70026`, Draft PR #55.

## Historic observations
- B6h overview job `134351632766` failed with `AssertionError: ('total', 1261.703773999983)` at `tests/stage3b6g-supervisor.py` line 57; 727 total, 726 PASS, 1 FAIL. The preceding successful cases did not establish total-case root cause.
- Workflow used a bare unit step and uploaded only three overview entries. There was no `.work/stage3b6g` collector in the overview workflow. The missing original runtime record cannot be reconstructed from the log.
- This is distinct from the B6g 6-second TimeoutExpired. Keep both failures and their provenance separate.

## Changes prepared in B6i
- Overview: persist unit.log/exit-codes, always collect with the existing B6h collector prior to browser, always seal manifest, always upload with hidden entries included.
- B6g test: new per-mode `*-timing-observation.json` captured before wall-window assertion. On window overflow, an explicit FAIL entry is written to partial assertions before raising. The 150ms requirement and process safety limits remain untouched.
- New static contract tests prevent collecting after browser, silent error masking, incorrect manifest/upload order, and deletion of the original time predicate.

## Status
Author-side source checks are not independent review. B6i automatic CI, live browser acceptance, and new artifact preservation must be reported against the *new* submitted HEAD rather than inherited from B6h. Until verified, status PARTIAL; independence NOT_TESTED; merge NO. Old evidence is read-only and not rewritten.
