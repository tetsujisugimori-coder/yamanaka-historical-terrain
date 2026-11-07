"""Positive extraction and tamper/edited-original negative controls, temporary files only."""
import json
from pathlib import Path
import runpy
import tempfile

ROOT = Path(__file__).resolve().parents[1]
api = runpy.run_path(str(ROOT / 'scripts/phase3h-prepare-gis.py'))
source = ROOT / 'production/phase3h'
results = []
with tempfile.TemporaryDirectory() as temporary:
    out = Path(temporary)
    for name in ('gis-package.json', 'phase3h-editable.gpkg.gz'):
        (out / name).write_bytes((source / name).read_bytes())
    original = source.joinpath('phase3h-editable.gpkg').read_bytes()
    api['prepare'](out)
    assert out.joinpath('phase3h-editable.gpkg').read_bytes() == original
    results.append('fresh extraction exact original bytes')
    api['prepare'](out)
    results.append('identical existing original accepted')
    target = out / 'phase3h-editable.gpkg'
    target.write_bytes(b'local edits')
    try:
        api['prepare'](out)
        raise RuntimeError('Edited original accepted')
    except AssertionError:
        assert target.read_bytes() == b'local edits'
        results.append('edited original rejected without overwrite')
    target.unlink()
    archive = out / 'phase3h-editable.gpkg.gz'
    good = archive.read_bytes()
    archive.write_bytes(good[:-1])
    try:
        api['prepare'](out)
        raise RuntimeError('Broken archive accepted')
    except AssertionError:
        assert not target.exists()
        results.append('archive corruption rejected before extraction')
    archive.write_bytes(good)
    manifest = out / 'gis-package.json'
    metadata = json.loads(manifest.read_text())
    metadata['sha256'] = '0' * 64
    manifest.write_text(json.dumps(metadata))
    try:
        api['prepare'](out)
        raise RuntimeError('Wrong original hash accepted')
    except AssertionError:
        assert not target.exists()
        results.append('original hash mismatch rejected before write')
print(json.dumps({'status': 'PASS', 'checks': results}, indent=2))
