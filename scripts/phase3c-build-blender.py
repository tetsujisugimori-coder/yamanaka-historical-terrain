"""Add separate editable C terrain to read-only prior native model."""
import bpy,json,hashlib,struct,runpy,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];s=runpy.run_path(str(ROOT/'scripts/phase3c-recipe.py'));r=s['produce']()
assert Path(bpy.data.filepath).name=='yamanaka-phase3b.blend'
out=ROOT/'evidence/phase3c/native';out.mkdir(parents=True,exist_ok=True)
def digest(o):
    h=hashlib.sha256()
    for v in o.data.vertices:h.update(struct.pack('<3f',*v.co))
    for p in o.data.polygons:h.update(struct.pack('<I',len(p.vertices)));h.update(struct.pack('<'+'I'*len(p.vertices),*p.vertices))
    h.update(struct.pack('<16f',*(v for row in o.matrix_world for v in row)))
    return h.hexdigest()
old={o.name:digest(o) for o in bpy.data.objects if o.type=='MESH'}
col=bpy.data.collections.new('Phase3C C inner defence terrain');bpy.context.scene.collection.children.link(col)
b=r['bounds'];step=r['ground']['step'];cols=r['ground']['cols'];rows=r['ground']['rows']
# 1m interior grid; only external cell edges retain quarter-metre seam nodes.
# Boundary-cell centre fans join fine external edges to coarse inner edges.
verts=[];lookup={};groups={}
def vertex(e,n):
    key=(e,n)
    if key not in lookup:
        lookup[key]=len(verts);verts.append((e,n,s['f32'](s['elevation'](e,n))))
    return lookup[key]
def add(face):
    e=sum(verts[k][0] for k in face)/3;n=sum(verts[k][1] for k in face)/3;id=s['component'](e,n)
    role='path' if abs(n+29)<2 else 'earth' if n<-21 else 'grass'
    groups.setdefault((id,role),[]).append(face)
for n in range(b[1],b[3]):
    for e in range(b[0],b[2]):
        if e not in [b[0],b[2]-1] and n not in [b[1],b[3]-1]:
            a,c,d,f=[vertex(x,y) for x,y in [(e,n),(e+1,n),(e+1,n+1),(e,n+1)]]
            add((a,c,d));add((a,d,f));continue
        corners=[(e,n),(e+1,n),(e+1,n+1),(e,n+1)];ring=[]
        for k,a in enumerate(corners):
            z=corners[(k+1)%4]
            edge=(a[0]==z[0] and a[0] in [b[0],b[2]]) or (a[1]==z[1] and a[1] in [b[1],b[3]])
            divisions=4 if edge else 1
            for j in range(divisions):ring.append(vertex(a[0]+(z[0]-a[0])*j/divisions,a[1]+(z[1]-a[1])*j/divisions))
        centre=vertex(e+.5,n+.5)
        for k,a in enumerate(ring):add((centre,a,ring[(k+1)%len(ring)]))
objects=[]
for (id,role),faces in groups.items():
    ids=sorted({i for f in faces for i in f});mapping={i:k for k,i in enumerate(ids)}
    mesh=bpy.data.meshes.new(id+'.'+role);mesh.from_pydata([verts[i] for i in ids],[],[tuple(mapping[i] for i in f) for f in faces]);mesh.update()
    o=bpy.data.objects.new(id+'.surface.'+role,mesh);col.objects.link(o);objects.append(o)
    for k,v in dict(elementId=id,evidenceCategory='C',surface=True,materialRole=role,metresPerUnit=1,horizontalCRS='EPSG:6676',modelVersion='phase3c-v2',ledger='data/phase3c.json#'+id,appearanceEvidence='D treatment is runtime only; portable neutral material').items():o[k]=v
    m=bpy.data.materials.new('Phase3C '+role+' neutral');m.use_nodes=True;m.diffuse_color=(*{'grass':(.36,.43,.24),'earth':(.48,.27,.15),'path':(.53,.38,.22)}[role],1)
    bs=m.node_tree.nodes['Principled BSDF'];bs.inputs['Base Color'].default_value=m.diffuse_color;bs.inputs['Roughness'].default_value=.95;o.data.materials.append(m)
    # No D UV/color/noise baked into the new C geometry.
assert all(digest(bpy.data.objects[k])==v for k,v in old.items())
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/data/phase3c.glb'),export_format='GLB',use_selection=True,export_extras=True,export_yup=True)
for o in bpy.context.scene.objects:
    if o not in objects:o.hide_set(True);o.hide_render=True
bpy.context.scene['phase3cOldGeometryHashes']=json.dumps(old);bpy.context.scene['phase3cBounds']=b
bpy.context.scene['phase3cEvidence']='C terrain hypotheses, no B, no tower. Original collections preserved hidden; use web display clipping for context.'
bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene.unit_settings.scale_length=1
# Verify the old source in memory, then package only the new editable collection.
runpy.run_path(str(ROOT/'scripts/phase3c-package-blender.py'))
(out/'blender-build.json').write_text(json.dumps(dict(status='PASS',blender=bpy.app.version_string,preservedMeshes=old,objects=[o.name for o in objects],triangles=sum(len(f) for f in groups.values()),vertices=len(verts),bounds=b,units=1,compressed=True,modelVersion='phase3c-v2',sourcePackaging='standalone new meshes only',priorMeshesStoredInNewSource=0),indent=2))
