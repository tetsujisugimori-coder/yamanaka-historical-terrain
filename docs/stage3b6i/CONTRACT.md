# Stage 3-B6i: overview finite-process and raw-evidence contract

Baseline: B6h GitHub HEAD `8168c3552b820d2da5a666e205e27c55fbd70026` (tree `e8ae785db4e448b78609d8229ae1d374a197a3ec`). Existing Draft PR #55, no merger/deployment.

## The narrowly observed defect
- Overview push run 44171535659, job 134351632766: 726/727 unit cases PASS; the B6g `total` wall test observed 1261.703774ms against the unchanged `totalMs=1100 + 150ms` limit. This records a deadline assertion failure, **not** proof of an orphan, scheduler pause or cleanup defect.
- The old overview artifact 14366514526 contains only identity/OS/oracle entries. No finite-process runtime originals were archived. Cause and descendant status for that run remain UNKNOWN.

## B6i acceptance rules
1. Never rewrite the historical failed run or its ZIP. Do not reuse B6h dedicated-job PASS as overview PASS.
2. Keep individual 45s, total 180s, outer fixture 6s and the existing `totalMs+150ms` assertion. Do not increase its tolerance to make CI green.
3. Save a separate timing diagnostic before the assertion. Include external wall, watchdog elapsed/status/audit, inner supervisor elapsed/status/audit when available, and `rootCause=UNKNOWN` on overflow. An observed window overflow is FAIL even if the eventual cleanup succeeds; absence of a diagnostic is INCOMPLETE.
4. In overview, retain unit stdout and exit status in the artifact. Run the B6h collector under `always()` **after unit and before browser**, without error masking. If raw evidence is incomplete, collector must exit nonzero so browser cannot run by default-success.
5. Seal root manifest after the browser step under `always()`, and upload under `always()` including hidden entries. Upload success is neither unit PASS nor process PASS.
6. The `stage3b6h-artifacts.py` contract requires six B6g cases and fourteen B6h cases; missing, corrupt, extra, or inconsistent evidence must not be silently accepted. A mid-suite failure may produce a partial `assertions.json` and must yield collection INCOMPLETE, retaining the original failure.
7. This B6i unifies the **overview** and dedicated-workflow collection contract only. Other non-dedicated workflows are not automatically attested. No product geometry, original source data, caches, browser acceptance, or 304 predicate changes.

## Review and final gates
A distinct reviewer must inspect the actual changed Git blobs, rerun at least the static contract tests, challenge missing/partial assertion, corrupted ledger, collect failure and step ordering, and distinguish timing observation from proven cause. Do not claim independent PASS from the author's own check. After a permitted automatic run, independently preserve raw ZIP(s), then reread and check all bytes/SHA/CRC/manifest where present. If that is unavailable, stay PARTIAL/BLOCKED. Draft, Stage 3-B HOLD, formal browser FAIL, NOT_ADOPTED 304, and merge NO remain until separately rejudged.
