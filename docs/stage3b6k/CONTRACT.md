# Stage 3-B6k: bounded fault controls and evidence-complete collection

## Scope
Existing Draft PR #55 only. The fixed B6j parent is `f6be90f4a27452375041bf7e4f7ebc35c5cd4e1b`. No browser/runtime/cache/304 acceptance changes, no relaxed budgets, no main write, no merge/publication/retry. Stage 3-B HOLD remains.

## Process ownership and time
The Linux test supervisor retains a subreaper and verifies each descendant's PID, process start identity (birth), parent and zombie state before any wait or signal. The parent `Popen.poll()/wait()` alone collects its direct child. An adopted, immediate, known `Z` child can be collected with `waitpid(pid, WNOHANG)`; a zombie is not killed with another signal. Never use `waitpid(-1)` to steal `Popen`'s exit status. Process group and root ownership are bounded; foreign PID/reused PID, uninterruptible kernel I/O, CI runner termination and host suspension remain outside guarantees.

The former `hard-audit/2` loop compared two *absolute monotonic clock values* with the wrong scale. Cleanup now uses `hard-audit`. Outer watchdog reaps the descendants that are adopted only after the inner supervisor exits, and records outer `exitCode`, `auditStatus`, `residual`, `cleanupFailure`, `reapedAdopted`. An outer PASS does **not** promote the old inner RED audit: old over-budget and inner Z/audit failures remain in their original raw records. If outer containment fails, the control remains FAIL.

The existing individual 45s / total 180s process limits, six-second outer bound, controlled 1800ms trial limit and wall `totalMs+150ms` check are not enlarged. These are user-space *measured* limits, not absolute limits across host/OS suspension.

## Per-case ledger
B6j has **18** explicitly named controls. Before the first control, `assertions.json` contains exactly 18 NOT_TESTED entries. Before each control, its state becomes RUNNING. The child process atomically writes PASS, FAIL, or INCOMPLETE before proceeding; on Python exceptions, the active row is FAIL (assert) or INCOMPLETE (other exception) while future rows remain NOT_TESTED. The JavaScript parent preserves `assertions-child-original.json`, converts any interrupted RUNNING to INCOMPLETE and records its own `execution.json` even on non-zero/timeout. Files are sealed only *after* the parent records, so a test failure never fabricates a completed PASS.

The additional adopted-zombie control creates a known child, observes its zombie identity and direct parent adoption, reaps that child by verified PID, and confirms a different direct child's original nonzero exit code remains available to `Popen.wait()`. It is fault-only Linux test code, not historical proof.

## Collector and acceptance
The always-run collector explicitly requires exactly one `b6j-controls/run-*` directory, 18 unique declared case identities, 18 PASS verdicts, an exit-zero parent, required streams, raw old/new summaries and outer audits, and an independently checked exact manifest of paths, bytes and SHA-256. It rejects missing/partial/corrupt evidence, duplicate cases, old baseline promotion, forged timing, residual/cleanup failure and altered manifest. The older six/fourteen suites cannot substitute for B6j.

Inability to save the raw record, job/host cancellation before always-steps, and storage/network failure are INCOMPLETE/BLOCKED, not PASS. Manifest consistency does not establish historical test success, browser acceptance or original source coverage.

## Governance
The central preservation policy v0.2.0 governs classification, authorization, immutable old evidence, one-year intended retention on approved owner-only destination, separate-session direct re-fetch and byte/SHA/CRC verification. Manifest-free old ZIP coverage remains UNKNOWN. Actual external preservation and independent human review must be reported separately from code-level and CI checks. Draft and merge-NO remain until explicitly re-adjudicated.

## Follow-up: eight independent evidence states

The local follow-up to fixed `29eb183726e6649b62495c573e19bd32f8f33abe` records `evidenceStates` for (1) deadline detection, (2) direct-child exit-code observation, (3) direct-child reaping by Popen, (4) any observed Z, (5) adopted-Z reaping or observed-not-reaped, (6) live descendants remaining, (7) audit errors and (8) final-record save verification. These are observations, not eight process PASS verdicts. Missing scans remain UNKNOWN; a clean final scan does not erase an earlier audit error. Z observations are retained before reaping. Initial failure, cleanup failure and evidence-write failure remain separate.

Root ownership is now a birth-identity set learned under the designated worker, not all children of the supervising Python process. Only a previously observed descendant that is now an immediate, birth-matching Z child is reaped; unrelated Popen children are never consumed. An unattributed direct child produces UNKNOWN and is not signalled. Fast orphaning before ownership can be observed is a limitation, not a success. Controlled orphan fixtures keep their parent alive briefly or use a release handshake to establish ownership, without changing deadlines.

Final raw records contain `PENDING_RECEIPT` for the eighth state, avoiding circular self-certification. A separate `*-evidence-receipt.json` records the actual saved source filename, nonempty raw byte size and SHA after readback. The collector requires the receipt and rechecks source/size/SHA. The receipt proves only its named final JSON, not log completeness, a whole manifest, external storage or process success. Write/readback failure is INCOMPLETE and cannot become a save PASS.

B6h's 14 controls now have a preinitialized `execution-cases.json`: active cases are RUNNING, assertion exceptions FAIL, other exceptions INCOMPLETE and later cases NOT_TESTED. Complete available supervisor/outer observations are saved before assertions. The eight-axis supplemental controls are synthetic/controlled local processes, not browser acceptance or reconstruction of the historical failure.

## Test-only ownership handshake follow-up
See [HANDSHAKE.md](HANDSHAKE.md). The fixture must remain blocked until the observer verifies PID/birth/PPID for both direct parent and child, then writes and reads a non-forgeable-to-the-fixture acknowledgment. Invalid/missing evidence remains FAIL/INCOMPLETE, not an owned child. No deadline change.
