# Stage 3-B independent preliminary review

Implementation snapshot: uncommitted branch `feat/stage3b-castle-overview`, base 5adb7156acda3968827ff39d5e6f40c4ac837ec5. Review is not final-HEAD or CI acceptance yet.

## Independent calculations

`coordinate_oracle.py` reads GLB bytes with Python struct, computes node hierarchy transforms with scalar 4×4 matrix arithmetic, reads every POSITION float and calculates bounds without importing the product generator or Three.js. It independently groups the named model nodes and checks geographic envelopes and centers against fixed existing EPSG:6676 origin/axis convention.

- 22 saved-GLB model envelopes match; maximum numerical coordinate discrepancy 0 m.
- Vertex counts and source SHA256 match.
- All 185 protected inputs match current bytes and the specified base Git objects. No protected model/terrain/source files changed.
- This does not demonstrate real-world or historical millimetre accuracy.
- Coverage is five saved GLBs. Runtime shrubs/library geometry and PR38 CAD dependency are not automatically covered by this audit.

## Findings and same-counterexample recheck

1. P2 invalid progress geometry was accepted. Counterexample `progress[0].geometry={type:'Polygon',coordinates:'bad'}`. Fixed; now rejected `Missing ring`.
2. P2 model envelope contract accepted null geometry and a WGS84-looking center `[138,35]`. Fixed; same cases now rejected (`Model envelope missing`, `Invalid local EPSG geometry`).
3. P3 missing source URL accepted. Fixed; same case now rejected `Invalid source URL`.
4. P2 model-linked work metadata could move its sign by +1000 m or substitute an unrelated model polygon while preserving claimed model identity. Fixed; both same cases now rejected `Progress model identity mismatch`.
5. P2 false georeference certification accepted `status:'VERIFIED',controls:[{}],residuals:-1`. Fixed fail-closed: schema v1 cannot certify georeference; same case rejected.

Product tests independently rerun: 37/37 pass after fixes.

## Evidence/uncertainty review

The dataset distinguishes 11 named historical regions with null geometry from 22 actual model envelopes. No historic boundaries or georeferencing residuals are fabricated. Zero control points and unresolved registration are explicit. Modern work progress describes software coordinate audit at a model center, not on-site construction or reconstructed historical completeness. Other region states remain UNKNOWN. Preservation-plan pages and reported distinctions are traceable; full primary-source historic adjudication is not part of this independent numeric review.

## Pending

Final commit/HEAD/tree, independent retrieval, CI run/artifact validation and final browser evidence review remain pending. No merge/publish recommendation is given at this preliminary point.
