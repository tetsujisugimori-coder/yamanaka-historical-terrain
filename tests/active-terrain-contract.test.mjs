import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {activeTerrainContract,ACTIVE_TERRAIN} from '../scripts/active-terrain-contract.mjs';
test('active terrain contract pins displayed H mesh and metadata',()=>{assert.equal(ACTIVE_TERRAIN.stem,'phase3h');});
test('stale or ambiguous metadata contract rejects instead of false success',()=>{
 const source=readFileSync('src/main.js','utf8');
 assert.throws(()=>activeTerrainContract(source.replace("'data/phase3h.json'","'data/phase3g.json'")),/mismatch/);
 assert.throws(()=>activeTerrainContract(source.replace("async function getModel", "async function changedModel")),/uniquely/);
});

test('metadata string decoy cannot hide stale actual load',()=>{const source=readFileSync('src/main.js','utf8').replace("'data/phase3h.json'","'data/phase3g.json'")+"\n// 'data/phase3h.json'";assert.throws(()=>activeTerrainContract(source),/mismatch/);});

test('same comment-decoy input reproduces draft RED and repaired GREEN',async()=>{
 const {activeTerrainContract:before}=await import('../evidence/phase3h/recovery-20261108/contract-before-review.mjs');
 const input=readFileSync('src/main.js','utf8').replace("'data/phase3h.json'","'data/phase3g.json'")+"\n// 'data/phase3h.json'";
 assert.equal(before(input).stem,'phase3h','preserved draft erroneously accepts this input');
 assert.throws(()=>activeTerrainContract(input),/mismatch/);
});
test('stale G triangle oracle fails unchanged 1mm comparison against H',async()=>{
 const {oracle}=await import('./section-oracle.mjs');
 const g=oracle('public/data/phase3g.glb')(-39,-10),h=oracle(ACTIVE_TERRAIN.glb)(-39,-10);
 assert.ok(Math.abs(g-h)>.001);assert.equal(Math.abs(g-h),0.03680419921875);
});

test('model selector and actual mapped request cannot diverge silently',()=>{const source=readFileSync('src/main.js','utf8');assert.throws(()=>activeTerrainContract(source.replace("const file=view==='reconstruction'","const file=view==='regional'")),/mismatch/);assert.throws(()=>activeTerrainContract(source.replace("map(path=>json(assetPath(path)))","map(path=>json(assetPath('data/phase3g.json')))")),/mismatch/);});
