"""Finite non-browser process fault controls. No browser/package import or dependency install."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(sys.argv[1]).resolve()
OUT.mkdir(parents=True, exist_ok=False)
FIXTURE = OUT/'worker.py'
FIXTURE.write_text('''import json,os,signal,subprocess,sys,time
from pathlib import Path
out=Path(os.environ['B6G_OUT']);mode=sys.argv[1]
def save(status,first=None):
 (out/'worker-result.json').write_text(json.dumps({'status':status,'firstFailure':first,'mode':mode}))
if mode=='normal':
 save('OBSERVED');sys.exit(0)
if mode=='orphan':
 child=subprocess.Popen([sys.executable,'-c','import signal,time;signal.signal(signal.SIGTERM,signal.SIG_IGN);time.sleep(60)'],start_new_session=True)
 (out/'descendant.pid').write_text(str(child.pid));save('OBSERVED');sys.exit(0)
if mode=='close':save('FAIL','CLOSE_STARTED')
if mode=='first-cleanup':save('FAIL','INITIAL_DIAGNOSTIC_FAILURE')
signal.signal(signal.SIGTERM,signal.SIG_IGN)
while True:time.sleep(.01)
''')
results=[]
for mode in ['normal','hang','close','orphan','first-cleanup','total']:
    case=OUT/mode
    config={'cwd':str(ROOT),'individualMs':1800,'totalMs':4000,'cleanupReserveMs':700,
        'termGraceMs':150,'auditReserveMs':150,
        'trials':[{'id':'first','argv':[sys.executable,str(FIXTURE),mode]},
                  {'id':'remaining','argv':[sys.executable,str(FIXTURE),'normal']}]}
    if mode=='total':config['totalMs']=1100
    cp=OUT/(mode+'-config.json');cp.write_text(json.dumps(config))
    start=time.monotonic()
    run=subprocess.run([sys.executable,str(ROOT/'scripts/stage3b6g-supervisor.py'),str(cp),str(case)],capture_output=True,timeout=6)
    wall=(time.monotonic()-start)*1000
    (OUT/(mode+'-stdout.log')).write_bytes(run.stdout);(OUT/(mode+'-stderr.log')).write_bytes(run.stderr)
    data=json.loads((case/'trial-ledger.json').read_text());row=data['trials'][0]
    expected='COMPLETED' if mode=='normal' else 'FAIL'
    assert row['status']==expected,(mode,row)
    assert row['withinBudget'],(mode,row)
    assert row['residual']==[],(mode,row)
    assert wall<config['totalMs']+150,(mode,wall)
    if mode!='normal':assert data['trials'][1]['status']=='NOT_TESTED'
    if mode=='total':assert row['firstFailure']=='TOTAL_DEADLINE'
    if mode=='first-cleanup':assert row['workerFirstFailure']=='INITIAL_DIAGNOSTIC_FAILURE'
    if mode=='orphan':
        pid=int((case/'first/descendant.pid').read_text())
        assert not Path(f'/proc/{pid}').exists(),pid
    results.append({'case':mode,'expected':expected,'actual':row['status'],'returncode':run.returncode,'elapsedMs':wall,
        'firstFailure':row['firstFailure'],'workerFirstFailure':row.get('workerFirstFailure'),'residual':row['residual'],'pass':True})
(OUT/'assertions.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results,indent=2))
