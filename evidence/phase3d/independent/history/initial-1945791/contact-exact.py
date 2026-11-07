"""Extrema of actual bottom-face minus terrain over triangle-overlay vertices."""
import json,struct,copy
from pathlib import Path
import numpy as np
R=Path.cwd();O=R/'evidence/phase3d/independent'
def load(path):
 b=path.read_bytes();n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);data=b[28+n:]
 def acc(i):
  a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];k=3 if a['type']=='VEC3' else 1;dt={5126:'<f4',5125:'<u4',5123:'<u2'}[a['componentType']];w=np.dtype(dt).itemsize
  return np.ndarray((a['count'],k),dtype=dt,buffer=data,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',w*k),w)).copy().astype(float)
 out=[]
 for node in g['nodes']:
  if 'mesh' not in node:continue
  p=g['meshes'][node['mesh']]['primitives'][0];v=acc(p['attributes']['POSITION']);ix=acc(p['indices']).ravel().astype(int);out.append(dict(name=node['name'],extras=node.get('extras',{}),vertices=v,triangles=v[ix].reshape((-1,3,3))))
 return out
terrain=np.concatenate([m['triangles'] for m in load(R/'public/data/phase3c.glb')])
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def height(t,p):
 a,b,c=t;u=b[[0,2]]-a[[0,2]];v=c[[0,2]]-a[[0,2]];d=p-a[[0,2]];det=cross(u,v);s=cross(d,v)/det;q=cross(u,d)/det;return a[1]+s*(b[1]-a[1])+q*(c[1]-a[1])
def overlay(a,b):
 poly=list(a[:,[0,2]]);clip=b[:,[0,2]];orientation=np.sign(cross(clip[1]-clip[0],clip[2]-clip[0]));
 if not orientation:return []
 for u,v in zip(clip,np.roll(clip,-1,axis=0)):
  out=[]
  for p,q in zip(poly,poly[1:]+poly[:1]):
   dp=orientation*cross(v-u,p-u);dq=orientation*cross(v-u,q-u)
   if dp>=-1e-10:out.append(p)
   if (dp>=0)!=(dq>=0):out.append(p+(q-p)*dp/(dp-dq))
  poly=out
 return poly
def exact(m,rectangle=None):
 vertices=m['vertices'];xy=vertices[:,[0,2]];bottom=[]
 for t in m['triangles']:
  if abs(cross(t[1,[0,2]]-t[0,[0,2]],t[2,[0,2]]-t[0,[0,2]]))<1e-10:continue
  if all(abs(p[1]-min(vertices[np.all(np.abs(xy-p[[0,2]])<1e-7,axis=1),1]))<1e-7 for p in t):bottom.append(t)
 assert len(bottom)==2,(m['name'],len(bottom));low=vertices.min(axis=0);high=vertices.max(axis=0)
 candidates=terrain[(terrain[:,:,0].max(axis=1)>=low[0])&(terrain[:,:,0].min(axis=1)<=high[0])&(terrain[:,:,2].max(axis=1)>=low[2])&(terrain[:,:,2].min(axis=1)<=high[2])];values=[]
 for a in bottom:
  for b in candidates:
   polygon=overlay(a,b)
   if rectangle:
    for axis,bound,sign in rectangle:
     output=[]
     for p,q in zip(polygon,polygon[1:]+polygon[:1]):
      dp=sign*(p[axis]-bound);dq=sign*(q[axis]-bound)
      if dp>=-1e-10:output.append(p)
      if (dp>=0)!=(dq>=0):output.append(p+(q-p)*dp/(dp-dq))
     polygon=output
   for p in polygon:values.append(dict(delta=float(height(a,p)-height(b,p)),east=float(p[0]),north=float(-p[1]),ground=float(height(b,p)),bottom=float(height(a,p)),bottomTriangle=a.tolist(),terrainTriangle=b.tolist()))
 assert values;return dict(name=m['name'],count=len(values),minimum=min(values,key=lambda p:p['delta']),maximum=max(values,key=lambda p:p['delta']))
meshes=load(R/'public/data/phase3d.glb')
rows=[exact(m) for m in meshes if m['extras']['partRole']=='ground-post']
bad=[r for r in rows if r['minimum']['delta']<-.13 or r['maximum']['delta']>.003]
overlaps=[m for m in meshes if m['vertices'][:,0].max()>-100 and m['vertices'][:,0].min()<-68 and m['vertices'][:,2].max()>27 and m['vertices'][:,2].min()<31]
assert len(overlaps)==1 and overlaps[0]['name']=='dc-gate.lintel'
lintel=exact(overlaps[0],[(0,-100,1),(0,-68,-1),(1,27,1),(1,31,-1)])
assert lintel['minimum']['delta']>=2.5
negative=[]
healthy=meshes[0];h=exact(healthy);assert h['minimum']['delta']>=-.13 and h['maximum']['delta']<=.003
for name,delta in [('floating-20cm',.2),('buried-20cm',-.2)]:
 m=copy.deepcopy(healthy);m['vertices'][:,1]+=delta;m['triangles'][:,:,1]+=delta;q=exact(m)
 assert q['maximum']['delta']>.003 or q['minimum']['delta']<-.13
 negative.append(dict(name=name,status='EXPECTED_REJECTION',healthy=h,mutated=q))
report=dict(status='FAIL' if bad else 'PASS',method='Exact piecewise planar overlay: clip bottom and ground triangle pairs, evaluate linear height difference at every intersection polygon vertex. Independent of authoring samplers.',allowed=[-.13,.003],rows=rows,failures=bad,routeOverlap=[m['name'] for m in overlaps],lintel=lintel,healthyControl=h,negative=negative)
(O/'contact-exact.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
