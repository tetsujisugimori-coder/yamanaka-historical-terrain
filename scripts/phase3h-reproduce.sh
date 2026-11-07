#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p production/phase3h/logs
blender --background --factory-startup --python scripts/phase3h-build-blender.py > production/phase3h/logs/blender-build.txt 2>&1
python3 scripts/phase3h-verify-geometry.py > production/phase3h/logs/geometry-check.txt 2>&1
python3 scripts/phase3h-verify-expansion.py > production/phase3h/logs/expansion-check.txt 2>&1
python3 scripts/phase3h-verify-edges.py > production/phase3h/logs/edge-check.txt 2>&1
blender --background production/phase3h/yamanaka-phase3h.blend --python scripts/phase3h-verify-blender.py > production/phase3h/logs/blender-reload.txt 2>&1
/usr/bin/python3 scripts/phase3h-build-gis.py > production/phase3h/logs/gis-build.txt 2>&1
python3 scripts/phase3h-prepare-gis.py --pack > production/phase3h/logs/gis-package.txt 2>&1
/usr/bin/python3 scripts/phase3h-verify-gis.py > production/phase3h/logs/gis-reload.txt 2>&1
