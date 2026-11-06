# Phase 3C editable production and verification

All three new facilities are **C hypotheses**. No new B claim or tower building is introduced. Soil/grass/light treatment is a separately reversible D display operation. No third-party image, PDF, drawing or texture is redistributed.

## Source support and limits

- [Mishima environmental works and excavation history](https://www.city.mishima.shizuoka.jp/page/1301.html): the FY1975 work list names Nishinomaru lookout and earth bridge; FY1976 names lookout entrance. These establish names and investigation history, not dimensions, exact position or a 1590 construction phase.
- [Preservation/utilisation plan](https://www.city.mishima.shizuoka.jp/uploaded/attachment/4805.pdf): printed p78 discusses the lookout entrance and western enclosure relationship; p102 expressly leaves a wooden-bridge connection uncertain because bridge-pier postholes were not found. General earth-bridge references cannot authenticate this model's connection. Its exact centreline, plan, gradient and cross section remain C.
- The plan's present-day access prohibition on lookout/bank is **not overridden by virtual observation**. This is not a real-world walking guide.
- The model ledger retains referenceDimensions separately from modelDimensions. Reference width, height and slope for each new facility remain UNKNOWN. No survey control points are registered; no map residual can be claimed. Independent historical review verifies printed-page support separately.
- Rights: links and independently worded factual summaries only. No traced plan, external mesh or image is incorporated. MIT covers our original modelling code, not municipal source material.

## Layout decision

New local E/N bounds are `[-100,-45,-68,50]` metres, same EPSG:6676 origin as castle.json (E44862.121277226666, N-93478.07235405142), 1 unit = 1m. Blender axes E/N/up export to glTF E/up/south. This bounded patch replaces **display** triangles from both prior western C terrain and `nm-transition`, never changes their source bytes, and never modifies A. West/east positions are an educational candidate, not a registered archaeological plan.

The footprint was selected after inspecting actual prior layouts. Existing western timber defences stop west of E=-103; original Nishinomaru moat starts at E=-62. Fixed sections start no further west than E=-66, leaving a 2m horizontal exclusion margin. The new east edge is -68. No previous gate ID is reused.

- `ic-lookout`: earthen high point at (-76,36), no tower/fence invented. Model shoulder footprint 12×16m, centre added height 2.5m.
- `ic-bridge`: continuous ground at N=-35 with two adjacent cuttings, each maximum 3m deep. The 6m clear neck retains existing longitudinal high/low variation. It is not a floating slab, surveyed route or simulation walkability dataset.
- `ic-koguchi`: soil banks around a 4m clear opening near (-77,-35); maximum added bank 2.3m. Distinct from `sc-gate` and `wb-gate`. Exterior and interior observation points compare the same opening.

One continuous adaptive mesh (1m interior and .25m external boundary) is partitioned by triangle among stable facility/material IDs, with no duplicated projected surface sheets. Patch boundary heights interpolate the actual previous C mesh grid (western 1m; Nishinomaru .25m), with float32 export rounding. No D UV/color/noise is baked into this new mesh. Three neutral portable materials identify earth/path/grass; runtime appearance is separately owned.

## Editable artifacts

- `production/yamanaka-phase3c.blend`: separately saved native project with prior mesh objects preserved byte-equivalent in geometry and hidden, plus editable new collection. It opens focused on the new source collection; the web layer clips old display surfaces for context. Prior objects are not destructively cut in the native source.
- `production/yamanaka-phase3c.qgz`: prior valid project/layers retained, new candidate raster, footprint, facilities and observation points added.
- `production/phase3c/recipe.json`: assumptions, dimensions, source support and all eight observation supports.
- `production/phase3c/surface-candidate-025m.tif`: float32 C derivative, actual adaptive-mesh heights sampled at pixel centres, NOT a measured DEM.
- `production/phase3c/{footprint,elements,stations}.geojson`: editable EPSG:6676 vectors. Point locations are C assumptions, not survey data.
- `public/data/phase3c.{glb,json}`: portable isolated web patch and manifest.

## Reproduction

Run from repository root using installed tools (no installations required):

```sh
python3 scripts/phase3c-recipe.py
/usr/bin/blender -b production/yamanaka-phase3b.blend --python scripts/phase3c-build-blender.py
QT_QPA_PLATFORM=offscreen /usr/bin/python3 scripts/phase3c-build-gis.py
/usr/bin/blender -b production/yamanaka-phase3c.blend --python scripts/phase3c-verify-blender.py
QT_QPA_PLATFORM=offscreen /usr/bin/python3 scripts/phase3c-verify-gis.py
/usr/bin/python3 scripts/phase3c-geometry-check.py
```

Blender 4.3.2 and installed QGIS 3.40.6 were actually executed. The prior QGIS project had been saved with 3.44.10; the downgrade warning is retained. All layer validity, CRS and source retention checks passed with 3.40.6. Reopen was performed in **separate Blender and QGIS processes**, not inferred from successful save. Repeated .blend/.qgz bytes can include native metadata; compare geometry and raster checks, not timestamps as evidence of reproduction.

## Verification and boundaries of claims

`evidence/phase3c/native/` records executed authoring/reopen results and logs. `evidence/phase3c/geometry/report.json` parses actual exported GLB positions/indices without importing the authoring elevation recipe. It verifies metre-coordinate bounds, C-only IDs, positive unique projected triangles, exact total area, consistent shared vertex heights, boundary attachment to prior exported triangles, eight station supports and prior artifact SHA256 hashes against baseline ed22133. Native GIS reopen compares every exported new vertex with the saved raster.

Negative controls reject shifted coordinates, mistaken old facility ID, B contamination, and changed seam/shared-vertex height. These are **in-memory faults**, never committed broken GLBs. The old baseline's absence of new facilities is not mislabeled a historic defect. The two fixed sections are protected by byte-identical prior GLBs and strict footprint exclusion; separate browser regression still owns state/display section checks.

Geometry proof does not prove historical accuracy, real-world route safety, free-walk collision handling, visibility of every intended feature in a screenshot, FPS or accessibility. Browser/visual and independent review reports are separate. Field verification, actual Safari/VoiceOver and archaeological georeferencing remain NOT_TESTED/UNKNOWN.

## Performance-driven production correction

The initial .25m attempt used 97,280 triangles and approximately 5.2MiB GLB (initial hash/checks retained in `geometry/initial-dense-report.json`). Fine sampling was unnecessary away from seams. The final adaptive mesh uses 1m two-triangle interior cells and outer-cell centre fans with .25m external boundary points. All 1,016 seam samples remain. This new candidate mesh is not geometry-equal to the dense attempt. Both native sources were resaved and separately reopened after optimization. The .25m raster samples the final adaptive triangulation; resolution does not imply archaeological precision.

Initial outside-koguchi eye (-83,-35) was on a steep prior transition and moved to (-79,-35); lookout eye was centred at (-76,36). Actual triangle-derived grades are recorded and all eight tour observation foot grades >=0.5m/m are rejected. This is a virtual viewpoint criterion, not a real-world accessibility standard. The route's inherited longitudinal rise is steep farther west; instant station changes do not imply continuous walking.

The new tour west-gate eye also moves from inherited (-197,-35) to (-195,-35), reducing actual local grade from0.839 to0.229m/m; the historical Phase3B station record is unchanged.
