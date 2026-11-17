# Stage 3-B6h — failure evidence and finite-process safety

This implementation plan is recorded during work, not a preregistered experiment.
Start: `16e26b3381763269dfc9d2360670b57726db996d`, tree `c2f1b07f938535d91acd0f94ec3d2d31b4a4a1a9`, branch `feat/stage3b6-comparison`, Draft PR55.

## Existing failure
Push run44071325311 / job133998000707 timed out in the first normal non-browser process fixture at the outer Python six-second communication boundary. The following five fixtures and browser step were not reached. Exact phase, descendants and root cause are UNKNOWN. Recovery from a completed runner's discarded `.work` cannot be assumed. Existing FAIL is immutable history.

## Scope and flow
Previously the outer `subprocess.run(capture_output=True, timeout=6)` threw before stdout/stderr and assertions were saved. The workflow archived EVIDENCE_DIR, not `.work/stage3b6g`. The inner supervisor only finalized ledger after trials and directly wrote JSON. B6h retains the same individual45s / total180s upper bounds and six-second fixture deadline. It adds atomic checkpoint/result writes, failure categories for record/audit errors, separate direct-child and descendant status, and a bounded outer watchdog with file-backed byte streams. Controlled process subreaper cleanup is not a hostile-code sandbox, hard realtime guarantee, or host-failure guarantee.

## Gates
1. Recover existing evidence read-only, distinguish GitHub/Library/workspace provenance and missing vs unavailable.
2. Implement exception-safe recording and always-run collection; do not relax browser/cache/product predicates.
3. Normal and injected timeout/cleanup/kill/detached/missing/corrupt/output/manifest/collection controls; preserve old failure and RED→GREEN records.
4. Independent source/record review must resolve new P1/P2 before push or real-browser execution.
5. Only then normal commit/push to existing branch. Existing automatic CI only, no dispatch/retry or result-only push.
6. Preserve original artifacts; separate storage integrity, record completeness, process safety and browser acceptance.

Stage3-B HOLD,304 NOT_ADOPTED,production used bytes UNKNOWN,404 diagnosis incomplete,11 unplaced regions/zero candidates/geometry=null/EPSG:6676 remain. Draft maintained; no merge/deploy.
