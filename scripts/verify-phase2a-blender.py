import bpy,os,json,hashlib,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
assert Path(bpy.data.filepath).name=='yamanaka-phase2a.blend'
assert bpy.context.scene.unit_settings.scale_length==1
expected={'nm-context','nm-transition','nm-bailey','nm-moat','nm-rampart','nm-passage'}
objects=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith('nm-')]
assert {o['facilityId'] for o in objects}==expected
for o in objects:
 assert o['evidenceCategory']=='C';assert o['metresPerUnit']==1
 assert o['positionAccuracy'].startswith('UNKNOWN')
 assert len(o.data.vertices)>50 and len(o.data.polygons)>100
assert len([o for o in bpy.data.objects if o.type=='MESH'])==10
assert not list(bpy.data.libraries)
assert not [i for i in bpy.data.images if i.filepath]
assert bpy.data.objects['A_castle_current']['evidenceCategory']=='A'
original=json.loads(bpy.context.scene['phase1GeometryHashes'])
for name,sha in original.items():
 o=bpy.data.objects[name];h=hashlib.sha256()
 for v in o.data.vertices:h.update(struct.pack('<3f',*v.co))
 for p in o.data.polygons:h.update(struct.pack('<I',len(p.vertices)));h.update(struct.pack('<'+'I'*len(p.vertices),*p.vertices))
 assert h.hexdigest()==sha,name
Path(os.environ['PHASE2A_WORKER_OUTPUT']).write_text(json.dumps({'workerStatus':'CHECKS_AND_TEARDOWN_RETURNED','blender':bpy.app.version_string,'objects':[o.name for o in objects],'originalGeometryHashes':original,'externalDependencies':0,'scope':'reopened editable .blend, not historical accuracy'}),encoding='utf8')
