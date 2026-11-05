"""Independent glTF binary reader and direct triangle checks. No production imports."""
import json,struct,hashlib,subprocess,collections
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[4]

def read(path):
 data=path.read_bytes(); assert data[:4]==b'glTF';jlen=struct.unpack_from('<I',data,12)[0];j=json.loads(data[20:20+jlen]);bin=data[28+jlen:]
 def acc(i):
  a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];dt={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']];n={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];off=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',np.dtype(dt).itemsize*n)
  return np.ndarray((a['count'],n),dtype=dt,buffer=bin,offset=off,strides=(stride,np.dtype(dt).itemsize)).copy()
 out=[]
 def walk(i,parent):
  n=j['nodes'][i]
  if 'matrix'in n:m=np.array(n['matrix']).reshape(4,4).T
  else:
   x,y,z,w=n.get('rotation',[0,0,0,1]);m=np.eye(4);m[:3,:3]=np.array([[1-2*y*y-2*z*z,2*x*y-2*z*w,2*x*z+2*y*w],[2*x*y+2*z*w,1-2*x*x-2*z*z,2*y*z-2*x*w],[2*x*z-2*y*w,2*y*z+2*x*w,1-2*x*x-2*y*y]])@np.diag(n.get('scale',[1,1,1]));m[:3,3]=n.get('translation',[0,0,0])
  m=parent@m
  if 'mesh'in n:
   for p in j['meshes'][n['mesh']]['primitives']:
    v=acc(p['attributes']['POSITION']);v=(np.c_[v,np.ones(len(v))]@m.T)[:,:3];indices=acc(p['indices']).flatten() if 'indices'in p else np.arange(len(v));out.append({'name':n.get('name'),'extra':n.get('extras',{}),'vertices':v,'tri':v[indices.reshape(-1,3)]})
  for c in n.get('children',[]):walk(c,m)
 for i in j['scenes'][j.get('scene',0)]['nodes']:walk(i,np.eye(4))
 return out

def height(tri,e,n):
 # independent barycentric vertical ray, exported glTF east/up/south
 p=tri[:,:,[0,2]].copy();p[:,:,1]*=-1;a=p[:,0];v=p[:,1]-a;w=p[:,2]-a;q=np.array([e,n])-a;det=v[:,0]*w[:,1]-v[:,1]*w[:,0];ok=np.abs(det)>1e-10;u=np.zeros(len(p));t=u.copy();u[ok]=(q[ok,0]*w[ok,1]-q[ok,1]*w[ok,0])/det[ok];t[ok]=(v[ok,0]*q[ok,1]-v[ok,1]*q[ok,0])/det[ok];ok&=(u>=-1e-7)&(t>=-1e-7)&(u+t<=1+1e-7);return (tri[ok,0,1]+u[ok]*(tri[ok,1,1]-tri[ok,0,1])+t[ok]*(tri[ok,2,1]-tri[ok,0,1])).tolist()

def clipped_area(tri,bounds):
 poly=[(v[0],-v[2]) for v in tri]
 for axis,lim,sgn in [(0,bounds[0],1),(0,bounds[2],-1),(1,bounds[1],1),(1,bounds[3],-1)]:
  result=[]
  for a,b in zip(poly,poly[1:]+poly[:1]):
   da=(a[axis]-lim)*sgn;db=(b[axis]-lim)*sgn
   if da>=0:result.append(a)
   if (da<0)!=(db<0):
    t=da/(da-db);result.append(tuple(a[k]+t*(b[k]-a[k]) for k in range(2)))
  poly=result
  if not poly:return 0
 return abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(poly,poly[1:]+poly[:1])))/2

def main():
 meta=json.loads((ROOT/'public/data/phase3c.json').read_text());b=meta['bounds'];new=read(ROOT/'public/data/phase3c.glb');wb=read(ROOT/'public/data/phase3b.glb');nm=read(ROOT/'public/data/nishinomaru.glb');nt=np.concatenate([x['tri']for x in new]);old=[x for x in wb if x['extra'].get('surface')]+[x for x in nm if x['extra'].get('facilityId')=='nm-transition'];ot=np.concatenate([x['tri']for x in old]);c=ot.mean(axis=1);inside=(c[:,0]>b[0])&(c[:,0]<b[2])&(-c[:,2]>b[1])&(-c[:,2]<b[3]);remain=ot[~inside];near=remain[(remain[:,:,0].max(1)>=b[0])&(remain[:,:,0].min(1)<=b[2])&(-remain[:,:,2].min(1)>=b[1])&(-remain[:,:,2].max(1)<=b[3])]
 overlap=sum(clipped_area(t,b)for t in near)
 edges=collections.Counter();edge3={}
 for t in nt:
  for a,c in zip(t,np.roll(t,-1,axis=0)):
   k=tuple(sorted((tuple(np.round(a,6)),tuple(np.round(c,6)))));edges[k]+=1;edge3[k]=(a,c)
 boundary=[edge3[k]for k,v in edges.items()if v==1];internal=[];seam=[]
 ot=ot[(ot[:,:,0].max(1)>=b[0]-1)&(ot[:,:,0].min(1)<=b[2]+1)&(-ot[:,:,2].min(1)>=b[1]-1)&(-ot[:,:,2].max(1)<=b[3]+1)]
 ot=ot[(ot[:,:,0].min(1)<=b[0]+1)|(ot[:,:,0].max(1)>=b[2]-1)|(-ot[:,:,2].max(1)<=b[1]+1)|(-ot[:,:,2].min(1)>=b[3]-1)]
 for a,c in boundary:
  for p in [a,(a+c)/2,c]:
   e,n=p[0],-p[2]
   outer=abs(e-b[0])<1e-5 or abs(e-b[2])<1e-5 or abs(n-b[1])<1e-5 or abs(n-b[3])<1e-5
   if not outer:internal.append([e,n,float(p[1])]);continue
   local=ot[(ot[:,:,0].min(1)<=e+1e-7)&(ot[:,:,0].max(1)>=e-1e-7)&(-ot[:,:,2].max(1)<=n+1e-7)&(-ot[:,:,2].min(1)>=n-1e-7)];hits=height(local,e,n)
   seam.append(None if not hits else min(abs(h-p[1])for h in hits))
 projected=abs(np.cross(nt[:,1]-nt[:,0],nt[:,2]-nt[:,0])[:,1])/2
 allground=np.concatenate([x['tri']for x in nm]+[x['tri']for x in wb if x['extra'].get('surface')]);stations=[]
 for s in meta['stations']:
  ts=nt if b[0]<=s['eye'][0]<=b[2] and b[1]<=s['eye'][1]<=b[3] else allground;hs=height(ts,*s['eye']);stations.append({'id':s['id'],'metadataGround':s['groundHeight'],'actualHeights':hs,'difference':min([abs(h-s['groundHeight'])for h in hs],default=None)})
 result={'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'hashes':{f:hashlib.sha256((ROOT/'public/data'/f).read_bytes()).hexdigest()for f in ['phase3c.glb','phase3b.glb','nishinomaru.glb','castle.glb']},'newObjects':[{'name':x['name'],'extra':x['extra'],'triangles':len(x['tri'])}for x in new],'boundsGLTF':[nt.min((0,1)).tolist(),nt.max((0,1)).tolist()],'triangles':len(nt),'projectedArea':float(sum(projected)),'expectedArea':(b[2]-b[0])*(b[3]-b[1]),'degenerateProjected':int(sum(projected<1e-10)),'edgeCounts':dict(collections.Counter(edges.values())),'interiorBoundarySamples':internal[:10],'interiorBoundarySampleCount':len(internal),'perimeterMaxHeightGap':max([x for x in seam if x is not None],default=None),'perimeterMissingOldSupport':seam.count(None),'oldRemainingOverlapArea':overlap,'stations':stations}
 print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
