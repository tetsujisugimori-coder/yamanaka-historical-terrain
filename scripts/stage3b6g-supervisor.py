"""Linux-only bounded supervisor for controlled B6g workers (not hostile process sandbox).
Own session/process group, subreaper, SIGTERM then SIGKILL, finite residual audit.
No retry. Existing/foreign processes are never targeted. No browser imports here.
"""
import ctypes
import json
import os
from pathlib import Path
import signal
import re
import subprocess
import sys
import time

START = time.monotonic()

def members(_worker_pid):
    # Subreaper adopts daemonized/reparented descendants, including their new groups.
    table = {}
    for path in Path('/proc').glob('[0-9]*/stat'):
        try:
            fields = path.read_text().rsplit(')', 1)[1].split()
            table[int(path.parent.name)] = {'pid': int(path.parent.name),
                'state': fields[0], 'ppid': int(fields[1]), 'birth': fields[19]}
        except (OSError, ValueError, IndexError):
            pass
    family = {os.getpid()}
    while True:
        found = {pid for pid, row in table.items() if row['ppid'] in family}
        if found <= family:
            break
        family |= found
    return [table[pid] for pid in family - {os.getpid()} if pid in table]

def signal_family(worker_pid, sig):
    # Recheck birth identity before signal; only descendants of THIS supervisor.
    for row in reversed(members(worker_pid)):
        try:
            fields = Path(f"/proc/{row['pid']}/stat").read_text().rsplit(')',1)[1].split()
            if fields[19] == row['birth']:
                os.kill(row['pid'], sig)
        except (OSError, ValueError, IndexError):
            pass

def reap():
    while True:
        try:
            pid, _ = os.waitpid(-1, os.WNOHANG)
            if pid == 0:
                return
        except ChildProcessError:
            return

def save_new(path, data):
    with path.open('x') as f:
        json.dump(data, f, indent=2)
        f.flush()
        os.fsync(f.fileno())

def supervise(config, out):
    start = time.monotonic()
    if sys.platform != 'linux' or not Path('/proc/self/stat').exists():
        raise RuntimeError('UNSUPPORTED_ENVIRONMENT')
    # Only this supervisor's own orphan adoption; no capability/root/security changes.
    if ctypes.CDLL(None, use_errno=True).prctl(36, 1, 0, 0, 0) != 0:
        raise RuntimeError('SUBREAPER_UNAVAILABLE')
    individual = config.get('individualMs', 45000) / 1000
    total = config.get('totalMs', 180000) / 1000
    reserve = config.get('cleanupReserveMs', 10000) / 1000
    grace = config.get('termGraceMs', 1000) / 1000
    audit = config.get('auditReserveMs', 1000) / 1000
    if not (0 < audit < reserve and 0 < grace < reserve - audit < individual <= 45 and total <= 180):
        raise ValueError('INVALID_BUDGET')
    trials = config['trials']
    if not 1 <= len(trials) <= 4 or any(not re.fullmatch(r'[a-z0-9-]+', t['id']) or not isinstance(t.get('argv'),list) or not t['argv'] or any(not isinstance(a,str) for a in t['argv']) for t in trials) or len({t['id'] for t in trials}) != len(trials):
        raise ValueError('INVALID_TRIAL_SET')
    deadline = start + total
    out.mkdir(parents=True, exist_ok=False)
    ledger = []
    stopped = None
    for trial in trials:
        row = {'id': trial['id'], 'status': 'NOT_TESTED', 'firstFailure': None,
               'events': [], 'residual': [], 'scope': 'controlled Linux descendant tree plus subreaper adoption'}
        ledger.append(row)
        if stopped:
            row['reason'] = stopped
            continue
        t0 = time.monotonic()
        hard = min(t0 + individual, deadline)
        if hard - t0 <= reserve:
            row['reason'] = 'TOTAL_DEADLINE'
            stopped = 'TOTAL_DEADLINE'
            continue
        row['budgetMs'] = (hard - t0) * 1000
        op_end = hard - reserve
        kill_at = min(op_end + grace, hard - audit)
        def event(kind, **extra):
            row['events'].append({'kind': kind, 'monotonicMs': (time.monotonic()-start)*1000, **extra})
        def fail(code):
            row['firstFailure'] = row['firstFailure'] or code
            event(code)
        trial_dir = out / trial['id']
        trial_dir.mkdir()
        env = os.environ.copy()
        env.update({'B6G_OUT': str(trial_dir.resolve()),
                    'B6G_CLOSE_MS': str(min(5000, int((reserve-grace-audit)*1000))),
                    'TMPDIR': str((out / 'tmp').resolve())})
        Path(env['TMPDIR']).mkdir(exist_ok=True)
        worker = None
        term_sent = kill_sent = False
        with (trial_dir/'stdout.log').open('xb') as stdout, (trial_dir/'stderr.log').open('xb') as stderr:
            try:
                worker = subprocess.Popen(trial['argv'], env=env, cwd=config['cwd'],
                    stdout=stdout, stderr=stderr, start_new_session=True)
                event('WORKER_STARTED', pid=worker.pid)
                while True:
                    now = time.monotonic()
                    rc = worker.poll()
                    group = members(worker.pid)
                    if rc is not None and not group:
                        break
                    if rc is not None and group and not term_sent:
                        fail('CHILD_RESIDUAL')
                        # worker has exited, descendants still in owned group.
                        op_end = now
                        kill_at = min(now + grace, hard-audit)
                    if stdout.tell()+stderr.tell() > 8*1024*1024 and not term_sent:
                        fail('OUTPUT_BUDGET')
                        op_end = now
                        kill_at = min(now+grace, hard-audit)
                    if now >= op_end and not term_sent:
                        if row['firstFailure'] is None:
                            fail('TOTAL_DEADLINE' if deadline <= t0+individual else 'INDIVIDUAL_DEADLINE')
                        event('CLEANUP_START')
                        try:
                            signal_family(worker.pid, signal.SIGTERM)
                            event('SIGTERM')
                        except ProcessLookupError:
                            pass
                        term_sent = True
                    if term_sent and now >= kill_at and not kill_sent:
                        try:
                            signal_family(worker.pid, signal.SIGKILL)
                            event('FORCED_KILL')
                        except ProcessLookupError:
                            pass
                        kill_sent = True
                    if rc is not None:
                        reap()
                    if now >= hard-audit:
                        break
                    time.sleep(min(.01, max(0, hard-audit-now)))
                # Even normal worker exit must leave no children. Never unbounded wait().
                if members(worker.pid):
                    try:
                        signal_family(worker.pid, signal.SIGKILL)
                        event('FINAL_FORCED_KILL')
                    except ProcessLookupError:
                        pass
                while time.monotonic() < hard-audit/2:
                    if kill_sent or term_sent:
                        signal_family(worker.pid, signal.SIGKILL)
                    worker.poll()
                    if worker.returncode is not None:
                        reap()
                    if not members(worker.pid):
                        break
                    time.sleep(.005)
                row['exitCode'] = worker.poll()
                row['residual'] = members(worker.pid)
                event('RESIDUAL_AUDIT', count=len(row['residual']))
                if row['residual'] or row['exitCode'] is None:
                    fail('CLEANUP_FAILED')
                result = trial_dir/'worker-result.json'
                if result.exists() and result.stat().st_size <= 1024*1024:
                    try:
                        data = json.loads(result.read_text())
                        if not isinstance(data,dict) or data.get('status') not in ('OBSERVED','FAIL','BLOCKED') or 'firstFailure' not in data or not (data['firstFailure'] is None or isinstance(data['firstFailure'],str) and re.fullmatch(r'[A-Z0-9_]{1,64}',data['firstFailure'])) or (data['status'] in ('FAIL','BLOCKED') and data['firstFailure'] is None):
                            raise ValueError('INVALID_WORKER_RESULT')
                        row['workerResult'] = data
                        # Preserve worker's initial diagnostic error independently of supervisor failures.
                        row['workerFirstFailure'] = data.get('firstFailure')
                    except (OSError, ValueError):
                        fail('RESULT_INVALID')
                if not isinstance(row.get('workerResult'), dict) or row['workerResult'].get('status') not in ('OBSERVED','FAIL','BLOCKED'):
                    fail('RESULT_MISSING_OR_INVALID')
                if row.get('workerResult', {}).get('status') == 'BLOCKED' and not row['firstFailure'] and not row['residual']:
                    row['status'] = 'BLOCKED'
                    stopped = 'WORKER_BLOCKED'
                elif row['firstFailure'] or row['exitCode'] != 0 or row.get('workerResult', {}).get('status') == 'FAIL':
                    row['status'] = 'FAIL'
                    stopped = row['firstFailure'] or 'WORKER_FAILED'
                else:
                    row['status'] = 'COMPLETED'
            except OSError:
                row['status'] = 'BLOCKED'
                fail('SPAWN_FAILED')
                stopped = 'SPAWN_FAILED'
            row['elapsedMs'] = (time.monotonic()-t0)*1000
            row['withinBudget'] = time.monotonic() <= hard
            if not row['withinBudget']:
                row['status'] = 'FAIL'
                stopped = 'BOUND_EXCEEDED'
            save_new(trial_dir/'supervisor-result.json', row)
    result = {'schema': 1, 'individualMs': individual*1000, 'totalMs': total*1000,
              'elapsedMs': (time.monotonic()-start)*1000, 'trials': ledger,
              'limits': ['No guarantee under host suspension/uninterruptible kernel I/O.',
                         'Subreaper covers reparented descendants; hostile ptrace/UID changes are out of scope.',
                         'No hostile-code security boundary or realtime scheduling guarantee.']}
    save_new(out/'trial-ledger.json', result)
    return result

if __name__ == '__main__':
    config = json.loads(Path(sys.argv[1]).read_text())
    result = supervise(config, Path(sys.argv[2]).resolve())
    print(json.dumps({'statuses': [r['status'] for r in result['trials']], 'elapsedMs':result['elapsedMs']}))
    sys.exit(0 if all(r['status']=='COMPLETED' for r in result['trials']) else 1)
