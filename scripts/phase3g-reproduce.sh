#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p production/phase3g/logs
blender --background --factory-startup --python scripts/phase3g-build-blender.py > production/phase3g/logs/blender-build.txt 2>&1
python3 scripts/phase3g-verify-geometry.py > production/phase3g/logs/geometry-check.txt 2>&1
python3 scripts/phase3g-verify-edges.py > production/phase3g/logs/edge-check.txt 2>&1
blender --background production/phase3g/yamanaka-phase3g.blend --python scripts/phase3g-verify-blender.py > production/phase3g/logs/blender-reload.txt 2>&1
/usr/bin/python3 scripts/phase3g-build-gis.py > production/phase3g/logs/gis-build.txt 2>&1
/usr/bin/python3 scripts/phase3g-verify-gis.py > production/phase3g/logs/gis-reload.txt 2>&1
