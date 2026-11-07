# Phase3D C connecting defence candidates

All new geometry is C, never B or a measured restoration. Appearance is D and managed separately in the web UI. The neutral source material contains no external textures. Historical existence, placement, dimensions, timber and joinery remain UNKNOWN. Existing A/C terrain is read-only. The .blend contains standalone editable metric meshes in east/north/up; GLB axes are east/up/south. QGIS and three GeoJSON layers use EPSG:6676 with the unchanged castle origin and relative paths.

The 63 parts form two side assemblies ending at the portal. Posts are embedded 0.06 m at their corners using actual exported phase3c GLB triangles. Corner tolerance is 0.003 m; interior embed may range 0–0.13 m due to linear bottom faces crossing terrain triangulation. Rails at 0.75/1.35 m nominal elevation above sampled corners overlap posts. Last span is 1.5 m; other spans 2 m. These are model design values only.

The E[-100,-68], N[-31,-27] route has a 2.5 m clearance requirement. Only the lintel overlaps this route. Independent GLB tests sample contact and clip original terrain triangles to calculate the exact ground maximum below the flat lintel. Other contact/rail tests use finite samples and do not claim continuous contact proof. Connected bounds are a coarse assembly check, not structural certification. Model route clearance does not establish real or historic navigability, accessibility, combat data or permission to enter the site.

Reproduce from repository root after preserving scripts/design:

    blender --background --factory-startup --python scripts/phase3d-build-blender.py
    QT_QPA_PLATFORM=offscreen /usr/bin/python3 scripts/phase3d-build-gis.py
    blender --background production/phase3d/yamanaka-phase3d.blend --python scripts/phase3d-verify-blender.py
    node scripts/phase3d-geometry-check.mjs
    node --test tests/phase3d-geometry.test.mjs

Tests do not import authoring code. Negative controls alter floating/buried posts, introduce a regrounded route obstruction, lower the lintel and change classification to B. Native checks reopen sources, compare exported vertex hashes, verify editable meshes, and reread all three QGIS layers. Reports are generated fresh in this checkout; no lost-run results are reused. Archive metadata is nondeterministic, so reproduction means matching geometry and tests rather than identical compressed native-project bytes.
