# B6e pre-experiment contract
Start: aa3688f312f46f4db7faace8e7e1d200cdf9b78e / ea6f733c50c06ba57c38637763ef64399c15d126. This file is fixed before extra browser attempts. No product, workflow, dependency, normal cache or acceptance-predicate changes.

## Observed baseline and wait graph
Four saved diagnostic records independently read from original ZIPs 14268856123 / 14267823889 / 14266314423 / 14268976111. Each missing phase2 records body-succeeded (0 bytes), preservation-succeeded, and later response-finish-failed and capture-settled. Exact event offsets from DIAGNOSTIC_DEADLINE are retained in evidence, not inferred from event order alone. Server selected404 and96-byte entity: zero captured bytes do not establish equality.
`drain -> bounded(Promise.all(capture catch wrappers)) -> capture finally -> await completion -> response.finished()` is the wait chain. Capture body/preservation success is not full capture settlement. Original response.finished invocation start, context.close start/end and drain snapshots are absent: UNKNOWN, not retrospectively fabricated. Subsequent SETTLED does not erase pre-close deadline. Native/wire/backend cause UNKNOWN.

## Frozen comparison (maximum8 trials including engine)
Each Chromium/WebKit gets four trials, no retries: missing/AS_OBSERVED, missing/AFTER_FINISHED, no-store/AS_OBSERVED, no-store/AFTER_FINISHED. Each is the same existing two-phase fixture and viewport375x900, serviceWorkers block, no routing,5s per operation/settlement, unchanged404 entity. Per-trial cap45s, total360s. Setup/launch failure consumes its slot and stops that engine; remaining slots NOT_TESTED. Existing automatic formal CI is separately counted and retains9 diagnostic conditions, not counted as extra trials.

|Comparison|Hypothesis / changed factor|Fixed|Expected / falsifier|Decision|
|---|---|---|---|---|
|missing AS vs AFTER per engine|completion wait blocks capture; only body timing changes|same404 fixture/context policy/cache/limits|AS body/preserve completes but finished pending; AFTER stops before body / both completed before deadline refutes|observer-level wait localization only|
|200 AS vs AFTER per engine|instrumentation does not reject normal completion; only timing changes|same no-store200 fixture/limits|both capture/finished/settlement complete / any pending or mismatch refutes normal-control success|normal control distinct from404|
|same timing missing vs200|fault association, not sole-factor cache causal claim|engine/viewport/limits; mode differs and no-store control acknowledged|404-only wait / both wait suggests broader issue|no cache-specific causal claim|

No blanket304 PASS/skip; no timeout extension; no conversion of post-close completion to pre-close success. Result dimensions: NORMAL_COMPLETE, DEADLINE, BODY_FAILURE, ENTITY_MISMATCH, UNKNOWN. Tests distinguish late completion, first error, pending completion, preservation mismatch, normal control. New measurement API in old version is NOT_IMPLEMENTED, not old browser RED.

## Recording and protection
Add monotonic start/terminal/error events for completion, drain and context close with local request/response IDs. Snapshot pending operations at deadline before cleanup can mutate records; keep first exception. Fixed error codes only, no raw messages/URLs/secrets in new records. Instrumentation can affect scheduling; no native timing claim. Preserve212 originals/22 models/230 protected paths,11 unplaced/0 candidates/EPSG6676/geometry=null. Dedicated storage budget initial checkout<1GB, local evidence<100MB, formal retrieval separately budgeted; no shared cleanup. Library approved, independent readback required; ACL/retention UNKNOWN.

Formal browserFAIL, overallPARTIAL, limited mergeNO,304NOT_ADOPTED,Draft,Stage3-B HOLD remain until separately justified. No dispatch/retry, merge or publication.
