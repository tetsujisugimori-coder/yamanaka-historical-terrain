import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto,createHash} from 'node:crypto';
import {D0,expectedParts,trialPlacement,trialPoint,verifyD0Bytes} from '../src/west-gate-d0-contract.js';
const asset=new URL('../src/assets/west-gate-left-leaf-d0.glb',import.meta.url);
const ctx={east:-190.456,north:-33.85,angle:.20,ground:548.6599731445312,scale:1};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('accepted D0 bytes and source-node inventory',async()=>{
 const buf=await readFile(asset);
 assert.equal(buf.length,D0.bytes);assert.equal(createHash('sha256').update(buf).digest('hex'),D0.sha256);
 const bytes=buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength);
 assert.equal(await verifyD0Bytes(bytes,webcrypto.subtle),bytes);
 const corrupt=bytes.slice(0);new Uint8Array(corrupt)[40]^=1;
 await assert.rejects(verifyD0Bytes(corrupt,webcrypto.subtle),/SHA-256/);
 await assert.rejects(verifyD0Bytes(bytes.slice(0,8),webcrypto.subtle));
 assert.equal(buf.readUInt32LE(0),0x46546c67);
 const gltf=JSON.parse(buf.subarray(20,20+buf.readUInt32LE(12)).toString());
 assert.deepEqual(gltf.nodes.map(n=>n.name),expectedParts.map(p=>p.id));
 assert.equal(gltf.nodes.filter(n=>n.mesh===0).length,6);
 assert.equal(gltf.nodes.filter(n=>n.mesh===1).length,2);
 assert.ok(gltf.nodes.every(n=>n.extras.basis==='D'&&n.extras.assembly_revision==='D0'));
});
test('reference anchor and width/back direction, scale after rigid transform',()=>{
 for(const scale of [1,2]){
  const p=trialPlacement({...ctx,scale});
  const center=trialPoint(D0.boardCenter,p);
  close(center[0],ctx.east);close(center[1],(ctx.ground+.05)*scale);close(center[2],-ctx.north);
  const tip=trialPoint([1.86,0,-.065],p);
  close(tip[0]-center[0],Math.sin(.2));close(tip[2]-center[2],-Math.cos(.2));
  const back=trialPoint([.86,0,-1.065],p);
  close(back[0]-center[0],-Math.cos(.2));close(back[2]-center[2],-Math.sin(.2));
  close(trialPoint([.86,2.85,-.065],p)[1]-center[1],2.85*scale);
 }
 for(const bad of [{...ctx,scale:0},{...ctx,ground:NaN},{...ctx,east:Infinity},null])assert.throws(()=>trialPlacement(bad));
});
