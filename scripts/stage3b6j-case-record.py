"""Evidence-first assertions. Test verdict is separate from observed fault status."""
import json
from pathlib import Path
import time

CASES = ['normal', 'hang', 'close', 'orphan', 'first-cleanup', 'total']

def evaluate(mode, config, outer, wall, case):
    record = {'case': mode, 'status': 'RUNNING', 'pass': False, 'checks': [],
              'firstFailure': None, 'cleanupFailure': outer.get('cleanupFailure'),
              'outer': outer, 'elapsedMs': wall, 'externalWallMs': wall,
              'rootCause': 'UNKNOWN', 'recordMissing': [], 'clocks': {
                  'external': 'harness before watchdog call through watchdog return',
                  'watchdog': 'watchdog start through own cleanup/audit',
                  'supervisor': 'supervisor start through returned ledger finalization',
                  'trial': 'before trial setup through inner result validation (see phase timings)'}}
    timing = {'schema': 2, 'case': mode, 'totalMs': config['totalMs'], 'toleranceMs': 150,
              'externalWallMs': wall, 'externalWallWithinWindow': wall < config['totalMs'] + 150,
              'watchdogElapsedMs': outer.get('elapsedMs'), 'watchdogFirstFailure': outer.get('firstFailure'),
              'watchdogCleanupFailure': outer.get('cleanupFailure'), 'watchdogAuditStatus': outer.get('auditStatus'),
              'interpretation': 'OBSERVATION_ONLY_NOT_ROOT_CAUSE'}
    def check(code, condition, classification='FAIL'):
        record['checks'].append({'id': code, 'pass': bool(condition)})
        if not condition:
            record['firstFailure'] = record['firstFailure'] or code
            if classification == 'INCOMPLETE': record['recordMissing'].append(code)
    check('OUTER_FAILURE', not outer.get('firstFailure') and not outer.get('cleanupFailure') and outer.get('auditStatus') == 'PASS')
    check('OUTER_EXIT_MISMATCH', outer.get('exitCode') == (0 if mode == 'normal' else 1))
    check('EXTERNAL_WALL_WINDOW_EXCEEDED', timing['externalWallWithinWindow'])
    try:
        data = json.loads((case / 'trial-ledger.json').read_text())
        row = data['trials'][0]
        if not isinstance(row, dict): raise TypeError('trial')
        record.update(actual=row.get('status'), expected='COMPLETED' if mode == 'normal' else 'FAIL',
                      returncode=outer.get('exitCode'), observedFirstFailure=row.get('firstFailure'),
                      workerFirstFailure=row.get('workerFirstFailure'), residual=row.get('residual'),
                      cleanupFailure=row.get('cleanupFailure') or outer.get('cleanupFailure'),
                      trial=row)
        timing.update(supervisorElapsedMs=data.get('elapsedMs'), firstTrialStatus=row.get('status'),
                      firstTrialBudgetMs=row.get('budgetMs'), firstTrialElapsedMs=row.get('elapsedMs'),
                      firstTrialAuditStatus=row.get('auditStatus'), firstTrialResidualCount=len(row.get('residual') or []))
        check('TRIAL_STATUS_MISMATCH', row.get('status') == record['expected'])
        check('WITHIN_BUDGET_FALSE', row.get('withinBudget') is True)
        check('RESIDUAL_OR_AUDIT_FAILURE', row.get('residual') == [] and row.get('auditStatus') == 'PASS')
        check('CLEANUP_FAILURE', row.get('cleanupFailure') is None)
        check('DIRECT_CHILD_NOT_EXITED', row.get('directChildExited') is True)
        if mode != 'normal': check('POST_FAILURE_TRIAL_EXECUTED', data['trials'][1].get('status') == 'NOT_TESTED')
        if mode == 'total': check('TOTAL_FIRST_FAILURE_LOST', row.get('firstFailure') == 'TOTAL_DEADLINE')
        if mode == 'first-cleanup': check('WORKER_FIRST_FAILURE_LOST', row.get('workerFirstFailure') == 'INITIAL_DIAGNOSTIC_FAILURE')
        if mode == 'orphan':
            pid = int((case / 'first/descendant.pid').read_text())
            ack = json.loads((case / 'first/ownership-release.json').read_text())
            request = json.loads((case / 'first/ownership-request.json').read_text())
            observed = row.get('ownershipHandshake')
            check('OWNERSHIP_HANDSHAKE_UNVERIFIED',
                  isinstance(observed, dict) and ack == observed and
                  ack.get('status') == 'CONFIRMED' and
                  ack.get('scope') == 'TEST_FIXTURE_ONLY' and
                  ack.get('child', {}).get('pid') == pid and
                  ack.get('child', {}).get('ppid') == ack.get('root', {}).get('pid') and
                  ack.get('root', {}).get('pid') == request.get('parentPid') and
                  ack.get('root', {}).get('birth') == request.get('parentBirth') and
                  ack.get('child', {}).get('birth') == request.get('childBirth'),
                  'INCOMPLETE')
            check('DESCENDANT_STILL_EXISTS', not Path(f'/proc/{pid}').exists())
        for stream in ['stdout.log', 'stderr.log']:
            check('STREAM_MISSING_' + stream, (case / 'first' / stream).is_file(), 'INCOMPLETE')
    except (OSError, ValueError, KeyError, TypeError, IndexError):
        check('SUPERVISOR_RECORD_MISSING_OR_INVALID', False, 'INCOMPLETE')
        timing['supervisorRecord'] = 'UNAVAILABLE'
    record['status'] = 'INCOMPLETE' if record['recordMissing'] else 'FAIL' if record['firstFailure'] else 'PASS'
    record['pass'] = record['status'] == 'PASS'
    record['finishedAtUnix'] = time.time()
    return record, timing
