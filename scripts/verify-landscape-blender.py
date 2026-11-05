import bpy,json,hashlib,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
expected=json.loads(bpy.context.scene['landscapeOriginalMeshHashes'])
def digest(o):
 h=hashlib.sha256()
 for v in o.data.vertices:h.update(struct.pack('<3f',*v.co))
 for p in o.data.polygons:h.update(struct.pack('<'+'I'*len(p.vertices),*p.vertices))
 return h.hexdigest()
assert all(digest(bpy.data.objects[name])==sha for name,sha in expected.items())
elements=json.loads((ROOT/'public/data/landscape.json').read_text(encoding='utf8'))['elements'];ids={e['id']:e['category'] for e in elements}
objects=[o for o in bpy.data.objects if o.get('elementId')];assert objects
assert all(o['evidenceCategory']==ids[o['elementId']] for o in objects)
assert {o['elementId'] for o in objects}==set(ids)
assert bpy.context.scene.unit_settings.scale_length==1
assert not any(i.filepath for i in bpy.data.images if i.source=='FILE')
(ROOT/'evidence/landscape/blender-check.json').write_text(json.dumps(dict(status='PASS',reread=True,oldMeshHashes=expected,objects=len(objects),elements=ids,externalImages=0),indent=2),encoding='utf8')
