"""Independent exported GLB triangle audit. Does not import elevation recipe."""
import json,struct,hashlib
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'production/phase3i'
params=json.loads((OUT/'parameters.json').read_text())
def read(name):
 raw=(ROOT/'public/data'/name).read_bytes()
 assert len(raw)>=28 and raw[:4]==b'glTF' and struct.unpack_from('<I',raw,4)[0]==2 and struct.unpack_from('<I',raw,8)[0]==len(raw),'invalid GLB header'
 n=struct.unpack_from('<I',raw,12)[0]
 assert raw[16:20]==b'JSON' and 28+n<=len(raw) and raw[24+n:28+n]==b'BIN\x00','invalid GLB chunks'
 assert struct.unpack_from('<I',raw,20+n)[0]==len(raw)-28-n,'invalid BIN length'
 doc=json.loads(raw[20:20+n]);blob=raw[28+n:]
 def acc(i):
  a=doc['accessors'][i];v=doc['bufferViews'][a['bufferView']];dtype={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']];size={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
  return np.frombuffer(blob,dtype=dtype,count=a['count']*size,offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,size)
 result={}
 for node in doc['nodes']:
  if 'mesh' not in node:continue
  assert not any(k in node for k in ['matrix','translation','rotation','scale'])
  ts=[]
  for p in doc['meshes'][node['mesh']]['primitives']:
   vs=acc(p['attributes']['POSITION']).copy()[:,[0,2,1]];vs[:,1]*=-1
   ts.append(vs[acc(p['indices']).ravel()].reshape(-1,3,3))
  result[node['name']]={'tri':np.concatenate(ts),'extras':node.get('extras',{})}
 return result

def sample(nodes,e,n):
 hits=[]
 for name,obj in nodes.items():
  if -100<=e<=-68 and -45<=n<=50 and any(k.startswith('ic-') for k in nodes) and not name.startswith('ic-'):continue
  t=obj['tri'];xy=t[:,:,:2]
  if 'bounds' not in obj:obj['bounds']=(xy[:,:,0].min(1),xy[:,:,0].max(1),xy[:,:,1].min(1),xy[:,:,1].max(1))
  a,b,c,d=obj['bounds'];mask=(a<=e+1e-5)&(b>=e-1e-5)&(c<=n+1e-5)&(d>=n-1e-5)
  for f in t[mask].astype(float):
   a,b,c=f
   def cross(v,w):return v[0]*w[1]-v[1]*w[0]
   den=cross(b[:2]-a[:2],c[:2]-a[:2]);u=cross(np.array([e,n])-a[:2],c[:2]-a[:2])/den;v=cross(b[:2]-a[:2],np.array([e,n])-a[:2])/den
   if min(u,v)>=-1e-5 and u+v<=1+1e-5:hits.append(float(a[2]+u*(b[2]-a[2])+v*(c[2]-a[2])))
 assert hits,('missing',e,n)
 assert max(hits)-min(hits)<.0002,('crack/overlap',e,n,hits)
 return sum(hits)/len(hits)
def key(t):return tuple(sorted(tuple(float(x) for x in v) for v in t))
def intersects(t,boxes):
 # All modified triangles must lie entirely within a declared closed rectangle.
 return any(np.all(t[:,0]>=b[0]) and np.all(t[:,0]<=b[2]) and np.all(t[:,1]>=b[1]) and np.all(t[:,1]<=b[3]) for b in boxes)

def main():
 outputs={};all_new={};all_old={}
 for name,oldname,boxes in [('phase3i.glb','phase3h.glb',[p['bounds'] for p in params['patches'][:2]]),('phase3i-inner.glb','phase3h-inner.glb',[params['patches'][2]['bounds']])]:
  new,old=read(name),read(oldname);assert set(new)==set(old);all_new.update(new);all_old.update(old);stats=[]
  for id,obj in new.items():
   ts=obj['tri'];prev=old[id]['tri'];assert np.isfinite(ts).all()
   assert len(ts)==len(prev),(id,'unexpected subdivision/removal')
   assert {key(t[:,:2]) for t in ts}=={key(t[:,:2]) for t in prev},(id,'XY topology changed')
   u=ts[:,1,:2]-ts[:,0,:2];v=ts[:,2,:2]-ts[:,0,:2];areas=u[:,0]*v[:,1]-u[:,1]*v[:,0];assert (areas>0).all(),id
   if id!='nm-context':assert obj['extras']['evidenceCategory']=='C'
   prior={key(t) for t in prev};current={key(t) for t in ts};assert len(current)==len(ts)
   added=current-prior;removed=prior-current
   assert all(intersects(np.array(t),boxes) for t in added|removed),(id,'outside triangle altered')
   assert id!='nm-context' or not added
   stats.append({'name':id,'beforeTriangles':len(prev),'afterTriangles':len(ts),'exactUnchangedTriangles':len(current&prior),'addedOrChanged':len(added),'removedOrChanged':len(removed)})
  # Same XY triangle multiset preserves the entire original coverage/topology.
  # A shared XY vertex must still have one Z across all material objects.
  heights={};maximum_gap=0.0
  for obj in new.values():
   for v in obj['tri'].reshape(-1,3):
    xy=tuple(map(float,v[:2]));z=float(v[2]);maximum_gap=max(maximum_gap,abs(heights.get(xy,z)-z));heights[xy]=z
  assert maximum_gap<.0001,('shared seam gap',name,maximum_gap)
  outputs[name]=stats
 sections=[]
 for id,a,b,count in [('moat',[-66,-10],[-38,-10],225),('rampart',[-15,15],[-45,15],241),('bridge-transverse',[-88,-39],[-88,-20],153),('bridge-longitudinal',[-100,-29],[-68,-29],257)]:
  samples=[]
  for i in range(count):
   t=i/(count-1);e=a[0]+(b[0]-a[0])*t;n=a[1]+(b[1]-a[1])*t
   samples.append({'distance':float(np.linalg.norm(np.subtract(b,a))*t),'e':e,'n':n,'oldHeight':sample(all_old,e,n),'height':sample(all_new,e,n)})
  sections.append({'id':id,'start':a,'end':b,'sampling':'barycentric intersection with actual exported GLB triangles','samples':samples})
 stations=json.loads((ROOT/'public/data/phase3c.json').read_text())['stations'];support=[]
 for st in stations:
  e,n=st['eye']
  if e< -100 or e>30:continue
  support.append({'id':st['id'],'groundHeight':sample(all_new,e,n),'lookTargetHeight':sample(all_new,*st['look'])+st.get('lookHeightOffset',1),'eye':st['eye']})
 public=dict(params,models={'nm':'data/phase3i.glb','inner':'data/phase3i-inner.glb'},sections=sections,stationSupport=support)
 (ROOT/'public/data/phase3i.json').write_text(json.dumps(public,ensure_ascii=False,indent=2)+'\n')
 report={'status':'PASS','reader':'independent raw GLB parser, no recipe imports','models':outputs,'sections':[{'id':x['id'],'samples':len(x['samples']),'maxAbsoluteHeightChange':max(abs(v['height']-v['oldHeight']) for v in x['samples'])} for x in sections],'stationSupport':support,'outsideTriangles':'EXACT identical coordinate triples','nativeReload':'separate verification script required'}
 (OUT/'geometry-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report))
if __name__=='__main__':main()
