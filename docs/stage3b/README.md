# Stage 3-B — castle overview and modern development layers

## Acceptance scope

This implementation separates four kinds of information: current DEM A, historic source catalog, existing C/D model geometry envelopes, and modern software-development progress. **It does not complete geographic registration of the historic plan.** Eleven documented regions remain unplaced. The diagram cannot be safely registered without independent correspondence points. A source name or visual similarity is not a survey control point. Never force the plan onto the old approximate observation anchors.

The lightweight overview displays actual model envelopes without loading all detailed GLBs; a model selection can load the existing detailed view. Model bounds are computed from POSITION vertices and the scene hierarchy, not accessor min/max claims. These are axis-aligned bounding envelopes, not occupied solid footprints or archaeological boundaries. Envelope center is a UI placement convention, not an identified historic center. Existing objects are never repositioned.

## Data and provenance

- `research/stage3b/regions.json`: original summaries of 11 named areas, source pages, relative relations, and null geographic geometry.
- `research/stage3b/progress.json`: separate modern development snapshot. Four supported lifecycle values plus UNKNOWN. Only Issue #41's model-coordinate audit is presently marked in progress. Open historical issues do not automatically mean every region is unfinished. The construction sign marks this software audit and is not a claim of physical site construction.
- `public/data/castle-overview.json`: generated source catalog, 22 actual model envelopes, current DEM coverage, separated progress and asset SHA256 values.
- `production/stage3b/*.geojson`: EPSG:6676 projected coordinates, explicitly **not RFC7946 WGS84**. QGIS sets the known source CRS, without treating the values as longitude/latitude.
- `production/stage3b/yamanaka-stage3b-overview.qgz`: derivative of existing QGIS project; no original project or raw report map is modified or embedded.
- `research/stage3b/preserved-inputs.json`: 185 protected source files pinned to the starting main.

EPSG:6676 uses metres. Existing origin E=44862.121277226666, N=-93478.07235405142 is retained. glTF x=E−E0, y=orthometric height, z=−(N−N0). Numeric agreement is not geographical accuracy. Vertical datum revision and DEM acquisition epoch remain those of the source metadata (UNKNOWN where not supplied). Present terrain is not the terrain of 1590.

Historical designated area, estimated castle extent, DEM acquisition area, and modeled area remain distinct. No circle/rectangle is invented from reported area totals. Current DEM contains the model envelopes, but complete historical castle coverage is UNKNOWN without a historic boundary.

## Reproduction

```
npm ci
node scripts/stage3b-overview-generate.mjs --verify
node scripts/stage3b-preservation-check.mjs
node --test --test-concurrency=1 tests/*.test.mjs
npm run build
npm run dev -- --port 4393
TEST_URL=http://127.0.0.1:4393 EVIDENCE_DIR=/tmp/stage3b-evidence node scripts/stage3b-overview-browser.mjs
QT_QPA_PLATFORM=offscreen /usr/bin/python3 scripts/stage3b-qgis.py
```

To regenerate derived JSON after a justified input update, omit `--verify`, inspect its diff and repeat the checks. QGIS generation requires installed QGIS Python bindings; absence is NOT_TESTED, never success. Generated QGZ is validated by reading it back, not promised byte-identical because QGIS records session metadata. JSON/GeoJSON generation is deterministic.

Schema v1 rejects VERIFIED georeferencing. A future control-point schema and independent checks are required before enabling such certification. Missing, invalid, duplicate, inconsistent or out-of-region data is rejected. No invalid historic polygon is silently promoted to a current model boundary. A failed overview load does not disable the existing terrain view; retry is explicit.

## Dependencies and limits

Starting main is `5adb7156acda3968827ff39d5e6f40c4ac837ec5`. PR #36 is included. PR #38 was open at inspection, HEAD `666aa9cb8ccc159b716fa0d3ac1699cbdaf24310`; it has not been merged here. Thus CAD-derived B0/B1/B2 are a recorded pending dependency, not an integration claim. No PR #34/#35 optimization or metrics changes are imported.

Detailed placement of Honmaru, Ninomaru, Kitanomaru, Nishinomaru, Moto-Nishi/Nishi-yagura, Sannomaru, Daizaki and other regions remains unplaced. Raw historic plan overlay and precise whole-castle geography are NOT_COMPLETED, so whole Stage 3-B completion cannot be PASS. See SOURCES.md for the actual source inspection and QGIS limitations.

Existing QGIS projects were read without saving: 10 projects, 82 references, 79 valid; phase3h has 3 existing invalid references. The base `yamanaka.qgz` and new derivative have valid references. This work does not repair unrelated historical GIS projects.

Real iPhone Safari, physical touch/VoiceOver, historic survey accuracy, GPU performance improvements and model-position historical confirmation are NOT_TESTED or UNKNOWN. No deployment, automatic merge, new historic reconstruction, or combat simulation is performed.

The 22-envelope numerical audit covers five saved GLBs. Runtime-generated vegetation and library palisades are not separately measured here. PR #38 CAD B0/B1/B2 remains unintegrated. Do not describe this bounded audit as all existing runtime models fully verified.

## 継続状況の更新

上記は初回成果の履歴です。PR #38はその後mainへ採用されました。新mainへのローカル統合と、再依頼との差分・残件・未検証事項は[2026-11-10継続記録](CONTINUATION-20261110.md)を参照してください。初回の359試験と185原本の結果を、新mainや最終CIの結果として流用しません。
