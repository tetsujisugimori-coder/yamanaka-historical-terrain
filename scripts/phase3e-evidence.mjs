import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';import {pathToFileURL} from 'node:url';
export function validateExplorationEvidence(report,expected){
 assert.equal(report.head,expected.head,'stale HEAD');assert.equal(report.tree,expected.tree,'stale tree');assert.deepEqual(report.hashes,expected.hashes,'source hashes');assert.deepEqual(report.finalHashes,report.hashes,'source changed during run');
 assert.equal(report.rows.length,16,'missing conditions');const keys=new Set();
 for(const engine of ['chromium','webkit'])for(const width of [375,390,765,1280])for(const motion of ['no-preference','reduce']){
  const key=`${engine}-${width}-${motion}`,rows=report.rows.filter(r=>r.key===key);assert.equal(rows.length,1,'duplicate or missing row');const r=rows[0];keys.add(key);assert.equal(r.status,'PASS');assert.equal(r.errors.length,0);assert.equal(r.checks.length,8);assert.equal(new Set(r.checks).size,8);assert.equal(new Set(r.guide.map(x=>x.id)).size,8);assert.ok(r.version);assert.match(r.pngSha256,/^[a-f0-9]{64}$/);
  assert.equal(r.final.phase3e.active,true);assert.ok(r.final.phase3e.obstacleCount>0);assert.ok(Number.isFinite(r.final.phase3e.support.height));assert.ok(Math.abs(r.final.camera[1]-r.final.phase3e.support.height-1.7)<1e-6,'eye does not match actual support');assert.ok(r.performance.frames.length>=8,'missing delivered motion');assert.ok(r.performance.frames.every(x=>Number.isFinite(x)&&x>0));
 }
 assert.equal(keys.size,16);return true;
}
if(import.meta.url===pathToFileURL(process.argv[1]??'').href){
 const dir=process.argv[2]??'evidence/phase3e/browser',r=JSON.parse(await readFile(dir+'/results.json','utf8'));
 const hash=async f=>createHash('sha256').update(await readFile(f)).digest('hex');
 const expected={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),tree:execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim(),hashes:Object.fromEntries(await Promise.all(Object.keys(r.hashes).map(async f=>[f,await hash(f)])))};
 validateExplorationEvidence(r,expected);for(const row of r.rows)assert.equal(await hash(dir+'/'+row.key+'.png'),row.pngSha256,'PNG missing or altered');console.log('16 complete conditions and actual source/PNG hashes verified');
}
