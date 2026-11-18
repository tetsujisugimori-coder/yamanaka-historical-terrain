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
test('B6i keeps the existing 150ms wall deadline and saves cause-unknown diagnostic before failed verdict',()=>{
  const py=readFileSync('tests/stage3b6g-supervisor.py','utf8');
  const helper=readFileSync('scripts/stage3b6j-case-record.py','utf8');
  assert.match(helper,/wall < config\['totalMs'\] \+ 150/);
  assert.match(helper,/'rootCause': 'UNKNOWN'/);
  assert.match(helper,/supervisorElapsedMs/);
  assert(py.indexOf("mode+'-timing-observation.json'")<py.indexOf('raise AssertionError'));
  assert.match(py,/finally:\n        persist\(\)/);
});
