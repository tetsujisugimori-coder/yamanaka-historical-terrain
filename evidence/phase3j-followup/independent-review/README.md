# Independent review evidence: Phase J A/B

Reviewed implementation heads:
- A: ee3c3def2565b088c978694469ed86d10d92c75c (PR #34). Measured source at b55431a is byte-identical; final-head CI was separately audited.
- B: ef47f1b43a9118f60e5b0f9a7f380ff49342282b (PR #35), based on A b55431a.

The reviewer fetched source and published evidence directly from GitHub into a separate checkout. No implementation files or old PRs were edited. No merge/deployment occurred. This branch contains audit artifacts only beyond evidence commit 0cb27662bf069ed5628e5585aef51b4b531ca7c6.

## Artifacts and provenance

- Historical independent original ZIP SHA256 f5385164105865fde1d3bf42b9b645f141a9e8721f8224490eb6dbf09e1677b1: all 288 manifest entries verified. The four preserved historical raw/identity gzip expansions in the published B archive are byte-identical to the original files. Original local results: cold -1.548537%; partial reload +1.714846%, five improved pairs out of ten in each. These remain separate from every new experiment.
- A local36: GitHub evidence in commit ee3c3d, ZIP SHA256 3cc605c13155f44659dfdd0116c2bb000f13ba057db94315b2e1681d2a9e0999.
- A earlier CI36: run 42597854436, artifact 13665501009, ZIP SHA256 73dc74b0867da7fc5b5ea61738a36c0e67abd5a552f1d8039a5b146980102c5a.
- A final-head CI36: run 42599971887, artifact 13666665110, ZIP SHA256 08a52c0281deb60990e835a7362bf658011d870ca363fca4c1de583a9425fa52. Both A CI original ZIPs are permanently preserved on evidence commit ad4ce76842bfa59983ea2e353f8667a7e984cf5f.
- B local48+18: GitHub evidence commit 0cb2766, ZIP SHA256 7accd9c7e0e447ed418237dbb144957d44bbe86751e0c5d63e21a0aef0ef3290. Its 36 manifest entries verify.
- B CI48+18: run 42598198849, artifact 13666490123, ZIP SHA256 6a472e6710aad2c8f42aa2f544aa49c18a00efbee9847311371561b91a3684a1. The original ZIP is also permanently preserved on evidence commit 0cb2766.
- A formal16: run 42599971927, artifact 13666517138, ZIP SHA256 7a9f2863c98b57a266198fcb84054154f888acef41af12d15209d1fc0fc078d7.
- B formal16: run 42598198884, artifact 13665869204, ZIP SHA256 c17f382bd20f634e7ca59d03fa258223fd105f94abe9f98b7034b85f31ea3f95. All 16 deterministic geometry/support/quality records and all 32 PNGs match A.

## Reproduction

Run from a checkout containing these scripts and the exact referenced Git objects. Install locked dependencies with `npm ci` for the Node geometry-oracle audit. Extract original archives into fresh temporary directories; do not overwrite prior evidence.

- `python3 evidence/phase3j-followup/independent-review/audit-followup.py RAW_DIRECTORY LABEL [RAW_BASENAME]`
- `node evidence/phase3j-followup/independent-review/probe-followup-raw.mjs RAW_FILE IDENTITY_FILE`
- `node evidence/phase3j-followup/independent-review/audit-formal16.mjs BROWSER_DIRECTORY EXACT_HEAD OUTPUT_JSON`

A raw basename is `raw.json`. B default/detailed basenames are `optimization-raw.json` and `optimization-detailed-raw.json`. The Python script independently calculates statistics, the fixed-seed descriptive paired bootstrap, and union coverage using an endpoint sweep; it does not call the project analyzer. Each audit also checks raw identity, served entry hashes, committed source/asset/runner hashes, manifest members, and PNG hashes. The formal16 audit reruns the repository's independent GLB-triangle oracles against sections, guide supports and every walking sample in the recorded evidence.

The copied output reports retain their original experiment labels. Audit outputs are saved next to the scripts. Use a new LABEL to avoid replacing a retained report.

## Findings and limits

- New A observer validation rejects all reproduced fail-open cases: self-comparison, wrong roles/profile, wrong delivered build/runner, invalid duration, missing entries/counters/assets/rows, reversed order, failed rows, HTTP errors, and unknown whole-task spans. Each retained actual-raw probe set has one accepted original and 18 rejected corruptions.
- A's default-path reload medians increased +5.10% locally, +8.01% in earlier CI and +6.10% in final-head CI. Paired uncertainty is broad. Instrumentation is characterized, not proved negligible or equivalent. Limited use as a measurement tool is a separate decision from speed or production adoption.
- B fails the preregistered total-time acceptance criteria. Local cold/reload median changes are -2.55%/-5.50%, but paired uncertainty crosses zero; official CI is +8.90%/+23.26%. Local support-computation savings cannot replace total-wall improvement. HOLD, merge recommendation NO.
- All 1,577 prior public/production/evidence files are unchanged. Independent A378/B390 tests and builds pass; independently rebuilt I/A/B entry hashes equal recorded served bytes.
- Benchmark PNGs show controls, not terrain; formal16 PNGs are the terrain visual evidence. Representative desktop Chromium and mobile WebKit formal images were visually inspected.
- Overlapping inclusive spans are never summed. H's historical 72% is a CPU-sampling denominator, not facility wall or GPU duration. Real Safari, physical input and GPU internal time remain NOT_TESTED. Shared-host noise and small-sample uncertainty remain.
- Both A and B formal16 and final nine workflows pass. Pages deployment jobs are skipped. See A-REVIEW.md and B-REVIEW.md for separate final acceptance decisions. No merge or deployment was performed.
