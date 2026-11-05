"""Actual Blender authoring: retain 1590 originals, export only new C candidates."""
import bpy, json, math, hashlib, struct, importlib.util
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('recipe',ROOT/'scripts/phase3b-recipe.py')
s=importlib.util.module_from_spec(spec);spec.loader.exec_module(s)
r=s.produce()
assert Path(bpy.data.filepath).name=='yamanaka-1590.blend'
OUT=ROOT/'evidence/phase3b/native';OUT.mkdir(parents=True,exist_ok=True)

def digest(o):
    h=hashlib.sha256()
    for v in o.data.vertices:h.update(struct.pack('<3f',*v.co))
    for p in o.data.polygons:
        h.update(struct.pack('<I',len(p.vertices)));h.update(struct.pack('<'+'I'*len(p.vertices),*p.vertices))
    h.update(struct.pack('<16f',*(v for row in o.matrix_world for v in row)))
    return h.hexdigest()
old={o.name:digest(o) for o in bpy.data.objects if o.type=='MESH'}
col=bpy.data.collections.new('Phase3B C western defence hypotheses');bpy.context.scene.collection.children.link(col)
objects=[];materials={};parts=[]

def material(role,tone=0):
    key=(role,tone)
    if key in materials:return materials[key]
    colors={'earth':(.40,.15,.075),'grass':(.24,.29,.11),'path':(.42,.25,.13),
        'wood':(.25+.025*tone,.17+.016*tone,.085+.009*tone),'roof':(.20,.15,.095),'endgrain':(.39,.28,.15)}
    color=colors[role];m=bpy.data.materials.new('Phase3B '+role+' '+str(tone));m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes['Principled BSDF'];p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.92
    # Procedural editable source material. Browser adds its own deterministic
    # fine normal/roughness treatment; exported base PBR remains portable.
    tex=m.node_tree.nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=8 if role in ['wood','roof'] else 3
    tex.inputs['Detail'].default_value=2; bump=m.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.13;bump.inputs['Distance'].default_value=.025
    m.node_tree.links.new(tex.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],p.inputs['Normal'])
    materials[key]=m;return m

def bind(o,id,role,surface=False,tone=0):
    for c in list(o.users_collection):c.objects.unlink(o)
    col.objects.link(o);o['elementId']=id;o['evidenceCategory']='C';o['materialRole']=role;o['surface']=surface
    o['ledger']='data/phase3b.json#'+id;o['metresPerUnit']=1;o['horizontalCRS']='EPSG:6676';o['modelVersion']='phase3b-v1'
    o['appearanceEvidence']='D: original color, texture, weathering; not archaeological material evidence'
    o.data.materials.append(material(role,tone));o.hide_set(False);o.hide_render=False
    objects.append(o);return o

def box(id,label,e,n,z,size,role='wood',tone=0,angle=0,base=None):
    w,d,h=size;ground=s.surface_height(e,n) if base is None else base
    bpy.ops.mesh.primitive_cube_add(size=1,location=(e,n,ground+z+h/2))
    o=bpy.context.object;o.name=id+'.'+label;o.scale=(w,d,h);o.rotation_euler.z=angle
    # Apply transforms, retaining UVs and an edit-ready independent part.
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    bevel=o.modifiers.new('Small worn edges (D appearance)','BEVEL');bevel.width=.025;bevel.segments=1
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=bevel.name)
    bind(o,id,role,tone=tone);o['groundHeight']=ground;o['bottomOffset']=z
    parts.append(dict(object=o.name,element=id,at=[e,n,ground],bottomOffset=z,kind='box',size=size,role=role))
    return o

# One common grid is partitioned by triangle into stable IDs. No overlapped
# sheets. Boundary heights retain actual A triangles. Original A is untouched.
b=s.BOUNDS;cols=126;rows=111;verts=[(b[0]+c,b[1]+j,s.f32(s.elevation(b[0]+c,b[1]+j))) for j in range(rows) for c in range(cols)]
facegroups={}
for j in range(rows-1):
    for c in range(cols-1):
        a=j*cols+c
        for f in [(a,a+1,a+cols+1),(a,a+cols+1,a+cols)]:
            e=sum(verts[i][0] for i in f)/3;n=sum(verts[i][1] for i in f)/3
            id=s.component(e,n)
            role='earth' if id=='wb-moat' else 'path' if id=='wb-gate' or abs(n+35)<3 else 'grass'
            facegroups.setdefault((id,role),[]).append(f)
for (id,role),faces in facegroups.items():
    ids=sorted({i for f in faces for i in f});mapping={old:new for new,old in enumerate(ids)}
    mesh=bpy.data.meshes.new(id+' terrain');mesh.from_pydata([verts[i] for i in ids],[],[tuple(mapping[i] for i in f) for f in faces]);mesh.update()
    o=bpy.data.objects.new(id+'.surface.'+role,mesh);col.objects.link(o);bind(o,id,role,True)
    uv=mesh.uv_layers.new(name='World metres')
    for p in mesh.polygons:
        for li in p.loop_indices:
            v=mesh.vertices[mesh.loops[li].vertex_index].co;uv.data[li].uv=(v.x*.2,v.y*.2)
    colors=mesh.color_attributes.new(name='Original soil and grass variation D',type='FLOAT_COLOR',domain='POINT')
    for i,v in enumerate(mesh.vertices):
        noise=math.sin(v.co.x*.37+v.co.y*.21)*math.sin(v.co.y*.49-v.co.x*.13)
        t=.87+.13*noise
        colors.data[i].color=(t,t*.97,t*.93,1)

# Plank defences. Ground support follows the exported C surface at every post.
for side,points in [('north',[(-150+i*2,25) for i in range(22)]),('east',[(-108,-14+i*2) for i in range(20)])]:
    for i,(e,n) in enumerate(points):
        box('wb-bailey',f'{side}.post.{i}',e,n,-.12,(.20,.20,2.05),tone=i%3)
        for level in [.45,1.2]:box('wb-bailey',f'{side}.rail.{i}.{level}',e,n,level,(2.1,.12,.17) if side=='north' else (.12,2.1,.17),tone=1)
        for k in range(5):
            ee=e+(k-2)*.34 if side=='north' else e;nn=n if side=='north' else n+(k-2)*.34
            box('wb-bailey',f'{side}.board.{i}.{k}',ee,nn,0,(.31,.10,1.8) if side=='north' else (.10,.31,1.8),tone=(i+k)%3)

# Western gate: a separate facility from sc-gate. Opening is along east-west.
gatebase=s.surface_height(-191,-35)
for j,n in enumerate([-37.1,-32.9]):
    box('wb-gate',f'gate.post.{j}',-191,n,-.2,(.38,.38,3.8),tone=j,base=gatebase)
    box('wb-gate',f'gate.cap.{j}',-191,n,3.55,(.42,.42,.07),'endgrain',base=gatebase)
box('wb-gate','gate.crossbeam',-191,-35,3.1,(.42,5.1,.42),base=gatebase)
for j,(n,angle) in enumerate([(-36.15,-.20),(-33.85,.20)]):
    for k in range(6):box('wb-gate',f'gate.door.{j}.{k}',-190.6+(k*.29)*math.sin(angle),n+(k-2.5)*.29*math.cos(angle),.05,(.13,.27,2.85),tone=k%3,angle=angle,base=gatebase)
    for z in [.45,2.15]:box('wb-gate',f'gate.door.rail.{j}.{z}',-190.7,n,z,(.17,1.85,.15),tone=1,angle=angle,base=gatebase)
for j,n in enumerate(list(range(-47,-38,2))+list(range(-31,-22,2))):
    box('wb-gate',f'side.post.{j}',-191,n,-.12,(.23,.23,1.95),tone=j%3)
    for z in [.5,1.25]:box('wb-gate',f'side.rail.{j}.{z}',-191,n,z,(.17,2.2,.16),tone=1)

# Removable upper-structure hypothesis, deliberately one-storey and plain.
buildingbase=s.surface_height(-131,7)
for e in [-135,-131,-127]:
    for n in [4,10]:
        box('wb-building',f'post.{e}.{n}',e,n,-.15,(.28,.28,4.15),tone=int(e)%3,base=buildingbase)
        box('wb-building',f'joint.{e}.{n}',e,n,3.35,(.44,.40,.15),'endgrain',base=buildingbase)
box('wb-building','floor',-131,7,.35,(8.4,6.4,.18),tone=1,base=buildingbase)
for n in [4,10]:
    box('wb-building',f'beam.{n}',-131,n,3.5,(8.6,.25,.32),tone=0,base=buildingbase)
    # Sparse waist-high boards retain views into the editable timber framework.
    box('wb-building',f'wall.{n}',-131,n,.65,(8.0,.13,1.2),tone=1,base=buildingbase)
for e in [-135,-127]:box('wb-building',f'crossbeam.{e}',e,7,3.45,(.28,6.7,.32),tone=2,base=buildingbase)
# Roof is two explicitly editable slopes, no decorative historic claim.
for sign in [-1,1]:
    vv=[(-135.7,7,buildingbase+5.8),(-126.3,7,buildingbase+5.8),(-126.3,7+sign*3.8,buildingbase+3.7),(-135.7,7+sign*3.8,buildingbase+3.7)]
    mesh=bpy.data.meshes.new('Hypothetical gable roof');mesh.from_pydata(vv,[],[(0,1,2,3)]);mesh.update()
    o=bpy.data.objects.new('wb-building.roof.'+str(sign),mesh);col.objects.link(o);bind(o,'wb-building','roof')
    solid=o.modifiers.new('Roof boards thickness','SOLIDIFY');solid.thickness=.12;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=solid.name)
box('wb-building','ridge',-131,7,5.78,(9.5,.18,.16),tone=0,base=buildingbase)

assert all(digest(bpy.data.objects[name])==value for name,value in old.items())
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/data/phase3b.glb'),export_format='GLB',use_selection=True,export_extras=True,export_yup=True)
for o in bpy.context.scene.objects:
    if o not in objects:o.hide_set(True);o.hide_render=True
bpy.context.scene['phase3bOldGeometryHashes']=json.dumps(old)
bpy.context.scene['phase3bEvidence']='All geometry C. No new B. D surface appearance is not archaeological evidence.'
bpy.context.scene['phase3bBounds']=b;bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene.unit_settings.scale_length=1
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_location=Vector((-142,0,553));area.spaces.active.region_3d.view_distance=145
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'production/yamanaka-phase3b.blend'))
report=dict(status='PASS',blender=bpy.app.version_string,oldMeshes=old,newObjects=len(objects),
    surfaceVertices=len(verts),surfaceTriangles=(cols-1)*(rows-1)*2,bounds=b,step=1,
    parts=parts,externalImages=len([x for x in bpy.data.images if x.source=='FILE']),B_objects=0)
(OUT/'blender-build.json').write_text(json.dumps(report,indent=2),encoding='utf8')
