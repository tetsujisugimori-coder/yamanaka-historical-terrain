"""Lossless GeoPackage packaging. Default: verify gzip and restore editable original."""
import argparse
import gzip
import hashlib
import json
import os
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'production/phase3i'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def atomic_write(path, data):
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as f:
        tmp = Path(f.name)
        f.write(data)
    try:
        os.replace(tmp, path)
    finally:
        tmp.unlink(missing_ok=True)


def pack(directory):
    raw = (directory / 'phase3i-editable.gpkg').read_bytes()
    assert raw.startswith(b'SQLite format 3\x00'), 'Not a GeoPackage SQLite container'
    compressed = gzip.compress(raw, mtime=0)
    manifest = {'format': 'gzip', 'file': 'phase3i-editable.gpkg',
                'archive': 'phase3i-editable.gpkg.gz',
                'bytes': len(raw), 'sha256': sha(raw),
                'archiveBytes': len(compressed), 'archiveSha256': sha(compressed)}
    assert gzip.decompress(compressed) == raw
    atomic_write(directory / manifest['archive'], compressed)
    atomic_write(directory / 'gis-package.json', (json.dumps(manifest, indent=2)+'\n').encode())
    return manifest


def prepare(directory):
    manifest = json.loads((directory / 'gis-package.json').read_text())
    # Fixed names: do not allow manifest-controlled paths.
    assert manifest['file'] == 'phase3i-editable.gpkg'
    assert manifest['archive'] == 'phase3i-editable.gpkg.gz'
    compressed = (directory / 'phase3i-editable.gpkg.gz').read_bytes()
    assert len(compressed) == manifest['archiveBytes'] and sha(compressed) == manifest['archiveSha256'], 'Archive hash/size mismatch'
    raw = gzip.decompress(compressed)
    assert len(raw) == manifest['bytes'] and sha(raw) == manifest['sha256'], 'Original hash/size mismatch'
    assert raw.startswith(b'SQLite format 3\x00'), 'Not a GeoPackage SQLite container'
    target = directory / 'phase3i-editable.gpkg'
    if target.exists():
        assert target.read_bytes() == raw, 'Local GeoPackage differs: preserve edits; move it aside manually before restoring'
    else:
        atomic_write(target, raw)
    return manifest


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pack', action='store_true', help='Package regenerated local original and record both SHA-256 hashes')
    args = parser.parse_args()
    print(json.dumps(pack(OUT) if args.pack else prepare(OUT), indent=2))
