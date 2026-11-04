"""Load phase1 .blend; retain original objects and add editable C components."""
import bpy,json,os,importlib.util,math,datetime,hashlib,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('shape',ROOT/'scripts/phase2a-shape.py');s=importlib.util.module_from_spec(spec);spec.loader.exec_module(s)
assert Path(bpy.data.filepath).name=='yamanaka.blend'
g=json.loads((ROOT/'public/data/castle.json').read_text());layout=json.loads((ROOT/'public/data/nishinomaru-layout.json').read_text())
core=bpy.data.objects['A_castle_current']; assert core['evidenceCategory']=='A'
original={o.name:len(o.data.vertices) for o in bpy.data.objects if o.type=='MESH'}
def geometry_hash(o):
 h=hashlib.sha256()
 for v in o.data.vertices:h.update(struct.pack('<3f',*v.co))
 for p in o.data.polygons:h.update(struct.pack('<I',len(p.vertices)));h.update(struct.pack('<'+'I'*len(p.vertices),*p.vertices))
 return h.hexdigest()
original_hashes={o.name:geometry_hash(o) for o in bpy.data.objects if o.type=='MESH'}
collection=bpy.data.collections.new('Phase2A C inferred Nishinomaru');bpy.context.scene.collection.children.link(collection)
colors={'nm-bailey':(.48,.57,.33),'nm-moat':(.57,.31,.17),'nm-rampart':(.63,.48,.26),'nm-passage':(.71,.61,.43),'nm-transition':(.35,.45,.30)}
def material(id,color):
 m=bpy.data.materials.new(id+' C hypothesis');m.diffuse_color=(*color,1);m.use_nodes=True
 m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*color,1);return m
def mesh(id,verts,faces,color):
 m=bpy.data.meshes.new(id);m.from_pydata(verts,[],faces);m.update();o=bpy.data.objects.new(id,m);collection.objects.link(o);o.data.materials.append(material(id,color))
 o['facilityId']=id;o['evidenceCategory']='C';o['horizontalCRS']='EPSG:6676';o['originE']=g['origin'][0];o['originN']=g['origin'][1];o['metresPerUnit']=1
 o['sourceIds']='plan,mishima-moat,mishima-works';o['positionAccuracy']='UNKNOWN; no control point registration';o['modelVersion']='phase2a-v1';o['hypothesis']='Assumed footprint, orientation, platform level, bank and passage dimensions. Not a measured 1590 surface.'
 return o
b=s.BOUNDS;step=.25;cols=round((b[2]-b[0])/step)+1;rows=round((b[3]-b[1])/step)+1
verts=[(b[0]+c*step,b[1]+r*step,s.elevation(g,b[0]+c*step,b[1]+r*step)) for r in range(rows) for c in range(cols)]
faces={id:[] for id in colors}
for r in range(rows-1):
 for c in range(cols-1):
  a=r*cols+c
  # Same NW-SE diagonal as A, including every 5m boundary crossing.
  for f in [(a,a+1,a+cols+1),(a,a+cols+1,a+cols)]:
   e=sum(verts[i][0] for i in f)/3;n=sum(verts[i][1] for i in f)/3;faces[s.component(e,n)].append(f)
objects=[]
for id,ff in faces.items():
 ids=sorted({i for f in ff for i in f});mapping={old:new for new,old in enumerate(ids)}
 objects.append(mesh(id,[verts[i] for i in ids],[tuple(mapping[i] for i in f) for f in ff],colors[id]))
# Preserve A separately; the display alternative has no faces under the patch.
vv=[tuple(v.co) for v in core.data.vertices];ff=[]
for p in core.data.polygons:
 e=sum(vv[i][0] for i in p.vertices)/3;n=sum(vv[i][1] for i in p.vertices)/3
 if not(b[0]<e<b[2] and b[1]<n<b[3]):ff.append(tuple(p.vertices))
shell=mesh('nm-context',vv,ff,(.31,.43,.30));shell['hypothesis']='Unchanged A vertices with opening for C alternative; derived display shell, not historical evidence';objects.insert(0,shell)
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True);o.hide_set(False);o.hide_render=False
bpy.context.view_layer.objects.active=objects[1]
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/data/nishinomaru.glb'),export_format='GLB',use_selection=True,export_extras=True,export_yup=True)
for o in bpy.context.scene.objects:
 if o not in objects:o.hide_set(True);o.hide_render=True
bpy.context.scene['phase2aEvidence']='All new geometry C. B count 0. Source-informed section parameters are distinct from footprint evidence.'
bpy.context.scene['phase2aBounds']=b;bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene.unit_settings.scale_length=1
bpy.context.scene['phase1GeometryHashes']=json.dumps(original_hashes)
assert all(geometry_hash(bpy.data.objects[name])==sha for name,sha in original_hashes.items())
# Useful editable opening view in Blender.
from mathutils import Vector
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':
   area.spaces.active.region_3d.view_location=Vector((-150+s.SHIFT[0],50+s.SHIFT[1],s.triangle_height(g,-145+s.SHIFT[0],50+s.SHIFT[1])))
   area.spaces.active.region_3d.view_distance=150;area.spaces.active.clip_end=15000
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'production/yamanaka-phase2a.blend'))
result={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'blender':bpy.app.version_string,'originalMeshVertices':original,'originalMeshSha256':original_hashes,'newObjects':[{'id':o['facilityId'],'vertices':len(o.data.vertices),'triangles':len(o.data.polygons),'category':'C'} for o in objects],'bounds':b,'gridStep':step,'B_objects':0,'workerStatus':'CHECKS_AND_TEARDOWN_RETURNED'}
Path(os.environ['PHASE2A_WORKER_OUTPUT']).write_text(json.dumps(result,indent=2),encoding='utf8')
