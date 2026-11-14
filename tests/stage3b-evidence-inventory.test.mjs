import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readdir,readFile} from 'node:fs/promises';
import {inventoryEvidence} from '../scripts/stage3b-evidence-inventory.mjs';
test('fixed CI oracle directory counterexample: old collector RED and recursive collector GREEN',async()=>{
 await mkdir('.cache/stage3b-inventory-tests',{recursive:true});
 const root=await mkdtemp('.cache/stage3b-inventory-tests/fixture-');
 await mkdir(root+'/oracle');await writeFile(root+'/oracle/raw.json','{}');await writeFile(root+'/results.json','[]');
 // Old code attempts readFile on every top-level name, reproducing the CI failure.
 await assert.rejects(async()=>{for(const f of await readdir(root))await readFile(root+'/'+f);},{code:'EISDIR'});
 const actual=await inventoryEvidence(root);
 assert.deepEqual(actual.map(x=>x.filename),['oracle/raw.json','results.json']);
 assert.deepEqual(actual.map(x=>[x.size,x.sha256]),[[2,'44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a'],[2,'4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945']]);
});
