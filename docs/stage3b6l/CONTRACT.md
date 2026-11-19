# Stage 3-B6l: bounded total evidence and separated 404/304 observations

## Scope
Existing Draft PR #55 only, existing branch only, no merge, no production deployment. Keep Stage 3-B HOLD, 304 alternative NOT_ADOPTED, 1250ms strict external window (totalMs=1100 plus the pre-existing 150ms tolerance), and existing process supervision and timeout budgets unchanged. The 38 prior Library ZIPs are immutable and do not require duplication.

## Total timing observation
The B6g total case writes total-phase-observation.json from a try/finally around the existing watchdog, regardless of success or exception. It records UTC Unix-nanosecond and monotonic-nanosecond start/end clocks, strict comparison result, watchdog PID/exit/cleanup/audit/residual/owned reaps, corresponding inner process fields, inner event-to-event intervals and ledger record-write intervals. Missing ledger, unavailable PID or other observations remain null/INCOMPLETE; neither synthetic success nor the new timing record changes the pre-existing assertions. The external window is strictly less than 1250ms, not less-than-or-equal. A monotonic elapsed time and inner/watcher timing come from distinct scopes and must not be subtracted as if they shared a clock origin. Root cause stays UNKNOWN until correlated original raw records support it.

## Independent synthetic transport diagnostic
A separate fixed two-case synthetic loopback probe executes a second-phase 404 with a response body and a revalidated 304 with no response body. It records request close/abort, response finish/close/error, socket identity/connection/close/error, clientError, server-chosen entity, request/response IDs and Playwright completion and body capture. Server finish does not prove browser delivery; Playwright captured bytes do not prove cache-used bytes. Actual browser-used 304 cache bytes remain UNKNOWN unless independently established. 404 and 304 are not interchangeable, and diagnosis does not modify product delivery or the 304 acceptance contract.

## Counterexamples, CI and evidence
Synthetic normal, timeout, cleanup-failure, missing-ledger and strict-equality controls check the timing record; a deliberately truncated HTTP response checks that incomplete delivery cannot be accepted as 96 bytes received. The dedicated Chromium/WebKit GitHub Actions diagnostic workflow retains the original log, outcome and raw negative-control records, seals a manifest and uploads the new artifact on failure. Existing official workflows for PR #55 remain the formal product gate; a green synthetic workflow alone cannot close P2 or imply B6a browser PASS. A new HEAD must be independently reviewed; external preservation requires actual approved destination and independent direct reread, not merely a successful upload.

## Boundary
This branch change is diagnostic only. Old failed jobs and original ZIPs are not overwritten. Do not infer production acceptance, process root cause, historic source fidelity or cache-used real bytes from synthetic controls. Separate CI execution, permanent storage and independent review must be reported at their observed status.
