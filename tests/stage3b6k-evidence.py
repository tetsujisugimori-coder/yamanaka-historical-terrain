"""Local controlled-process evidence axes; not browser or historical proof."""
import importlib.util,json,pathlib,subprocess,sys
from unittest.mock import patch
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=pathlib.Path(sys.argv[1]).resolve();OUT.mkdir(parents=True,exist_ok=False)
def module(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
W=module('watch',ROOT/'scripts/stage3b6h-watchdog.py')
A=module('artifacts',ROOT/'scripts/stage3b6h-artifacts.py')
rows=[]
def persist():W.SUP.save_json(OUT/'assertions.json',rows)
for mode,code in [('normal','pass'),('nonzero','raise SystemExit(17)'),('timeout','import time;time.sleep(20)'),('zombie','TEST_FIXTURE_HANDSHAKE'),('live','TEST_FIXTURE_HANDSHAKE'),('audit','pass'),('write','pass')]:
 row={'case':mode,'status':'RUNNING'};rows.append(row);persist()
 original_members=W.SUP.members;original_save=W.SUP.save_json
 def bad_members(pid=None,errors=None):
  if errors is not None:errors.append('INJECTED_AUDIT_ERROR')
  return original_members(pid,errors)
 def bad_save(path,data):
  if path.name==mode+'-outer-result.json':raise OSError('injected-record-failure')
  return original_save(path,data)
 try:
  with patch.object(W.SUP,'members',bad_members if mode=='audit' else original_members),patch.object(W.SUP,'save_json',bad_save if mode=='write' else original_save):
   if code=='TEST_FIXTURE_HANDSHAKE':
    command=[sys.executable,str(ROOT/'tests/stage3b6k-ownership-fixture.py'),mode,
             str(OUT/(mode+'-ownership-request.json')),
             str(OUT/(mode+'-ownership-release.json')),'0.24']
   else:
    command=[sys.executable,'-c',code]
   observed=W.run_bounded(command,OUT,mode,timeout=.3,
                          ownership_handshake=code=='TEST_FIXTURE_HANDSHAKE')
  # Save the complete observation before evaluating any expected outcome.
  W.SUP.save_json(OUT/(mode+'-observed.json'),observed)
  states=observed['evidenceStates'];assert len(states)==8
  assert states['directChildReaped']=='REAPED_BY_POPEN'
  assert states['directChildExitCode']['value']==observed['exitCode']
  if mode=='timeout':assert states['deadlineDetection']=='DETECTED' and observed['firstFailure']=='OUTER_TIMEOUT'
  if mode=='nonzero':assert observed['exitCode']==17
  if mode in ('zombie','live'):
   ack=observed.get('ownershipHandshake')
   assert isinstance(ack,dict) and ack.get('status')=='CONFIRMED',(mode,observed)
   assert json.loads((OUT/(mode+'-ownership-release.json')).read_text())==ack
   assert ack['child']['ppid']==ack['root']['pid'] and ack['root']['pid']==observed['pid']
  if mode=='zombie':assert states['zombieObserved']=='OBSERVED' and states['adoptedZombieReap']=='REAPED'
  if mode=='live':assert observed['preCleanupSnapshot'] and observed['firstFailure']=='OUTER_CHILD_RESIDUAL'
  if mode=='audit':assert states['auditError']=='OBSERVED' and observed['auditStatus']=='UNKNOWN'
  if mode=='write':assert states['evidenceSavedVerified']=='INCOMPLETE' and not (OUT/(mode+'-outer-evidence-receipt.json')).exists()
  else:
   receipt=json.loads((OUT/(mode+'-outer-evidence-receipt.json')).read_text())
   assert receipt['evidenceSavedVerified']=='PASS'
  row.update(status='PASS',observation=mode+'-observed.json')
 except BaseException as exc:
  row.update(status='FAIL',exception=type(exc).__name__);persist();raise
 persist()
# Missing/corrupt final records cannot produce a successful readback receipt.
for mode in ['missing-final','corrupt-final']:
 row={'case':mode,'status':'RUNNING'};rows.append(row);persist()
 source=OUT/(mode+'.json')
 if mode=='corrupt-final':source.write_text('{')
 try:W.SUP.save_evidence_receipt(OUT/(mode+'-receipt.json'),source,{});raise AssertionError('invalid record accepted')
 except (OSError,ValueError):row['status']='PASS'
 persist()
# Same exact-set manifest verifier used by collection; no both-empty success.
for mode in ['manifest-missing','manifest-corrupt','manifest-empty']:
 row={'case':mode,'status':'RUNNING'};rows.append(row);persist()
 p=OUT/mode;p.mkdir();(p/'raw').write_bytes(b'evidence')
 if mode!='manifest-missing':(p/'manifest.json').write_text('{' if mode=='manifest-corrupt' else '[]')
 try:A.verify(p);raise AssertionError('invalid manifest accepted')
 except (OSError,ValueError):row['status']='PASS'
 persist()
# Negative controls must reject missing/forged ownership; no release may permit an orphan.
negative=[]
for mode,code in [('no-request',"import time;time.sleep(.6)"),
                  ('preissued-release',"import time;time.sleep(.6)"),
                  ('forged-request',"import json,sys,time;from pathlib import Path;Path(sys.argv[1]).write_text(json.dumps({'schema':1,'parentPid':999999,'childPid':999998,'parentBirth':'0','childBirth':'0'}));time.sleep(.6)")]:
 command=([sys.executable,'-c',code,str(OUT/(mode+'-ownership-request.json'))]
          if mode=='forged-request' else [sys.executable,'-c',code])
 if mode=='preissued-release':
  # A receipt created before any observation is never a valid release.
  (OUT/(mode+'-ownership-release.json')).write_text('{"status":"CONFIRMED","scope":"TEST_FIXTURE_ONLY"}')
 observed=W.run_bounded(command,OUT,mode,timeout=.20,ownership_handshake=True)
 assert observed['ownershipHandshake']['status']=='NOT_CONFIRMED'
 assert observed['auditStatus']=='UNKNOWN' and observed['firstFailure'] is not None
 assert mode=='preissued-release' or not (OUT/(mode+'-ownership-release.json')).exists()
 negative.append({'case':mode,'status':'REJECTED','outerFailure':observed['firstFailure'],
                  'auditStatus':observed['auditStatus']})
W.SUP.save_json(OUT/'ownership-negative-assertions.json',negative)
print(json.dumps(rows))
