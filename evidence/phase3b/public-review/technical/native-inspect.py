import bpy, json, struct, hashlib, sys
from pathlib import Path

root=Path(sys.argv[sys.argv.index('--')+1]);out=root/'evidence/phase3b/public-review/technical'
def mesh_fingerprint(o):
    h=hashlib.sha256()
    for row in o.matrix_world:h.update(struct.pack('<4d',*row))
    for v in o.data.vertices:h.update(struct.pack('<3d',*v.co))
    for face in o.data.polygons:h.update(struct.pack('<I',len(face.vertices)));h.update(struct.pack('<'+'I'*len(face.vertices),*face.vertices))
    return h.hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(root/'production/yamanaka-1590.blend'))
old={o.name:mesh_fingerprint(o) for o in bpy.data.objects if o.type=='MESH'}
bpy.ops.wm.open_mainfile(filepath=str(root/'production/yamanaka-phase3b.blend'))
preserved={name:bpy.data.objects.get(name) is not None and mesh_fingerprint(bpy.data.objects[name])==fingerprint for name,fingerprint in old.items()}
objects=[]
for o in bpy.data.objects:
    if o.type!='MESH' or not o.get('elementId','').startswith('wb-'):continue
    points=[]
    for v in o.data.vertices:
        p=o.matrix_world@v.co;points.append([p.x,p.z,-p.y])
    o.data.calc_loop_triangles()
    objects.append(dict(name=o.name,id=o.get('elementId'),category=o.get('evidenceCategory'),surface=o.get('surface',False),points=points,triangles=len(o.data.loop_triangles)))
result=dict(scope='Independent native reread; geometry fingerprints computed directly from old/new source, not embedded author hashes.',blender=bpy.app.version_string,preserved=preserved,units=bpy.context.scene.unit_settings.scale_length,objects=objects,externalImages=[x.name for x in bpy.data.images if x.source=='FILE'])
assert all(preserved.values())
assert result['units']==1 and len(objects)==412 and not result['externalImages']
(out/'native-points.json').write_text(json.dumps(result),encoding='utf8')
print('INDEPENDENT_NATIVE_COMPLETE',len(old),len(objects))
