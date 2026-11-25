"""B6l diagnostic-only timing record for the B6g total case.

This record cannot change the 1250ms strict gate, infer a root cause, or
turn an unavailable inner ledger into a passing process audit.
"""
import json
import os
from pathlib import Path
import sys
import time


def _read(path):
    try:
        value = json.loads(path.read_text())
        return value if isinstance(value, dict) else None
    except (OSError, ValueError, TypeError):
        return None


def _number(value):
    return round(value, 3) if isinstance(value, (float, int)) and not isinstance(value, bool) else None


def _intervals(events):
    safe = [event for event in events if isinstance(event, dict)
            and isinstance(event.get('monotonicMs'), (int, float))
            and isinstance(event.get('kind'), str)]
    return [{'from': a['kind'], 'to': b['kind'],
             'startMs': _number(a['monotonicMs']),
             'endMs': _number(b['monotonicMs']),
             'durationMs': _number(b['monotonicMs'] - a['monotonicMs'])}
            for a, b in zip(safe, safe[1:])]


def record_total(out, case, config, outer, start_ns, end_ns,
                 start_unix_ns, end_unix_ns):
    """Atomic, read-back-verified result, emitted regardless of supervisor verdict."""
    ledger = _read(case / 'trial-ledger.json')
    trial = next((r for r in ledger.get('trials', [])
                  if isinstance(r, dict) and r.get('id') == 'first'), None) if ledger else None
    events = trial.get('events', []) if trial else []
    events = events if isinstance(events, list) else []
    outer = outer if isinstance(outer, dict) else None
    start_cleanup = next((e.get('monotonicMs') for e in events
                          if e.get('kind') == 'CLEANUP_START'), None)
    end_audit = next((e.get('monotonicMs') for e in events
                      if e.get('kind') == 'RESIDUAL_AUDIT'), None)
    phase = {
        'externalHarnessMs': _number((end_ns - start_ns) / 1_000_000),
        'watchdogMs': _number(outer.get('elapsedMs')) if outer else None,
        'supervisorMs': _number(ledger.get('elapsedMs')) if ledger else None,
        'firstTrialMs': _number(trial.get('elapsedMs')) if trial else None,
        'cleanupThroughAuditMs': _number(end_audit - start_cleanup)
            if isinstance(start_cleanup, (int, float)) and isinstance(end_audit, (int, float)) else None,
        'eventIntervals': _intervals(events),
        'recordWriteIntervals': ledger.get('recordTimings', []) if ledger else [],
    }
    missing = []
    if not outer: missing.append('OUTER_RECORD_UNAVAILABLE')
    if not ledger: missing.append('SUPERVISOR_LEDGER_UNAVAILABLE')
    if not trial: missing.append('FIRST_TRIAL_UNAVAILABLE')
    if trial and not events: missing.append('PHASE_EVENTS_UNAVAILABLE')
    if not isinstance(outer.get('residual'), list) if outer else False:
        missing.append('OUTER_RESIDUAL_UNKNOWN')
    if trial and not isinstance(trial.get('residual'), list):
        missing.append('INNER_RESIDUAL_UNKNOWN')
    observation = {
        'schema': 1, 'case': 'total', 'scope': 'B6G_TOTAL_DIAGNOSTIC_ONLY',
        'status': 'INCOMPLETE' if missing else 'OBSERVED',
        'missing': missing, 'rootCause': 'UNKNOWN',
        'strictExternalWindowMs': config['totalMs'] + 150,
        'strictComparison': 'externalHarnessMs < strictExternalWindowMs',
        'externalWithinWindow': (end_ns - start_ns) / 1_000_000 < config['totalMs'] + 150,
        'startedAtUnixNs': start_unix_ns, 'endedAtUnixNs': end_unix_ns,
        'startedMonotonicNs': start_ns, 'endedMonotonicNs': end_ns,
        'outerPid': outer.get('pid') if outer else None,
        'outerProcessSnapshot': outer.get('processSnapshot') if outer else None,
        'outerExitCode': outer.get('exitCode') if outer else None,
        'outerFirstFailure': outer.get('firstFailure') if outer else None,
        'outerCleanupFailure': outer.get('cleanupFailure') if outer else None,
        'outerAuditStatus': outer.get('auditStatus') if outer else 'UNKNOWN',
        'outerResidual': outer.get('residual') if outer else None,
        'outerReapedAdopted': outer.get('reapedAdopted') if outer else None,
        'innerPid': trial.get('pid') if trial else None,
        'innerExitCode': trial.get('exitCode') if trial else None,
        'innerFirstFailure': trial.get('firstFailure') if trial else None,
        'innerCleanupFailure': trial.get('cleanupFailure') if trial else None,
        'innerAuditStatus': trial.get('auditStatus') if trial else 'UNKNOWN',
        'innerResidual': trial.get('residual') if trial else None,
        'innerReapedAdopted': trial.get('reapedAdopted') if trial else None,
        'phaseTimings': phase,
        'interpretation': 'OBSERVATION_ONLY; wall overrun vs inner work/cleanup needs complete raw records',
    }
    path = out / 'total-phase-observation.json'
    tmp = path.with_name(path.name + '.pending')
    raw = json.dumps(observation, indent=2, allow_nan=False)
    try:
        with tmp.open('x') as stream:
            stream.write(raw)
            stream.flush()
            os.fsync(stream.fileno())
        if json.loads(tmp.read_bytes()) != observation:
            raise ValueError('TOTAL_OBSERVATION_READBACK_FAILED')
        os.replace(tmp, path)
        if json.loads(path.read_bytes()) != observation:
            raise ValueError('TOTAL_FINAL_READBACK_FAILED')
    finally:
        # The .pending file is an incomplete audit clue; never delete on error.
        pass
    return observation


def _self_test(destination):
    destination.mkdir(parents=True, exist_ok=False)
    sample = {'totalMs': 1100}
    events = [{'kind': 'WORKER_STARTED', 'monotonicMs': 100},
              {'kind': 'CLEANUP_START', 'monotonicMs': 450},
              {'kind': 'RESIDUAL_AUDIT', 'monotonicMs': 550}]
    for mode in ('normal', 'timeout', 'cleanup-failed', 'missing-ledger'):
        target = destination / mode
        case = target / 'total'
        case.mkdir(parents=True)
        if mode != 'missing-ledger':
            (case / 'trial-ledger.json').write_text(json.dumps({
                'elapsedMs': 650, 'recordTimings': [],
                'trials': [{'id': 'first', 'pid': 202, 'exitCode': 0 if mode == 'normal' else -9,
                            'firstFailure': None if mode == 'normal' else 'TOTAL_DEADLINE',
                            'cleanupFailure': 'CLEANUP_FAILED' if mode == 'cleanup-failed' else None,
                            'auditStatus': 'PASS' if mode != 'cleanup-failed' else 'FAIL',
                            'residual': [{'pid': 303}] if mode == 'cleanup-failed' else [],
                            'reapedAdopted': [], 'elapsedMs': 580, 'events': events}]}))
        outer = {'pid': 101, 'exitCode': 0 if mode == 'normal' else 1,
                 'elapsedMs': 700, 'auditStatus': 'PASS', 'residual': [],
                 'cleanupFailure': None, 'reapedAdopted': []}
        observed = record_total(target, case, sample, outer, 500_000_000,
                                1_200_000_000, 1000, 2000)
        assert observed['externalWithinWindow']
        assert observed['innerExitCode'] == (None if mode == 'missing-ledger'
                                            else 0 if mode == 'normal' else -9)
        assert observed['status'] == ('INCOMPLETE' if mode == 'missing-ledger' else 'OBSERVED')
        if mode == 'cleanup-failed': assert observed['innerCleanupFailure'] == 'CLEANUP_FAILED'
        assert json.loads((target / 'total-phase-observation.json').read_text()) == observed
    # Explicit strict-boundary negative control: equality is not an accepted window.
    target = destination / 'boundary'
    (target / 'total').mkdir(parents=True)
    observed = record_total(target, target / 'total', sample, None, 0,
                            1_250_000_000, 1000, 2000)
    assert observed['externalWithinWindow'] is False
    assert observed['status'] == 'INCOMPLETE'
    print(json.dumps({'status': 'PASS', 'cases': 5}))


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == '--self-test':
        _self_test(Path(sys.argv[2]).resolve())
    else:
        raise SystemExit('USE_AS_IMPORT_OR_SELF_TEST_ONLY')
