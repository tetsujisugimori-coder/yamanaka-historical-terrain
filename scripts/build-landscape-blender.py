"""Run Blender on production/yamanaka-phase2a.blend; export ONLY additive scenery."""
import bpy,json,hashlib,struct,os
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[1]
recipe=json.loads((ROOT/'production/landscape/recipe.json').read_text(encoding='utf8'))
assert Path(bpy.data.filepath).name=='yamanaka-phase2a.blend'
def digest(o):
 h=hashlib.sha256()
 for v in o.data.vertices:h.update(struct.pack('<3f',*v.co))
 for p in o.data.polygons:h.update(struct.pack('<'+'I'*len(p.vertices),*p.vertices))
 return h.hexdigest()
old={o.name:digest(o) for o in bpy.data.objects if o.type=='MESH'}
surfaces=[BVHTree.FromObject(o,bpy.context.evaluated_depsgraph_get()) for o in bpy.data.objects if o.type=='MESH' and o.get('facilityId','').startswith('nm-')]
def ground(e,n):
 hits=[b.ray_cast(Vector((e,n,2000)),Vector((0,0,-1)))[0] for b in surfaces]
 return max(v.z for v in hits if v is not None)
collections={}
for category in ['C','D']:
 c=bpy.data.collections.new('1590 '+category+' / hypothesis' if category=='C' else '1590 D / creative scenery');bpy.context.scene.collection.children.link(c);collections[category]=c
elements={e['id']:e for e in recipe['elements']};materials={};objects=[];placements=[]
def material(hex):
 if hex in materials:return materials[hex]
 m=bpy.data.materials.new('Original '+hex);rgb=[int(hex[i:i+2],16)/255 for i in (1,3,5)]
 # sRGB input to linear material, matching browser color management.
 rgb=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb]
 m.diffuse_color=(*rgb,1);m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*rgb,1);m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.95;materials[hex]=m;return m
for i,p in enumerate(recipe['parts']):
 e,n,offset=p['at'];x,h,z=p['size'];base=ground(e,n);loc=(e,n,base+offset+h/2);kind=p['kind']
 if kind=='box':bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=(x,z,h)
 elif kind=='cylinder':bpy.ops.mesh.primitive_cylinder_add(vertices=7,radius=x,depth=h,location=loc);o=bpy.context.object
 elif kind=='cone':bpy.ops.mesh.primitive_cone_add(vertices=7,radius1=x,radius2=x*.12,depth=h,location=loc);o=bpy.context.object
 elif kind=='sphere':bpy.ops.mesh.primitive_uv_sphere_add(segments=8,ring_count=4,radius=1,location=(e,n,base+offset+h));o=bpy.context.object;o.scale=(x,z,h)
 elif kind=='flag':
  verts=[(e-x/2+j*x/4,n+(.15 if j%2 else 0),base+offset+k*h) for k in [0,1] for j in range(5)]
  faces=[(j,j+1,j+6,j+5) for j in range(4)];m=bpy.data.meshes.new('folded cloth');m.from_pydata(verts,[],faces);m.update();o=bpy.data.objects.new('flag',m);bpy.context.collection.objects.link(o)
 else:raise ValueError(kind)
 elem=elements[p['element']];o.name=f"{elem['id']}.{i:03d}"
 for c in list(o.users_collection):c.objects.unlink(o)
 collections[elem['category']].objects.link(o)
 o['elementId']=elem['id'];o['evidenceCategory']=elem['category'];o['recipePart']=i;o['groundHeight']=base;o['metresPerUnit']=1;o['horizontalCRS']='EPSG:6676';o['ledger']='data/landscape.json#'+elem['id'];o['modelVersion']='landscape-v1';o.data.materials.append(material(p['color']));o.hide_set(False);o.hide_render=False
 objects.append(o);placements.append(dict(part=i,element=elem['id'],east=e,north=n,ground=base))
for o in bpy.context.scene.objects:o.select_set(False)
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/data/landscape.glb'),export_format='GLB',use_selection=True,export_extras=True,export_yup=True)
assert all(digest(bpy.data.objects[name])==sha for name,sha in old.items())
for o in bpy.context.scene.objects:
 if o not in objects and not o.get('facilityId','').startswith('nm-'):o.hide_set(True);o.hide_render=True
bpy.context.scene['landscapeLedger']='public/data/landscape.json; C/D are not certain historical restoration'
bpy.context.scene['landscapeOriginalMeshHashes']=json.dumps(old)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'production/yamanaka-1590.blend'))
out=dict(status='PASS',blender=bpy.app.version_string,oldMeshHashes=old,objects=len(objects),placements=placements,externalAssets=0)
(ROOT/'evidence/landscape').mkdir(exist_ok=True)
(ROOT/'evidence/landscape/blender-build.json').write_text(json.dumps(out,indent=2),encoding='utf8')
