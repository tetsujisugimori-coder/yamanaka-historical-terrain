"""Separate Blender process reopens the NEW native master and checks saved data."""
import bpy,json,struct,runpy,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'production/phase3i'
assert Path(bpy.data.filepath)==OUT/'yamanaka-phase3i.blend'
r=json.loads((OUT/'blender-build.json').read_text())
assert bpy.context.scene.unit_settings.scale_length==1
for record in r['objects']:
 o=bpy.data.objects[record['name']];assert o.type=='MESH'
 assert len(o.data.vertices)==record['vertices'] and len(o.data.polygons)==record['triangles']
 assert o.name=='nm-context' or o['evidenceCategory']=='C'
for path,sha in r['protectedFileHashes'].items():assert hashlib.sha256((ROOT/path).read_bytes()).hexdigest()==sha
# Directly compare native triangle-coordinate multisets to the rendered GLB.
parser=runpy.run_path(str(ROOT/'scripts/phase3i-verify-geometry.py'));key=parser['key']
checked=0;controls=[]
def compare(actual,expected):
 assert actual and expected,'empty evidence'
 assert len(actual)==len(expected),'triangle count mismatch'
 assert actual==expected,'native/GLB geometry mismatch'
for name in ['phase3i.glb','phase3i-inner.glb']:
 for id,model in parser['read'](name).items():
  o=bpy.data.objects[id];native={tuple(sorted(tuple(float(x) for x in o.data.vertices[i].co) for i in p.vertices)) for p in o.data.polygons}
  exported={key(t) for t in model['tri']};compare(native,exported);checked+=len(native)
  if id=='nm-moat':
   t=next(iter(exported))
   changes={'height':tuple((x,y,z+1) for x,y,z in t),'axis':tuple((x,z,y) for x,y,z in t),'units':tuple((x*1000,y*1000,z*1000) for x,y,z in t)}
   bads={'missingTriangle':exported-{t},'empty':set()}
   for label,mut in changes.items():bads[label]=(exported-{t})|{mut}
   for label,bad in bads.items():
    try:compare(native,bad)
    except AssertionError:controls.append({'case':label,'expected':'REJECT','actual':'REJECT'})
    else:raise AssertionError('fault accepted: '+label)
report=dict(status='PASS',execution='separate installed Blender background process reopened saved .blend',blender=bpy.app.version_string,objects=len(r['objects']),nativeAndGLBTrianglesExactlyEqual=checked,protectedFilesUnchanged=len(r['protectedFileHashes']),negativeControls=controls,B=0,glbSha256={name:hashlib.sha256((ROOT/'public/data'/name).read_bytes()).hexdigest() for name in ['phase3i.glb','phase3i-inner.glb']})
(OUT/'blender-reload.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
