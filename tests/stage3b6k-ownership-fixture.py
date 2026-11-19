"""B6k controlled Linux fixture. Not production code or a security boundary.

The fixture must not orphan its child before the supervisor has observed and
acknowledged the live PID/birth/PPID relationship. No release = nonzero exit.
"""
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time


def identity(pid):
    try:
        fields = Path(f'/proc/{pid}/stat').read_text().rsplit(')', 1)[1].split()
        return {'pid': pid, 'state': fields[0], 'ppid': int(fields[1]), 'birth': fields[19]}
    except (OSError, ValueError, IndexError):
        return None


def write_atomic(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + '.pending')
    temp.write_text(json.dumps(data))
    os.replace(temp, path)


def run_fixture(mode, request, release, wait_seconds=0.28, result_dir=None):
    if mode not in ('orphan', 'live', 'zombie'):
        raise ValueError('INVALID_FIXTURE_MODE')
    request, release = Path(request), Path(release)
    if request.exists() or release.exists():
        raise ValueError('UNEXPECTED_EXISTING_HANDSHAKE')
    child_script = ("raise SystemExit(3)" if mode == 'zombie'
                    else "import signal,time;signal.signal(signal.SIGTERM,signal.SIG_IGN);time.sleep(60)")
    child = subprocess.Popen([sys.executable, '-c', child_script], start_new_session=True)
    acknowledged = False
    try:
        parent = identity(os.getpid())
        child_info = identity(child.pid)
        if parent is None or child_info is None or child_info['ppid'] != parent['pid']:
            raise RuntimeError('OWNERSHIP_REQUEST_IDENTITY_UNAVAILABLE')
        write_atomic(request, {'schema': 1,
                               'parentPid': parent['pid'], 'parentBirth': parent['birth'],
                               'childPid': child_info['pid'], 'childBirth': child_info['birth']})
        deadline = time.monotonic() + wait_seconds
        while time.monotonic() < deadline:
            if release.is_file():
                ack = json.loads(release.read_text())
                if (ack.get('schema') != 1 or ack.get('status') != 'CONFIRMED' or
                        ack.get('scope') != 'TEST_FIXTURE_ONLY' or
                        ack.get('root') != {'pid': parent['pid'], 'birth': parent['birth'],
                                            'ppid': parent['ppid']} or
                        ack.get('child') != {'pid': child_info['pid'],
                                             'birth': child_info['birth'], 'ppid': parent['pid']}):
                    raise RuntimeError('OWNERSHIP_RELEASE_MISMATCH')
                acknowledged = True
                break
            time.sleep(.004)
        if not acknowledged:
            raise RuntimeError('OWNERSHIP_RELEASE_MISSING')
        if result_dir is not None:
            out = Path(result_dir)
            write_atomic(out/'worker-result.json',
                         {'status': 'OBSERVED', 'firstFailure': None, 'mode': mode})
            (out/'descendant.pid').write_text(str(child.pid))
        if mode == 'zombie':
            # Deliberately leave a known Z for the subreaper; never wait() here.
            end = time.monotonic() + min(.10, wait_seconds)
            while time.monotonic() < end:
                z = identity(child.pid)
                if z and z['state'] == 'Z':
                    break
                time.sleep(.003)
            else:
                raise RuntimeError('EXPECTED_ZOMBIE_NOT_OBSERVED')
            # Bypass Popen.__del__: it may waitpid() a Z before adoption.
            # This deliberate fixture process exit is only after the receipt.
            os._exit(0)
        # The parent intentionally exits only AFTER the verified release.
        return 0
    except (OSError, ValueError, RuntimeError) as exc:
        if result_dir is not None:
            write_atomic(Path(result_dir)/'worker-result.json',
                         {'status': 'FAIL', 'firstFailure': 'OWNERSHIP_HANDSHAKE_FAILED',
                          'mode': mode, 'exceptionType': type(exc).__name__})
        print(json.dumps({'status': 'FAIL', 'error': type(exc).__name__,
                          'category': str(exc)}), file=sys.stderr, flush=True)
        return 91
    finally:
        if not acknowledged:
            # This is the fixture's known Popen child, not an arbitrary PID.
            try:
                child.kill()
                child.wait(timeout=.15)
            except (OSError, subprocess.TimeoutExpired):
                print('FIXTURE_CHILD_CLEANUP_UNCONFIRMED', file=sys.stderr, flush=True)


if __name__ == '__main__':
    if len(sys.argv) != 5:
        raise SystemExit('USAGE: fixture mode request release wait_seconds')
    raise SystemExit(run_fixture(sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])))
