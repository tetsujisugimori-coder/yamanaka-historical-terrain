import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const overview=()=>readFileSync('.github/workflows/stage3b-overview.yml','utf8');
test('B6i overview retains failed unit output and collects before browser without promoting failure',()=>{
  const w=overview();
  assert.match(w,/node --test --test-concurrency=1 tests\/\*\.test\.mjs > evidence-run\/stage3b\/unit\.log 2>&1/);
  assert.match(w,/printf 'unit\\t%s\\n' "\$code" > evidence-run\/stage3b\/exit-codes\.tsv/);
  const collect=w.indexOf('- name: Collect finite-process evidence even on failure');
  const browser=w.indexOf('- name: Browser matrix and evidence');
  const seal=w.indexOf('- name: Seal overview evidence manifest on success or failure');
  const upload=w.indexOf('- uses: actions/upload-artifact@v4');
  assert(collect>0&&browser>collect&&seal>browser&&upload>seal);
  assert.match(w.slice(collect,browser),/if: always\(\)/);
  assert.match(w.slice(collect,browser),/stage3b6h-artifacts\.py collect evidence-run\/stage3b \.work\/stage3b6g/);
  assert(!/collect[^\n]*\|\|\s*true/.test(w));
  assert(!/Browser matrix and evidence\n\s+if: always/.test(w));
  assert.match(w.slice(seal,upload),/if: always\(\)/);
  assert.match(w.slice(upload),/include-hidden-files: true/);
});
test('B6i keeps the existing 150ms wall deadline as FAIL and saves a cause-unknown diagnostic',()=>{
  const py=readFileSync('tests/stage3b6g-supervisor.py','utf8');
  const diagnostic=py.indexOf("SUP.save_json(OUT/(mode+'-timing-observation.json'),timing)");
  const deadline=py.indexOf("assert wall<config['totalMs']+150");
  assert(diagnostic>0&&deadline>diagnostic);
  assert.match(py,/EXTERNAL_WALL_WINDOW_EXCEEDED/);
  assert.match(py,/'rootCause':'UNKNOWN'/);
  assert.match(py,/timing\['supervisorElapsedMs'\]/);
});
