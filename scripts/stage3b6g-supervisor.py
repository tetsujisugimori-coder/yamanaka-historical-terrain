"""Bounded controlled Linux process supervision, not a hostile-code sandbox.
B6h: atomic checkpoints, distinct first/cleanup failures and explicit audit coverage.
Host suspension, stuck kernel I/O and forced host destruction remain outside guarantee.
"""
import ctypes
import json
import os
from pathlib import Path
import re
import signal
import subprocess
import sys
import time


def enable_subreaper():
    if sys.platform != 'linux' or not Path('/proc/self/stat').exists():
        raise RuntimeError('UNSUPPORTED_ENVIRONMENT')
    if ctypes.CDLL(None, use_errno=True).prctl(36, 1, 0, 0, 0) != 0:
        raise RuntimeError('SUBREAPER_UNAVAILABLE')


def members(_worker_pid=None, errors=None):
    table = {}
    try:
        paths = list(Path('/proc').glob('[0-9]*/stat'))
    except OSError:
        if errors is not None: errors.append('PROC_ENUMERATION_FAILED')
        return []
    for path in paths:
        try:
            fields = path.read_text().rsplit(')', 1)[1].split()
            table[int(path.parent.name)] = {'pid': int(path.parent.name), 'state': fields[0],
                                           'ppid': int(fields[1]), 'birth': fields[19]}
        except FileNotFoundError:
            pass  # process exited during snapshot
        except (OSError, ValueError, IndexError):
            if errors is not None: errors.append('PROC_ROW_UNREADABLE')
    family = {os.getpid()}
    while True:
        found = {pid for pid, row in table.items() if row['ppid'] in family}
        if found <= family: break
        family |= found
    return [table[pid] for pid in sorted(family - {os.getpid()}) if pid in table]


def signal_family(worker_pid, sig, errors=None):
    for row in reversed(members(worker_pid, errors)):
        try:
            fields = Path(f"/proc/{row['pid']}/stat").read_text().rsplit(')', 1)[1].split()
            if fields[19] == row['birth'] and fields[0] != 'Z': os.kill(row['pid'], sig)
        except ProcessLookupError: pass
        except FileNotFoundError: pass
        except (OSError, ValueError, IndexError):
            if errors is not None: errors.append('SIGNAL_IDENTITY_OR_DELIVERY_FAILED')


def reap_adopted(worker_pid=None, errors=None):
    """Reap only observed, birth-verified zombie children adopted by this subreaper.

    Popen.poll() exclusively owns the direct child's wait status. Never use
    waitpid(-1): it can consume a live Popen object's status and hide its exit.
    """
    recovered = []
    for row in members(worker_pid, errors):
        if row['state'] != 'Z' or row['ppid'] != os.getpid() or row['pid'] == worker_pid:
            continue
        try:
            fields = Path(f"/proc/{row['pid']}/stat").read_text().rsplit(')', 1)[1].split()
            if fields[0] != 'Z' or int(fields[1]) != os.getpid() or fields[19] != row['birth']:
                continue
            pid, _ = os.waitpid(row['pid'], os.WNOHANG)
            if pid:
                recovered.append({'pid': pid, 'birth': row['birth']})
        except (FileNotFoundError, ChildProcessError):
            pass
        except (OSError, ValueError, IndexError):
            if errors is not None: errors.append('ADOPTED_REAP_FAILED')
    return recovered


def save_json(path, data):
    """New checkpoint name replaced only after complete write/fsync/parse validation."""
    payload = json.dumps(data, indent=2, allow_nan=False)
    tmp = path.with_name(path.name + '.pending')
    with tmp.open('w') as f:
        f.write(payload); f.flush(); os.fsync(f.fileno())
    if json.loads(tmp.read_text()) != data: raise ValueError('RECORD_VERIFY_FAILED')
    os.replace(tmp, path)


def supervise(config, out):
    enable_subreaper()
    start = time.monotonic()
    individual = config.get('individualMs', 45000) / 1000
    total = config.get('totalMs', 180000) / 1000
    reserve = config.get('cleanupReserveMs', 10000) / 1000
    grace = config.get('termGraceMs', 1000) / 1000
    audit = config.get('auditReserveMs', 1000) / 1000
    if not (0 < audit < reserve and 0 < grace < reserve-audit < individual <= 45 and total <= 180):
        raise ValueError('INVALID_BUDGET')
    trials = config['trials']
    if not 1 <= len(trials) <= 4 or any(not re.fullmatch(r'[a-z0-9-]+', t['id']) or not isinstance(t.get('argv'), list) or not t['argv'] or any(not isinstance(a, str) for a in t['argv']) for t in trials) or len({t['id'] for t in trials}) != len(trials):
        raise ValueError('INVALID_TRIAL_SET')
    out.mkdir(parents=True, exist_ok=False)
    ledger = [{'id': t['id'], 'status': 'NOT_TESTED', 'firstFailure': None, 'cleanupFailure': None,
               'events': [], 'residual': None, 'auditStatus': 'NOT_TESTED'} for t in trials]
    result = {'schema': 2, 'individualMs': individual*1000, 'totalMs': total*1000, 'trials': ledger,
              'limits': ['No guarantee under host suspension, uninterruptible I/O or forced environment destruction.',
                         'Controlled descendant tree/subreaper only; not a hostile-code security boundary.']}
    record_errors = []
    record_timings = []
    result['recordTimings'] = record_timings
    result['recordTimingScope'] = 'Completed writes before this ledger serialization; final ledger write cannot self-time.'
    def record(path, data):
        began = time.monotonic()
        try: save_json(path, data); return True
        except (OSError, ValueError, TypeError):
            record_errors.append({'file': path.name, 'reason': 'RECORD_WRITE_FAILED'})
            print(json.dumps({'status': 'INCOMPLETE', 'firstFailure': 'RECORD_WRITE_FAILED', 'file': path.name}), file=sys.stderr, flush=True)
            return False
        finally:
            record_timings.append({'file': str(path.relative_to(out)), 'startMs': (began-start)*1000, 'endMs': (time.monotonic()-start)*1000})
    record(out/'trial-ledger.json', result)
    deadline = start + total
    stopped = None
    for trial, row in zip(trials, ledger):
        if stopped: row['reason'] = stopped; continue
        t0 = time.monotonic(); hard = min(t0+individual, deadline)
        if hard-t0 <= reserve: row['reason'] = stopped = 'TOTAL_DEADLINE'; continue
        row.update(status='RUNNING', budgetMs=(hard-t0)*1000, phase='STARTING')
        trial_dir = out/trial['id']; trial_dir.mkdir()
        def checkpoint():
            if not record(trial_dir/'supervisor-checkpoint.json', row):
                row['firstFailure'] = row['firstFailure'] or 'RECORD_WRITE_FAILED'
        def event(kind, persist=True, **extra):
            row['events'].append({'kind': kind, 'monotonicMs': (time.monotonic()-start)*1000, **extra})
            if persist: checkpoint()
        def fail(code, persist=True):
            row['firstFailure'] = row['firstFailure'] or code
            event(code, persist=persist)
        worker = None; streams = []; term_sent = kill_sent = False; audit_errors = []; reaped_children = []
        op_end = hard-reserve; kill_at = min(op_end+grace, hard-audit)
        env = os.environ.copy(); env.update(B6G_OUT=str(trial_dir.resolve()), B6G_CLOSE_MS=str(min(5000, int((reserve-grace-audit)*1000))), TMPDIR=str((out/'tmp').resolve()))
        Path(env['TMPDIR']).mkdir(exist_ok=True)
        checkpoint()
        try:
            streams = [(trial_dir/'stdout.log').open('xb'), (trial_dir/'stderr.log').open('xb')]
            event('SPAWN_BEGIN', persist=False)
            worker = subprocess.Popen(trial['argv'], env=env, cwd=config['cwd'], stdout=streams[0], stderr=streams[1], start_new_session=True)
            row['phase'] = 'OPERATION'
            event('WORKER_STARTED', pid=worker.pid, processSnapshot=members(worker.pid, audit_errors))
            while time.monotonic() < hard-audit:
                rc = worker.poll()
                reaped_children.extend(reap_adopted(worker.pid, audit_errors))
                group = members(worker.pid, audit_errors); now = time.monotonic()
                if rc is not None and not group: break
                if rc is not None and group and not term_sent:
                    fail('CHILD_RESIDUAL', persist=False); op_end = now; kill_at = min(now+grace, hard-audit)
                if sum(s.tell() for s in streams) > 8*1024*1024 and not term_sent:
                    fail('OUTPUT_BUDGET', persist=False); op_end = now; kill_at = min(now+grace, hard-audit)
                if (now >= op_end or record_errors) and not term_sent:
                    fail('RECORD_WRITE_FAILED' if record_errors else ('TOTAL_DEADLINE' if deadline <= t0+individual else 'INDIVIDUAL_DEADLINE'), persist=False)
                    row['phase'] = 'CLEANUP'; event('CLEANUP_START', persist=False)
                    signal_family(worker.pid, signal.SIGTERM, audit_errors); term_sent = True; event('SIGTERM', persist=False)
                if term_sent and now >= kill_at and not kill_sent:
                    signal_family(worker.pid, signal.SIGKILL, audit_errors); kill_sent = True; event('FORCED_KILL', persist=False)
                if rc is not None: reaped_children.extend(reap_adopted(worker.pid, audit_errors))
                time.sleep(max(0, min(.01, (kill_at if term_sent and not kill_sent else op_end if not term_sent else hard-audit)-time.monotonic())))
        except Exception as exc:
            # Error details may contain argv/secrets: persist a fixed category only.
            fail('SPAWN_OR_SUPERVISOR_EXCEPTION', persist=False); row['exceptionType'] = type(exc).__name__
        finally:
            row['phase'] = 'CLEANUP'
            if worker is not None:
                worker.poll()
                reaped_children.extend(reap_adopted(worker.pid, audit_errors))
                if members(worker.pid, audit_errors):
                    signal_family(worker.pid, signal.SIGKILL, audit_errors); event('FINAL_FORCED_KILL', persist=False)
                # The old hard-audit/2 compared an absolute monotonic timestamp
                # against half another timestamp and skipped cleanup on most hosts.
                while time.monotonic() < hard-audit:
                    worker.poll()
                    reaped_children.extend(reap_adopted(worker.pid, audit_errors))
                    if not members(worker.pid, audit_errors): break
                    signal_family(worker.pid, signal.SIGKILL, audit_errors); time.sleep(.005)
                row['exitCode'] = worker.poll()
                row['directChildExited'] = row['exitCode'] is not None
                reaped_children.extend(reap_adopted(worker.pid, audit_errors))
            else:
                row.update(exitCode=None, directChildExited=None)
            row['reapedAdopted'] = reaped_children
            row['residual'] = members(None, audit_errors)
            row['auditErrors'] = sorted(set(audit_errors))
            row['auditStatus'] = 'UNKNOWN' if audit_errors else ('FAIL' if row['residual'] else 'PASS')
            row['descendantsExited'] = None if audit_errors else not bool(row['residual'])
            if row['residual'] or (worker is not None and row['exitCode'] is None): row['cleanupFailure'] = 'CLEANUP_FAILED'
            elif audit_errors: row['cleanupFailure'] = 'AUDIT_INCOMPLETE'
            event('RESIDUAL_AUDIT', persist=False, count=len(row['residual']))
            row['phase'] = 'RECORD_FINALIZATION'
            checkpoint()
            for stream in streams: stream.close()
        try:
            p = trial_dir/'worker-result.json'
            if p.stat().st_size > 1024*1024: raise ValueError('RESULT_TOO_LARGE')
            data = json.loads(p.read_text())
            if not isinstance(data, dict) or data.get('status') not in ('OBSERVED','FAIL','BLOCKED') or 'firstFailure' not in data or not (data['firstFailure'] is None or isinstance(data['firstFailure'], str) and re.fullmatch(r'[A-Z0-9_]{1,64}',data['firstFailure'])) or (data['status'] in ('FAIL','BLOCKED') and data['firstFailure'] is None): raise ValueError('INVALID_RESULT')
            row['workerResult'] = data; row['workerFirstFailure'] = data['firstFailure']
        except (OSError, ValueError): fail('RESULT_MISSING_OR_INVALID')
        row['budgetObservationScope'] = 'trial setup through residual audit checkpoint and worker-result validation; final result/ledger writes excluded and separately timed'
        row['elapsedMs'] = (time.monotonic()-t0)*1000; row['withinBudget'] = time.monotonic() <= hard
        if not row['withinBudget']: fail('BOUND_EXCEEDED')
        if row['firstFailure'] or row['cleanupFailure'] or row.get('exitCode') != 0 or row.get('workerResult',{}).get('status') == 'FAIL': row['status'] = 'FAIL'
        elif row.get('workerResult',{}).get('status') == 'BLOCKED': row['status'] = 'BLOCKED'
        else: row['status'] = 'COMPLETED'
        if audit_errors or record_errors: row['status'] = 'INCOMPLETE'
        row['phase'] = 'FINISHED'
        if not record(trial_dir/'supervisor-result.json', row): row['status'] = 'INCOMPLETE'
        if row['status'] != 'COMPLETED': stopped = row['firstFailure'] or row['cleanupFailure'] or row['status']
        record(out/'trial-ledger.json', result)
    result.update(elapsedMs=(time.monotonic()-start)*1000, recordErrors=record_errors)
    record(out/'trial-ledger.json', result)
    return result

if __name__ == '__main__':
    try:
        result = supervise(json.loads(Path(sys.argv[1]).read_text()), Path(sys.argv[2]).resolve())
        print(json.dumps({'statuses': [r['status'] for r in result['trials']], 'elapsedMs': result['elapsedMs'], 'recordErrors': result['recordErrors']}), flush=True)
        sys.exit(0 if all(r['status']=='COMPLETED' for r in result['trials']) and not result['recordErrors'] else 1)
    except Exception as exc:
        print(json.dumps({'status':'INCOMPLETE','firstFailure':'SUPERVISOR_FATAL','exceptionType':type(exc).__name__}), file=sys.stderr, flush=True)
        sys.exit(2)
