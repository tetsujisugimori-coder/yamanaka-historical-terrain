"""Non-browser B6h evidence failure controls. Separate from product acceptance."""
import importlib.util
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(sys.argv[1]).resolve();OUT.mkdir(parents=True,exist_ok=False)
spec=importlib.util.spec_from_file_location('supervisor',ROOT/'scripts/stage3b6g-supervisor.py')
S=importlib.util.module_from_spec(spec);spec.loader.exec_module(S)
fixture=OUT/'worker.py'
fixture.write_text('''import json,os,signal,sys,time
from pathlib import Path
out=Path(os.environ['B6G_OUT']);mode=sys.argv[1]
print('partial 日本語',flush=True);print('partial error',file=sys.stderr,flush=True)
if mode=='missing':sys.exit(0)
if mode=='invalid':(out/'worker-result.json').write_text('{');sys.exit(0)
if mode=='killed':os.kill(os.getpid(),signal.SIGKILL)
if mode=='record-failure':(out/'supervisor-result.json').mkdir()
if mode=='first-cleanup':
 (out/'worker-result.json').write_text(json.dumps({'status':'FAIL','firstFailure':'INITIAL_FAILURE'}))
 signal.signal(signal.SIGTERM,signal.SIG_IGN)
 while True:time.sleep(.01)
(out/'worker-result.json').write_text(json.dumps({'status':'OBSERVED','firstFailure':None}))
''')
rows=[]
CASE_NAMES=['normal','missing','invalid','killed','record-failure','first-cleanup','stdout-failure','audit-failure','timeout-partial','timeout-silent','outer-timeout','outer-timeout-silent','outer-orphan','worker-first-cleanup']
case_ledger={name:{'case':name,'status':'NOT_TESTED'} for name in CASE_NAMES}
active=None
def persist_cases():S.save_json(OUT/'execution-cases.json',list(case_ledger.values()))
def begin_case(name):
    global active
    active=name;case_ledger[name]['status']='RUNNING';persist_cases()
def finish_case(row):
    global active
    rows.append(row);case_ledger[active]['status']='PASS';persist_cases();active=None
def capture_exception(kind,value,tb):
    if active is not None:
        case_ledger[active].update(status='FAIL' if issubclass(kind,AssertionError) else 'INCOMPLETE',exceptionType=kind.__name__)
        persist_cases()
    sys.__excepthook__(kind,value,tb)
sys.excepthook=capture_exception
persist_cases()
for mode in ['normal','missing','invalid','killed','record-failure','first-cleanup','stdout-failure','audit-failure']:
    begin_case(mode)
    cfg={'cwd':str(ROOT),'individualMs':1800,'totalMs':4000,'cleanupReserveMs':700,'termGraceMs':150,'auditReserveMs':150,
         'trials':[{'id':'first','argv':[sys.executable,str(fixture),mode]}, {'id':'remaining','argv':[sys.executable,str(fixture),'normal']}]}
    case=OUT/mode;start=time.time();begin=time.monotonic()
    original=Path.open
    def failing_open(self,*a,**kw):
        if self.name=='stdout.log':raise OSError('injected')
        return original(self,*a,**kw)
    original_members=S.members
    def incomplete(pid=None,errors=None):
        if errors is not None:errors.append('INJECTED_AUDIT_FAILURE')
        return original_members(pid,errors)
    if mode=='stdout-failure':
        with patch.object(Path,'open',failing_open):result=S.supervise(cfg,case)
    elif mode=='audit-failure':
        with patch.object(S,'members',incomplete):result=S.supervise(cfg,case)
    else:result=S.supervise(cfg,case)
    S.save_json(case/'test-observed-before-assert.json',result)
    row=result['trials'][0]
    expected='COMPLETED' if mode=='normal' else 'INCOMPLETE' if mode in ('record-failure','audit-failure') else 'FAIL'
    assert row['status']==expected,(mode,row)
    assert row['residual']==[],(mode,row)
    assert row['withinBudget'],(mode,row)
    if mode!='normal':assert result['trials'][1]['status']=='NOT_TESTED'
    if mode=='first-cleanup':assert row['workerFirstFailure']=='INITIAL_FAILURE' and row['firstFailure']=='INDIVIDUAL_DEADLINE'
    if mode not in ('stdout-failure',):assert (case/'first/stdout.log').read_bytes().startswith('partial 日本語'.encode())
    finish_case({'case':mode,'expected':expected,'actual':row['status'],'firstFailure':row['firstFailure'],'cleanupFailure':row['cleanupFailure'],'auditStatus':row['auditStatus'],'residual':row['residual'],'startedAt':start,'elapsedMs':(time.monotonic()-begin)*1000,'passed':True})
    S.save_json(OUT/'assertions.json',rows)
# Actual TimeoutExpired partial bytes/no output, fixed 0.1s fault-only timeout, no descendants.
for mode,body in [('partial',"import time;print('日本語',flush=True);time.sleep(10)"),('silent','import time;time.sleep(10)')]:
    begin_case('timeout-'+mode)
    start=time.time()
    try:subprocess.run([sys.executable,'-c',body],capture_output=True,text=True,timeout=.1)
    except subprocess.TimeoutExpired as exc:
        raw=exc.stdout or b'';raw=raw.encode() if isinstance(raw,str) else raw
        (OUT/(mode+'-partial.bin')).write_bytes(raw)
        assert isinstance(raw,bytes)
        if mode=='partial':assert '日本語'.encode() in raw
        else:assert raw==b''
        finish_case({'case':'timeout-'+mode,'expected':'TIMEOUT','actual':'TIMEOUT','partialBytes':len(raw),'startedAt':start,'passed':True})
watchspec=importlib.util.spec_from_file_location('watchdog', ROOT/'scripts/stage3b6h-watchdog.py')
W=importlib.util.module_from_spec(watchspec);watchspec.loader.exec_module(W)
for mode,body in [('outer-timeout',"import time;print('partial 日本語',flush=True);time.sleep(10)"),('outer-timeout-silent','import time;time.sleep(10)')]:
    begin_case(mode)
    data=W.run_bounded([sys.executable,'-c',body],OUT,mode,timeout=.1)
    S.save_json(OUT/(mode+'-test-observed-before-assert.json'),data)
    assert data['firstFailure']=='OUTER_TIMEOUT' and data['directChildExited'] and data['residual']==[] and data['auditStatus']=='PASS',json.dumps({'case':mode,'outerResult':data,'scope':'B6K_DIAGNOSTIC_NO_PASS_PROMOTION'})
    finish_case({'case':mode,'expected':'OUTER_TIMEOUT','actual':data['firstFailure'],'cleanupFailure':data['cleanupFailure'],'auditStatus':data['auditStatus'],'passed':True})
begin_case('outer-orphan')
orphan=W.run_bounded([sys.executable,'-c',"import subprocess,sys,time;subprocess.Popen([sys.executable,'-c','import time;time.sleep(20)'],start_new_session=True);time.sleep(.1)"],OUT,'outer-orphan',timeout=.5)
S.save_json(OUT/'outer-orphan-test-observed-before-assert.json',orphan)
assert orphan['exitCode']==0 and orphan['firstFailure']=='OUTER_CHILD_RESIDUAL' and orphan['preCleanupSnapshot'] and orphan['residual']==[] and orphan['auditStatus']=='PASS'
finish_case({'case':'outer-orphan','expected':'OUTER_CHILD_RESIDUAL','actual':orphan['firstFailure'],'cleanupFailure':orphan['cleanupFailure'],'auditStatus':orphan['auditStatus'],'passed':True})
# Execute actual worker control flow with a synthetic runtime: initial operation and close both fail.
begin_case('worker-first-cleanup')
fake=OUT/'fake-runtime.mjs';fake.write_text("const browser={newContext:async()=>{throw Error('injected operation');},close:async()=>{throw Error('injected close');}};export const chromium={launch:async()=>browser};export const webkit=chromium;")
pkg=OUT/'fake-package.json';pkg.write_text(json.dumps({'version':'1.56.1'}))
workerout=OUT/'worker-first-cleanup';workerout.mkdir()
env={**os.environ,'B6G_OUT':str(workerout),'B6G_PLAYWRIGHT_MODULE':str(fake),'B6G_PLAYWRIGHT_PACKAGE':str(pkg)}
r=subprocess.run(['node',str(ROOT/'scripts/stage3b6g-worker.mjs'),'chromium','missing'],env=env,capture_output=True,timeout=6)
(workerout/'stdout.log').write_bytes(r.stdout);(workerout/'stderr.log').write_bytes(r.stderr)
data=json.loads((workerout/'worker-result.json').read_text())
assert r.returncode==1 and data['firstFailure']=='OPERATION_FAILED' and data['cleanupFailure']=='BROWSER_CLOSE_FAILED'
finish_case({'case':'worker-first-cleanup','scope':'actual worker with synthetic runtime; not browser','expected':'FAIL','actual':data['status'],'firstFailure':data['firstFailure'],'cleanupFailure':data['cleanupFailure'],'exitCode':r.returncode,'passed':True})
S.save_json(OUT/'assertions.json',rows)
print(json.dumps(rows,indent=2))
