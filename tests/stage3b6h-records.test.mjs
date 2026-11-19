import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,mkdtempSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
test('B6h recording failures never become process PASS', {timeout:15000,skip:process.platform!=='linux'},()=>{
 mkdirSync('.work/stage3b6g',{recursive:true});const base=mkdtempSync('.work/stage3b6g/b6h-');
 const started=Date.now(),r=spawnSync('python3',['tests/stage3b6h-records.py',path.resolve(base,'results')],{encoding:'utf8',timeout:12000});
 writeFileSync(path.join(base,'outer-node-stdout.log'),r.stdout??'');writeFileSync(path.join(base,'outer-node-stderr.log'),r.stderr??'');
 writeFileSync(path.join(base,'outer-node-result.json'),JSON.stringify({startedAt:started,endedAt:Date.now(),exitCode:r.status,errorCode:r.error?.code??null,descendantAudit:r.error?'UNKNOWN':'SEE_CASE_RECORDS'}));
 assert.equal(r.status,0,r.stdout+r.stderr);
});
