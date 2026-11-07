import copy,hashlib,json,subprocess
from pathlib import Path
P=Path('evidence/phase3d/independent');b=json.loads((P/'browser-results.json').read_text());head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
def verify(r):
 assert r['head']==head,'STALE_HEAD'
 for f,h in r['hashes'].items():assert hashlib.sha256(Path(f).read_bytes()).hexdigest()==h,'STALE_SOURCE_HASH '+f
verify(b);neg=[]
for kind in ['old-head','old-source-hash']:
 r=copy.deepcopy(b)
 if kind=='old-head':r['head']='d2af615b872c9d42c7a5241573329e30f580a7af'
 else:r['hashes']['src/main.js']='0'*64
 try:verify(r);raise RuntimeError('STALE_EVIDENCE_ACCEPTED')
 except AssertionError as e:neg.append(dict(kind=kind,status='EXPECTED_REJECTION',signature=str(e)))
files=subprocess.check_output(['git','ls-files','src','production/phase3d','public/data/phase3d.glb','public/data/phase3d.json'],text=True).splitlines()
report=dict(status='PASS',head=head,tree=subprocess.check_output(['git','rev-parse','HEAD^{tree}'],text=True).strip(),sourceStableThroughoutBrowserRun=True,negative=neg,sha256={f:hashlib.sha256(Path(f).read_bytes()).hexdigest() for f in files})
(P/'evidence-guard.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
