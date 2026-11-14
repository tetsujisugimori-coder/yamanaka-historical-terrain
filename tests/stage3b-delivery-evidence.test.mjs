import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {deliveryPath,preserveEntity,digest} from '../scripts/stage3b-delivery-evidence.mjs';
test('HTTP evidence preserves actual bytes and independently available build bytes',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'yamanaka-http-evidence-'));const dist=path.join(root,'dist'),out=path.join(root,'proof');await mkdir(dist);await writeFile(path.join(dist,'index.html'),'original');
 const a=await preserveEntity({body:Buffer.from('original'),url:'http://localhost/',status:200,headers:{},base:'http://localhost',out,dist});
 assert.equal(a.matchesBuild,true);assert.equal(digest(await readFile(path.join(out,a.rawFile))),a.sha256);assert.equal((await readFile(path.join(out,a.buildFile))).toString(),'original');
 const b=await preserveEntity({body:Buffer.from('tampered'),url:'http://localhost/',status:200,headers:{},base:'http://localhost',out,dist});assert.equal(b.matchesBuild,false);assert.notEqual(a.rawFile,b.rawFile);assert.equal((await readFile(path.join(out,a.rawFile))).toString(),'original');
});
test('delivery filter excludes unrelated origins and binary meshes',()=>{assert.equal(deliveryPath('http://other/a.js','http://localhost'),null);assert.equal(deliveryPath('http://localhost/model.glb','http://localhost'),null);assert.equal(deliveryPath('http://localhost/assets/a.js?v=1','http://localhost'),'assets/a.js');});
