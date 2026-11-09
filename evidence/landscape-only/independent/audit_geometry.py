import json,struct,hashlib,sys
from pathlib import Path
import numpy as np
root=Path(sys.argv[1]); out=Path(sys.argv[2])
def read(path):
 b=path.read_bytes(); magic,ver,total=struct.unpack_from('<III',b); assert magic==0x46546c67 and ver==2 and total==len(b)
 off=12; chunks={}
 while off<len(b):
  length,kind=struct.unpack_from('<II',b,off); chunks[kind]=b[off+8:off+8+length];off+=8+length
 d=json.loads(chunks[0x4e4f534a]); raw=chunks[0x004e4942]
 def accessor(i):
  a=d['accessors'][i]; v=d['bufferViews'][a['bufferView']]; assert 'sparse' not in a
  typ={5126:'<f4',5125:'<u4',5123:'<u2'}[a['componentType']]; n={'SCALAR':1,'VEC3':3}[a['type']];dt=np.dtype(typ); stride=v.get('byteStride',dt.itemsize*n)
  return np.ndarray((a['count'],n),dtype=typ,buffer=raw,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(stride,dt.itemsize)).copy()
 result={}
 for node in d['nodes']:
  if 'mesh' not in node:continue
  assert not any(k in node for k in ['matrix','translation','scale','rotation'])
  ps=[]
  for p in d['meshes'][node['mesh']]['primitives']:
   assert p.get('mode',4)==4
   vertices=accessor(p['attributes']['POSITION']);vertices=vertices[:,[0,2,1]];vertices[:,1]*=-1
   indices=accessor(p['indices']).reshape(-1,3)
   assert np.isfinite(vertices).all()
   tri=vertices[indices];u=tri[:,1,:2]-tri[:,0,:2];v=tri[:,2,:2]-tri[:,0,:2];assert np.all(u[:,0]*v[:,1]-u[:,1]*v[:,0]>0), 'winding/degenerate triangle'
   ps.append((vertices,indices,tri))
  result[node['name']]=ps
 return result
stats=[]; totals={'triangles':0,'changedTriangles':0,'uniqueChangedVertices':0}; changed_vertices=set()
for old,new in [('phase3h.glb','phase3i.glb'),('phase3h-inner.glb','phase3i-inner.glb')]:
 a=read(root/'public/data'/old);b=read(root/'public/data'/new);assert a.keys()==b.keys()
 for name in a:
  assert len(a[name])==len(b[name])
  for (av,ai,at),(bv,bi,bt) in zip(a[name],b[name]):
   # glTF may reorder vertices/index buffer, so compare oriented triangle XY keys.
   def ordered(t):
    order=np.lexsort((t[:,:,1],t[:,:,0]),axis=1);return np.take_along_axis(t,order[:,:,None],axis=1)
   aa=ordered(at);bb=ordered(bt)
   def sorttri(t):
    return t[np.lexsort(tuple(t[:,:,k].reshape(-1,3)[:,j] for j in (2,1,0) for k in (1,0)))]
   aa=sorttri(aa);bb=sorttri(bb)
   assert np.array_equal(aa[:,:,:2],bb[:,:,:2]),(name,'XY/topology changed')
   av=aa.reshape(-1,3);bv=bb.reshape(-1,3)
   delta=bv[:,2].astype(float)-av[:,2].astype(float); modified=delta!=0
   count=int(np.any(aa!=bb,axis=(1,2)).sum()); totals['triangles']+=len(at); totals['changedTriangles']+=count
   if modified.any():
    assert name=='ic-bridge.surface.grass',name
    p=bv[modified]; assert np.all((p[:,0]>-99)&(p[:,0]<-87)&(p[:,1]>2)&(p[:,1]<23))
    assert np.min(delta)>=0 and np.max(delta)<.0751
    changed_vertices.update(tuple(float(z) for z in x) for x in av[modified])
   stats.append({'file':new,'node':name,'triangles':len(at),'changedTriangles':count,'changedVertices':int(modified.sum()),'maxHeightDelta':float(np.max(np.abs(delta)))})
totals['uniqueChangedVertices']=len(changed_vertices)
assert totals=={'triangles':473792,'changedTriangles':418,'uniqueChangedVertices':180},totals
out.write_text(json.dumps({'status':'PASS','method':'independent GLB byte/stride/index reader and exact indexed comparison','totals':totals,'objects':stats},indent=2)+'\n')
print(totals)
