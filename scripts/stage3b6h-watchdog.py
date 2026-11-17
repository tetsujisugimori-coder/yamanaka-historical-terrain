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
def run_bounded(command, OUT, mode, timeout=6):
    SUP.enable_subreaper()
    start=time.monotonic()
    outer={'case':mode,'command':command,'startedAt':time.time(),'firstFailure':None,'cleanupFailure':None,'auditStatus':'NOT_TESTED'}
    SUP.save_json(OUT/(mode+'-outer-checkpoint.json'),outer)
    with (OUT/(mode+'-stdout.log')).open('xb') as stdout,(OUT/(mode+'-stderr.log')).open('xb') as stderr:
        run=subprocess.Popen(command,stdout=stdout,stderr=stderr,start_new_session=True)
        try:
            outer['pid']=run.pid;outer['processSnapshot']=SUP.members(run.pid)
            SUP.save_json(OUT/(mode+'-outer-checkpoint.json'),outer)
            run.wait(timeout=timeout) # fixed fixture deadline, not extended to obtain success
        except subprocess.TimeoutExpired as exc:
            outer['firstFailure']='OUTER_TIMEOUT'
            # wait() with file streams has no partial pipe attributes; logs remain actual bytes.
            outer['timeoutSeconds']=exc.timeout
        except Exception as exc:
            outer['firstFailure']='OUTER_RECORD_OR_WAIT_FAILURE'
            outer['exceptionType']=type(exc).__name__
        finally:
            errors=[];owned=SUP.members(run.pid,errors)
            outer['preCleanupSnapshot']=owned
            if owned and outer['firstFailure'] is None:outer['firstFailure']='OUTER_CHILD_RESIDUAL'
            if owned:
                SUP.signal_family(run.pid,signal.SIGKILL,errors)
                outer['forcedKill']=True
            until=time.monotonic()+.7
            while time.monotonic()<until:
                run.poll()
                if run.returncode is not None:SUP.reap()
                if not SUP.members(run.pid,errors):break
                SUP.signal_family(run.pid,signal.SIGKILL,errors);time.sleep(.01)
            outer.update(exitCode=run.poll(),directChildExited=run.returncode is not None,
                         residual=SUP.members(run.pid,errors),auditErrors=sorted(set(errors)))
            outer['auditStatus']='UNKNOWN' if errors else 'FAIL' if outer['residual'] else 'PASS'
            if outer['residual'] or run.returncode is None:outer['cleanupFailure']='CLEANUP_FAILED'
            outer.update(endedAt=time.time(),elapsedMs=(time.monotonic()-start)*1000)
            try:SUP.save_json(OUT/(mode+'-outer-result.json'),outer)
            except Exception:
                outer['recordFailure']='OUTER_RECORD_WRITE_FAILED'
                outer['firstFailure']=outer['firstFailure'] or outer['recordFailure']
                print(json.dumps(outer),file=sys.stderr,flush=True)
    return outer
