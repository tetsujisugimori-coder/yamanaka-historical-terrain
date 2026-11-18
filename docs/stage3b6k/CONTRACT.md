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
