#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p production/phase3f/logs
blender --background --factory-startup --python scripts/phase3f-build-blender.py > production/phase3f/logs/blender-build.log 2>&1
python3 scripts/phase3f-verify-geometry.py > production/phase3f/logs/geometry-check.log 2>&1
python3 scripts/phase3f-verify-edges.py > production/phase3f/logs/edge-check.log 2>&1
blender --background production/phase3f/yamanaka-phase3f.blend --python scripts/phase3f-verify-blender.py > production/phase3f/logs/blender-reload.log 2>&1
/usr/bin/python3 scripts/phase3f-build-gis.py > production/phase3f/logs/gis-build.log 2>&1
/usr/bin/python3 scripts/phase3f-verify-gis.py > production/phase3f/logs/gis-reload.log 2>&1
