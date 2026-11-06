"""Save only the new editable source collection; never overwrite prior source.
Can run standalone on the combined phase3c source, or after its authoring script.
"""
import bpy,json,hashlib,struct
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'evidence/phase3c/native'
TARGET=ROOT/'production/yamanaka-phase3c.blend'
assert Path(bpy.data.filepath).name in ['yamanaka-phase3b.blend','yamanaka-phase3c.blend']
def digest(o):
 h=hashlib.sha256()
 for v in o.data.vertices:h.update(struct.pack('<3f',*v.co))
 for p in o.data.polygons:h.update(struct.pack('<I',len(p.vertices)));h.update(struct.pack('<'+'I'*len(p.vertices),*p.vertices))
 h.update(struct.pack('<16f',*(v for row in o.matrix_world for v in row)))
 return h.hexdigest()
def record(p):return dict(bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest())
old=json.loads(bpy.context.scene['phase3cOldGeometryHashes'])
assert all(digest(bpy.data.objects[k])==v for k,v in old.items())
objects=[o for o in bpy.data.objects if o.type=='MESH' and str(o.get('elementId','')).startswith('ic-')]
assert len(objects)==7
before={o.name:digest(o) for o in objects};materials={m.name:list(m.diffuse_color) for o in objects for m in o.data.materials}
prior=record(TARGET) if TARGET.exists() else None
protected=[*sorted((ROOT/'public/data').glob('*')),*sorted((ROOT/'production').glob('*.blend')),*sorted((ROOT/'production').glob('*.qgz')),*sorted((ROOT/'production/phase3c').glob('*'))]
protected=[p for p in protected if p.is_file() and p!=TARGET]
hashes={str(p.relative_to(ROOT)):record(p) for p in protected}
# Remove duplicated old content only from the NEW saved scene. All prior files
# remain unchanged. New editable geometry and materials retain the same IDs/data.
keep={o.name for o in objects};collections={c.name for o in objects for c in o.users_collection}
for o in list(bpy.data.objects):
 if o.name not in keep:bpy.data.objects.remove(o,do_unlink=True)
for c in list(bpy.data.collections):
 if c.name not in collections:bpy.data.collections.remove(c,do_unlink=True)
for group in [bpy.data.meshes,bpy.data.materials,bpy.data.images]:
 for block in group:
  if block.users==0:block.use_fake_user=False
bpy.data.orphans_purge(do_local_ids=True,do_linked_ids=True,do_recursive=True)
assert {o.name:digest(o) for o in objects}==before
assert {m.name:list(m.diffuse_color) for o in objects for m in o.data.materials}==materials
scene=bpy.context.scene
for k in list(scene.keys()):
 if k.startswith('phase') and not k.startswith('phase3c'):del scene[k]
del scene['phase3cOldGeometryHashes']
scene['phase3cSourcePackaging']='standalone new candidate collection only; prior source files immutable and separate'
scene['phase3cPriorSource']='production/yamanaka-phase3b.blend'
scene['phase3cPriorMeshCountVerifiedBeforePackaging']=len(old)
scene['phase3cNewGeometryHashes']=json.dumps(before)
scene['phase3cEvidence']='C terrain hypotheses, no B or tower. Only new editable meshes; context remains in separate original source files.'
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':
   area.spaces.active.region_3d.view_location=Vector((-82,-25,568));area.spaces.active.region_3d.view_distance=55
bpy.ops.wm.save_as_mainfile(filepath=str(TARGET),compress=True)
assert all(record(ROOT/p)==h for p,h in hashes.items())
report=dict(status='SAVE_PASS_REOPEN_PENDING',operation='standalone source packaging; prior duplicated objects removed from NEW scene only',before=prior,after=record(TARGET),priorMeshesVerifiedBeforeRemoval=len(old),storedPriorMeshes=0,newObjects=len(objects),newMeshHashes=before,materials=materials,protectedFileHashes=hashes,separateReopen=False)
(OUT/'source-packaging.json').write_text(json.dumps(report,indent=2)+'\n')
