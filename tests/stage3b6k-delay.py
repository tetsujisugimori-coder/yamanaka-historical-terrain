"""Stage B6k isolated baseline/new delay controls. Never promotes baseline faults."""
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
label, source_name, fixture_name, output_name = sys.argv[1:]
if label not in ('old', 'new'):
    raise SystemExit('INVALID_MODE')
source = Path(source_name).resolve()
fixture = Path(fixture_name).resolve()
out = Path(output_name).resolve()
if label == 'old':
    expected = 'eb8e9c4ee03918616f77a80db5a8bc4c4fd48173dea2a0148d43d20d5e7fc68b'
    if hashlib.sha256(source.read_bytes()).hexdigest() != expected:
        raise SystemExit('BASELINE_SOURCE_MISMATCH')

spec = importlib.util.spec_from_file_location('isolated_supervisor', source)
S = importlib.util.module_from_spec(spec)
spec.loader.exec_module(S)
original = S.save_json
injected = []
def delayed(path, data):
    if path.name == 'supervisor-checkpoint.json' and data.get('phase') == 'OPERATION' and data.get('firstFailure') and not injected:
        injected.append(True)
        time.sleep(.7)
    return original(path, data)
S.save_json = delayed
cfg = {'cwd': str(ROOT), 'individualMs': 1800, 'totalMs': 4000,
       'cleanupReserveMs': 700, 'termGraceMs': 150, 'auditReserveMs': 150,
       'trials': [{'id': 'first', 'argv': [sys.executable, str(fixture)]}]}
try:
    result = S.supervise(cfg, out)
    row = result['trials'][0]
    summary = {
        'label': label, 'injectedDelayReached': bool(injected),
        'expectedWithinBudget': label == 'new',
        'withinBudget': row.get('withinBudget'), 'status': row.get('status'),
        'elapsedMs': row.get('elapsedMs'),
        'firstFailure': row.get('firstFailure'),
        'cleanupFailure': row.get('cleanupFailure'),
        'auditStatus': row.get('auditStatus'), 'residual': row.get('residual'),
        'directChildExited': row.get('directChildExited'),
        'reapedAdopted': row.get('reapedAdopted', []),
        'rootCause': 'UNKNOWN', 'baselineIsDiagnosticOnly': label == 'old'}
    S.save_json(out/'b6k-summary.json', summary)
    print(json.dumps(summary), flush=True)
except Exception as exc:
    print(json.dumps({'status': 'INCOMPLETE', 'exceptionType': type(exc).__name__}), file=sys.stderr, flush=True)
    raise
