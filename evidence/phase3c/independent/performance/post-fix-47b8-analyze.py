import json,statistics,collections,hashlib,sys
from pathlib import Path
if len(sys.argv)!=2: raise SystemExit('Required: explicit path to run42152881096 performance/results.json')
src=Path(sys.argv[1]);raw=src.read_bytes();x=json.loads(raw)
assert x['head']=='c239f2b36f9aa119b7c4eaf156bf47d7aa16a2e7', 'wrong artifact HEAD'
assert x['tree']=='5e44d4b1a310a45c9de1176939c6c60fb16b76d1', 'wrong artifact tree'
assert hashlib.sha256(raw).hexdigest()=='2db950f48c1c583e30ac0be69eadb70dbd5110478500d9d08d4d1db440fe005c', 'wrong raw JSON bytes'
groups=collections.defaultdict(list)
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
Path('evidence/phase3c/independent/performance/post-fix-47b8-analysis.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))

result.update(metadataVersion=x['metadataVersion'],artifactTree=x['tree'],artifactURL='https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42152881096/artifacts/13473804018',zipSha256ReportedByParent='e5425c90db8fe4ceb50c6eb3754a409f6b8db920a06765d66eb6ba48a3576ef0',allFov38=all(r['diagnostics']['cameraFov']==38 for r in x['rows']),allQualityMatches=all(r['quality']==r['diagnostics']['phase3b']['quality']for r in x['rows']),notStartupMeasured=True,rawCopiedToGit=False)
assert len(comparisons)==12 and all(r['inputChangePercent']<0 for r in comparisons)
assert next(r for r in comparisons if (r['engine'],r['width'],r['quality'])==('webkit',1280,'balanced'))['base']['inputMedianMs']==1091.5
assert abs(next(r for r in comparisons if (r['engine'],r['width'],r['quality'])==('webkit',1280,'balanced'))['phase3c']['inputMedianMs']-508)<1e-6
Path('evidence/phase3c/independent/performance/post-fix-47b8-analysis.json').write_text(json.dumps(result,indent=2))
report=Path('evidence/phase3c/independent/performance/post-fix-47b8-REPORT.md');text=report.read_text();a=text.index('| Engine/width/quality |');b=text.index('\nMedians use24',a)
lines=['| Engine/width/quality | Median input+2RAF ms base→fixed | Change | Landscape-entry ms base→fixed |','|---|---:|---:|---:|']
for r in comparisons:
 before=r['base'];after=r['phase3c'];lines.append(f"| {r['engine']}/{r['width']}/{r['quality']} | {before['inputMedianMs']:.1f} → {after['inputMedianMs']:.1f} | {r['inputChangePercent']:+.1f}% | {before['readyMedianMs']:.0f} → {after['readyMedianMs']:.0f} |")
text=text[:a]+'\n'.join(lines)+'\n'+text[b:]
import re
text=re.sub(r'Raw results SHA256 [0-9a-f]{64}', 'Raw results SHA256 '+result['resultsSha256'], text)
report.write_text(text)
