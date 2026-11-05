"""Independent projected edge crossing intervals; does not import producer code."""
import runpy,json,numpy as np,hashlib,subprocess
from pathlib import Path
p=Path('evidence/phase3c/independent/technical');m=runpy.run_path(str(p/'mesh_review.py'));objs=m['read'](Path('public/data/phase3c.glb'));tri=np.concatenate([x['tri']for x in objs]);r=json.loads(Path('public/data/phase3c.json').read_text());height=m['height']
def breaks(a,b):
 a=np.array(a);d=np.array(b)-a;v=tri[:,:,[0,2]].copy();v[:,:,1]*=-1;u=v.reshape(-1,2);w=np.roll(v,-1,axis=1).reshape(-1,2)-u;q=u-a
 cross=lambda x,y:x[...,0]*y[...,1]-x[...,1]*y[...,0]
 den=cross(d,w);ok=abs(den)>1e-10;t=np.zeros(len(u));s=t.copy();t[ok]=cross(q[ok],w[ok])/den[ok];s[ok]=cross(q[ok],d)/den[ok];ok&=(t>=0)&(t<=1)&(s>=-1e-8)&(s<=1+1e-8)
 return np.unique(np.r_[0,np.round(t[ok],10),1])
def profile(a,b):
 ts=breaks(a,b);a=np.array(a);d=np.array(b)-a;pts=a+ts[:,None]*d;hs=np.array([max(height(tri,*pt))for pt in pts]);return ts,hs
slopes=[]
for n in [-31,-30,-29,-28,-27]:
 ts,hs=profile([-100,n],[-68,n]);gs=abs(np.diff(hs)/(np.diff(ts)*32));slopes.append({'north':n,'maxGrade':float(max(gs)),'segments':len(gs)})
def ray(st,xy,offset,scale):
 ts,hs=profile(st['eye'],xy);eye=max(height(tri,*st['eye']))*scale+1.7;target=max(height(tri,*xy))*scale+offset;clear=eye+(target-eye)*ts-hs*scale;return {'scale':scale,'minClearance':float(min(clear)),'fraction':float(ts[np.argmin(clear)]),'visible':bool(min(clear)>0),'segments':len(ts)-1}
rays=[dict(t,results=[ray(next(st for st in r['stations']if st['id']==t['stationId']),t['target'],t['targetOffset'],scale)for scale in [1,2]])for t in r['sightlineTests']]
if __name__=='__main__':
 print(json.dumps({'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'slopes':slopes,'rays':rays},ensure_ascii=False,indent=2))
