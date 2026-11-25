import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,mkdtempSync,writeFileSync,readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
test('B6h artifact manifest detects missing, changed, extra and generation failure',()=>{
 mkdirSync('.work/stage3b6g/artifact-controls',{recursive:true});const base=mkdtempSync('.work/stage3b6g/artifact-controls/test-');
 const cmd=(op,dir,extra)=>spawnSync('python3',['scripts/stage3b6h-artifacts.py',op,path.resolve(dir),...(extra?[path.resolve(extra)]:[])],{encoding:'utf8',timeout:5000});
 const root=path.join(base,'evidence');mkdirSync(root);writeFileSync(path.join(root,'raw.log'),'original');
 assert.equal(cmd('seal',root).status,0);
 assert.equal(cmd('verify',root).status,0);
 const manifest=readFileSync(path.join(root,'manifest.json'),'utf8');
 writeFileSync(path.join(root,'manifest.json'),'[]');assert.notEqual(cmd('verify',root).status,0);
 writeFileSync(path.join(root,'manifest.json'),manifest);writeFileSync(path.join(root,'raw.log'),'changed');assert.notEqual(cmd('verify',root).status,0);
 writeFileSync(path.join(root,'raw.log'),'original');writeFileSync(path.join(root,'extra.log'),'extra');assert.notEqual(cmd('verify',root).status,0);
 const absent=path.join(base,'absent');assert.notEqual(cmd('verify',absent).status,0);
 const blocked=path.join(base,'blocked');writeFileSync(blocked,'not a directory');assert.notEqual(cmd('seal',blocked).status,0);
 const missing=path.join(base,'missing-input');assert.notEqual(cmd('collect',missing,absent).status,0);
 const result=JSON.parse(readFileSync(path.join(missing,'finite-process-collection.json'),'utf8'));assert.equal(result.status,'INCOMPLETE');
 writeFileSync(path.join(base,'assertions.json'),JSON.stringify({normalManifest:'PASS',missing:'REJECTED',changed:'REJECTED',extra:'REJECTED',generationFailure:'REJECTED',missingProcessDirectory:'INCOMPLETE'}));
});
test('B6h always collects then seals then uploads without changing browser success gate',()=>{
 const w=readFileSync('.github/workflows/stage3b6.yml','utf8');
 assert.match(w,/Collect finite-process evidence even on failure\n        if: always\(\)/);
 assert.match(w,/Evidence inventory including hidden source\n        if: always\(\)/);
 assert.match(w,/actions\/upload-artifact@v4\n        if: always\(\)/);
 assert(w.indexOf('Collect finite-process')<w.indexOf('Production guide'));
 assert(w.indexOf('Production guide')<w.indexOf('Evidence inventory'));
 assert(!/collect[^\n]*\|\|\s*true/.test(w));
 assert(!/Production guide matrix and injected data controls\n        if: always/.test(w));
});
test('B6h collector rejects same independent-review missing-record and exit-code counterexamples',()=>{
 mkdirSync('.work/stage3b6g/artifact-controls',{recursive:true});const base=mkdtempSync('.work/stage3b6g/artifact-controls/collection-');
 const r=spawnSync('python3',['tests/stage3b6h-collection.py',path.resolve(base,'fixtures')],{encoding:'utf8',timeout:5000});
 writeFileSync(path.join(base,'stdout.log'),r.stdout??'');writeFileSync(path.join(base,'stderr.log'),r.stderr??'');
 assert.equal(r.status,0,r.stdout+r.stderr);
});
