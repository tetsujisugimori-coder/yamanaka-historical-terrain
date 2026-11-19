# B6k test-only parent/child ownership handshake

## Scope and failure baseline
This implements only the five requested test-fixture steps for Stage 3-B6k, on the existing Draft PR #55 branch. The starting HEAD is `35ec9eb02fad30acdb97556bb36ec2830fa13624`, tree `0466c81bfd4957e4532fc963fae52e7bf398865a`. Historic B6k formal 19-run result remains **6 success / 13 failure**, finite-process FAIL, external-audit P2 OPEN and merge NO. Old recorded failures and Library originals are immutable. No claim of root-cause confirmation is made.

## The five steps
1. **Spawn**. The known test-only fixture (not the product runtime) launches a controlled descendant with its own Popen and obtains its actual `/proc/PID/stat` birth and PPID. It writes a request atomically. The fixture parent remains alive until release.
2. **Observe**. The responsible Python supervisor or outer watchdog scans the actual process lineage and checks both PID and start-time birth, `root.ppid == supervisor.pid` and `child.ppid == root.pid`, then rechecks both birth/PPID fields directly from `/proc`. No PID-only inference, no family guessing from unknown adopted processes.
3. **Acknowledge**. Only on verified observation is a test-only `ownership-release.json` saved atomically and read back. The receipt contains the observed root and child PID, birth and PPID. The fixture verifies the exact receipt before proceeding. An unknown/missing/invalid request, stale receipt or unobserved lineage never releases it.
4. **Controlled fault**. The fixture deliberately exits its parent (or leaves a known zombie) *only after* the verified release, allowing the established subprocess ownership to be audited. Without release the fixture exits nonzero and attempts to clean up its own known child. No unrelated PID is signalled.
5. **Finite cleanup**. Existing `Popen.poll()/wait()`, known descendant kill/reap, Z-state verification and audit apply under unchanged original budgets: default outer 6 seconds, controlled B6g 1800ms individual/4000ms total, framework 45 seconds/180 seconds, 150ms external acceptance tolerance, and original short test fixture budgets 0.3/0.5 seconds. Unknown or incomplete ownership never becomes PASS.

## Evidence and negative controls
- The inner process result/ledger records `ownershipHandshake` and the child raw request/release files; the outer watchdog records the same and its final readback receipt.
- The case evaluator and formal collector verify exact correspondence of request, release, PIDs and birth IDs, including the descendant PID, without trying to retroactively prove a past run.
- Negative tests include missing request, forged request, unexpected pre-existing receipt, missing release and forged release/manifest; these are rejected, not converted to expected-success.
- A raw receipt confirms only a named saved file and its checksum, not an OS guarantee, complete artifact, or long-term external retention. Uninterruptible I/O, host suspension, CI cancellation or storage loss remain outside the finite user-space guarantee.
- A controlled harness PASS does not override an old formal FAIL, authorize a rerun, relax the original timeout, or certify browser acceptance. Separate HEAD-specific CI, original artifact preservation and independent review remain mandatory.

## Governance
Keep Stage 3-B HOLD, Draft, 304 alternative NOT_ADOPTED and merge/publication NO. Do not edit products, historic geography, datasets, dependencies, browsers, CI workflow, or old originals. Preserve failed-case bytes and any incomplete collection records. Human independent review remains NOT_TESTED until demonstrably performed.
