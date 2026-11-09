# Independent landscape extraction review evidence (PR36)

Reviewer checkout was independently fetched from GitHub. Product implementation was not edited by this reviewer. No merge or deployment was performed.

## Evaluation identity
- Final candidate: 86871faac10a07b56552aa76aa846e6f228ae83b
- Tree: 4df2de8b32df87dc13605aba856c99551ed76bca
- Reproduction checkout: 3316affd60e5969ae5730ad44ba2fee186b1521c (same product, native source and reproduction scripts as final; final adds documentation wording and one evidence hash target).
- Source PR26: e67f1fc81c38986ccf8170d1942a1894992c0f3a
- Main baseline: 42ed7bbe1b1f839535ed66c76c75d1ade2ce2cc8

## Independent checks
- audit_geometry.py: raw GLB accessor decoder and canonical XY triangle matching. No production geometry oracle. 473792 triangles; 418 changed triangles/180 changed vertices; strict intended C bounds; XY/topology and exterior preserved. Exported index order is NOT claimed identical.
- negative_geometry.py: copied assets mutated for exterior height, wrong unit, NaN and winding; each must fail.
- audit_sections.py: separate NumPy linear system barycentric height computation: 876 section points and 5 supports; max discrepancy 1.1368683772161603e-13 m.
- Headless phase3i-reproduce.sh completed under Blender4.3.2/QGIS3.40.6. Public GLBs/metadata byte-identical. The 1777 old-main paths are unchanged BEFORE/AFTER REGENERATION, not an assertion that the PR changes none of main's files.
- Native reproducibility is semantic, not byte-for-byte: 13 generated new native/log outputs differ. GPKG tables differ only in gpkg_contents last_change timestamps. QGIS XML additionally changes default layer colors/UUIDs/attribute order; its PNG therefore changes. Blender native saves differ; geometric reload and exported public geometry were checked. Do not attribute every native byte difference to timestamps.
- Final candidate: 322 unit tests PASS; build PASS. Unit/build logs also appear in older-named 3316aff folder due to output naming; execution checkout was final86871fa.
- Independent browser probe: Chromium390/1280 PASS for repeated A/C/D restoration and synchronous exaggeration change. WebKit failed to launch for missing host libraries; browser.json reports NOT_TESTED and run exit1, not PASS. This is supplementary, not the formal16-condition CI evidence.
- First npm ci failed because default cache was read-only. Retry using /tmp cache succeeded. Failure retained.

## Re-run
python audit_geometry.py CHECKOUT OUTPUT.json
python negative_geometry.py CHECKOUT NEGATIVE.json
python audit_sections.py CHECKOUT SECTIONS.json
Browser probe uses Playwright and an already running local Vite server on port4531; see independent-acd-review.mjs.

CI artifact review is pending at this package checkpoint. Historical certainty, performance improvement, actual Safari/touch/GPU timing and native application GUI operation are NOT_TESTED or unproven. This package alone is not final acceptance.

## Final-candidate supplement
Final candidate advanced to 9e29d737f56f606df9688874b9510490dbce54e7 / tree ee91f0f2742b9686ad40b001864b0408251dbbfa. Only tests/landscape-only-separation.test.mjs changed: a pinned byte-identical baseline snapshot replaces git-show dependency in shallow CI. Independent no-Git RED/GREEN and corrupted-baseline rejection are in 9e29/. Reviewer harness's initial missing copied test input failure is explicitly retained and distinguished.

Final9e29 unit322 PASS/build PASS repeated independently. Final formal CI artifact13678681247, run42621982317 ZIP SHA25610e73eb0e72ea726229ae73b5f2d6759f4116c3bd8927c70a11780fc61860594: audit_ci.py and product verifier both PASS, 16 conditions/32 PNGs/20source hashes/64 section records/128 support records/320 post measurements/1536 preserved paths. Old86871fa artifact is separately audited, not relabeled. Representative WebKit390 D screenshot viewed from final artifact. Remaining western regression CI was still in progress at this supplement; formal review awaits it.
