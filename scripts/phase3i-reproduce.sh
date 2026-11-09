#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p production/phase3i/logs
blender --background --factory-startup --python scripts/phase3i-build-blender.py > production/phase3i/logs/blender-build.txt 2>&1
python3 scripts/phase3i-verify-geometry.py > production/phase3i/logs/geometry-check.txt 2>&1
blender --background production/phase3i/yamanaka-phase3i.blend --python scripts/phase3i-verify-blender.py > production/phase3i/logs/blender-reload.txt 2>&1
/usr/bin/python3 scripts/phase3i-build-gis.py > production/phase3i/logs/gis-build.txt 2>&1
python3 scripts/phase3i-prepare-gis.py --pack > production/phase3i/logs/gis-package.txt 2>&1
/usr/bin/python3 scripts/phase3i-verify-gis.py > production/phase3i/logs/gis-reload.txt 2>&1
