import runpy,sys,json
from pathlib import Path
import numpy as np
# Import only the separately written independent GLB decoder, not product code/oracles.
code=Path(__file__).with_name('audit_geometry.py').read_text().split('stats=[];')[0]
scope={'__name__':'independent_decoder'};exec(code,scope);read=scope['read'];root=Path(sys.argv[1]);out=Path(sys.argv[2])
models={k:read(root/'public/data'/f) for k,f in [('nm','phase3i.glb'),('inner','phase3i-inner.glb')]}
def height(model,e,n):
 hits=[]
 for node,ps in model.items():
  for _,_,tris in ps:
   xy=tris[:,:,:2]; mask=((xy[:,:,0].min(1)<=e+1e-7)&(xy[:,:,0].max(1)>=e-1e-7)&(xy[:,:,1].min(1)<=n+1e-7)&(xy[:,:,1].max(1)>=n-1e-7))
   for t in tris[mask].astype(float):
    A=np.vstack((t[:,:2].T,np.ones(3)));w=np.linalg.solve(A,np.array([e,n,1.]));
    if np.min(w)>=-1e-7:hits.append(float(w@t[:,2]))
 assert hits,(e,n)
 assert max(hits)-min(hits)<.0002,(e,n,hits)
 return sum(hits)/len(hits)
m=json.loads((root/'public/data/phase3i.json').read_text());report={'sections':[],'supports':[]}
for s in m['sections']:
 model=models['inner' if s['id'].startswith('bridge') else 'nm'];errors=[]
 for p in s['samples']:errors.append(abs(height(model,p['e'],p['n'])-p['height']))
 assert max(errors)<1e-8,(s['id'],max(errors));report['sections'].append({'id':s['id'],'count':len(errors),'maxError':max(errors)})
for s in m['stationSupport']:
 e,n=s['eye'];error=abs(height(models['inner' if e<-68 else 'nm'],e,n)-s['groundHeight']);assert error<1e-8
 report['supports'].append({'id':s['id'],'error':error})
report['status']='PASS';report['method']='Independent linear system barycentric solution over raw GLB triangles';out.write_text(json.dumps(report,indent=2)+'\n');print(report)
