"""Storage-only native compression, executed on the existing Phase3C source.
Reproduce: blender -b production/yamanaka-phase3c.blend --python evidence/phase3c/native/compress-source.py
Then run scripts/phase3c-verify-blender.py in a separate process.
"""
import bpy,json,hashlib,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
p=ROOT/'production/yamanaka-phase3c.blend'
assert Path(bpy.data.filepath).resolve()==p.resolve()
def file_record(path):return dict(bytes=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest())
def mesh_digest(o):
 h=hashlib.sha256()
 for v in o.data.vertices:h.update(struct.pack('<3f',*v.co))
 for f in o.data.polygons:
  h.update(struct.pack('<I',len(f.vertices)));h.update(struct.pack('<'+'I'*len(f.vertices),*f.vertices))
 h.update(struct.pack('<16f',*(v for row in o.matrix_world for v in row)))
 return h.hexdigest()
old=file_record(p)
mesh_before={o.name:mesh_digest(o) for o in bpy.data.objects if o.type=='MESH'}
protected=[*sorted((ROOT/'public/data').glob('*.glb')),*sorted((ROOT/'production').glob('*.blend'))]
protected=[x for x in protected if x!=p]
hashes={str(x.relative_to(ROOT)):file_record(x) for x in protected}
bpy.ops.wm.save_as_mainfile(filepath=str(p),compress=True)
assert {o.name:mesh_digest(o) for o in bpy.data.objects if o.type=='MESH'}==mesh_before
assert all(file_record(ROOT/name)==record for name,record in hashes.items())
report=dict(status='SAVE_PASS_REOPEN_PENDING',operation='Blender native compress=True; storage-only',blender=bpy.app.version_string,before=old,after=file_record(p),meshHashes=mesh_before,protectedFiles=hashes,separateReopen=False)
(ROOT/'evidence/phase3c/native/source-compression.json').write_text(json.dumps(report,indent=2)+'\n')
