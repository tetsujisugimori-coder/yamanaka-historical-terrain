"""Synthetic records and controlled local processes, never historical cause proof."""
import hashlib,copy,importlib.util,json,os,pathlib,subprocess,sys,time
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=pathlib.Path(sys.argv[1]);OUT.mkdir(exist_ok=True)
def module(name,path):
 s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
C=module('C',ROOT/'scripts/stage3b6j-case-record.py')
NAMES = ['normal-fault','within-budget-false','external-wall','outer-failure',
         'ledger-missing','ledger-corrupt','cleanup-failure','stdout-missing',
         'stderr-missing','residual','direct-child','checkpoint-delay-old',
         'checkpoint-delay-new','adopted-zombie-reap','exception-signal-before-write',
         'withinBudget-harness-old','withinBudget-harness-new','upload-failure-model']
INDEX = {name: i for i, name in enumerate(NAMES)}
rows = [{'case': name, 'status': 'NOT_TESTED', 'pass': False,
         'reason': 'PRIOR_CASE_NOT_COMPLETED'} for name in NAMES]
active = None
def persist():
    target = OUT/'assertions.json'
    pending = target.with_name(target.name+'.pending')
    pending.write_text(json.dumps(rows, indent=2, allow_nan=False))
    os.replace(pending, target)
def begin(name):
    global active
    if name not in INDEX or active is not None: raise ValueError('INVALID_CASE_TRANSITION')
    active = name
    rows[INDEX[name]] = {'case': name, 'status': 'RUNNING', 'pass': False}
    persist()
def finish(row):
    global active
    name = row['case']
    if name != active: raise ValueError('CASE_ID_MISMATCH')
    rows[INDEX[name]] = {**row, 'status': 'PASS' if row.get('pass') is True else 'FAIL'}
    persist()
    active = None
def capture_exception(kind, value, tb):
    global active
    if active is not None:
        row = rows[INDEX[active]]
        row['status'] = 'FAIL' if issubclass(kind, AssertionError) else 'INCOMPLETE'
        row['firstFailure'] = 'CONTROL_ASSERTION_FAILED' if issubclass(kind, AssertionError) else 'CONTROL_EXECUTION_EXCEPTION'
        row['exceptionType'] = kind.__name__
        persist()
    sys.__excepthook__(kind, value, tb)
sys.excepthook = capture_exception
persist()
base={'trials':[{'status':'FAIL','withinBudget':True,'residual':[],'auditStatus':'PASS','cleanupFailure':None,'directChildExited':True,'firstFailure':'INDIVIDUAL_DEADLINE','budgetMs':1800,'elapsedMs':1300},{'status':'NOT_TESTED'}],'elapsedMs':1305}
outer={'firstFailure':None,'cleanupFailure':None,'auditStatus':'PASS','exitCode':1,'elapsedMs':1310}
for label in ['normal-fault','within-budget-false','external-wall','outer-failure','ledger-missing','ledger-corrupt','cleanup-failure','stdout-missing','stderr-missing','residual','direct-child']:
 begin(label)
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
 finish({'case':label,'kind':'synthetic-record','expected':expected,'actual':record['status'],'pass':True})
# Same precise controlled delay in the old unsafe OPERATION checkpoint. The old CI
# did not measure fsync duration; this does NOT establish its historic root cause.
old=(ROOT/'tests/fixtures/stage3b6j/old-supervisor.txt').read_text()
assert hashlib.sha256(old.encode()).hexdigest()=='eb8e9c4ee03918616f77a80db5a8bc4c4fd48173dea2a0148d43d20d5e7fc68b'
(OUT/'old-supervisor.py').write_text(old)
fixture=OUT/'wait.py';fixture.write_text("import json,os,signal,time\nfrom pathlib import Path\np=Path(os.environ['B6G_OUT']);(p/'worker-result.json').write_text(json.dumps({'status':'FAIL','firstFailure':'CLOSE_STARTED'}));signal.signal(signal.SIGTERM,signal.SIG_IGN)\nwhile True:time.sleep(.01)\n")
# Run old and new sources in independently supervised OS children. The original
# RED result remains diagnostic even when the outer containment passes.
WATCH=module('outer_watchdog',ROOT/'scripts/stage3b6h-watchdog.py')
for label in ['old','new']:
 begin('checkpoint-delay-'+label)
 target=OUT/('delay-'+label)
 command=[sys.executable,str(ROOT/'tests/stage3b6k-delay.py'),label,
          str(OUT/'old-supervisor.py' if label=='old' else ROOT/'scripts/stage3b6g-supervisor.py'),
          str(fixture),str(target)]
 outer_result=WATCH.run_bounded(command,OUT,'b6k-delay-'+label,timeout=5)
 summary=None
 try:summary=json.loads((target/'b6k-summary.json').read_text())
 except (OSError,ValueError,TypeError):pass
 contained=(outer_result.get('auditStatus')=='PASS' and outer_result.get('residual')==[]
            and outer_result.get('directChildExited') is True and outer_result.get('exitCode')==0
            and outer_result.get('cleanupFailure') is None)
 observed=(isinstance(summary,dict) and summary.get('label')==label
           and summary.get('injectedDelayReached') is (label=='old')
           and summary.get('signalObserved') is True
           and summary.get('checkpointBetweenDeadlineAndSignal') is (label=='old')
           and summary.get('withinBudget') is (label=='new')
           and summary.get('firstFailure') is not None)
 # The old inner audit is deliberately not promoted: its failures and Z remain
 # raw observations. Only the outer bounded containment is scored here.
 passed=bool(contained and observed and (label=='old' or
           (summary.get('auditStatus')=='PASS' and summary.get('residual')==[]
            and summary.get('directChildExited') is True and summary.get('cleanupFailure') is None)))
 finish({'case':'checkpoint-delay-'+label,'kind':'isolated-real-process-controlled-delay',
         'expectedWithinBudget':label=='new','observedInner':summary,
         'outerAuditStatus':outer_result.get('auditStatus'),
         'outerFirstFailure':outer_result.get('firstFailure'),
         'outerPreCleanupSnapshot':outer_result.get('preCleanupSnapshot'),
         'outerResidual':outer_result.get('residual'),
         'outerExitCode':outer_result.get('exitCode'),
         'outerCleanupFailure':outer_result.get('cleanupFailure'),
         'baselineInnerResultPromoted':False,'pass':passed})
 assert passed,('DELAY_CONTAINMENT_OR_CONTROL_FAILED',label,summary,outer_result)
# Deterministic Linux zombie negative control: adopted child must be reaped by
# the owning subreaper, but Popen must keep the direct child's wait status.
begin('adopted-zombie-reap')
Z=module('zombie_reaper',ROOT/'scripts/stage3b6g-supervisor.py')
Z.enable_subreaper()
zdir=OUT/'adopted-zombie';zdir.mkdir()
pid_path=zdir/'adopted.pid'
script=("import subprocess,sys\nfrom pathlib import Path\n"
        "p=subprocess.Popen([sys.executable,'-c','import os,time;time.sleep(.2);os._exit(0)'],start_new_session=True)\n"
        "Path(sys.argv[1]).write_text(str(p.pid))\n")
parent=subprocess.Popen([sys.executable,'-c',script,str(pid_path)])
assert parent.wait(timeout=2)==0
adopted=int(pid_path.read_text())
errors=[];observed=None;deadline=time.monotonic()+2
while time.monotonic()<deadline:
 try:
  parts=pathlib.Path(f'/proc/{adopted}/stat').read_text().rsplit(')',1)[1].split()
  if parts[0]=='Z' and int(parts[1])==os.getpid():
   observed={'pid':adopted,'state':parts[0],'ppid':int(parts[1]),'birth':parts[19]};break
 except FileNotFoundError:break
 time.sleep(.01)
assert observed is not None,('ADOPTED_Z_NOT_OBSERVED',adopted)
reaped=Z.reap_adopted(parent.pid,errors)
assert any(r['pid']==adopted and r['birth']==observed['birth'] for r in reaped)
assert not pathlib.Path(f'/proc/{adopted}').exists()
direct=subprocess.Popen([sys.executable,'-c','import sys;sys.exit(7)'])
time.sleep(.05)
Z.reap_adopted(direct.pid,errors)
assert direct.wait(timeout=2)==7 and not errors,('DIRECT_EXIT_OR_REAP_FAILURE',errors)
finish({'case':'adopted-zombie-reap','kind':'real-linux-adopted-zombie',
        'adopted':observed,'reaped':reaped,'directExit':7,'errors':errors,'pass':True})
# Independent-review exception counterexample: signal must precede persistence.
begin('exception-signal-before-write')
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
finish({'case':'exception-signal-before-write','kind':'real-process-injected-observation-failure','sequence':sequence,'pass':True})
# Run the old and new harness with the SAME mutated measured-record predicate.
# Actual normal worker runs; withinBudget is changed only in the test record.
oldtest=(ROOT/'tests/fixtures/stage3b6j/old-harness.txt').read_text()
assert hashlib.sha256(oldtest.encode()).hexdigest()=='ac1d6c5a91b7d62b090676224602e91094fb4e0ef62e38bc15c4d959b470cc44'
newtest=(ROOT/'tests/stage3b6g-supervisor.py').read_text()
for label,text in [('old',oldtest),('new',newtest)]:
 begin('withinBudget-harness-'+label)
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
 finish({'case':'withinBudget-harness-'+label,'kind':'actual-harness-record-mutation','exit':r.returncode,'failRecordPresent':(dest/'assertions.json').exists(),'pass':True})
# Local failed uploader process model, not a real GitHub upload attempt.
begin('upload-failure-model')
u=subprocess.run([sys.executable,'-c','raise SystemExit(7)'],capture_output=True)
assert u.returncode==7
finish({'case':'upload-failure-model','kind':'local-exit-model-not-GitHub','observedExit':u.returncode,'artifactUploadStatus':'FAIL','pass':True})
persist()
print(json.dumps(rows))
