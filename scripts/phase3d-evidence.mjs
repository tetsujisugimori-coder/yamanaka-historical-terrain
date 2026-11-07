import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export function validateEvidence(r,expected){
 assert.equal(r.head,expected.head,'evidence HEAD mismatch');assert.equal(r.tree,expected.tree,'evidence tree mismatch');
 const keys=[];for(const e of ['chromium','webkit'])for(const w of [375,390,765,1280])for(const m of ['no-preference','reduce'])keys.push(e+'-'+w+'-'+m);
 const rows=r.rows.filter(x=>x.key);assert.equal(rows.length,16,'matrix count');assert.deepEqual([...new Set(rows.map(x=>x.key))].sort(),keys.sort(),'matrix identities');
 assert(r.rows.every(x=>x.status==='PASS'),'non-PASS row');
 for(const [f,h]of Object.entries(expected.hashes))assert.equal(r.hashes[f],h,'source hash '+f);
 for(const row of rows){assert.equal(row.pairs.length,4,'paired views missing');assert(row.browserVersion,'browser version missing');assert(row.metrics?.phase3d.loaded,'model not loaded');}
 assert(r.rows.some(x=>x.kind==='source-stability'&&x.status==='PASS'),'missing source-stability');return true;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const dir=process.argv[2]??'evidence/phase3d/browser',r=JSON.parse(readFileSync(dir+'/results.json'));
 const hashes=Object.fromEntries(Object.keys(r.hashes).map(f=>[f,createHash('sha256').update(readFileSync(f)).digest('hex')]));
 validateEvidence(r,{head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),tree:execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim(),hashes});
 for(const e of ['chromium','webkit'])for(const w of [390,1280])assert(existsSync(dir+'/'+e+'-'+w+'-reduce.png'),'mandatory image absent');console.log('Current HEAD matrix evidence PASS');
}
