"""Read raw immutable GLB triangles to check fresh browser section coordinates."""
import json,struct,subprocess,hashlib
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
  assert not any(k in node for k in ['matrix','translation','rotation','scale'])
  for p in g['meshes'][node['mesh']]['primitives']:
   v=acc(p['attributes']['POSITION']);ix=acc(p['indices']).ravel().astype(int);out.append(v[ix].reshape((-1,3,3)))
 return np.concatenate(out)
def ground(ts,x,z):
 a,b,c=ts[:,0,:],ts[:,1,:],ts[:,2,:];d=(b[:,2]-c[:,2])*(a[:,0]-c[:,0])+(c[:,0]-b[:,0])*(a[:,2]-c[:,2]);valid=np.abs(d)>1e-12;d=np.where(valid,d,1)
 u=((b[:,2]-c[:,2])*(x-c[:,0])+(c[:,0]-b[:,0])*(z-c[:,2]))/d;v=((c[:,2]-a[:,2])*(x-c[:,0])+(a[:,0]-c[:,0])*(z-c[:,2]))/d;w=1-u-v;mask=valid&(np.minimum(np.minimum(u,v),w)>=-1e-8);values=(u*a[:,1]+v*b[:,1]+w*c[:,1])[mask];assert len(values);return float(max(values))
raw={'A':load(R/'public/data/castle.glb'),'C':load(R/'public/data/nishinomaru.glb')};report={'rows':[]};browser=json.loads((O/'browser-results.json').read_text())
for row in browser['rows']:
 for section in row.get('sections',[]):
  s=section['id'];start,end=([-66,-10],[-38,-10]) if s=='moat' else ([-15,15],[-45,15]);dist=float(np.linalg.norm(np.array(end)-start));errors=[]
  for kind in ['A','C']:
   profile=section['data'][kind];assert abs(profile['length']-dist)<1e-9
   for piece in profile['segments']:
    for t in [.13,.5,.87]:
     d=piece['from']+(piece['to']-piece['from'])*t;x,n=np.array(start)+(np.array(end)-start)*d/dist;actual=piece['h0']+(piece['h1']-piece['h0'])*t;expected=ground(raw[kind],x,-n);errors.append(abs(actual-expected));assert abs(actual-expected)<.001
  report['rows'].append(dict(browser=row['name'],section=s,samples=len(errors),maximumError=max(errors)))
assert report['rows'];baseline='988735123024650c8ae44e6a69f73b14b4669fc6';changed=subprocess.check_output(['git','diff','--name-status',baseline,'1945791afb91353ec073a03f5a3bbf33e8093cdd'],text=True).splitlines()
for line in changed:
 status,path=line.split('\t');assert status=='A' or path in ['src/main.js','src/phase3b.js']
report.update(status='PASS',priorTerrainNativeAndSourceRecordsUnchanged=True,baselineChanges=changed,head=browser['head'],hashes={f:hashlib.sha256((R/f).read_bytes()).hexdigest() for f in ['public/data/castle.glb','public/data/nishinomaru.glb','public/data/phase3c.glb','public/data/phase3d.glb']})
(O/'sections-preservation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
