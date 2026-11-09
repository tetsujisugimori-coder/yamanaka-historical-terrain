"""Independent audit of downloaded fixed-HEAD raw evidence; no project analyzer used.
Usage: python3 audit-followup.py RAW_DIRECTORY LABEL [RAW_BASENAME]
Read-only git object checks and independent endpoint sweep/bootstrap arithmetic.
"""
import json,pathlib,sys,hashlib,subprocess,statistics,math
root=pathlib.Path(__file__).resolve().parent;repo=pathlib.Path(subprocess.check_output(['git','rev-parse','--show-toplevel'],text=True).strip());rawdir=pathlib.Path(sys.argv[1]);label=sys.argv[2];name=sys.argv[3] if len(sys.argv)>3 else 'raw.json'
sha=lambda b:hashlib.sha256(b).hexdigest()
r=json.loads((rawdir/name).read_text());ident=json.loads((rawdir/(name+'.identity.json')).read_text());summary=json.loads((rawdir/(name+'.summary.json')).read_text());assert r['identity']==ident==summary['identity']
checks=[]
def git(*args):return subprocess.check_output(['git',*args],cwd=repo)
for role,v in ident['variants'].items():
 assert git('rev-parse',v['head']+'^{tree}').decode().strip()==v['tree']
 for f,h in v['sources'].items():
  actual=sha(git('show',v['head']+':src/'+f));assert actual==h,(role,f);checks.append({'role':role,'file':'src/'+f,'sha256':actual})
for f,h in ident['assetHashes'].items():
 for head in set(v['head'] for v in ident['variants'].values()):
  assert sha(git('show',head+':public/data/'+f))==h,(head,f)
checks.extend({'file':'public/data/'+f,'sha256':h,'allVariants':True} for f,h in ident['assetHashes'].items())
candidate=ident['variants'].get('A',ident['variants'].get('B'))['head']
for field,file in [('runnerHash','scripts/phase3j-followup-benchmark.mjs'),('analyzerHash','scripts/phase3j-followup-report.mjs')]:
 assert sha(git('show',candidate+':'+file))==ident[field];checks.append({'file':file,'sha256':ident[field]})
manifest=[]
if (rawdir/'SHA256SUMS').exists():
 for line in (rawdir/'SHA256SUMS').read_text().splitlines():
  digest,path=line.split(maxsplit=1);f=rawdir/pathlib.Path(path).name;assert sha(f.read_bytes())==digest,f;manifest.append(f.name)
if (rawdir/'SHA256.json').exists():
 for name_,digest in json.loads((rawdir/'SHA256.json').read_text()).items():
  assert sha((rawdir/name_).read_bytes())==digest,name_;manifest.append(name_)
screens=[]
for row in r['rows']:
 assert row['servedBuild']==ident['variants'][row['variant']]['build']
 if 'screenshot' in row:
  s=row['screenshot'];assert sha((rawdir/s['filename']).read_bytes())==s['sha256'];screens.append(s)

def describe(xs):
 a=sorted(xs);quant=lambda q: a[math.floor((len(a)-1)*q)]+(a[math.ceil((len(a)-1)*q)]-a[math.floor((len(a)-1)*q)])*((len(a)-1)*q-math.floor((len(a)-1)*q))
 return {'n':len(xs),'min':min(xs),'median':statistics.median(xs),'q1':quant(.25),'q3':quant(.75),'max':max(xs),'mean':sum(xs)/len(xs),'all':xs,'exclusions':0}
def paired(xs):
 seed=123456789;boot=[]
 for _ in range(5000):
  selected=[]
  for _ in xs:
   seed=(1664525*seed+1013904223)&0xffffffff;selected.append(xs[int(seed/4294967296*len(xs))])
  boot.append(sum(selected)/len(xs))
 boot.sort();return dict(describe(xs),improved=sum(x<0 for x in xs),descriptiveBootstrap95=[boot[124],boot[4874]])
def close(a,b):
 if isinstance(a,(int,float)) and isinstance(b,(int,float)):assert abs(a-b)<1e-6,(a,b)
 elif isinstance(a,list):assert len(a)==len(b);[close(x,y) for x,y in zip(a,b)]
 elif isinstance(a,dict):
  for k,v in a.items():close(v,b[k])
 else:assert a==b,(a,b)
groups={};contrasts={};caches=ident['plan']['caches'];blocks=ident['plan']['blocks'];kind=ident['plan']['kind']
for role in ident['variants']:
 for cache in caches:
  rows=[x for x in r['rows'] if x['variant']==role and x['cache']==cache];groups[role+'/'+cache]={'facility':describe([x['facilityMs'] for x in rows]),'initialReady':describe([x['initialReadyMs'] for x in rows])}
close(groups,summary['groups'])
value=lambda b,v,c:next(x['facilityMs'] for x in r['rows'] if x['block']==b and x['variant']==v and x['cache']==c)
if kind=='overhead':
 for c in caches:
  for name_,a,b in [('incrementalDefault','I','A'),('detailedInterference','A','AD')]:contrasts[name_+'/'+c]=paired([value(i,b,c)-value(i,a,c) for i in range(1,blocks+1)])
else:
 for c in caches:
  bases=[(value(i,'Apre',c)+value(i,'Apost',c))/2 for i in range(1,blocks+1)];bs=[value(i,'B',c) for i in range(1,blocks+1)]
  contrasts[c]={'delta':paired([b-a for a,b in zip(bases,bs)]),'baselineMidpoint':describe(bases),'candidate':describe(bs),'medianChangePercent':(statistics.median(bs)/statistics.median(bases)-1)*100,'orderDrift':paired([value(i,'Apost',c)-value(i,'Apre',c) for i in range(1,blocks+1)])}
close(contrasts,summary['contrasts'])
accounting=[]
for row in r['rows']:
 if not ident['variants'][row['variant']]['profile']:continue
 log=row['diagnostics']['phase3i'];spans=list(log['spans'])+[x for x in log['entries'] if x['stage'] in ['fetch','parse','geometryMaterials']]
 for step in row['steps']:
  es=[x for x in row['inputEvents'] if x['id']==step['selector'][1:] and step['start']<=x['time']<=step['end']];assert len(es)==1;spans.append({'stage':'automationInputPreparation','start':step['start'],'end':es[0]['time']})
 spans.append({'stage':'twoRAFPresentationProxyWait','start':row['rafStart'],'end':row['end']});events={};inclusive={}
 for s in spans:
  a,b=max(row['start'],s['start']),min(row['end'],s['end']);inclusive[s['stage']]=inclusive.get(s['stage'],0)+max(0,b-a)
  if b>a:events[a]=events.get(a,0)+1;events[b]=events.get(b,0)-1
 covered=0;active=0;prev=None
 for t,delta in sorted(events.items()):
  if prev is not None and active>0:covered+=t-prev
  active+=delta;prev=t
 assert active==0
 record={'id':row['id'],'variant':row['variant'],'cache':row['cache'],'wall':row['facilityMs'],'covered':covered,'unknown':row['facilityMs']-covered,'inclusiveStageMs':inclusive};accounting.append(record)
close(accounting,summary['accounting'])
result={'label':label,'kind':kind,'rows':len(r['rows']),'rawSHA256':sha((rawdir/name).read_bytes()),'sourceChecks':checks,'manifestMembersVerified':manifest,'screenshotsVerified':screens,'groups':groups,'contrasts':contrasts,'accounting':accounting,'independentSummaryMatch':True,'coverageRange':[min(x['covered']/x['wall'] for x in accounting),max(x['covered']/x['wall'] for x in accounting)] if accounting else None,'limitations':'Build bytes recorded/served verified, independent fresh rebuild pending. Browser automated Chromium SwiftShader only; real Safari, physical input, GPU internals NOT_TESTED. Bootstrap is descriptive. No intervention-equivalence claim.'}
(root/(label+'-independent-audit.json')).write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'label':label,'rows':len(r['rows']),'sourceChecks':len(checks),'manifestMembersVerified':len(manifest),'screenshotsVerified':len(screens),'medians':{k:v['facility']['median'] for k,v in groups.items()},'contrasts':contrasts,'coverageRange':result['coverageRange'],'independentSummaryMatch':True},indent=2))
