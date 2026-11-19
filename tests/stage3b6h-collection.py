"""Synthetic collection-contract fixtures; never evidence of process execution."""
import importlib.util,json,shutil,sys,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=Path(sys.argv[1]);OUT.mkdir(parents=True,exist_ok=False)
spec=importlib.util.spec_from_file_location('artifact',ROOT/'scripts/stage3b6h-artifacts.py');A=importlib.util.module_from_spec(spec);spec.loader.exec_module(A)
def put(path,data):
 path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(data) if not isinstance(data,str) else data)
base=OUT/'baseline'
normal={'id':'first','status':'COMPLETED','residual':[],'auditStatus':'PASS','withinBudget':True,'directChildExited':True,'elapsedMs':100,'budgetMs':1800}
base_modes=['normal','hang','close','orphan','first-cleanup','total']
h_modes=['normal','missing','invalid','killed','record-failure','first-cleanup','stdout-failure','audit-failure']
extra=['timeout-partial','timeout-silent','outer-timeout','outer-timeout-silent','outer-orphan','worker-first-cleanup']
for suite,modes in [('test-synthetic',base_modes),('b6h-synthetic',h_modes+extra)]:
 p=base/suite
 for f in ['outer-node-stdout.log','outer-node-stderr.log']:put(p/f,'')
 put(p/'outer-node-result.json',{'exitCode':0,'errorCode':None})
 put(p/'results/assertions.json',[{'case':m,'status':'PASS','pass':True} for m in modes])
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
   put(p/'results'/(m+'-assertion.json'),{'case':m,'status':'PASS','pass':True})
   put(p/'results'/(m+'-timing-observation.json'),{'case':m,'externalWallWithinWindow':True,'toleranceMs':150,'externalWallMs':100,'totalMs':4000})
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
# B6k synthetic fixtures ONLY: these records test the collector parser, not
# actual process containment or production evidence.
b6j_names=['normal-fault','within-budget-false','external-wall','outer-failure',
           'ledger-missing','ledger-corrupt','cleanup-failure','stdout-missing',
           'stderr-missing','residual','direct-child','checkpoint-delay-old',
           'checkpoint-delay-new','adopted-zombie-reap','exception-signal-before-write',
           'withinBudget-harness-old','withinBudget-harness-new','upload-failure-model']
control=base/'b6j-controls/run-synthetic'
assertions=[{'case':name,'status':'PASS','pass':True} for name in b6j_names]
for label in ['old','new']:
 inner={'label':label,'injectedDelayReached':label=='old','signalObserved':True,
        'checkpointBetweenDeadlineAndSignal':label=='old',
        'expectedWithinBudget':label=='new',
        'withinBudget':label=='new','status':'FAIL','elapsedMs':1900 if label=='old' else 1300,
        'firstFailure':'INDIVIDUAL_DEADLINE','cleanupFailure':None,
        'auditStatus':'PASS','residual':[],'directChildExited':True,
        'rootCause':'UNKNOWN','baselineIsDiagnosticOnly':label=='old'}
 outer={'auditStatus':'PASS','residual':[],'exitCode':0,'cleanupFailure':None,'directChildExited':True}
 put(control/('delay-'+label)/'b6k-summary.json',inner)
 put(control/('b6k-delay-'+label+'-outer-result.json'),outer)
 target=next(row for row in assertions if row['case']=='checkpoint-delay-'+label)
 target.update(observedInner=inner,outerAuditStatus='PASS',outerFirstFailure=None,
               outerPreCleanupSnapshot=None,outerResidual=[],
               outerExitCode=0,outerCleanupFailure=None,baselineInnerResultPromoted=False)
put(control/'assertions.json',assertions)
put(control/'assertions-child-original.json',assertions)
for f in ['test.stdout','test.stderr']:put(control/f,'')
put(control/'execution.json',{'exit':0,'signal':None,'error':None,'status':'PASS',
                              'nonPassCases':0,'assertionCases':18})
# Synthetic receipts are fixture data, never real save attestations.
for source in base.rglob('*.json'):
 if source.name=='supervisor-result.json' or source.name.endswith('-outer-result.json'):
  name='supervisor-evidence-receipt.json' if source.name=='supervisor-result.json' else source.name.replace('-outer-result.json','-outer-evidence-receipt.json')
  raw=source.read_bytes();put(source.with_name(name),{'schema':1,'source':source.name,'size':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'evidenceSavedVerified':'PASS'})
A.seal(control)
assert A.collect(base,OUT/'normal-output')['status']=='PASS'
mutations=[('root-assertions','test-synthetic/results/assertions.json'),('case-assertion','test-synthetic/results/normal-assertion.json'),('timing','test-synthetic/results/normal-timing-observation.json'),('partial','b6h-synthetic/results/partial-partial.bin'),('checkpoint','b6h-synthetic/results/normal/first/supervisor-checkpoint.json'),('worker-stdout','b6h-synthetic/results/worker-first-cleanup/stdout.log'),('worker-stderr','b6h-synthetic/results/worker-first-cleanup/stderr.log'),('normal-worker','test-synthetic/results/normal/first/worker-result.json')]
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
for label,value in [('partial-assertions',[]),('corrupt-assertions','{'),('forged-pass',None),('false-timing',None),('empty-trials',None),('cleanup',None),('false-budget',None)]:
 source=OUT/label;shutil.copytree(base,source)
 if label=='false-timing':
  p=source/'test-synthetic/results/normal-timing-observation.json';row=json.loads(p.read_text());row['externalWallMs']=999999;put(p,row)
 elif label=='empty-trials':
  p=source/'test-synthetic/results/normal/trial-ledger.json';row=json.loads(p.read_text());row['trials']=[];put(p,row)
 elif label in ('forged-pass','cleanup','false-budget'):
  for name in ['test-synthetic/results/normal/trial-ledger.json','test-synthetic/results/normal/first/supervisor-result.json']:
   p=source/name;row=json.loads(p.read_text())
   target=row['trials'][0] if 'trials' in row else row
   target[{'forged-pass':'withinBudget','cleanup':'cleanupFailure','false-budget':'elapsedMs'}[label]]={'forged-pass':False,'cleanup':'CLEANUP_FAILED','false-budget':999999}[label]
   put(p,row)
 else:put(source/'test-synthetic/results/assertions.json',value)
 assert A.collect(source,OUT/(label+'-output'))['status']=='INCOMPLETE'
 results.append({'case':label,'expected':'INCOMPLETE','passed':True})
# B6k collection faults: even re-sealed fake PASS must fail semantic checks.
for label,change in [('b6j-absent','absent'),('b6j-partial','partial'),
                     ('b6j-forged-pass','forged'),('b6j-manifest','manifest'),
                     ('b6j-outer','outer'),('b6j-duplicate','duplicate')]:
 source=OUT/label;shutil.copytree(base,source)
 run=source/'b6j-controls/run-synthetic'
 if change=='absent':
  shutil.rmtree(source/'b6j-controls')
 elif change=='manifest':
  (run/'manifest.json').write_text('[]')
 else:
  if change=='partial':
   put(run/'assertions.json',assertions[:-1])
  elif change=='forged':
   p=run/'delay-new/b6k-summary.json';bad=json.loads(p.read_text());bad['elapsedMs']=99999;put(p,bad)
  elif change=='outer':
   p=run/'b6k-delay-old-outer-result.json';bad=json.loads(p.read_text());bad['residual']=[{'pid':17}];put(p,bad)
  elif change=='duplicate':
   bad=list(assertions);bad[1]=bad[0];put(run/'assertions.json',bad)
  A.seal(run)
 assert A.collect(source,OUT/(label+'-output'))['status']=='INCOMPLETE',(label,'not rejected')
 results.append({'case':label,'expected':'INCOMPLETE','passed':True})
put(OUT/'assertions.json',results);print(json.dumps(results))

for label in ['receipt-missing','receipt-corrupt','receipt-other-source']:
 source=OUT/label;shutil.copytree(base,source)
 p=source/'test-synthetic/results/normal-outer-evidence-receipt.json'
 if label=='receipt-missing':p.unlink()
 elif label=='receipt-corrupt':p.write_text('{')
 else:
  data=json.loads(p.read_text());data['source']='different-outer-result.json';put(p,data)
 assert A.collect(source,OUT/(label+'-output'))['status']=='INCOMPLETE'
 results.append({'case':label,'expected':'INCOMPLETE','passed':True})
put(OUT/'receipt-assertions.json',results[-3:])
