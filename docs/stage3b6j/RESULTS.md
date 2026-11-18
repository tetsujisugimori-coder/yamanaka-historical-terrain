# Stage 3-B6j: evidence-first finite-process repair

## Scope and fixed inputs
Draft PR #55, branch `feat/stage3b6-comparison`; starting HEAD `8b0abbd7038be062aa43c8aeff40edc25b9ad203`, tree `6d9a6cb51265967d16afe8b2e410ae57f94a3295`, parent `8168c3552b820d2da5a666e205e27c55fbd70026`.
Changes are finite-process signaling, harness records and collection contracts only. Browser root-cause fixes, deployment, merge, protected geography and threshold changes are excluded.

## F1: historic observation versus controlled mechanism
Direct GitHub job log `134396960583` (run `44184412610`) shows close budget1800ms, elapsed1829.093ms, withinBudget=false, residual=[], auditStatus=PASS. Events: deadline1125.564; cleanup1623.322; SIGTERM1781.564; kill1816.261; audit1828.910ms. Residual zero does not establish deadline success.
Original artifact `14375076761`:107528bytes, SHA-256 `f8e6dfa042247f01521afb97d9e483ef479cb435f38a424ec097cbc4335087fd`,31 CRC entries,manifest30 exact set/size/SHA; nested ZIP9 CRC. It contains no finite-process runtime/assertion files. Job-log rows are not missing original files.
Static source places synchronous checkpoint writes/fsync between deadline detection and signal delivery. The historic gaps include these writes, process enumeration and scheduling; individual I/O duration was not recorded. Historic root cause remains UNKNOWN.
Controlled delayed-checkpoint RED/GREEN uses the original fixed source and new source with the same injected delay and same1800ms budget. It tests removal of that avoidable pre-signal persistence dependency, not reproduction or proof of the historic root cause. Timing records distinguish operation, cleanup, signals, audit and record finalization. Host/kernel stalls cannot be universally bounded by user-space code.

## F2: recording before verdict
All six cases start as NOT_TESTED. A case becomes RUNNING before launch; result/timing/assertions are saved before a failing verdict raises. Missing/corrupt evidence is INCOMPLETE; failed time/cleanup/exit predicates are FAIL. Later cases remain NOT_TESTED. First failure and cleanup failure are separate; rootCause stays UNKNOWN.
Actual-harness predicate mutation compares old and new record behavior. Synthetic records cover time budget, external window, watchdog failure, missing/corrupt ledger, cleanup, streams, residual and direct-child exit. Collector controls cover absent/partial/corrupt root assertions, missing per-case assertion/timing and a forged PASS paired with an exceeded budget. Synthetic upload failure is not an actual GitHub upload test.
The unchanged six-second outer bound,45-second trial cap,180-second total cap and totalMs+150ms acceptance window remain. Inner withinBudget excludes final result/ledger writes; external wall includes supervisor finalization. Completed write timings are appended after each write; a final ledger cannot include its own completed write duration.

## F3 and status
Browser failures and Stage3-B HOLD remain. Local/fault-control success is not formal CI success or browser acceptance. New-head formal CI and preservation are initially NOT_TESTED, independent review pending. Overall PARTIAL; B6j limited technical acceptance not yet established; merge NO. Final exact-version results belong in the PR report after CI and custody checks, not a result-only push.

## Local revision record
Initial local full suite731/731 and build passed. Independent review found P2 contract weaknesses: timing booleans were trusted without numerical validation; cleanup failure and empty ledger were not safely classified; the exception path still persisted before termination. Corrections recompute finite numerical windows (reject bool,NaN,negative and overflow), reject cleanup failures, retain INCOMPLETE collection reports for malformed ledgers, and defer exception checkpoint persistence until signal/audit. The same independent counterexamples were replayed and closed. These controls are now permanent regressions; no previous failed evidence was overwritten. A second full suite731/731 passed; the final added exception-order regression passed focused validation. Final independent byte identity and formal results remain separate submission gates.

The RED baselines are exact source snapshots from starting HEAD, stored as two SHA-256-pinned text fixtures under tests/fixtures/stage3b6j. They are source, not historic runtime evidence. This avoids requiring old Git objects in shallow CI checkouts; workflow/deployment settings remain unchanged.
