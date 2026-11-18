import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,mkdtempSync,writeFileSync,readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
test('B6j evidence-first faults and bounded signal ordering', {timeout:30000,skip:process.platform!=='linux'},()=>{
 mkdirSync('.work/stage3b6g/b6j-controls',{recursive:true});
 const out=mkdtempSync('.work/stage3b6g/b6j-controls/run-');
 const p=spawnSync('python3',['tests/stage3b6j.py',path.resolve(out)],{encoding:'utf8',timeout:25000});
 writeFileSync(path.join(out,'test.stdout'),p.stdout??'');writeFileSync(path.join(out,'test.stderr'),p.stderr??'');
 writeFileSync(path.join(out,'execution.json'),JSON.stringify({exit:p.status,signal:p.signal,error:p.error?.code??null}));
 assert.equal(p.status,0,p.stdout+p.stderr);
});
test('B6j preserves hard bounds and browser collection order',()=>{
 const s=readFileSync('scripts/stage3b6g-supervisor.py','utf8');
 assert.match(s,/45000/);assert.match(s,/180000/);
 assert.match(s,/persist=False/);
 for(const name of ['stage3b6.yml','stage3b-overview.yml']){
  const w=readFileSync('.github/workflows/'+name,'utf8');
  const c=w.indexOf('Collect finite-process evidence');
  const b=Math.max(w.indexOf('Production guide matrix'),w.indexOf('Browser matrix and evidence'));
  assert(c>0&&b>c);assert.match(w.slice(c,b),/if: always\(\)/);
  assert(!/collect[^\n]*\|\|\s*true/.test(w));
  assert(!/continue-on-error: true/.test(w));
  assert.match(w,/include-hidden-files: true/);
 }
});
