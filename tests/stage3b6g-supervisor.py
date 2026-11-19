"""Finite non-browser process fault controls. No browser/package import or dependency install."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import signal
import time

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(sys.argv[1]).resolve()
OUT.mkdir(parents=True, exist_ok=False)
spec=importlib.util.spec_from_file_location('supervisor', ROOT/'scripts/stage3b6g-supervisor.py')
SUP=importlib.util.module_from_spec(spec);spec.loader.exec_module(SUP);SUP.enable_subreaper()
FIXTURE = OUT/'worker.py'
FIXTURE.write_text('''import json,os,signal,subprocess,sys,time
from pathlib import Path
out=Path(os.environ['B6G_OUT']);mode=sys.argv[1]
def save(status,first=None):
 (out/'worker-result.json').write_text(json.dumps({'status':status,'firstFailure':first,'mode':mode}))
if mode=='normal':
 save('OBSERVED');sys.exit(0)
if mode=='orphan':
 import importlib.util
 sp=importlib.util.spec_from_file_location('b6k_fixture',Path.cwd()/'tests/stage3b6k-ownership-fixture.py')
 fm=importlib.util.module_from_spec(sp);sp.loader.exec_module(fm)
 sys.exit(fm.run_fixture('orphan',out/'ownership-request.json',
                         out/'ownership-release.json',.62,out))
if mode=='close':save('FAIL','CLOSE_STARTED')
if mode=='first-cleanup':save('FAIL','INITIAL_DIAGNOSTIC_FAILURE')
signal.signal(signal.SIGTERM,signal.SIG_IGN)
while True:time.sleep(.01)
''')
watchspec=importlib.util.spec_from_file_location('watchdog', ROOT/'scripts/stage3b6h-watchdog.py')
WATCH=importlib.util.module_from_spec(watchspec);watchspec.loader.exec_module(WATCH)
totalspec=importlib.util.spec_from_file_location('b6l_total', ROOT/'scripts/stage3b6l-total-observation.py')
TOTAL=importlib.util.module_from_spec(totalspec);totalspec.loader.exec_module(TOTAL)
casespec=importlib.util.spec_from_file_location('case_record',ROOT/'scripts/stage3b6j-case-record.py')
C=importlib.util.module_from_spec(casespec);casespec.loader.exec_module(C)
identity=subprocess.run(['git','rev-parse','HEAD'],cwd=ROOT,capture_output=True,text=True,timeout=2)
head=identity.stdout.strip() if identity.returncode==0 else None
run_id=OUT.name+'-'+str(os.getpid())
results=[{'case':mode,'status':'NOT_TESTED','pass':False,'reason':'PRIOR_CASE_NOT_COMPLETED'} for mode in C.CASES]
def persist():
    try: SUP.save_json(OUT/'assertions.json',results)
    except Exception:
        print(json.dumps({'status':'INCOMPLETE','firstFailure':'ASSERTION_RECORD_WRITE_FAILED','runId':run_id}),file=sys.stderr,flush=True)
        raise
persist()
for index,mode in enumerate(C.CASES):
    case=OUT/mode
    config={'cwd':str(ROOT),'individualMs':1800,'totalMs':4000,'cleanupReserveMs':700,
        'termGraceMs':150,'auditReserveMs':150,
        'trials':[{'id':'first','argv':[sys.executable,str(FIXTURE),mode]},
                  {'id':'remaining','argv':[sys.executable,str(FIXTURE),'normal']}]}
    if mode=='orphan':
        config['trials'][0]['fixtureOwnershipHandshake']=True
    if mode=='total':config['totalMs']=1100
    cp=OUT/(mode+'-config.json');cp.write_text(json.dumps(config))
    started=time.time();start=time.monotonic()
    started_ns=time.monotonic_ns();started_unix_ns=time.time_ns()
    results[index]={'case':mode,'status':'RUNNING','pass':False,'runId':run_id,'targetHead':head,'startedAtUnix':started}
    persist()
    try:
        command=[sys.executable,str(ROOT/'scripts/stage3b6g-supervisor.py'),str(cp),str(case)]
        outer=None
        try:
            outer=WATCH.run_bounded(command,OUT,mode)
        finally:
            if mode=='total':
                ended_ns=time.monotonic_ns()
                ended_unix_ns=time.time_ns()
                TOTAL.record_total(OUT,case,config,outer,started_ns,ended_ns,
                                   started_unix_ns,ended_unix_ns)
        # Record serialization happens AFTER the original watchdog timing boundary.
        wall=(ended_ns-start_ns)/1_000_000 if mode=='total' else (time.monotonic()-start)*1000
        row,timing=C.evaluate(mode,config,outer,wall,case)
        row.update(runId=run_id,targetHead=head,startedAtUnix=started)
        if head is None:
            row.update(status='INCOMPLETE')
            row['pass']=False;row['firstFailure']=row['firstFailure'] or 'TARGET_HEAD_UNAVAILABLE'
        results[index]=row
        SUP.save_json(OUT/(mode+'-timing-observation.json'),timing)
        SUP.save_json(OUT/(mode+'-assertion.json'),row)
    except Exception as exc:
        row=results[index]
        row.update(status='INCOMPLETE',finishedAtUnix=time.time(),exceptionType=type(exc).__name__)
        row['pass']=False;row['firstFailure']=row.get('firstFailure') or 'CASE_EXECUTION_OR_RECORD_FAILED'
        print(json.dumps({'case':mode,'status':'INCOMPLETE','firstFailure':row['firstFailure'],'exceptionType':type(exc).__name__}),file=sys.stderr,flush=True)
    finally:
        persist()
    if not results[index]['pass']:
        raise AssertionError({'case':mode,'firstFailure':results[index].get('firstFailure'),'status':results[index]['status']})
print(json.dumps(results,indent=2))
