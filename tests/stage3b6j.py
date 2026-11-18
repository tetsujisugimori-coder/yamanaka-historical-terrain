"""Synthetic records and controlled local processes, never historical cause proof."""
import hashlib,copy,importlib.util,json,os,pathlib,subprocess,sys,time
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=pathlib.Path(sys.argv[1]);OUT.mkdir(exist_ok=True)
def module(name,path):
 s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
C=module('C',ROOT/'scripts/stage3b6j-case-record.py')
rows=[]
base={'trials':[{'status':'FAIL','withinBudget':True,'residual':[],'auditStatus':'PASS','cleanupFailure':None,'directChildExited':True,'firstFailure':'INDIVIDUAL_DEADLINE','budgetMs':1800,'elapsedMs':1300},{'status':'NOT_TESTED'}],'elapsedMs':1305}
outer={'firstFailure':None,'cleanupFailure':None,'auditStatus':'PASS','exitCode':1,'elapsedMs':1310}
for label in ['normal-fault','within-budget-false','external-wall','outer-failure','ledger-missing','ledger-corrupt','cleanup-failure','stdout-missing','stderr-missing','residual','direct-child']:
 p=OUT/label;(p/'first').mkdir(parents=True)
 for f in ['stdout.log','stderr.log']:(p/'first'/f).write_bytes(b'raw')
 d=copy.deepcopy(base);o=dict(outer);wall=1320
 if label=='within-budget-false':d['trials'][0]['withinBudget']=False
 if label=='external-wall':wall=4200
 if label=='outer-failure':o['firstFailure']='OUTER_TIMEOUT'
 if label=='cleanup-failure':d['trials'][0]['cleanupFailure']='CLEANUP_FAILED'
 if label=='residual':d['trials'][0]['residual']=[{'pid':42}]
 if label=='direct-child':d['trials'][0]['directChildExited']=False
 if label.endswith('-missing') and label!='ledger-missing':(p/'first'/label.replace('-missing','.log')).unlink()
 if label!='ledger-missing':(p/'trial-ledger.json').write_text('{' if label=='ledger-corrupt' else json.dumps(d))
 record,timing=C.evaluate('close',{'totalMs':4000},o,wall,p)
 (p/'assertion.json').write_text(json.dumps(record,indent=2));(p/'timing.json').write_text(json.dumps(timing))
 expected='PASS' if label=='normal-fault' else 'INCOMPLETE' if 'missing' in label or label=='ledger-corrupt' else 'FAIL'
 assert record['status']==expected,(label,record)
 assert bool(record['firstFailure'])==(expected!='PASS')
 rows.append({'case':label,'kind':'synthetic-record','expected':expected,'actual':record['status'],'pass':True})
# Same precise controlled delay in the old unsafe OPERATION checkpoint. The old CI
# did not measure fsync duration; this does NOT establish its historic root cause.
old=(ROOT/'tests/fixtures/stage3b6j/old-supervisor.txt').read_text()
assert hashlib.sha256(old.encode()).hexdigest()=='eb8e9c4ee03918616f77a80db5a8bc4c4fd48173dea2a0148d43d20d5e7fc68b'
(OUT/'old-supervisor.py').write_text(old)
fixture=OUT/'wait.py';fixture.write_text("import json,os,signal,time\nfrom pathlib import Path\np=Path(os.environ['B6G_OUT']);(p/'worker-result.json').write_text(json.dumps({'status':'FAIL','firstFailure':'CLOSE_STARTED'}));signal.signal(signal.SIGTERM,signal.SIG_IGN)\nwhile True:time.sleep(.01)\n")
for label,source in [('old',OUT/'old-supervisor.py'),('new',ROOT/'scripts/stage3b6g-supervisor.py')]:
 S=module(label,source);save=S.save_json;injected=[]
 def delayed(path,data):
  if path.name=='supervisor-checkpoint.json' and data.get('phase')=='OPERATION' and data.get('firstFailure') and not injected:
   injected.append(True);time.sleep(.7)
  return save(path,data)
 S.save_json=delayed
 cfg={'cwd':str(ROOT),'individualMs':1800,'totalMs':4000,'cleanupReserveMs':700,'termGraceMs':150,'auditReserveMs':150,'trials':[{'id':'first','argv':[sys.executable,str(fixture)]}]}
 result=S.supervise(cfg,OUT/('delay-'+label));r=result['trials'][0]
 assert r['residual']==[] and r['auditStatus']=='PASS'
 assert r['withinBudget']==(label=='new'),(label,r)
 rows.append({'case':'checkpoint-delay-'+label,'kind':'real-process-controlled-delay','delayReached':bool(injected),'expectedWithinBudget':label=='new','actualWithinBudget':r['withinBudget'],'elapsedMs':r['elapsedMs'],'pass':True})
# Independent-review exception counterexample: signal must precede persistence.
S=module('exception_control',ROOT/'scripts/stage3b6g-supervisor.py')
original_members=S.members;original_save=S.save_json;original_signal=S.signal_family
sequence=[];injected=[]
def broken_members(pid=None,errors=None):
 if pid and not injected:injected.append(True);raise RuntimeError('synthetic-observation-error')
 return original_members(pid,errors)
def watched_save(path,data):
 if path.name=='supervisor-checkpoint.json' and data.get('firstFailure')=='SPAWN_OR_SUPERVISOR_EXCEPTION':sequence.append('write')
 return original_save(path,data)
def watched_signal(*args):sequence.append('signal');return original_signal(*args)
S.members=broken_members;S.save_json=watched_save;S.signal_family=watched_signal
cfg={'cwd':str(ROOT),'individualMs':1800,'totalMs':4000,'cleanupReserveMs':700,'termGraceMs':150,'auditReserveMs':150,'trials':[{'id':'first','argv':[sys.executable,'-c','import time;time.sleep(20)']}]}
r=S.supervise(cfg,OUT/'exception-order')['trials'][0]
assert sequence.index('signal')<sequence.index('write') and r['residual']==[] and r['firstFailure']=='SPAWN_OR_SUPERVISOR_EXCEPTION'
rows.append({'case':'exception-signal-before-write','kind':'real-process-injected-observation-failure','sequence':sequence,'pass':True})
# Run the old and new harness with the SAME mutated measured-record predicate.
# Actual normal worker runs; withinBudget is changed only in the test record.
oldtest=(ROOT/'tests/fixtures/stage3b6j/old-harness.txt').read_text()
assert hashlib.sha256(oldtest.encode()).hexdigest()=='ac1d6c5a91b7d62b090676224602e91094fb4e0ef62e38bc15c4d959b470cc44'
newtest=(ROOT/'tests/stage3b6g-supervisor.py').read_text()
for label,text in [('old',oldtest),('new',newtest)]:
 text=text.replace('ROOT = Path(__file__).resolve().parents[1]', 'ROOT = Path('+repr(str(ROOT))+')')
 if label=='old':text=text.replace("row=data['trials'][0]", "row=data['trials'][0];row['withinBudget']=False")
 else:text=text.replace('row,timing=C.evaluate(mode,config,outer,wall,case)',"injected=json.loads((case/'trial-ledger.json').read_text());injected['trials'][0]['withinBudget']=False;(case/'trial-ledger.json').write_text(json.dumps(injected))\n        row,timing=C.evaluate(mode,config,outer,wall,case)")
 script=OUT/('harness-'+label+'.py');script.write_text(text);dest=OUT/('harness-'+label)
 r=subprocess.run([sys.executable,str(script),str(dest)],capture_output=True,timeout=8)
 (OUT/(label+'-harness.stdout')).write_bytes(r.stdout);(OUT/(label+'-harness.stderr')).write_bytes(r.stderr)
 assert r.returncode!=0
 if label=='old':assert not (dest/'assertions.json').exists()
 else:
  a=json.loads((dest/'assertions.json').read_text());assert len(a)==6 and a[0]['status']=='FAIL' and a[0]['firstFailure']=='WITHIN_BUDGET_FALSE' and all(x['status']=='NOT_TESTED' for x in a[1:])
 rows.append({'case':'withinBudget-harness-'+label,'kind':'actual-harness-record-mutation','exit':r.returncode,'failRecordPresent':(dest/'assertions.json').exists(),'pass':True})
# Local failed uploader process model, not a real GitHub upload attempt.
u=subprocess.run([sys.executable,'-c','raise SystemExit(7)'],capture_output=True)
assert u.returncode==7
rows.append({'case':'upload-failure-model','kind':'local-exit-model-not-GitHub','observedExit':u.returncode,'artifactUploadStatus':'FAIL','pass':True})
(OUT/'assertions.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows))
