"""Independent binary GLB and triangle checks; imports no authoring or producer test code."""
import copy,json,struct,hashlib,subprocess
from pathlib import Path
import numpy as np
ROOT=Path.cwd();OUT=ROOT/'evidence/phase3d/independent'
def read(path):
 b=path.read_bytes();assert b[:4]==b'glTF';n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);data=b[28+n:]
 def acc(i):
  a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];dt={5126:'<f4',5125:'<u4',5123:'<u2'}[a['componentType']];k={'SCALAR':1,'VEC3':3}[a['type']];offset=v.get('byteOffset',0)+a.get('byteOffset',0);size=np.dtype(dt).itemsize
  return np.ndarray((a['count'],k),dtype=dt,buffer=data,offset=offset,strides=(v.get('byteStride',size*k),size)).copy()
 meshes=[]
 for node in g['nodes']:
  if 'mesh' not in node:continue
  assert not any(k in node for k in ['matrix','translation','rotation','scale'])
  for p in g['meshes'][node['mesh']]['primitives']:
   meshes.append(dict(name=node['name'],extras=node.get('extras',{}),positions=acc(p['attributes']['POSITION']),indices=acc(p['indices']).ravel()))
 return meshes
def triangles(meshes):return np.concatenate([m['positions'][m['indices']].reshape((-1,3,3)) for m in meshes]).astype(float)
terrain=triangles(read(ROOT/'public/data/phase3c.glb'))
def height(ts,x,z,high=True):
 a,b,c=ts[:,0,:],ts[:,1,:],ts[:,2,:];d=(b[:,2]-c[:,2])*(a[:,0]-c[:,0])+(c[:,0]-b[:,0])*(a[:,2]-c[:,2]);ok=np.abs(d)>1e-10;d=np.where(ok,d,1)
 u=((b[:,2]-c[:,2])*(x-c[:,0])+(c[:,0]-b[:,0])*(z-c[:,2]))/d;v=((c[:,2]-a[:,2])*(x-c[:,0])+(a[:,0]-c[:,0])*(z-c[:,2]))/d;w=1-u-v
 mask=ok&(np.minimum(np.minimum(u,v),w)>=-1e-6);hits=(u*a[:,1]+v*b[:,1]+w*c[:,1])[mask];assert len(hits),'missing triangle support';return float(np.max(hits) if high else np.min(hits))
def clipped_maximum(ts,x0,x1,z0,z1):
 maximum=-float('inf');count=0
 for tri in ts:
  if np.max(tri[:,0])<x0 or np.min(tri[:,0])>x1 or np.max(tri[:,2])<z0 or np.min(tri[:,2])>z1:continue
  poly=list(tri)
  for axis,bound,sign in [(0,x0,1),(0,x1,-1),(2,z0,1),(2,z1,-1)]:
   out=[]
   for a,b in zip(poly,poly[1:]+poly[:1]):
    ia,ib=sign*(a[axis]-bound)>=-1e-10,sign*(b[axis]-bound)>=-1e-10
    if ia:out.append(a)
    if ia!=ib:out.append(a+(b-a)*((bound-a[axis])/(b[axis]-a[axis])))
   poly=out
  if poly:maximum=max(maximum,max(v[1] for v in poly));count+=len(poly)
 assert count;return maximum,count
meshes=read(ROOT/'public/data/phase3d.glb')
def verify(ms):
 assert len(ms)==63;rows=[];overlap=[]
 for m in ms:
  assert m['extras'].get('evidenceCategory')=='C','CATEGORY_NOT_C'
  p=m['positions'];lo,hi=p.min(axis=0),p.max(axis=0);ts=triangles([m]);role=m['extras']['partRole'];h=[];corners=[]
  for i in range(11):
   for j in range(11):
    x=lo[0]+(hi[0]-lo[0])*i/10;z=lo[2]+(hi[2]-lo[2])*j/10;delta=height(ts,x,z,False)-height(terrain,x,z);h.append(delta)
    if i in [0,10] and j in [0,10]:corners.append(delta)
  if role=='ground-post':
   assert max(abs(q+.06) for q in corners)<.003,'POST_CORNER_CONTACT'
   assert min(h)>=-.13 and max(h)<=.003,f'POST_INTERIOR_CONTACT {m["name"]} min={min(h)} max={max(h)} corners={corners}'
  else:assert min(h)>.1,'RAIL_GROUND_CLEARANCE'
  if hi[0]>-100 and lo[0]<-68 and hi[2]>27 and lo[2]<31:
   overlap.append(m['name']);assert role=='lintel','ROUTE_OBSTRUCTION'
   maximum,count=clipped_maximum(terrain,max(lo[0],-100),min(hi[0],-68),max(lo[2],27),min(hi[2],31));assert lo[1]-maximum>=2.5,'LINTEL_CLEARANCE'
   clearance=float(lo[1]-maximum)
  rows.append(dict(name=m['name'],role=role,samples=len(h),minimum=min(h),maximum=max(h),corners=corners))
 assert overlap==['dc-gate.lintel'];return dict(parts=len(ms),rows=rows,routeOverlap=overlap,exactLintelClearance=clearance,exactRoutePolygonVertices=count)
report=dict(status='PASS',method='Fresh standalone Python binary decoder; 121 point actual-triangle samples per part; exact clipped terrain maximum under lintel. Sampling is not continuous contact proof.',result=verify(meshes),negative=[])
for kind in ['floating-5cm','buried-20cm','false-B','low-lintel-3m']:
 m=copy.deepcopy(meshes)
 if kind=='floating-5cm':m[0]['positions'][:,1]+=.05
 if kind=='buried-20cm':m[0]['positions'][:,1]-=.2
 if kind=='false-B':m[0]['extras']['evidenceCategory']='B'
 if kind=='low-lintel-3m':next(x for x in m if x['name']=='dc-gate.lintel')['positions'][:,1]-=3
 try:verify(m);raise RuntimeError('NEGATIVE_ACCEPTED')
 except AssertionError as e:report['negative'].append(dict(kind=kind,status='EXPECTED_REJECTION',signature=str(e)))
baseline='988735123024650c8ae44e6a69f73b14b4669fc6';changed=subprocess.check_output(['git','diff','--name-status',baseline,'HEAD','--','public/data','production'],text=True).splitlines();report['baselineChanges']=changed
for line in changed:
 state,path=line.split('\t');assert state=='A'
report['priorTerrainAndNativeFilesUnchanged']=True
report['hashes']={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [ROOT/'public/data/phase3d.glb',ROOT/'public/data/phase3c.glb',ROOT/'public/data/castle.glb',ROOT/'public/data/nishinomaru.glb']}
(OUT/'geometry-results.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='result'},indent=2));print('parts',report['result']['parts'],'lintel clearance',report['result']['exactLintelClearance'])
