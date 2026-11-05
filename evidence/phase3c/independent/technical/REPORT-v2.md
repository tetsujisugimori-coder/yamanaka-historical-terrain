# Independent technical review: v2

**Technical scope PASS. No open P1/P2 found in the checks below. Browser/visual acceptance remains separate.**

Reviewed local product HEAD `c71edbf440ddada2acf0e74501c47afad1772adc`, tree `f49d1348354df2a147609e43558f42ac9c06c498`. A remote commit with a different SHA is covered only if its product tree is verified identical. The earlier REPORT.md and original P2 failure remain historical evidence, not a v2 approval.

## Independent methods and results

- Read actual GLB bytes with reviewer-owned struct/numpy parser, apply glTF transforms, intersect exported triangles. No production elevation or sightline functions were used as an oracle.
- GLB SHA256 `810c858a08259b85399530a07faa762da56921613d6c09ef60eaee72f77fbfc4`: 7,342 triangles, exact projected footprint 3,040m², no projected degenerate triangles, no internal boundary edges, zero retained wb/nm-transition projected overlap. Perimeter height discrepancy to prior actual GLB triangles at vertices and edge midpoints is at most 0.000030517578125m. Stable C IDs and east/up/south coordinates remain consistent.
- Independent line/triangle-edge intersection partitions, not producer barycentric interval code, yield exact planar profiles across full E=-100..-68 at N=-31,-30,-29,-28,-27. Maximum longitudinal grades respectively 0.497620, 0.492432, 0.487976, 0.483521, 0.493347. These are mesh grades, not proof of historical access or safe real-world walking.
- Three actual-triangle lookout rays toward gate and bridge targets are clear at 1x and 2x. Minimum clearance for the tightest 2x ray is 0.095406m. This is a narrow model-specific margin, not evidence of robustness to future shape/camera edits; rerun after such changes.
- Same southern-bank target E=-75,N=-35 is occluded from outside (minimum clearance -0.550346m at 1x, -1.800692m at 2x) and visible from inside (+0.2m both scales). This supports the intended relationship in model geometry without claiming browser perceptual quality or historical defensive effectiveness.
- Independent Three Raycaster target check against actual meshes: src/phase3c.js supportedPose target equals displayed terrain height at target plus physical offset at both scales, while eye remains 1.7m above support. The previous unscaled lookDown formula has nonzero error at 2x. Metadata support heights match exported geometry.
- Negative controls: independently read v1 archived GLB and measured bridge max grade 2.376282, rejected by 0.5-grade criterion; reinserting a 10m ridge into v2 ray path produces -9.182091m clearance and is rejected. Original coordinate/ID/category/seam and shared-UV negative controls remain in v1 evidence; they were not relabelled as newly executed v2 controls.

## Native sources and reproducibility

- Separate Blender process reopened compressed v2 .blend successfully. Compared decoded coordinates, polygons and transforms with independently recorded prior .blend: all 693 prior meshes unchanged; 7 new meshes; unit scale 1m. Compression is not judged by raw-byte equality.
- Independent selected-object GLB re-export from compressed v2 .blend: every triangle coordinate equals released GLB exactly, and extras match for all seven meshes. This verifies native-to-GLB reproducibility, not a clean-machine full recipe rebuild.
- Separate QGIS read: 21 layers valid; new sightline layer has five features and EPSG:6676. All eight station metadata supports match actual surfaces. This verifies file readability and modeled registration, not surveyed/historical georeferencing.
- Fixed sections lie east of the unchanged patch boundary E=-68, and prior actual source GLBs remain unchanged. Prior runtime clipping/ownership findings and corrected dependency guard apply because those product paths were unchanged in v2.

## Scope limits and recommendation

Technical recommendation: YES for this tested v2 scope, contingent on identical delivered product tree and separate browser/visual CI acceptance. No independent browser screenshots, sustained FPS, GPU-memory measurement, physical Safari/VoiceOver, or field survey were performed by this reviewer. Geometry visibility is not a substitute for screenshots. No product files were edited.

Reproduce using reviewer scripts `mesh_review.py`, `v2_rays.py`, `v2_negative.py`, `v2_target.mjs`, `native_blender.py`, `native_qgis.py`, and `v2_reexport.py` in this folder. Raw v2 JSON files and native logs accompany this report.
