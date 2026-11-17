# B6g submission record

Overall PARTIAL; formal browser acceptance FAIL, limited merge NO, Draft/Stage3-B HOLD,304 alternative NOT_ADOPTED remain. This is runner safety and notification instrumentation, not a solved browser cause.

Start HEAD `7c4442e319e19950799d813524038b8474bc69a5` / tree `f84b54fc7d9776e070da5f283cb0858b2a78c1fb`. Final submission SHA/tree and automatic CI are recorded in the PR comment after this commit; no old CI success is attributed to this code.

## Old P2 and new finite controls
Old excluded `local-comparison-runner.mjs` was directly recovered from retained evidence. It has no45s individual enforcement and awaits browser.close without a deadline. Its original bytes remain unchanged. Using dependency doubles only, the unchanged control flow stalled on operation-hang and close-hang after800ms; the audit harness stopped it. Those are synthetic REDs, NOT old-browser REDs. The identical worker sources/input under the new external supervisor fail safely within shortened fixed bounds with zero residual processes (GREEN for rejection/safe-stop, not successful diagnosis).

Six finite process controls cover normal exit, operation hang, close hang, detached descendant, initial failure then cleanup hang, total deadline. Expectations retain first failure, enforce finite failure, leave no descendants, and mark later slots NOT_TESTED. Subreaper and PID birth checked descendant signaling cover newly detached child processes in these controls, without system settings or foreign process operations. Not a hostile-code sandbox or guarantee under host suspension/uninterruptible kernel I/O.

## Initial verification and limitations
Related100 Node tests passed including new4 tests and existing96. Full local suite initially reported485 passed/23 failing files (508 test records); missing rollup/three dependencies prevent those files loading. Those are environment BLOCKED test scopes, not product regression PASS. A lock-preserving npm ci attempt was denied by safety review as outside allowed dependency setup; no retry, substitute install, or lock/workflow changes. Build is NOT_TESTED for that missing dependency reason. Existing preservation checks directly pass230 paths/212 originals/22 models against Git baseline.

Fixed Playwright1.56.1 exists locally, package/runtime files read and hashed. Both expected Chromium1194 and WebKit2215 executables are absent. No replacement/new runtime or binary installation is performed. Browser trial status is recorded separately only after the independent runner gate; a setup failure stops the entire planned sequence, not just one engine. Existing B6e404 four rows are reference evidence only; this new code does not retrospectively observe their terminal notifications.

## Evidence and acceptance boundaries
Only supervisor, dedicated worker/terminal bookkeeping, optional diagnostic hooks, tests and B6g docs changed. Existing formal9 diagnostic plans and5s limits remain default; new4-slot runner is NOT wired to automatic CI. Standard acceptance predicates, routing/cache/body order, fixtures, product, dependencies, lock/workflow and protected assets are unchanged. New hooks synchronize checkpoint writes and can perturb timing, explicitly not causality proof. Recorded entity0 vs server96 mismatch remains unresolved until actual new evidence; complete callback/close settlement alone cannot make it PASS.

Private evidence includes original runner, synthetic failed outputs, new tests, source hashes, initial dependency failures and independent review. Final automatic CI/artifact preservation is separately appended after submission. No raw artifacts/private storage IDs are published here. Observation, runner gate, diagnosis, formal acceptance and preservation are separate verdicts.

## Frozen four-slot observation outcome

After the independent pre-browser gate, exactly one worker launch was attempted: Chromium no-store200. It returned BLOCKED/LAUNCH_OR_RUNTIME_BLOCKED with fixed runtime1.56.1. Batch elapsed421.817463ms; first-slot elapsed419.956605ms; residual-process audit0. No real browser or HTTP diagnostic was started. Chromium404, WebKit200 and WebKit404 are NOT_TESTED due to WORKER_BLOCKED. Planned4, worker launches1, real browser trials0, BLOCKED1, NOT_TESTED3, successful observations0. No additional launch, retry, replacement runtime, or dependency installation followed.

The supervisor firstFailure field is null because no supervisor-origin failure occurred; workerFirstFailure separately retains LAUNCH_OR_RUNTIME_BLOCKED. No request/response/terminal notification chronology was acquired. The prior body0/server96 discrepancy and actual finished branch remain UNKNOWN, not resolved by the finite supervisor stop.
