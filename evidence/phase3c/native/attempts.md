# Native production attempts

1. Initial dense .25m candidate: actual Blender export/save and separate native reopen succeeded; QGIS save/reopen succeeded. Initial dense geometry report and native build record retained. This attempt was replaced for excessive triangle count, not presented as final performance.
2. Optimized adaptive candidate: Blender build and separate reopen succeeded. Geometry changed from97,280 to7,342 triangles. Final portable GLB500,716bytes.
3. During raster adaptation an intermediate QGIS build raised `ValueError: point outside patch`: Python eagerly evaluated a fallback height even when an existing-station groundHeight was present. That attempt failed and was not accepted. The code now selects declared element/station support without evaluating the unused fallback. A fresh QGIS build and separate reopen both passed; all20 layers valid,17,532 actual exported vertex/raster comparisons exact.
4. A development-only parser attempt failed with an index-shape error before any geometry assertion; the indices are now explicitly reshaped into triangle triplets. Final binary checks and negative controls passed. This was not a production geometry failure.
5. A documentation-copy helper encountered a string/Path method error. Native files were unaffected; documentation and log copying subsequently completed.

QGIS3.40.6 reports the prior file was saved with3.44.10. AF_NETLINK sandbox warnings and GDAL future-warning remain in execution logs. They are not hidden; validity/CRS/preserved-layer/raster checks pass. No installation was required.

Original source/public binaries and past evidence remain unchanged relative to ed22133. The appended public sources ledger is handled by integration. The initial .blend backup is not published; initial hash/report evidence is retained instead.

## V2 experience correction
The v1 arrangement and steep inherited bridge transition failed the primary experience goal despite earlier geometric-consistency checks. Full v1 proofs are preserved under history/v1-production. V2 regrades the entire neck and relocates the lookout near its entrance. The first v2 centre-eye ray check at2x exposed a near shoulder occlusion (an unsuccessful2x sightline attempt, not a pass). The observation eye moves0.5m west/0.9m south on the same supported plateau; no2x camera hover is introduced. Final exact triangle-clipped checks pass at1x and2x, with smaller2x clearance explicitly recorded. Model slope remains steep and is not real-world walking guidance.
