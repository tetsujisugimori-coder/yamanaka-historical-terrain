# Phase 3G: bounded C geometry source

This is an editable, reproducible overlay of **inferred C**, not a measured 1590 surface. Existing A and Phase 3F files are immutable inputs. No new historic dimension or B classification is introduced. All rendering D effects remain outside this shape recipe.

## Native inputs and coordinates

- Base commit: `aee4fd10960a345e169caef381b120f3fe3f3ac8` (merged F).
- Input: `production/phase3f/yamanaka-phase3f.blend`; comparison: `public/data/phase3f.glb` and `phase3f-inner.glb`.
- Units: metres; native Blender east/north/up; GLB east/up/south.
- Local origin comes unchanged from `public/data/castle.json`; horizontal CRS EPSG:6676. Model Z is not a new absolute-elevation claim.
- All 242,203 native vertices, XY positions, and 473,792 triangles are retained. Changed vertex counts count object-local vertices; shared material-boundary vertices can occur in more than one object.

## Shape revision and scope

See `parameters.json` for exact rectangles and assumptions. The existing F surface is copied; no whole-castle subdivision is done.

1. Moat rectangle E −62…−42, N −23…29 m: soften shoulder and toe profile with the quintic `6t^5−15t^4+10t^3`, widen the assumed half-crown .3→.4 m and slope run 1.9→2.1 m, preserve depth 2.05 m and ridge pitch 7 m. Those numbers are authoring assumptions, not archaeology.
2. Rampart E −41…−31, N −21…27 m: widen assumed crown half-width .8→1 m and shorten shoulder run 3.2→3 m, retaining 2.65 m assumed height. Improve crest/flank/toe joins, not arbitrary random noise.
3. Bridge E −96…−72, N −39…−20 m: use quintic crown/toe profile and reduce the extra crown .24→.20 m. Existing four-metre passage width and boundaries remain unchanged. This includes only the adjoining already-modelled outer entrance surface, not a broad new gate terrain model.

The quintic profile and boundary feather have zero first/second derivative at their endpoints. This describes the analytic correction, not a claim that a finite triangular mesh is globally differentiable. The inherited F surface and triangulation remain piecewise planar. At the boundary, delta is exactly zero. No new route is constructed.

Actual measured max coordinate changes: moat 0.3572998046875 m; rampart 0.28765869140625 m; bridge-region 0.03997802734375 m. These are F→G displacement measures, not historical dimensions. Fixed sections intersect multiple patches, so their maximum delta need not equal the rampart-only maximum.

## Regeneration and verification

Run `bash scripts/phase3g-reproduce.sh` from repository root with installed Blender 4.3.2, Python/NumPy, system QGIS 3.40.6/GDAL. The script creates new G files only. It uses real Blender background CLI and QGIS Python bindings with offscreen rendering; GUI/physical-device tests are NOT_TESTED.

- `yamanaka-phase3g.blend`: editable master for all 13 meshes.
- `phase3g-editable.gpkg`, `yamanaka-phase3g.qgz`: editable exact XYZ changed triangles, bounds, and actual-mesh sections, not a fabricated raster DEM.
- `phase3g-qgis-map.png`: native QGIS map export, not a GUI screenshot.
- `changed-triangles.json.gz`: deterministic triangle-coordinate transfer to GIS.
- `public/data/phase3g*.glb`: GLB exports. NM has no duplicated normal attribute; web viewer computes normals, as in F.
- `public/data/phase3g.json`: four sections and five affected-region guide supports, directly sampled from actual GLB triangles. Other three guide points retain their original metadata.
- `blender-build.json`, `geometry-check.json`, `edge-check.json`, `blender-reload.json`, `gis-build.json`, `gis-reload.json`: performed checks and exact file hashes.

The raw-GLB audit checks finite/upward triangles, duplicate triangles, exact XY topology, unchanged out-of-scope triangle coordinate triples, and shared XY/Z seam consistency. Inner coverage is 3040 m² with no interior open edges/T-junctions. Reopened Blender triangles and GLB triangles match exactly. QGIS reopened XYZ differs by zero. This is self-verification by a separate computation path; independent-review results must be reported separately.

Negative controls in the saved-native/GLB equality gate reject an altered height, swapped axes, millimetre scaling, missing triangle, and empty set. They are in-memory deliberate faults, not a claim of browser end-to-end injection.

## Limits

No new archaeological evidence, real iPhone performance/physics acceptance, broad gate-area restoration, or new LOD is established by these production files. QGIS GeoPackage and Blender container bytes may include application metadata; geometry and source/GLB hashes are tracked separately. Old F evidence and original A remain accessible.
