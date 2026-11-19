# Stage 3-B6k review checklist (not an approval)

- [ ] Fixed GitHub HEAD/tree/parent agrees with the source archive and current PR.
- [ ] `reap_adopted` restricts collection to an observed Z child of this subreaper, verifies PID birth, and excludes direct Popen child.
- [ ] Explicit cleanup deadline uses `hard-audit`, not absolute-clock division.
- [ ] Outer bounded containment is audited separately from the old RED's failing inner result.
- [ ] One actual adopted-zombie control proves wait/reap and direct-child exit preservation.
- [ ] Failure in any of 18 B6j cases leaves an atomically saved status and 18-case ledger with remaining NOT_TESTED.
- [ ] SIGKILL/host termination is not claimed fully recoverable; parent and collector reject incomplete records.
- [ ] Collector rejects missing/extra/duplicate controls, missing stream or raw file, corrupt/missing manifest, partial assertion, false time, residual, and false PASS.
- [ ] Baseline synthetic collector test is explicitly labelled non-production and does not claim formal process success.
- [ ] New-HEAD formal CI and original evidence custody are checked separately and a second execution context rechecks saved originals.
- [ ] All FAIL/UNKNOWN/BLOCKED retained; browser acceptance NOT_ADOPTED, Draft, Stage 3-B HOLD, no merge.

An author-only code inspection is not an independent human review. Mark **INDEPENDENT REVIEW PENDING** without separate execution and verified primary artifacts.

## Handshake-specific independent acceptance checklist
- [ ] Confirm the fixture waits for an observation receipt before exiting/orphaning.
- [ ] Confirm root/child PID, birth and PPID are re-read directly before ACK.
- [ ] Confirm no unsolicited, missing, forged or stale receipt can authorize progression.
- [ ] Confirm the direct Popen child retains its exit code; only pre-observed adopted Z is reaped.
- [ ] Run both inner B6g orphan and outer B6h/B6k live/Z, plus no-request and forged-request/release controls under unchanged deadlines.
- [ ] Verify the formal collector rejects missing or forged handshake raw files and matched case/ledger manifests.
- [ ] Inspect latest original CI logs, new formal ZIPs after owner-approved save and independent byte/SHA/CRC readback; keep UNKNOWN and prior failures.
- [ ] Independent reviewer documents untested areas and HOLD/merge NO separately.
