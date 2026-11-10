# Stage 3-B local continuation independent review

Reviewed HEAD: `d37d7759f36d73f1f18cc3c868641aee1983d0f3` in separate main38 checkout. Adopted baseline: `842d5378bb1fad648f225b79933763b8e87b6afa`. Focus: changes after `5ae2e313`, plus source-coordinate preservation. No browser launched and no external publication performed.

## Results

- Independent Python raw-GLB decoder and scalar hierarchy transformations: 22 saved-model envelopes, centers, vertex counts and hashes match with numeric maximum discrepancy 0 m. This is not historical or survey accuracy.
- All 212 protected files match current bytes AND the adopted baseline Git objects, independently rehashed. Old baseline is not confused with adopted PR38 assets.
- CAD B0/B1/B2: each 14 meshes / 336 vertices. Independently computed asset-local bounds and SHA256 agree with report and fixed pin. The configured anchor E=-20/N=0 matches main.js. Runtime ground support and transformed placement are NOT_TESTED, not implied by local bounds.
- Contract test suite: 43/43 PASS. Generated data --verify PASS. git diff --check PASS at inspection.
- Independent Node fake-DOM harness with real Three.js exercised initial acquisition failure, retry, late old invalid response after new valid response, duplicate rebuild, and response after disposal. All PASS. It also checked one capture while already active, saved-snapshot forwarding to restore, and deactivation on return.
- Node cost report: all 20 measurements match ten predeclared alternating blocks. Independently recalculated median parse 0.2008996985 ms/iteration, parse+validation 0.2376288890 ms/iteration. These are Node-only costs, not browser load/render/input or improvement evidence.

## Findings

No unresolved P1/P2 identified in the independently checked numeric/contract/controller scope. A preliminary suspected missing render-sync hook was withdrawn: main render calls syncConnected, whose first statement invokes castleOverview.sync; it was not a regression. The earlier invalid-geometry/model-center/work-identity/georeference-certification controls remain fail-closed.

The new region/model relation is expressly software-audit association with geographicAgreement UNKNOWN. Evidence categories are inherited from metadata. Historic counterpart distance and direction remain null/UNKNOWN, not zero. Eleven historical regions remain unplaced. Modern software work state is not historic completion.

## Limits / acceptance

Browser rendering, final camera restore in the real application, input/touch/resize and browser-history behavior were not independently executed here because the parent was running browsers serially. The fake-DOM test is not a substitute for the requested 16-condition browser matrix. CI/final remote HEAD/official review submission were not verified. No merge recommendation is issued by this local review; full Stage3-B completion remains unproven (historic registration and runtime CAD placement absent).

Evidence: coordinate-oracle-main38.json; recheck-main38.json; controller-recheck.json and their independent scripts, all beside this report. No source PDFs/images or private data were copied to GitHub.
