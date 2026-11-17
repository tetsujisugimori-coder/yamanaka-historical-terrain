"""Synthetic collection-contract fixtures; never evidence of process execution."""
import importlib.util,json,shutil,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=Path(sys.argv[1]);OUT.mkdir(parents=True,exist_ok=False)
spec=importlib.util.spec_from_file_location('artifact',ROOT/'scripts/stage3b6h-artifacts.py');A=importlib.util.module_from_spec(spec);spec.loader.exec_module(A)
def put(path,data):
 path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(data) if not isinstance(data,str) else data)
base=OUT/'baseline'
normal={'id':'first','status':'COMPLETED','residual':[],'auditStatus':'PASS'}
base_modes=['normal','hang','close','orphan','first-cleanup','total']
h_modes=['normal','missing','invalid','killed','record-failure','first-cleanup','stdout-failure','audit-failure']
extra=['timeout-partial','timeout-silent','outer-timeout','outer-timeout-silent','outer-orphan','worker-first-cleanup']
for suite,modes in [('test-synthetic',base_modes),('b6h-synthetic',h_modes+extra)]:
 p=base/suite
 for f in ['outer-node-stdout.log','outer-node-stderr.log']:put(p/f,'')
 put(p/'outer-node-result.json',{'exitCode':0,'errorCode':None})
 put(p/'results/assertions.json',[{'case':m,'passed':True} for m in modes])
 for m in (base_modes if suite.startswith('test-') else h_modes):
  status='COMPLETED' if m=='normal' else 'INCOMPLETE' if m in ['record-failure','audit-failure'] else 'FAIL'
  rows=[{**normal,'status':status},{**normal,'id':'remaining'} if m=='normal' else {'id':'remaining','status':'NOT_TESTED'}]
  ledger={'trials':rows,'recordErrors':[{'reason':'RECORD_WRITE_FAILED'}] if m=='record-failure' else []}
  folder=p/'results'/m;put(folder/'trial-ledger.json',ledger)
  for row in rows:
   if row['status']=='NOT_TESTED':continue
   d=folder/row['id']
   for name in ['stdout.log','stderr.log']:put(d/name,'')
   put(d/'supervisor-result.json',row);put(d/'supervisor-checkpoint.json',row)
   put(d/'worker-result.json',{'status':'OBSERVED','firstFailure':None})
  if suite.startswith('test-'):
   for f in ['-stdout.log','-stderr.log']:put(p/'results'/(m+f),'')
   put(p/'results'/(m+'-outer-result.json'),{'exitCode':0 if m=='normal' else 1,'firstFailure':None,'cleanupFailure':None,'auditStatus':'PASS'})
 if suite.startswith('b6h-'):
  for f in ['partial-partial.bin','silent-partial.bin']:put(p/'results'/f,'')
  for m in ['outer-timeout','outer-timeout-silent','outer-orphan']:
   for f in ['-stdout.log','-stderr.log']:put(p/'results'/(m+f),'')
   put(p/'results'/(m+'-outer-checkpoint.json'),{})
   put(p/'results'/(m+'-outer-result.json'),{'firstFailure':'OUTER_CHILD_RESIDUAL' if m=='outer-orphan' else 'OUTER_TIMEOUT','residual':[],'auditStatus':'PASS'})
  for f in ['stdout.log','stderr.log']:put(p/'results/worker-first-cleanup'/f,'')
  put(p/'results/worker-first-cleanup/worker-result.json',{'status':'FAIL','firstFailure':'OPERATION_FAILED','cleanupFailure':'BROWSER_CLOSE_FAILED'})
assert A.collect(base,OUT/'normal-output')['status']=='PASS'
mutations=[('partial','b6h-synthetic/results/partial-partial.bin'),('checkpoint','b6h-synthetic/results/normal/first/supervisor-checkpoint.json'),('worker-stdout','b6h-synthetic/results/worker-first-cleanup/stdout.log'),('worker-stderr','b6h-synthetic/results/worker-first-cleanup/stderr.log'),('normal-worker','test-synthetic/results/normal/first/worker-result.json')]
results=[{'case':'normal','passed':True}]
for label,missing in mutations:
 source=OUT/label
 for file in base.rglob('*'):
  if file.is_file() and file.relative_to(base).as_posix()!=missing:
   target=source/file.relative_to(base);target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(file,target)
 assert A.collect(source,OUT/(label+'-output'))['status']=='INCOMPLETE'
 results.append({'case':label,'expected':'INCOMPLETE','passed':True})
source=OUT/'exit-mismatch';shutil.copytree(base,source);p=source/'test-synthetic/results/normal-outer-result.json';row=json.loads(p.read_text());row['exitCode']=7;put(p,row)
assert A.collect(source,OUT/'exit-mismatch-output')['status']=='INCOMPLETE';results.append({'case':'exit-mismatch','expected':'INCOMPLETE','passed':True})
put(OUT/'assertions.json',results);print(json.dumps(results))
