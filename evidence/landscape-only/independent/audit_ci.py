import json,hashlib,sys,subprocess,zipfile,itertools
from pathlib import Path
zip_path,root,out=map(Path,sys.argv[1:]);root=root.resolve();head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip();tree=subprocess.check_output(['git','rev-parse','HEAD^{tree}'],cwd=root,text=True).strip()
with zipfile.ZipFile(zip_path) as z:
 r=json.loads(z.read('browser/results.json'));assert r['head']==head and r['tree']==tree
 expected={f'{e}-{w}-{m}' for e,w,m in itertools.product(['chromium','webkit'],[375,390,765,1280],['no-preference','reduce'])};assert len(r['rows'])==16 and {x['key'] for x in r['rows']}==expected
 assert r['hashes']==r['finalHashes']
 for f,h in r['hashes'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
 pngs=[];counts={'sections':0,'supports':0,'postMeasurements':0,'trustedKeydown':0,'walkMoves':0}
 for x in r['rows']:
  assert x['status']=='PASS' and x['errors']==[]
  for name,h in [(x['key']+'.png',x['pngSha256']),(x['key']+'-D.png',x['nature']['pngSha256'])]:
   data=z.read('browser/'+name);assert data[:8]==b'\x89PNG\r\n\x1a\n';assert hashlib.sha256(data).hexdigest()==h;pngs.append({'file':name,'sha256':h})
  for s in x['sections']:assert s['maxError']<.001;counts['sections']+=1
  for s in x['supports']:assert abs(s['error'])<.001;counts['supports']+=1
  for p in x['parts']:
   for post in p['posts']:assert post['base']==post['ground'];counts['postMeasurements']+=1
  counts['trustedKeydown']+=sum(t['type']=='keydown' and t.get('trusted') is True for t in x['walk']['trace']);counts['walkMoves']+=sum(t['type']=='move' for t in x['walk']['trace'])
  assert x['nature']['a']['visible'] is False and x['nature']['c']['visible'] is False and x['nature']['cd']['visible'] is True
 assert len(pngs)==32 and len([n for n in z.namelist() if n.endswith('.png')])==32
 p=json.loads(z.read('preservation.json'));assert p['status']=='PASS'
 for row in p['rows']:
  sha=subprocess.check_output(['git','hash-object',row['path']],cwd=root,text=True).strip();assert sha==row['blob']
report={'head':head,'tree':tree,'zipSha256':hashlib.sha256(zip_path.read_bytes()).hexdigest(),'rows':16,'pngs':pngs,'counts':counts,'sourceHashes':len(r['hashes']),'preservedPaths':p['checked'],'result':'PASS','scope':'Artifact results and hashes checked independently; not a new browser execution'};out.write_text(json.dumps(report,indent=2)+'\n');print({k:v for k,v in report.items() if k!='pngs'})
