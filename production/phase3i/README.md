# Phase 3I editable C terrain

Read [production notes](../../docs/phase3i-production.md) for extent, assumptions, native tools and verification limits.

Run `python3 scripts/phase3i-prepare-gis.py` from the repository root before opening `yamanaka-phase3i.qgz`. This verifies and restores the exact editable GeoPackage from `phase3i-editable.gpkg.gz` beside the project. Full regeneration: `bash scripts/phase3i-reproduce.sh`.

EPSG:6676, metres; native east/north/up; glTF east/up/south. New native master is `yamanaka-phase3i.blend`. Do not overwrite H or A originals. Geometry is C hypothesis, D appearance lives separately in `src/nature-finish.js`.
