import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,mkdtempSync,writeFileSync,readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
test('B6k eight evidence states and failed evidence rejection',{timeout:15000,skip:process.platform!=='linux'},()=>{
 mkdirSync('.work/stage3b6g/b6k-evidence',{recursive:true});
 const out=mkdtempSync('.work/stage3b6g/b6k-evidence/run-');
 const p=spawnSync('python3',['tests/stage3b6k-evidence.py',path.resolve(out,'results')],{encoding:'utf8',timeout:10000});
 writeFileSync(path.join(out,'stdout.log'),p.stdout??'');writeFileSync(path.join(out,'stderr.log'),p.stderr??'');
 writeFileSync(path.join(out,'execution.json'),JSON.stringify({exit:p.status,signal:p.signal,error:p.error?.code??null}));
 const seal=spawnSync('python3',['scripts/stage3b6h-artifacts.py','seal',path.resolve(out)],{encoding:'utf8',timeout:5000});
 assert.equal(seal.status,0,seal.stderr);
 assert.equal(p.status,0,p.stdout+p.stderr);
 const rows=JSON.parse(readFileSync(path.join(out,'results/assertions.json'),'utf8'));
 assert.equal(rows.length,12);assert(rows.every(x=>x.status==='PASS'));
});
