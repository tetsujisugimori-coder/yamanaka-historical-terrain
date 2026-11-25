# B6k execution status

## Submission boundary
B6j parent `f6be90f4a27452375041bf7e4f7ebc35c5cd4e1b`. This change targets the bounded Linux supervision, B6j's evidence-first control harness and the explicitly checked collector suite. Product code, source placement, 304 contract and browser acceptance are not modified.

## Prior factual baseline
B6j on parent HEAD: 19 run = 8 success, 10 failure, 1 cancelled; the new six formal delayed controls reached the GREEN control in only two cases. Four old RED controls retained a Z-state residual and audit FAIL. Final B6j assertions were absent after early assert; collector only understood six-case and fourteen-case suites. This remains a failure baseline, not retroactively repaired.

## B6k acceptance record
At change-preparation time: independent code-level review and synthesized collector mutations are planned. Formal new-HEAD CI, full artifact collection, authorized archive and separate-session re-fetch are NOT_TESTED. In particular, no result in this document may be inferred from a Git blob upload or a successful prior-head local run.

Required assessment:
1. Read submitted commit/tree/parent, protected paths, and workflow gating.
2. Re-run focused tests for the adopted Z, direct child exit code, 18-case B6j harness, normal/timeout and manifest mutation.
3. Observe both PR and push formal events, count every run/job by event and HEAD; record non-success, cancellation, and not-reached controls without retries.
4. Preserve all eligible CI originals, list root manifests per artifact and classify missing coverage as UNKNOWN. Re-fetch with an approved independent execution area; compare full bytes, SHA, size, every ZIP CRC and applicable manifest.
5. An independent reviewer reopens raw sources, failed control evidence and the exact final HEAD. B6k limited acceptance remains NO/PENDING until these gates are demonstrably met.

**Provisional verdict: PARTIAL / LIMITED ACCEPTANCE NO / MERGE NO / Draft / Stage 3-B HOLD.**

## First formal-HEAD observation and bounded amendment
The initial submitted B6k HEAD `7dc4921d166e479e5475f7093ce48591fc84ced8` triggered automatic Actions. The first three inspected failure jobs (castle-exploration `134970655756`, Pages build `134970655693`, landscape-only `134970655427`) all show the same new B6j harness failure at delayed GREEN: the controlled new supervisor completed with `withinBudget=true`, `auditStatus=PASS`, `residual=[]`, `directChildExited=true`, outer containment PASS, and `injectedDelayReached=false`. The original test mistakenly demanded a delayed **pre-signal checkpoint** in the repaired source even though that checkpoint's removal is the feature under test.

This is a **test-oracle defect**, not evidence that the new source ran the baseline checkpoint. The amendment requires the old source's delayed pre-signal checkpoint to be present, the new one's to be absent, and independently checks observed SIGTERM plus the recorded checkpoint start times between deadline and SIGTERM; all original wall budgets, exit/audit/residual and manifest gates remain unchanged. The original failed CI, original logs and unexecuted cases remain FAIL/NOT_TESTED. This amendment cannot establish acceptance until new-HEAD formal results and original artifacts are reviewed.

## Second formal-HEAD observation: keep old timestamp correlation separate
At `e9c7e38e67084ce1487095fbc136abc925c6ccd3`, the first inspected B6j failure reports the old RED controlled delay injected (`injectedDelayReached=true`), an observed SIGTERM, over-budget inner trial and outer containment PASS, but the additional derived `checkpointBetweenDeadlineAndSignal` field reads false. The two measurements are inconsistent, and the derived event-write correlation is not proven to represent the original injected save's scope. The corrective record treats that derived field as diagnostic/UNKNOWN for the old baseline, **not as evidence that the injected delay did not occur**. It continues to require an absent pre-signal checkpoint for the new source and the old/new fault behavior, unchanged 1800ms bound and outer cleanup PASS. This is a scoped observation contract amendment; older failed CI remains FAIL.

The same HEAD's B6h recording test also failed an outer-timeout assertion. Its actual outer record was not present in the inspected job-log excerpt. The test now includes the complete bounded outer result in its **failed** assertion message to permit a later root-cause decision without guessing or changing an expected failure into PASS. Both issues remain OPEN until corresponding formal evidence is checked.

## Local follow-up to 29eb1837 (not yet submitted)

The exact historic outer failure identified in castle-exploration run `44352938326`, job `134973229616`, occurs at test line 73 at `2026-11-18T16:56:58.412Z`. Its sole ZIP artifact `14449795931` does not contain the runtime outer/checkpoint record; it contains unrelated geometry/unit material and a preservation record referring to an older baseline. Individual historical deadline/exit/reap/Z/audit observations therefore remain UNKNOWN. New controlled tests cannot identify that historical root cause.

The six B6j original ZIPs were independently examined in the preceding evidence task. Four RED controls record `INDIVIDUAL_DEADLINE`, `CLEANUP_FAILED`, directChildExited=false, exitCode=null and audit FAIL with one Z each; the new control/final assertions were not reached. Two controls completed. These historical FAIL/NOT_TESTED values are unchanged.

Local independent review found a further ownership defect in the fixed 29eb source: `reap_adopted(first.pid)` could consume a second Popen direct child's exit 17 and cause its later wait to report 0. The follow-up limits ownership to observed root descendants. The same two-direct-child counterexample preserves exits 7 and 17 in the revised source. This is a newly measured control, not a claim that the old CI failure had that cause.

Additional review found loss of early audit errors and an ambiguous unreaped-Z label; these are corrected by accumulating errors from the first scan and retaining OBSERVED_NOT_REAPED. The reviewer is re-running the same counterexamples. Final-record receipts are separately verified by the collector, including missing/corrupt/wrong-source faults. Old records and source fixtures are not overwritten.

At this local editing boundary, formal CI for a new submitted HEAD, external preservation of new evidence and final independent acceptance are NOT_TESTED/PENDING. No push, workflow change, browser experiment, timeout increase, retry/dispatch, Draft release or merge has been performed by this local worker. Existing FAIL, Stage 3-B HOLD and merge NO remain.

## B6k owner-observation handshake submission boundary
After the fixed starting HEAD `35ec9eb02fad30acdb97556bb36ec2830fa13624`, a test-only ownership-observation handshake was designed for the existing `orphan`, `outer-orphan`, `zombie` and `live` controlled fixture paths. The supervisor and outer watchdog must observe both actual parent and child PID/birth/PPID before saving a verified release, and the fixture must not orphan or stop until release. Missing or forged request/release and mismatched manifest are negative controls. The original time limits are unchanged. See [HANDSHAKE.md](HANDSHAKE.md).

This document records a **provisional submission design**, not proof of newly executed CI, external preservation, independent review or P2 closure. Start-head formal results remain 6/19 SUCCESS, 13/19 FAIL, B6g orphan/outside-audit FAIL, B6k live FAIL, and browser acceptance NO. Original Library ZIP38 + two audit records were reported byte/SHA/CRC checked with 26 manifest-free ZIPs coverage UNKNOWN. New-HEAD CI and new artifacts require their own assessment. Do not promote synthetic or local tests to formal acceptance.
