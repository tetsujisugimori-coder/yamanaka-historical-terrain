# Phase 3C v2: related defences and editable production

**All new shapes remain C candidates. No B reconstruction or tower building is asserted.** Soil/grass/light treatment is a separately reversible D display operation. No third-party image, PDF, drawing or texture is redistributed.

## Source support and limits

- [Mishima excavation history](https://www.city.mishima.shizuoka.jp/page/1301.html): FY1975 names Nishinomaru lookout and earth bridge; FY1976 names lookout entrance. This supports facility names and investigation history, not dimensions, exact model position or1590 construction phase.
- [Preservation/utilisation plan](https://www.city.mishima.shizuoka.jp/uploaded/attachment/4805.pdf), printed p78: supports the relationship between the lookout entrance and western enclosure as a defensive outwork. The v2 design makes this relation observable. It does **not** turn the plan into surveyed geometry.
- Printed p102 explicitly leaves a wooden-bridge connection uncertain because bridge-pier postholes were not found. General earth-bridge references cannot authenticate this candidate centreline, connection form, width, gradient or cross section.
- The p102 access restriction specifically concerns **見張台の土塁上**. Virtual observation is not site access guidance; follow current local restrictions. It does not establish that the entire lookout is prohibited.
- ReferenceDimensions remain UNKNOWN, separately stored from modelDimensions. No surveyed control points are registered; no geographic residual or1590 surface can be claimed.
- Rights: original factual summaries and links only. MIT covers our code/original modelling, not municipal source material.

## Why v1 was corrected

The v1 model placed the lookout71m from its entrance and retained an inherited C transition rising roughly12.6m over6m in the bridge corridor. Disclaimers did not make those shapes serve the experience goal. Its manifest, GLB, authoring recipe, original production document and native/geometry proofs remain in `evidence/phase3c/history/v1-production/`. They are historical attempts, not current acceptance evidence.

The fixed external seam at N=-35 would require a mean17.12m rise over32m, exceeding the chosen0.5m/m candidate design limit. V2 moves the **hypothetical** centreline to N=-29, allowing full-length regrading without moving the footprint or falsifying seam support. This choice is geometric design, not source-derived positioning.

## Current design

Bounds remain `[-100,-45,-68,50]` local E/N metres, EPSG:6676 origin E44862.121277226666/N-93478.07235405142. Blender E/N/up exports to glTF E/up/south. One unit is one metre.

- **ic-bridge:** E=-100 to-68, N=-29, clear neck4m (N=-31…-27). Every longitudinal strip in that neck follows a straight height interpolation between its actual old boundary endpoints. Maximum measured longitudinal slope over all296 neck triangles (also checked on five exported-mesh profiles) is approximately0.498m/m, still about26.5°. This is an explicit model assumption, **not accessibility, historical walkability or simulation data**. Two side cuttings descend up to3m.
- **ic-koguchi:** opening near(-77,-29), clear width4m, flanking bank addition up to2.3m. Distinct from sc-gate/wb-gate.
- **ic-lookout:** earth high point centred(-76,-16), model shoulder12×16m, centre3.5m above prior C height. Its distance from the gate is13.038m. No tower/fence is invented.
- The lookout camera looks down toward the gateway and bridge. The two entrance cameras show the same southern bank from opposite sides. The lookout eye is(-76.5,-16.9), slightly southwest of the high point to avoid a shoulder occlusion at2x. Eye height is1.7m above actual triangles; target-height metadata supports1x/2x framing. Stations are instant relocations, not a simulated path.

External boundary heights retain actual old C mesh interpolation. Within the footprint only **display copies** of prior western terrain/nm-transition are clipped. A, original GLBs and native files remain unchanged. Existing western timber stops west of E=-103, original Nishinomaru moat starts at E=-62; fixed section geometry begins at E=-66 or further east, leaving2m exclusion from the new east edge-68.

The adaptive mesh uses1m interior triangles and external .25m seam points connected through outer-cell centre fans. Stable facility/material IDs partition one surface with no layered floating bridge slab. Neutral portable materials are exported without baked D noise/UV/color treatment.

## Direct geometric experience checks

`geometry/relationships.json` is computed from binary GLB positions and triangle indices, **not the authoring elevation function**:

- Exact longitudinal gradients of all296 triangles covering the full4m neck are checked, supplemented by measurements over the entire32m at .25m intervals along five transverse ordinates. The maximum remains below0.5001m/m.
- Exact barycentric segment/triangle clipping checks every crossed planar interval. From the lookout, gate and two bridge target points0.2m above ground have unobstructed rays with at least0.2m vertical clearance.
- The same ground point behind the southern bank is occluded from the outside entrance eye (approximately0.55m terrain intersection) and visible from the inside eye. This illustrates changing sightlines without quantifying combat effectiveness.
- Initial framing is checked mathematically at nominal375×520 viewport. These tests supplement, not replace, browser screenshots and visual review.
- Clearances are repeated with2x displayed terrain and fixed1.7m eye height. Minimum lookout-to-gate clearance at2x is0.0954m; the1x margin is0.2m.
- V1 distance/steep-grade defects produce old RED; v2 passes. Reintroduced old cliff and deliberately lowered lookout eye are rejected. Existing coordinate/ID/B-contamination/crack negative controls remain.

## Editable files and actual native verification

- `production/yamanaka-phase3c.blend`: compressed native project with all693 prior mesh objects preserved and hidden, plus the new editable C collection. Prior objects are not destructively clipped in this source. Native compression is a storage option; v2 shape changes are **not** claimed geometry-equal to v1.
- `production/yamanaka-phase3c.qgz`: prior valid layers retained; new C raster, footprint, facilities, stations and virtual sightlines added.
- `production/phase3c/recipe.json`: source scope, dimensions, assumptions, station calibration and intended sightline targets.
- `surface-candidate-025m.tif`: float32 C derivative sampling the actual adaptive triangulation at .25m pixel centres, **not a measured DEM**.
- `footprint.geojson`, `elements.geojson`, `stations.geojson`, `sightlines.geojson`: editable EPSG:6676 geometry. Sightlines are virtual model tests, not archaeological visibility evidence.
- `public/data/phase3c.{glb,json}`: isolated web patch and metadata.

Installed Blender4.3.2/QGIS3.40.6 were actually run. The prior QGIS project was saved with3.44.10; that warning is retained. Save success was followed by **separate-process Blender and QGIS reopens**, source-retention/CRS/layer checks and exported-vertex/raster equality checks. Current reports/logs are in `evidence/phase3c/native/`.

## Reproduction

```sh
python3 scripts/phase3c-recipe.py
/usr/bin/blender -b production/yamanaka-phase3b.blend --python scripts/phase3c-build-blender.py
QT_QPA_PLATFORM=offscreen /usr/bin/python3 scripts/phase3c-build-gis.py
/usr/bin/blender -b production/yamanaka-phase3c.blend --python scripts/phase3c-verify-blender.py
QT_QPA_PLATFORM=offscreen /usr/bin/python3 scripts/phase3c-verify-gis.py
/usr/bin/python3 scripts/phase3c-relationship-check.py
```

The last command also runs the binary geometry/preservation/negative-control checks. Native serialization may change metadata bytes; compare exported geometry/raster checks rather than infer equality from timestamps.

Actual-site georeferencing, field verification, free-walk collision handling, real Safari/VoiceOver, sustained FPS and military effectiveness remain outside this production proof. Browser/visual and independent review reports determine their own scope/status.
