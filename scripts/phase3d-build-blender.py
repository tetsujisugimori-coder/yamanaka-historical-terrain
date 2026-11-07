"""Original C candidates on immutable exported terrain. Run with Blender factory startup."""
import bpy,json,struct,hashlib,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'production/phase3d';D=json.loads((OUT/'design.json').read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
inputs={str(p.relative_to(ROOT)):sha(p) for p in [ROOT/'public/data'/n for n in ['castle.glb','castle.json','nishinomaru.glb','phase3b.glb','phase3c.glb','phase3c.json']]}
b=(ROOT/D['sourceSurface']).read_bytes();sz=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+sz]);blob=b[28+sz:]
def acc(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];c={'VEC3':3,'SCALAR':1}[a['type']];fmt={5126:'f',5125:'I',5123:'H'}[a['componentType']];size=struct.calcsize(fmt)*c
 return [struct.unpack_from('<'+fmt*c,blob,v.get('byteOffset',0)+a.get('byteOffset',0)+j*v.get('byteStride',size)) for j in range(a['count'])]
cells={}
for node in g['nodes']:
 if 'mesh' not in node:continue
 assert not any(k in node for k in ['matrix','rotation','translation','scale'])
 for p in g['meshes'][node['mesh']]['primitives']:
  v=[(e,-s,h) for e,h,s in acc(p['attributes']['POSITION'])];ids=[i[0] for i in acc(p['indices'])]
  for j in range(0,len(ids),3):
   t=[v[i] for i in ids[j:j+3]]
   for x in range(math.floor(min(q[0] for q in t)),math.floor(max(q[0] for q in t))+1):
    for y in range(math.floor(min(q[1] for q in t)),math.floor(max(q[1] for q in t))+1):cells.setdefault((x,y),[]).append(t)
def height(e,n):
 for a,b,c in cells.get((math.floor(e),math.floor(n)),[]):
  d=(b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]);u=((e-a[0])*(c[1]-a[1])-(c[0]-a[0])*(n-a[1]))/d;v=((b[0]-a[0])*(n-a[1])-(e-a[0])*(b[1]-a[1]))/d
  if min(u,v,1-u-v)>=-1e-7:return a[2]+u*(b[2]-a[2])+v*(c[2]-a[2])
 raise ValueError(('Missing immutable C support',e,n))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
col=bpy.data.collections.new('Phase3D C connecting timber hypotheses');bpy.context.scene.collection.children.link(col)
mat=bpy.data.materials.new('Neutral timber; appearance D separate');mat.diffuse_color=(.32,.21,.12,1);mat.use_nodes=True
mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=mat.diffuse_color;mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.85
parts=[]
def box(name,eid,role,x0,y0,x1,y1,lower,upper):
 corners=[(x0,y0),(x1,y0),(x1,y1),(x0,y1)];bottom=[lower(x,y) for x,y in corners];top=[upper(x,y) for x,y in corners];verts=[(x,y,z) for levels in [bottom,top] for (x,y),z in zip(corners,levels)]
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]);mesh.update();o=bpy.data.objects.new(name,mesh);col.objects.link(o);o.data.materials.append(mat)
 for k,v in dict(elementId=eid,evidenceCategory='C',materialRole='wood',modelVersion='phase3d-v1',partRole=role,ledger='data/phase3d.json#'+eid,historicalDimensions='UNKNOWN',surface=False).items():o[k]=v
 parts.append(dict(name=name,elementId=eid,role=role,footprint=[x0,y0,x1,y1],bottom=bottom,top=top))
for side,n in [('north',D['fenceNorth']),('south',D['fenceSouth'])]:
 for j,e in enumerate(range(D['firstPostEast'],D['lastPostEast']+1,D['postSpacing'])):
  w=D['fencePostWidth']/2;box(f'dc-fence-{side}.post.{j}',f'dc-fence-{side}','ground-post',e-w,n-w,e+w,n+w,lambda x,y:height(x,y)-D['postCornerEmbed'],lambda x,y:height(x,y)+D['postHeight'])
 for j,e in enumerate(range(D['firstPostEast'],D['lastPostEast']+1,D['postSpacing'])):
  for level in D['railLevels']:
   w=D['railDepth']/2;box(f'dc-rail-{side}.rail.{j}.{level}',f'dc-rail-{side}','rail',e,n-w,min(e+D['postSpacing'],D['gateEast']),n+w,lambda x,y:height(x,y)+level,lambda x,y:height(x,y)+level+D['railDepth'])
x=D['gateEast'];w=D['gatePostWidth']/2;lintel=max(height(x+dx,-31+4*j/40) for dx in [-w,0,w] for j in range(41))+D['lintelClearance']
for side,n in [('north',D['fenceNorth']),('south',D['fenceSouth'])]:box('dc-gate.post.'+side,'dc-gate','ground-post',x-w,n-w,x+w,n+w,lambda e,n:height(e,n)-D['postCornerEmbed'],lambda e,n:lintel+.25)
box('dc-gate.lintel','dc-gate','lintel',x-w,D['fenceSouth']-w,x+w,D['fenceNorth']+w,lambda e,n:lintel,lambda e,n:lintel+D['lintelHeight'])
base=json.loads((ROOT/'public/data/phase3c.json').read_text());elements=[]
for id,name,local in [('dc-gate','見張台側の門候補',[-76.5,-29]),('dc-fence-north','接続路北側の柵候補',[-87,-26.4]),('dc-fence-south','接続路南側の柵候補',[-87,-31.6]),('dc-rail-north','北側の横木候補',[-87,-26.4]),('dc-rail-south','南側の横木候補',[-87,-31.6])]:
 elements.append(dict(id=id,name=name,shortLabel=name,category='C',reconstruction=True,landscape=True,local=local,height=height(*local),modelObject=id,modelVersion='phase3d-v1',description='既存C土橋・虎口に木造部材を添えた比較用候補。史実の復元ではない。',role='開口と側方の区切りを観察するための模型。',sourceIds=['mishima-inner','plan'],accuracy='UNKNOWN：実測基準点0。位置・向き・年代別形状は未確定。',unknown='1590年の門・柵・横木の存在、配置、寸法、木種、接合形式はUNKNOWN。',supportScope='既存phase3cの調査対象名称と防御上の関係のみを継承。新しい木造部材を直接支持する史料ではない。',assumptions='木造部材は全てC仮説。門位置E=-76.5m、柵N=-26.4/-31.6m、柱間2mは模型設計値。',referenceDimensions={'all':'UNKNOWN'},modelDimensions={'routeWidth':4,'fencePostWidth':.24,'fencePostHeightAboveCorners':1.65,'gatePostWidth':.4,'lintelMinimumDesignedClearance':3.3},direction='形状C、外観D。実地の通行可能性・立入案内には使用しない。',editor='production/phase3d/yamanaka-phase3d.blend'))
r=dict(version=1,modelVersion='phase3d-v1',category='C',crs='EPSG:6676',origin=base['origin'],units='metres',axes='Blender east,north,up; glTF east,up,south',license='MIT project-original meshes; no third-party textures',elements=elements,parts=parts,sources=base['sources'],stations=[],groundSource=D['sourceSurface'],immutableInputs=inputs,route=dict(D['route'],scope='model clearance only; historic and real-world navigability UNKNOWN'),support=dict(postCornerEmbedDepth=.06,cornerTolerance=.003,interiorAllowedEmbedRange=[0,.13],method='Bottom corners sample immutable exported phase3c triangles'),appearance=dict(category='D',bakedTextures=False),simulation=dict(exported=False,navigability='UNKNOWN'),sourceCautions=base['sourceCautions']+['門・柵・横木の配置と接合形式は今回のC設計仮説。'])
assert len(parts)==63
for p in [OUT/'recipe.json',ROOT/'public/data/phase3d.json']:p.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene.unit_settings.scale_length=1;bpy.context.scene['evidence']='C hypotheses; no B; historical layout UNKNOWN; appearance D separate';bpy.context.scene['immutableInputs']=json.dumps(inputs);bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT');bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'yamanaka-phase3d.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/data/phase3d.glb'),export_format='GLB',use_selection=True,export_extras=True,export_yup=True)
assert all(sha(ROOT/k)==v for k,v in inputs.items())
(OUT/'build-report.json').write_text(json.dumps(dict(status='PASS',blender=bpy.app.version_string,parts=len(parts),immutableInputs=inputs,triangles=sum(len(o.data.polygons)*2 for o in col.objects)),indent=2))
