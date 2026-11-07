"""Separate Blender process reopens the NEW native master and checks saved data."""
import bpy,json,struct,runpy,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'production/phase3f'
assert Path(bpy.data.filepath)==OUT/'yamanaka-phase3f.blend'
r=json.loads((OUT/'blender-build.json').read_text())
assert bpy.context.scene.unit_settings.scale_length==1
for record in r['objects']:
 o=bpy.data.objects[record['name']];assert o.type=='MESH'
 assert len(o.data.vertices)==record['vertices'] and len(o.data.polygons)==record['triangles']
 assert o.name=='nm-context' or o['evidenceCategory']=='C'
for path,sha in r['protectedFileHashes'].items():assert hashlib.sha256((ROOT/path).read_bytes()).hexdigest()==sha
# Directly compare native triangle-coordinate multisets to the rendered GLB.
parser=runpy.run_path(str(ROOT/'scripts/phase3f-verify-geometry.py'));key=parser['key']
checked=0
for name in ['phase3f.glb','phase3f-inner.glb']:
 for id,model in parser['read'](name).items():
  o=bpy.data.objects[id];native={tuple(sorted(tuple(float(x) for x in o.data.vertices[i].co) for i in p.vertices)) for p in o.data.polygons}
  assert native=={key(t) for t in model['tri']},id;checked+=len(native)
report=dict(status='PASS',execution='separate installed Blender background process reopened saved .blend',blender=bpy.app.version_string,objects=len(r['objects']),nativeAndGLBTrianglesExactlyEqual=checked,protectedFilesUnchanged=len(r['protectedFileHashes']),B=0,glbSha256={name:hashlib.sha256((ROOT/'public/data'/name).read_bytes()).hexdigest() for name in ['phase3f.glb','phase3f-inner.glb']})
(OUT/'blender-reload.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
