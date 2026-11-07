import gzip
"""Run with installed Blender --background --factory-startup --python SCRIPT."""
import bpy,json,runpy,hashlib,struct
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'production/phase3f';OUT.mkdir(exist_ok=True)
s=runpy.run_path(str(ROOT/'scripts/phase3f-recipe.py'));params=s['PARAMETERS']
(OUT/'parameters.json').write_text(json.dumps(params,ensure_ascii=False,indent=2)+'\n')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
protected=[p for pattern in ['public/data/*.glb','production/*.blend','production/*.qgz'] for p in ROOT.glob(pattern) if not p.name.startswith('phase3f')]
before={str(p.relative_to(ROOT)):sha(p) for p in protected}
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
all_objects=[];records=[];patch_triangles=[]
for kind,path,output,prefix in [('nm','production/yamanaka-phase2a.blend','phase3f.glb','nm-'),('inner','production/yamanaka-phase3c.blend','phase3f-inner.glb','ic-')]:
 with bpy.data.libraries.load(str(ROOT/path),link=False) as (src,dst):
  dst.objects=[name for name in src.objects if name.startswith(prefix)]
 objects=[]
 for o in dst.objects:
  if o is None or o.type!='MESH':continue
  bpy.context.scene.collection.objects.link(o);o.hide_set(False);o.hide_render=False
  objects.append(o);all_objects.append(o)
  source_vertex_count=len(o.data.vertices);source_face_count=len(o.data.polygons)
  if kind=='inner':
   # Conforming local refinement: unchanged outer edges, four subdivisions on
   # shared inner edges; all new vertex heights interpolate the old triangle.
   b=params['patches'][2]['bounds'];vv=[tuple(v.co) for v in o.data.vertices];ff=[];lookup={tuple(v):i for i,v in enumerate(vv)}
   def vertex(v):
    key=tuple(v)
    if key not in lookup:lookup[key]=len(vv);vv.append(key)
    return lookup[key]
   for poly in o.data.polygons:
    ids=list(poly.vertices);pts=[vv[i] for i in ids]
    contained=all(b[0]<=v[0]<=b[2] and b[1]<=v[1]<=b[3] for v in pts)
    if not contained:ff.append(ids);continue
    ring=[]
    for i,a in enumerate(pts):
     c=pts[(i+1)%3]
     boundary=(a[0]==c[0] and a[0] in [b[0],b[2]]) or (a[1]==c[1] and a[1] in [b[1],b[3]])
     divisions=1 if boundary else 4
     for j in range(divisions):ring.append(vertex(tuple(a[k]+(c[k]-a[k])*j/divisions for k in range(3))))
    centre=vertex(tuple(sum(v[k] for v in pts)/3 for k in range(3)))
    for i,a in enumerate(ring):ff.append((centre,a,ring[(i+1)%len(ring)]))
   mesh=bpy.data.meshes.new(o.name+'.phase3f-refined');mesh.from_pydata(vv,[],ff);mesh.update()
   for material in o.data.materials:mesh.materials.append(material)
   o.data=mesh
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
   o['modelVersion']='phase3f-v1';o['evidenceCategory']='C';o['phase3fLedger']='data/phase3f.json'
   o['phase3fHypothesis']='C local terrain edit; no new measured or historical dimensions. D appearance separate.'
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
scene['phase3fParameters']='parameters.json';scene['phase3fEvidence']='Only C copied terrain edited. A-derived context unchanged. All originals remain separate, immutable. D presentation not evidence.'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'yamanaka-phase3f.blend'),compress=True)
assert all(sha(ROOT/p)==h for p,h in before.items())
report=dict(status='PASS',execution='installed Blender background CLI; no GUI claim',blender=bpy.app.version_string,objects=records,protectedFileHashes=before,changedTriangles=len(patch_triangles),topology='NM: unchanged .25m topology; inner: conforming local centre-fan subdivision with .25 parametric edge spacing, perimeter edges unchanged; vertex Z profiles only',B=0)
(OUT/'blender-build.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='protectedFileHashes'}))
