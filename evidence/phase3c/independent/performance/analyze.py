import json,statistics,collections,hashlib,sys
from pathlib import Path
src=Path(sys.argv[1] if len(sys.argv)>1 else 'evidence/phase3c/history/performance-before-p2-fix/results.json');x=json.loads(src.read_text());groups=collections.defaultdict(list)
for r in x['rows']:groups[r['engine'],r['width'],r['quality'],r['version']].append(r)
comparisons=[]
for eng in ['chromium','webkit']:
 for width in [390,1280]:
  for q in ['balanced','light','high']:
   out={'engine':eng,'width':width,'quality':q}
   for ver in ['base','phase3c']:
    rows=groups[eng,width,q,ver];vals=[v for r in rows for v in r['inputAndTwoFrameMs']];out[ver]={'trials':len(rows),'inputMedianMs':statistics.median(vals),'inputRangeMs':[min(vals),max(vals)],'readyMedianMs':statistics.median(r['readyMs']for r in rows),'switchMedianMs':statistics.median(r['qualitySwitchAndTwoFrameMs']for r in rows),'triangles':sorted(set(r['diagnostics']['triangles']for r in rows)),'drawCalls':sorted(set(r['diagnostics']['drawCalls']for r in rows))}
   out['inputChangePercent']=(out['phase3c']['inputMedianMs']/out['base']['inputMedianMs']-1)*100
   out['sameInitialPose']=len(set(json.dumps(r['initialPose'],sort_keys=True)for ver in ['base','phase3c']for r in groups[eng,width,q,ver]))==1
   comparisons.append(out)
result={'artifactHead':x['head'],'base':x['base'],'resultsSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'rows':len(x['rows']),'allExecutionStatusesPASS':all(r['status']=='PASS'for r in x['rows']),'comparisons':comparisons,'productHashesVersusCurrent':{f:hashlib.sha256(Path(f).read_bytes()).hexdigest()==h for f,h in x['hashes'].items() if f!='scripts/phase3c-performance.mjs'},'bytes':x['bytes'],'capacityAdditionPercent':x['bytes']['phase3c.glb']/sum(v for k,v in x['bytes'].items()if k!='phase3c.glb')*100}
Path('evidence/phase3c/independent/performance/analysis.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
