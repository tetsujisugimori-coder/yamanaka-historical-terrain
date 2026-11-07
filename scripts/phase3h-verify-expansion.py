"""Exported G/H comparison, independent of elevation recipe. No archaeological inference."""
import json,runpy,math
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'production/phase3h'
p=runpy.run_path(str(ROOT/'scripts/phase3h-verify-geometry.py'));read,key,sample=p['read'],p['key'],p['sample']
g=json.loads((ROOT/'production/phase3g/parameters.json').read_text());h=json.loads((OUT/'parameters.json').read_text())
models=[];oldall={};newall={};outside_g=0
for file,oldfile,kind in [('phase3h.glb','phase3g.glb','nm'),('phase3h-inner.glb','phase3g-inner.glb','inner')]:
 old,new=read(oldfile),read(file);oldall.update(old);newall.update(new)
 boxes=[q['bounds'] for q in g['patches'] if ('inner' in q['model'])==(kind=='inner')]
 count=0;expanded=0;area=0;maxdelta=0
 for name,obj in new.items():
  oldz={tuple(map(float,v[:2])):float(v[2]) for v in old[name]['tri'].reshape(-1,3)}
  for t in obj['tri']:
   changed=any(abs(float(v[2])-oldz[tuple(map(float,v[:2]))])>1e-7 for v in t)
   if not changed:continue
   count+=1;maxdelta=max(maxdelta,max(abs(float(v[2])-oldz[tuple(map(float,v[:2]))]) for v in t))
   center=t[:,:2].mean(0);e,n=map(float,center)
   if not any(a<=e<=c and b<=n<=d for a,b,c,d in boxes):
    expanded+=1;u=t[1,:2]-t[0,:2];v=t[2,:2]-t[0,:2];area+=abs(float(u[0]*v[1]-u[1]*v[0]))/2
 assert expanded>0,('no actual expansion beyond G',file)
 models.append(dict(model=file,changedTriangles=count,changedTriangleCentresOutsideGBounds=expanded,projectedAreaOfThoseTriangles=area,maxVertexHeightChange=maxdelta));outside_g+=expanded
posts=[]
for i in range(5):
 e=-20+(i-2)*1.2;n=0;before=sample(oldall,e,n);after=sample(newall,e,n);assert before==after
 posts.append(dict(east=e,north=n,G=before,H=after,delta=after-before))
# Geometric centreline sampling of existing authored path, not assertion of historic route or obstacle-free travel.
paths=[]
for name in ['ic-bridge.surface.path','ic-koguchi.surface.path']:
 t=newall[name]['tri'].astype(float);normal=np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0]);slopes=np.degrees(np.arccos(np.clip(abs(normal[:,2])/np.linalg.norm(normal,axis=1),0,1)))
 paths.append(dict(object=name,triangles=len(t),maxSlope=float(slopes.max()),medianSlope=float(np.median(slopes)),trianglesAtOrBelowWalk38Degrees=int((slopes<=38).sum()),interpretation='surface geometry only; browser collision and foot-radius checks separate'))
# Counterexamples: altered support and zero expansion cannot pass acceptance helper.
def accept(expansion,supports):
 assert expansion>0
 assert all(math.isfinite(x['H']) and x['H']==x['G'] for x in supports)
accept(outside_g,posts);controls=[]
for label,count,ps in [('noExpansion',0,posts),('postMoved',outside_g,[dict(posts[0],H=posts[0]['H']+1)]+posts[1:]),('unknownSupport',outside_g,[dict(posts[0],H=float('nan'))]+posts[1:])]:
 try:accept(count,ps)
 except AssertionError:controls.append(dict(case=label,result='REJECT'))
 else:raise AssertionError('fault accepted '+label)
r=dict(status='PASS',models=models,fiveFixedPosts=posts,existingPathSlopes=paths,negativeControls=controls,limits='Projected areas count triangles by centroid and are not surveyed archaeology. No assertion of full castle route continuity.')
(OUT/'expansion-check.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r))
