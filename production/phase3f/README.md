# Phase3F: bounded C terrain edits

All geometry edits are explicit C hypotheses. Nothing is promoted to B. No new historical facts, surveyed dimensions, 1590 positions, construction methods or access claims are introduced. Source references remain in `public/data/nishinomaru-layout.json` and `public/data/phase3c.json`. `parameters.json` records model assumptions, not measured dimensions. Original A/current DEM, old native masters and old GLBs are immutable. D material and lighting treatments remain separate; these meshes inherit portable neutral materials.

## Native deliverables

- `yamanaka-phase3f.blend`: editable copied terrain meshes, 13 objects, metric E/N/up coordinates. Original facility/element IDs and material roles retained. `nm-context` is an unmodified A-derived display shell, **not newly inferred or modified A data**.
- `yamanaka-phase3f.qgz`: independent editable EPSG:6676 C overlay project, not a replacement for any original GIS master.
- `phase3f-editable.gpkg`: 3D polygon features for altered triangles, patch bounds and actual exported-mesh cross-sections. Z is existing model height in metres; no new datum is asserted.
- `phase3f-qgis-map.png`: native QGIS map export, **not a GUI screenshot**.
- New full model replacement `public/data/phase3f.glb`; bridge replacement `public/data/phase3f-inner.glb`. glTF axes E/up/south. New metadata `public/data/phase3f.json` contains real triangle-intersection sections and observation support heights. None of the old public data files are overwritten.

## Why these changes are geometry improvements

The existing Nishinomaru quarter-metre grid already resolves the proposed features. Keeping its topology and XY coordinates preserves triangulation, facility boundaries, and all unrelated triangles exactly. Only Z changes inside two bounded patches. The shoji grid pitch stays 7m (inherited C assumption); smooth cubic shoulders round the ridge crown and bowl toe with a 2.05m model depth. The rampart uses a 1.6m-wide rounded crest, 3.2m side run, and 2.65m height above its inherited local platform. Its existing footprint stays put. These figures are model choices, not archaeological findings. Actual maximum vertex displacements are reported separately from designed depths/heights.

The bridge's original one-metre grid is locally refined. Each enclosed old triangle gets a centre fan; interior shared edges get four divisions, while edit-perimeter edges retain their old endpoints. This is conforming local subdivision, not an assertion of a uniform 0.25m grid. New vertex base heights interpolate the old triangle. A small 0.24m earth crown and up to 0.35m side-toe rounding are applied as deterministic transverse profiles. No random noise or new wooden structure is used. Outside the patch the exact old triangles survive. The full inner surface is independently checked for edge valence, shared-height consistency, and projected coverage.

A cubic feather drives displacement to zero at every patch perimeter, including zero analytic first derivative. Final polygonal geometry remains piecewise linear, so no mathematical C1 mesh continuity is claimed. Existing outside slopes are retained; this work does not certify historic navigability or current visitor safety.

Local E/N patch bounds: shoji moat `[-62,-23,-42,29]`; rampart `[-41,-21,-31,27]`; earthbridge `[-96,-39,-72,-20]`. QGIS uses the EPSG:6676 origin from immutable `castle.json` plus local XY.

## Reproduction and evidence

Run `bash scripts/phase3f-reproduce.sh` from a checkout with installed Blender 4.3.2, QGIS 3.40.6, GDAL and Python NumPy. This was executed with Blender background CLI and QGIS offscreen Python bindings; no interactive GUI operation is claimed. Only new Phase3F outputs are written. Parameters are defined in `scripts/phase3f-recipe.py`; edit that deterministic configuration and rebuild to change the profiles.

`blender-build.json` records old/new counts, changes and protected-file SHA-256 hashes. `geometry-check.json` reads GLB buffers directly without importing the authoring profile. It compares exact triangle coordinate sets, permits changes only within declared patches, checks finite/nondegenerate geometry and C classification, and computes sections from the real triangles. Source and new meshes are selected using the same inner-patch replacement precedence as the viewer, excluding the hidden old context under the inner patch.

`blender-reload.json` comes from a separate Blender process reopening the new master and compares all native and exported triangle coordinate sets exactly. `gis-reload.json` comes from a separate QGIS process reopening the new QGZ and GeoPackage, checks every altered polygon's XYZ against the native build, validates layers, and renders the map export. Raw program output is retained in `logs/`. `changed-triangles.json.gz` is an exact native-mesh exchange record for GIS, not a surveyed terrain source.

## Compact transport packaging

The Nishinomaru GLB omits redundant exported normals so exact equal positions can share vertices; the viewer computes vertex normals. Position float32 values, triangle coordinate multisets and metadata remain exact. The inner GLB keeps its normals because its loader does not recompute them. The editable GeoPackage omits the optional spatial index for the changed-triangle layer. No feature or XYZ coordinate is removed. The raw native triangle exchange JSON is losslessly gzip-compressed. Earlier receipts and raw logs are retained under `evidence/phase3f/native-precompact/`.
