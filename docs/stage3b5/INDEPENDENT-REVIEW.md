# Stage 3-B5 independent review

- Reviewer role: independent review worker, separate from implementation/validator/UI/browser authors. No product code edits or commits by reviewer.
- Started: 2026-11-15 23:18 JST. Review basis: preimplementation contract `a1543a7`, baseline main `4b7a11d271cd6018c41ee8d78619fa69a3b8a391` / tree `449d37cedbb08a9cad67945502d6f82ad08365fc`; working implementation was not yet committed. Individual source hashes are recorded in private execution evidence.
- Status: INTERIM / PARTIAL. Production browser evidence, final HEAD CI and saved artifact readback are not yet reviewed here.

## Confirmed scope

1. Reviewed prior B3/B4 ledgers and the B5 source references, all 11 per-region decisions, direct statements, limitations and null geometry. Every B5 direct statement exactly matches the previously recorded region summary. This is a review of existing research records, not fresh inspection of historical plans/PDFs. The zero-adoption decision is consistent with absent reproducible geographic outline derivation; model locations are not promoted to historical boundary evidence.
2. Source identity/record hashes and deployed-versus-research JSON are checked by the 58 contract tests, independently rerun with 58 PASS. This is rerunning the implementation test code, not an independent historical source authentication.
3. A separately authored mutation script applied 12 invalid variants to the real zero-candidate ledger, plus an unchanged normal control. Normal accepted; all 12 rejected for intended semantic reasons (missing geometry, geometry on unplaced record, unknown precision with numeric zero, synthetic production data, missing sources, mismatched region name, duplicate candidate ID, foreign source, absent procedure, unknown CRS, historical promotion, default-on display). No parser/launch error counted as rejection. The script, input hashes, validator hash, and outcomes are preserved in independent execution evidence.
4. Independent Python calculation, not the implementation checker: derive baseline path membership from `git ls-tree`, union the 212 protected registry paths with historical research/production/public-data scopes, then compare current full bytes to baseline `git show` and size/SHA256. Result: exact 230-path set, 212 protected originals unchanged, 22 model registrations unchanged. No mismatch. Evidence: independent-preservation.json in the private case evidence package. Verification applies to the reviewed working tree at 23:18 JST and must be repeated after further changes if relevant.
5. Polygon validator rejects missing/invalid geometry, duplicate/nonfinite points, nonclosed/degenerate/self-crossing and adjacent-reversal shapes. Its success is structural only: not permission, source truth, or historical position authentication.

## Findings and follow-up

- R1 (display clarity, pending implementation check): region detail initially printed `資料で直接確認した記述` but omitted `statementBasis`, which says the text is inherited research summary and that the original PDF was not reinspected this time. Show that basis next to the text, rather than implying fresh source inspection.
- R2 (P3 locator precision): the B4 reference locator used `targets:` although the actual ledger keys are `projects`, `materials`, `evidence`. Replace with real paths/IDs for reproducible lookup.
- R3 (nonblocking maintenance limitation): B3/B4 legacy preservation checks use a B5-branch-specific wrapper. It preserves protected bytes on this branch but later unrelated branches can revert to obsolete historical no-product-change comparisons. Do not call that future compatibility tested; any later replacement must preserve the protected-input checks.

## Limits and disposition

Candidate historical validity: UNKNOWN / all 11 UNPLACED, accepted 0. Real inferred historical polygon rendering: NOT_TESTED (none qualifies). Transform NOT_TESTED, residual null, historical precision UNKNOWN. Stage 3-B HOLD remains. Synthetic geometry acceptance/rendering, if later tested, is separate.

No blocking P1/P2 false acceptance has been reproduced in the reviewed validator scope. This is not final technical acceptance: browser raw evidence and final CI/artifact preservation remain pending. Overall PARTIAL; merge recommendation NO until required checks and review are complete.

## Follow-up at 2026-11-15 23:23 JST

- R1 CLOSED: source-detail label now says confirmation scope follows, and renders the inherited-record/no-new-PDF-inspection `statementBasis`. Reviewed preserved RED (same detail assertion failed) and GREEN logs; independently reran UI and contract tests: 64/64 PASS.
- R2 CLOSED: B4 locators now resolve actual `projects[id=survey-1972|survey-2012]` and `materials[id=target-1972|target-2012].facts/.rights`. Independently inspected those IDs. Existing before/after ledger copies and failed/success logs retained.
- R3 expanded into a P2 preservation membership finding: the original checker covered `public/data` and registered files but missed a newly added unregistered `public/parts` file. Fixed checker scans `public` and `data`, retaining the one explicit B5 data addition exception. Independent same-input test in an isolated clone: a synthetic added `public/parts/b5-preservation-negative.txt` was accepted by the reconstructed pre-fix scope (exit 0), rejected by fixed scope (exit 1, `protected scope path membership`), and fixed normal control accepted (exit 0). The pre-fix script was reconstructed by reversing only the two scope entries because the original implementation had already changed before preservation; do not call it a saved original pre-fix executable. Input SHA256 `931cde0a34cc9727a1e40ceace80f7be70246d746effdb30c5dc17421c13285f`. Post-fix checker SHA256 `679d40da820a02fc43603026619c3962a507986a7e47a1d50fb84b848ae3755b`. Existing original files were only read through symlinks; no source/CAD mutation. R3 CLOSED for the same negative input. The wrapper now chooses the tracked B5 contract by file presence rather than branch name, avoiding the reported future-branch issue.

The above closes the local findings, not the still-pending formal browser/CI/evidence review.
