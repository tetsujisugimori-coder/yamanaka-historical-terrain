import gzip
"""Run with installed Blender --background --factory-startup --python SCRIPT."""
import bpy,json,runpy,hashlib,struct
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'production/phase3g';OUT.mkdir(exist_ok=True)
s=runpy.run_path(str(ROOT/'scripts/phase3g-recipe.py'));params=s['PARAMETERS']
(OUT/'parameters.json').write_text(json.dumps(params,ensure_ascii=False,indent=2)+'\n')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
protected=[p for pattern in ['public/data/*.glb','production/*.blend','production/*.qgz','production/phase3f/*'] for p in ROOT.glob(pattern) if p.is_file() and not p.name.startswith('phase3g')]
before={str(p.relative_to(ROOT)):sha(p) for p in protected}
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
all_objects=[];records=[];patch_triangles=[]
for kind,path,output,prefix in [('nm','production/phase3f/yamanaka-phase3f.blend','phase3g.glb','nm-'),('inner','production/phase3f/yamanaka-phase3f.blend','phase3g-inner.glb','ic-')]:
 with bpy.data.libraries.load(str(ROOT/path),link=False) as (src,dst):
  dst.objects=[name for name in src.objects if name.startswith(prefix)]
 objects=[]
 for o in dst.objects:
  if o is None or o.type!='MESH':continue
  bpy.context.scene.collection.objects.link(o);o.hide_set(False);o.hide_render=False
  objects.append(o);all_objects.append(o)
  source_vertex_count=len(o.data.vertices);source_face_count=len(o.data.polygons)
  old=[tuple(v.co) for v in o.data.vertices];changed=0;outside=0;max_delta=0
  for v in o.data.vertices:
   e,n,z=v.co
   if o.name!='nm-context':
    d=s['displacement'](e,n,kind)
    if d:v.co.z=z+d
   if tuple(v.co)!=old[v.index]:
    assert s['inside'](e,n,kind);changed+=1;max_delta=max(max_delta,abs(v.co.z-z))
   elif not s['inside'](e,n,kind):outside+=1
  o.data.update()
  for poly in o.data.polygons:
   assert len(poly.vertices)==3
   ids=list(poly.vertices);new=[list(o.data.vertices[i].co) for i in ids]
   if any(tuple(o.data.vertices[i].co)!=old[i] for i in ids):
    patch_triangles.append(dict(model=output,object=o.name,face=poly.index,vertices=new,old=[list(old[i]) for i in ids]))
   else:assert all(tuple(o.data.vertices[i].co)==old[i] for i in ids)
  # The immutable original A-derived context is left completely unmodified.
  if o.name!='nm-context':
   o['modelVersion']='phase3g-v1';o['evidenceCategory']='C';o['phase3gLedger']='data/phase3g.json'
   o['phase3gHypothesis']='C local terrain edit; no new measured or historical dimensions. D appearance separate.'
  records.append(dict(name=o.name,model=output,sourceVertices=source_vertex_count,sourceTriangles=source_face_count,vertices=len(old),triangles=len(o.data.polygons),changedVertices=changed,outsideUnchanged=outside,maxDisplacement=max_delta))
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0]
 bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/data'/output),export_format='GLB',use_selection=True,export_extras=True,export_yup=True,export_normals=(kind=='inner'))
# Compact raw exact edited triangles for independent GIS conversion and reload audit.
(OUT/'changed-triangles.json.gz').write_bytes(gzip.compress((json.dumps(patch_triangles,separators=(',',':'))+'\n').encode(),compresslevel=9,mtime=0))
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':
   area.spaces.active.region_3d.view_location=Vector((-52,-10,570));area.spaces.active.region_3d.view_distance=80;area.spaces.active.clip_end=15000
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
scene['phase3gParameters']='parameters.json';scene['phase3gEvidence']='Only C copied terrain edited. A-derived context unchanged. All originals remain separate, immutable. D presentation not evidence.'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'yamanaka-phase3g.blend'),compress=True)
assert all(sha(ROOT/p)==h for p,h in before.items())
report=dict(status='PASS',execution='installed Blender background CLI; no GUI claim',blender=bpy.app.version_string,objects=records,protectedFileHashes=before,changedTriangles=len(patch_triangles),topology='NM and inner: unchanged F vertices XY and triangle topology; bounded vertex Z edits only',B=0)
(OUT/'blender-build.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='protectedFileHashes'}))
