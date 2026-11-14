# Independent review: delayed-operation evidence contract

2026-11-14. Baseline HEAD `9319dd887b073598765a820d44b9b5fde0915b78`, base `c0ba33b52c86b252ef570467b7b5058fb33d87d2`. This document records pre-submit source review and a separate local execution. Final-head CI and original-artifact/Library verification are separate gates, reported in the PR after completion.

## Reviewed scope and executed result

Read AGENTS.md, actual main/overview/intent implementations, existing race browser checks, fixed acceptance contract, and new CONTROLLER runner. Independently ran the final runner and Node test: **15 normal scenarios and 10 semantic fault controls PASS**, 25 rows. The executable controller file reviewed has SHA-256 `2e611623782a5060f0ddfbf531dda32e72b9c30b21e54b6f3814f80aa994780b`; the node test has SHA-256 `a8c9f2fa796af0072ac3466d5108a39b2489b2622b8a7cb5db7142fc5d72f69c`.

- Actual source slices: runAction, setView, loadInner, restore callback, reload, activate, deactivate, dispose. Each original slice has byte count/hash. Fault mutations assert exact occurrence counts, preserve before/after hashes and require the intended assertion reason.
- Cancel/new operation completes before old response release. Scene/state snapshots remain unchanged after old terminal. Shared-fetch normal control keeps the latest waiter and rejects the stale waiter; a separate lost-waiter fault must be detected.
- Actual overview reload checks both old-failure/new-success and old-success/new-failure. Latest expected outcome is checked before the stale-response comparison. Invalid coordinate and fetch failure recovery remain distinct.
- Normal restore confirms view/landscape/drama/selected/comparison/camera/target/fov. Stale restore checks new operation and independent camera input.
- Actual overview dispose removes the Three group and fires geometry/material dispose; pending response cannot rebuild or add another request. Actual main loadInner disposed gate is a separate source-contract check, not an assertion that a mock renderFailed flag simulates native WebGL disposal.

## Review findings and corrections

First draft lacked actual retry reload/dispose paths and replaced runAction's catch ownership guard with a fixture implementation. These evidence P2 gaps were corrected by the actual source slices listed above. No product defect is alleged from these gaps.

The fault wrapper initially accepted any AssertionError, including failed mutation setup. It now requires the expected semantic reason. Independent fault check inserts `assert.fail('injection setup failed')` at mutation setup: the corrected wrapper rejects it with `wrong rejection reason`, exit 1. A reviewer-only reconstruction of the earlier permissive wrapper accepts the same setup failure; it is explicitly a reconstructed comparator, not a prior committed product result. The attempted direct-script run without EVIDENCE_DIR was an environment/setup failure and is not counted as semantic evidence. Raw copies/logs remain in independent evidence.

Also strengthened latest-result assertions and changed close scenarios from sequential old-terminal/new-start to new-complete/old-release. No production code was changed in this supplement. No blocking P1/P2 remains in the reviewed supplemental source; this is not a claim about untested code or all Stage 3-B functionality.

## Boundaries and cumulative PR scope

These are isolated Node CONTROLLER tests using real function bodies with minimal surrounding dependencies and real Three groups. Rendering, full DOM lifecycle, full app teardown, browser/network scheduling and native WebGL are not executed by them. Existing Chromium/WebKit UI and native context-loss evidence stays separate. Prior four UI paths × two engines remain NOT_TESTED, not rewritten to UI PASS. UI_UNREACHABLE is a reachability classification, not internal-safety proof.

The existing PR cumulative 105-file scope was inspected by path/type: runtime src/public additions, derived GIS metadata, provenance/preservation ledgers, tests/scripts and retained evidence/documents. This supplement does not isolate those changes into a smaller merge; all remain in the PR. Independently reran the 212-input protection check: all unchanged against ledger base `842d5378`. No current diff in src/public/production/research/lock against baseline 9319dd8. No new dependency or historical/model coordinates change was found in this supplement. Cumulative technical acceptance still requires the final-head production 30 conditions/484 transitions, existing workflows and artifact evidence; prior CI is not used as a substitute.

Stage 3-B HOLD, historical-position UNKNOWN, Draft and no deployment remain. Final limited merge recommendation is deferred until the final HEAD CI and byte-preservation audit, and does not authorize merging.
