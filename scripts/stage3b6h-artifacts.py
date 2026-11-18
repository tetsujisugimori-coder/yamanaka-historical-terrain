"""Collect finite-process raw evidence after success OR failure. No test-result promotion."""
import hashlib
import math
import json
import os
from pathlib import Path
import shutil
import sys

def atomic(path,data):
    tmp=path.with_name(path.name+'.pending')
    tmp.write_text(json.dumps(data,indent=2));json.loads(tmp.read_text());os.replace(tmp,path)

def verify(root):
    rows=json.loads((root/'manifest.json').read_text())
    if not isinstance(rows,list) or not rows:raise ValueError('EMPTY_MANIFEST')
    # exclude only the root manifest; nested manifests are evidence too
    actual=[{'path':p.relative_to(root).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(root.rglob('*')) if p.is_file() and p!=root/'manifest.json']
    if rows!=actual:raise ValueError('MANIFEST_SET_OR_CONTENT_MISMATCH')
    return len(rows)

def valid_window(elapsed,budget):
    return all(isinstance(n,(int,float)) and not isinstance(n,bool) and math.isfinite(n) for n in (elapsed,budget)) and 0 <= elapsed <= budget

def collect(source,root):
    root.mkdir(parents=True,exist_ok=True)
    dest=root/'finite-process'
    errors=[];total=0
    if dest.exists():raise ValueError('DESTINATION_ALREADY_EXISTS')
    dest.mkdir()
    if not source.is_dir():errors.append('PROCESS_DIRECTORY_NOT_FOUND')
    else:
        for p in sorted(source.rglob('*')):
            rel=p.relative_to(source)
            if p.is_symlink():errors.append('SYMLINK_REJECTED');continue
            if p.is_file():
                total+=p.stat().st_size
                if total>64*1024*1024:errors.append('COLLECTION_SIZE_LIMIT');break
                target=dest/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,target)
    suites=[]
    for base in sorted(dest.glob('*')):
        if not base.is_dir():continue
        expected=6 if base.name.startswith('test-') else 14 if base.name.startswith('b6h-') else None
        if expected is None:continue
        missing=[name for name in ['outer-node-stdout.log','outer-node-stderr.log','outer-node-result.json','results/assertions.json'] if not (base/name).is_file()]
        assertions=[]
        try:
            outer=json.loads((base/'outer-node-result.json').read_text())
            if outer.get('exitCode')!=0 or outer.get('errorCode') is not None:missing.append('OUTER_NODE_FAILED')
            assertions=json.loads((base/'results/assertions.json').read_text())
            names=['normal','hang','close','orphan','first-cleanup','total'] if base.name.startswith('test-') else ['normal','missing','invalid','killed','record-failure','first-cleanup','stdout-failure','audit-failure','timeout-partial','timeout-silent','outer-timeout','outer-timeout-silent','outer-orphan','worker-first-cleanup']
            if sorted(a['case'] for a in assertions)!=sorted(names):missing.append('ASSERTION_CASE_SET_INVALID')
            if len(assertions)!=expected or not all(row.get('pass',row.get('passed')) is True for row in assertions):missing.append('ASSERTION_SET_INCOMPLETE_OR_FAILED')
        except (OSError,ValueError,TypeError,KeyError):missing.append('ASSERTIONS_UNREADABLE')
        # Each declared case is represented by raw bytes/records, not an empty successful inventory.
        if base.name.startswith('test-'):
            for mode in ['normal','hang','close','orphan','first-cleanup','total']:
                for name in [mode+'-stdout.log',mode+'-stderr.log',mode+'-outer-result.json',mode+'/trial-ledger.json',mode+'/first/supervisor-result.json', mode+'-assertion.json', mode+'-timing-observation.json']:
                    if not (base/'results'/name).is_file():missing.append(name)
                try:
                    assertion=json.loads((base/'results'/(mode+'-assertion.json')).read_text())
                    if assertion != next(a for a in assertions if a['case']==mode) or assertion.get('status')!='PASS' or assertion.get('pass') is not True:missing.append(mode+'/CASE_RECORD_MISMATCH')
                    timing=json.loads((base/'results'/(mode+'-timing-observation.json')).read_text())
                    if timing.get('case')!=mode or timing.get('externalWallWithinWindow') is not True or timing.get('toleranceMs')!=150 or not isinstance(timing.get('externalWallMs'),(int,float)) or isinstance(timing.get('externalWallMs'),bool) or not isinstance(timing.get('totalMs'),(int,float)) or isinstance(timing.get('totalMs'),bool) or not valid_window(timing['externalWallMs'],timing['totalMs']+150) or timing['externalWallMs']==timing['totalMs']+150:missing.append(mode+'/TIMING_RECORD_INVALID')
                    outer=json.loads((base/'results'/(mode+'-outer-result.json')).read_text())
                    if outer.get('exitCode')!=(0 if mode=='normal' else 1):missing.append(mode+'/OUTER_EXIT_MISMATCH')
                    if outer.get('firstFailure') or outer.get('cleanupFailure') or outer.get('auditStatus')!='PASS':missing.append(mode+'/OUTER_FAILED')
                    ledger=json.loads((base/'results'/mode/'trial-ledger.json').read_text())
                    if ledger['trials'][0].get('status')!=('COMPLETED' if mode=='normal' else 'FAIL'):missing.append(mode+'/TRIAL_STATUS_INVALID')
                    if len(ledger['trials'])!=2 or ledger['trials'][0]['id']!='first' or ledger['trials'][1]['id']!='remaining':missing.append(mode+'/LEDGER_SET_INVALID')
                    for trial in ledger['trials']:
                        if trial['status']=='NOT_TESTED':continue
                        folder=base/'results'/mode/trial['id']
                        for name in ['stdout.log','stderr.log','supervisor-result.json','supervisor-checkpoint.json']:
                            if not (folder/name).is_file():missing.append(mode+'/'+trial['id']+'/'+name)
                        saved=json.loads((folder/'supervisor-result.json').read_text())
                        if saved!=trial:missing.append(mode+'/SUPERVISOR_LEDGER_MISMATCH')
                        if saved.get('withinBudget') is not True or saved.get('directChildExited') is not True or saved.get('cleanupFailure') is not None or not valid_window(saved.get('elapsedMs'),saved.get('budgetMs')):missing.append(mode+'/BUDGET_OR_CHILD_EXIT_FAILED')
                        if saved.get('auditStatus')!='PASS' or saved.get('residual')!=[]:missing.append(mode+'/AUDIT_INCOMPLETE')
                        if mode=='normal':
                            worker=json.loads((folder/'worker-result.json').read_text())
                            if worker.get('status')!='OBSERVED' or worker.get('firstFailure') is not None:missing.append(mode+'/NORMAL_WORKER_INVALID')
                except (OSError,ValueError,KeyError,TypeError,StopIteration,IndexError,AttributeError):missing.append(mode+'/RECORD_INVALID')
        if base.name.startswith('b6h-'):
            for mode in ['normal','missing','invalid','killed','record-failure','first-cleanup','stdout-failure','audit-failure']:
                folder=base/'results'/mode
                try:
                    ledger=json.loads((folder/'trial-ledger.json').read_text())
                    trial=ledger['trials'][0]
                    expectedStatus='COMPLETED' if mode=='normal' else 'INCOMPLETE' if mode in ('record-failure','audit-failure') else 'FAIL'
                    if trial.get('status')!=expectedStatus:missing.append(mode+'/TRIAL_STATUS_INVALID')
                    if len(ledger['trials'])!=2 or (mode!='normal' and ledger['trials'][1].get('status')!='NOT_TESTED'):missing.append(mode+'/TRIAL_SET_INVALID')
                    json.loads((folder/'first/supervisor-checkpoint.json').read_text())
                    if trial.get('residual')!=[]:missing.append(mode+'/RESIDUAL')
                    if mode!='audit-failure' and trial.get('auditStatus')!='PASS':missing.append(mode+'/AUDIT_MISSING')
                    if mode!='stdout-failure':
                        for name in ['stdout.log','stderr.log']:
                            if not (folder/'first'/name).is_file():missing.append(mode+'/'+name)
                    if mode!='record-failure':
                        saved=json.loads((folder/'first/supervisor-result.json').read_text())
                        if saved!=trial:missing.append(mode+'/SUPERVISOR_LEDGER_MISMATCH')
                    elif not ledger.get('recordErrors'):missing.append(mode+'/RECORD_FAILURE_UNEXPLAINED')
                    if mode in ('normal','first-cleanup'):
                        json.loads((folder/'first/worker-result.json').read_text())
                except (OSError,ValueError,KeyError,TypeError,StopIteration,IndexError,AttributeError):missing.append(mode+'/RECORD_INVALID')
            for partial in ['partial-partial.bin','silent-partial.bin']:
                if not (base/'results'/partial).is_file():missing.append(partial)
            for mode in ['outer-timeout','outer-timeout-silent','outer-orphan']:
                try:
                    data=json.loads((base/'results'/(mode+'-outer-result.json')).read_text())
                    for suffix in ['-stdout.log','-stderr.log','-outer-checkpoint.json']:
                        if not (base/'results'/(mode+suffix)).is_file():missing.append(mode+suffix)
                    json.loads((base/'results'/(mode+'-outer-checkpoint.json')).read_text())
                    if data.get('firstFailure')!=('OUTER_CHILD_RESIDUAL' if mode=='outer-orphan' else 'OUTER_TIMEOUT') or data.get('residual')!=[] or data.get('auditStatus')!='PASS':missing.append(mode+'/OUTER_INVALID')
                except (OSError,ValueError,TypeError):missing.append(mode+'/OUTER_MISSING')
            try:
                for name in ['stdout.log','stderr.log']:
                    if not (base/'results/worker-first-cleanup'/name).is_file():missing.append('worker-first-cleanup/'+name)
                worker=json.loads((base/'results/worker-first-cleanup/worker-result.json').read_text())
                if worker.get('status')!='FAIL' or worker.get('firstFailure')!='OPERATION_FAILED' or worker.get('cleanupFailure')!='BROWSER_CLOSE_FAILED':missing.append('WORKER_CLEANUP_RECORD_INVALID')
            except (OSError,ValueError,TypeError):missing.append('WORKER_CLEANUP_RECORD_MISSING')
        suites.append({'suite':base.name,'expectedCases':expected,'status':'INCOMPLETE' if missing else 'PASS','missing':missing})
    # B6k: explicitly enumerate the additional B6j controlled RED/GREEN suite.
    # No implicit PASS from the older six/fourteen control declarations.
    controls = dest/'b6j-controls'
    names = ['normal-fault','within-budget-false','external-wall','outer-failure',
             'ledger-missing','ledger-corrupt','cleanup-failure','stdout-missing',
             'stderr-missing','residual','direct-child','checkpoint-delay-old',
             'checkpoint-delay-new','adopted-zombie-reap','exception-signal-before-write',
             'withinBudget-harness-old','withinBudget-harness-new','upload-failure-model']
    runs = sorted(controls.glob('run-*')) if controls.is_dir() else []
    if len(runs) != 1 or not runs[0].is_dir():
        errors.append('B6J_CONTROL_RUN_SET_INVALID')
    for control in runs:
        if not control.is_dir():
            errors.append('B6J_CONTROL_NOT_DIRECTORY')
            continue
        missing = []
        for name in ['assertions.json','assertions-child-original.json',
                     'test.stdout','test.stderr','execution.json','manifest.json',
                     'b6k-delay-old-outer-result.json','b6k-delay-new-outer-result.json',
                     'delay-old/b6k-summary.json','delay-new/b6k-summary.json']:
            if not (control/name).is_file():missing.append('B6J_MISSING_'+name)
        try:
            verify(control)  # exact set, sizes and raw SHA for this entire suite
        except (OSError, ValueError, TypeError, KeyError):
            missing.append('B6J_MANIFEST_INVALID')
        try:
            assertions = json.loads((control/'assertions.json').read_text())
            if not isinstance(assertions, list) or len(assertions) != len(names) or (
                sorted(row['case'] for row in assertions) != sorted(names)):
                missing.append('B6J_ASSERTION_CASE_SET_INVALID')
            elif not all(row.get('status') == 'PASS' and row.get('pass') is True for row in assertions):
                missing.append('B6J_ASSERTIONS_NOT_ALL_PASS')
            execution = json.loads((control/'execution.json').read_text())
            if execution.get('exit') != 0 or execution.get('signal') is not None or execution.get('error') is not None or execution.get('status') != 'PASS' or execution.get('nonPassCases') != 0 or execution.get('assertionCases') != 18:
                missing.append('B6J_EXECUTION_FAILED')
            for label in ['old','new']:
                inner = json.loads((control/('delay-'+label)/'b6k-summary.json').read_text())
                outer = json.loads((control/('b6k-delay-'+label+'-outer-result.json')).read_text())
                assertion = next(row for row in assertions if row['case']=='checkpoint-delay-'+label)
                if assertion.get('observedInner') != inner or assertion.get('outerAuditStatus') != outer.get('auditStatus') or assertion.get('outerResidual') != outer.get('residual') or assertion.get('outerExitCode') != outer.get('exitCode') or assertion.get('outerCleanupFailure') != outer.get('cleanupFailure') or assertion.get('outerFirstFailure') != outer.get('firstFailure') or assertion.get('outerPreCleanupSnapshot') != outer.get('preCleanupSnapshot'):
                    missing.append('B6J_DELAY_EVIDENCE_MISMATCH_'+label)
                if (inner.get('label') != label or inner.get('injectedDelayReached') is not (label=='old')
                    or inner.get('signalObserved') is not True
                    or (label=='new' and inner.get('checkpointBetweenDeadlineAndSignal') is not False)
                    or inner.get('expectedWithinBudget') is not (label=='new')
                    or inner.get('withinBudget') is not (label=='new')
                    or not isinstance(inner.get('elapsedMs'),(int,float))
                    or isinstance(inner.get('elapsedMs'),bool)
                    or not math.isfinite(inner['elapsedMs'])
                    or (inner['elapsedMs'] <= 1800 if label=='old' else inner['elapsedMs'] > 1800)
                    or outer.get('auditStatus') != 'PASS' or outer.get('residual') != []
                    or outer.get('exitCode') != 0 or outer.get('cleanupFailure') is not None
                    or outer.get('directChildExited') is not True
                    or (label=='new' and outer.get('firstFailure') is not None)
                    or (label=='old' and outer.get('firstFailure') not in (None,'OUTER_CHILD_RESIDUAL'))):
                    missing.append('B6J_DELAY_CONTROL_INVALID_'+label)
                if label=='new' and (inner.get('auditStatus') != 'PASS' or inner.get('residual') != [] or inner.get('cleanupFailure') is not None or inner.get('directChildExited') is not True):
                    missing.append('B6J_NEW_AUDIT_INVALID')
                if label=='old' and assertion.get('baselineInnerResultPromoted') is not False:
                    missing.append('B6J_BASELINE_PROMOTION_FORBIDDEN')
        except (OSError, ValueError, TypeError, KeyError, StopIteration, IndexError, AttributeError):
            missing.append('B6J_CONTROL_EVIDENCE_INVALID')
        suites.append({'suite':'b6j-controls/'+control.name,'expectedCases':18,
                       'status':'INCOMPLETE' if missing else 'PASS','missing':missing})
    if not any(s['suite'].startswith('test-') for s in suites):errors.append('BASE_PROCESS_SUITE_MISSING')
    if not any(s['suite'].startswith('b6h-') for s in suites):errors.append('B6H_RECORD_SUITE_MISSING')
    report={'schema':1,'status':'INCOMPLETE' if errors or any(s['status']!='PASS' for s in suites) else 'PASS','errors':errors,'suites':suites,
            'meaning':'Evidence collection completeness only. FAIL/INCOMPLETE process results are preserved; upload never changes them.',
            'limits':['Host/job destruction can prevent collection and upload.','Missing worker-result in injected missing/corrupt/kill controls is deliberate and recorded in assertions.']}
    atomic(root/'finite-process-collection.json',report)
    return report

def seal(root):
    rows=[{'path':p.relative_to(root).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(root.rglob('*')) if p.is_file() and p!=root/'manifest.json']
    if not rows:raise ValueError('EMPTY_EVIDENCE')
    atomic(root/'manifest.json',rows);verify(root)

if __name__=='__main__':
    root=Path(sys.argv[2]).resolve()
    try:
        if sys.argv[1]=='collect':
            r=collect(Path(sys.argv[3]).resolve(),root);print(json.dumps(r));sys.exit(0 if r['status']=='PASS' else 1)
        elif sys.argv[1]=='seal':seal(root);print(json.dumps({'manifest':'PASS','files':verify(root)}))
        elif sys.argv[1]=='verify':print(json.dumps({'manifest':'PASS','files':verify(root)}))
        else:raise ValueError('INVALID_OPERATION')
    except Exception as e:
        print(json.dumps({'status':'INCOMPLETE','errorType':type(e).__name__,'reason':str(e) if isinstance(e,ValueError) else 'ARTIFACT_OPERATION_FAILED'}),file=sys.stderr)
        sys.exit(1)
