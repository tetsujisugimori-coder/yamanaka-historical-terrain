"""Outer non-browser fixture watchdog; fixed 6s default, bounded owned cleanup."""
import importlib.util
import json
from pathlib import Path
import signal
import subprocess
import sys
import time
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('b6g_supervisor',ROOT/'scripts/stage3b6g-supervisor.py')
SUP=importlib.util.module_from_spec(spec);spec.loader.exec_module(SUP)
def run_bounded(command, OUT, mode, timeout=6, ownership_handshake=False):
    SUP.enable_subreaper()
    start=time.monotonic()
    errors=[]; zombies=[]; ownership_ack=None
    outer={'case':mode,'command':command,'startedAt':time.time(),'firstFailure':None,'cleanupFailure':None,'auditStatus':'NOT_TESTED'}
    if ownership_handshake:
        outer['ownershipHandshake'] = {'status': 'PENDING', 'scope': 'TEST_FIXTURE_ONLY'}
    SUP.save_json(OUT/(mode+'-outer-checkpoint.json'),outer)
    with (OUT/(mode+'-stdout.log')).open('xb') as stdout,(OUT/(mode+'-stderr.log')).open('xb') as stderr:
        run=subprocess.Popen(command,stdout=stdout,stderr=stderr,start_new_session=True)
        try:
            outer['pid']=run.pid;outer['processSnapshot']=SUP.members(run.pid,errors)
            SUP.save_json(OUT/(mode+'-outer-checkpoint.json'),outer)
            deadline=time.monotonic()+timeout
            while True:
                family=SUP.members(run.pid,errors)  # learn birth-verified descendants before adoption
                if ownership_handshake and ownership_ack is None:
                    ownership_ack=SUP.confirm_fixture_ownership(
                        run.pid, OUT/(mode+'-ownership-request.json'),
                        OUT/(mode+'-ownership-release.json'), family, errors)
                    if ownership_ack is not None:
                        outer['ownershipHandshake']=ownership_ack
                        SUP.save_json(OUT/(mode+'-outer-checkpoint.json'),outer)
                remaining=deadline-time.monotonic()
                if remaining <= 0: raise subprocess.TimeoutExpired(command,timeout)
                try:
                    run.wait(timeout=min(.01,remaining))
                    break
                except subprocess.TimeoutExpired:
                    if time.monotonic() >= deadline: raise subprocess.TimeoutExpired(command,timeout)
            # Fixed fixture deadline; polling does not extend it.
        except subprocess.TimeoutExpired as exc:
            outer['firstFailure']='OUTER_TIMEOUT'
            # wait() with file streams has no partial pipe attributes; logs remain actual bytes.
            outer['timeoutSeconds']=exc.timeout
        except Exception as exc:
            outer['firstFailure']='OUTER_RECORD_OR_WAIT_FAILURE'
            outer['exceptionType']=type(exc).__name__
        finally:
            run.poll()
            adopted=SUP.reap_adopted(run.pid,errors,zombies)
            owned=SUP.members(run.pid,errors)
            outer['preCleanupSnapshot']=owned
            if owned and outer['firstFailure'] is None:outer['firstFailure']='OUTER_CHILD_RESIDUAL'
            if owned:
                SUP.signal_family(run.pid,signal.SIGKILL,errors)
                outer['forcedKill']=True
            until=time.monotonic()+.7
            while time.monotonic()<until:
                run.poll()
                adopted.extend(SUP.reap_adopted(run.pid,errors,zombies))
                if not SUP.members(run.pid,errors):break
                SUP.signal_family(run.pid,signal.SIGKILL,errors);time.sleep(.01)
            run.poll()
            adopted.extend(SUP.reap_adopted(run.pid,errors,zombies))
            if ownership_handshake and ownership_ack is None:
                outer['ownershipHandshake'] = {'status': 'NOT_CONFIRMED', 'scope': 'TEST_FIXTURE_ONLY'}
                outer['firstFailure'] = outer['firstFailure'] or 'OWNERSHIP_HANDSHAKE_NOT_CONFIRMED'
                errors.append('OWNERSHIP_HANDSHAKE_NOT_CONFIRMED')
            outer['reapedAdopted']=adopted
            outer['zombieObservations']=zombies
            outer.update(exitCode=run.returncode,directChildExited=run.returncode is not None,
                         residual=SUP.members(run.pid,errors),auditErrors=sorted(set(errors)))
            outer['auditStatus']='UNKNOWN' if errors else 'FAIL' if outer['residual'] else 'PASS'
            if outer['residual'] or run.returncode is None:outer['cleanupFailure']='CLEANUP_FAILED'
            outer.update(endedAt=time.time(),elapsedMs=(time.monotonic()-start)*1000)
            outer['evidenceStates']=SUP.evidence_states(outer,zombies,errors,True,outer['firstFailure']=='OUTER_TIMEOUT')
            try:
                SUP.save_json(OUT/(mode+'-outer-result.json'),outer)
                SUP.save_evidence_receipt(OUT/(mode+'-outer-evidence-receipt.json'),OUT/(mode+'-outer-result.json'),outer)

            except Exception:
                outer['recordFailure']='OUTER_RECORD_WRITE_FAILED'
                outer['evidenceStates']['evidenceSavedVerified']='INCOMPLETE'
                outer['firstFailure']=outer['firstFailure'] or outer['recordFailure']
                print(json.dumps(outer),file=sys.stderr,flush=True)
    return outer
