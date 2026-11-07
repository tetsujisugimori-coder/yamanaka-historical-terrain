"""Independent full inner GLB edge-valence and projected coverage audit."""
import runpy,json,collections
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'production/phase3f'
s=runpy.run_path(str(ROOT/'scripts/phase3f-verify-geometry.py'));models=s['read']('phase3f-inner.glb');edges=collections.Counter();heights={};maxgap=0;area=0
for obj in models.values():
 for tri in obj['tri']:
  xy=[tuple(map(float,p[:2])) for p in tri]
  for p in tri:
   k=tuple(map(float,p[:2]));z=float(p[2]);maxgap=max(maxgap,abs(heights.get(k,z)-z));heights[k]=z
  for i in range(3):edges[tuple(sorted([xy[i],xy[(i+1)%3]]))]+=1
  a,b,c=tri;area+=float((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2
bad=[]
for edge,count in edges.items():
 a,b=edge;outer=(a[0]==b[0] and a[0] in [-100,-68]) or (a[1]==b[1] and a[1] in [-45,50])
 if count!=(1 if outer else 2):bad.append((edge,count))
assert not bad,bad[:10]
assert maxgap<.0001 and abs(area-32*95)<.001
r=dict(status='PASS',innerProjectedArea=area,expectedArea=3040,edges=len(edges),badEdgeValenceCount=len(bad),maxSharedVertexHeightGap=maxgap,meaning='no T-junctions or open internal edges in exported full inner surface')
(OUT/'edge-check.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r))
