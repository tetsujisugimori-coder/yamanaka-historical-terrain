"""Separate Blender process reopens final editable source; checks old geometry."""
import bpy,json,hashlib,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
assert Path(bpy.data.filepath).name=='yamanaka-phase3b.blend'
def digest(o):
    h=hashlib.sha256()
    for v in o.data.vertices:h.update(struct.pack('<3f',*v.co))
    for p in o.data.polygons:
        h.update(struct.pack('<I',len(p.vertices)));h.update(struct.pack('<'+'I'*len(p.vertices),*p.vertices))
    h.update(struct.pack('<16f',*(v for row in o.matrix_world for v in row)))
    return h.hexdigest()
old=json.loads(bpy.context.scene['phase3bOldGeometryHashes'])
assert all(digest(bpy.data.objects[name])==value for name,value in old.items())
objects=[o for o in bpy.data.objects if o.type=='MESH' and str(o.get('elementId','')).startswith('wb-')]
assert objects;assert all(o['evidenceCategory']=='C' for o in objects)
ids=sorted(set(o['elementId'] for o in objects));assert ids==['wb-bailey','wb-building','wb-gate','wb-moat']
assert bpy.context.scene.unit_settings.scale_length==1
assert len([x for x in bpy.data.images if x.source=='FILE'])==0
report=dict(status='PASS',blender=bpy.app.version_string,reread=True,preservedMeshes=len(old),newObjects=len(objects),ids=ids,
    meshHashes={o.name:digest(o) for o in objects},externalImages=0,metresPerUnit=1)
(ROOT/'evidence/phase3b/native/blender-check.json').write_text(json.dumps(report,indent=2),encoding='utf8')
