/** Regression fixtures retain their source generation; raw GLB is the oracle.
 * No product interpolation, metadata-merging, or section functions are imported.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {oracle,verifyProfile} from './section-oracle.mjs';
const historical=JSON.parse(readFileSync('evidence/sections/submission/normal.json'));
const current=JSON.parse(readFileSync('public/data/phase3f.json'));
const queries={old:oracle('public/data/nishinomaru.glb'),current:oracle('public/data/phase3f.glb')};
for(const id of ['moat','rampart'])test(`Phase3F ${id}: bind old and current fixtures to their own raw triangles`,t=>{
 const section=current.sections.find(x=>x.id===id);
 const old=historical.results.find(x=>x.id===id&&x.snapshot)?.snapshot.section.data.C;
 const next={length:section.samples.at(-1).distance,segments:section.samples.slice(1).map((p,i)=>({from:section.samples[i].distance,to:p.distance,h0:section.samples[i].height,h1:p.height}))};
 const results={old:verifyProfile(old,section.start,section.end,queries.old),current:verifyProfile(next,section.start,section.end,queries.current)};
 assert.throws(()=>verifyProfile(old,section.start,section.end,queries.current),/Surface height mismatch/,'stale C evidence must not validate the new physical terrain');
 for(const [key,profile] of [['old',old],['current',next]]){
  const shifted=structuredClone(profile);for(const p of shifted.segments){p.h0+=.1;p.h1+=.1;}
  assert.throws(()=>verifyProfile(shifted,section.start,section.end,queries[key]),/Surface height mismatch/,`${key} +0.1m corruption must be rejected`);
 }
 t.diagnostic(JSON.stringify({id,...results,crossGenerationRejected:true,bothHeightMutationsRejected:true}));
});
test('Phase3F preserved facility metadata remains bound to the original Nishinomaru GLB',t=>{
 const facilities=JSON.parse(readFileSync('public/data/nishinomaru.json')).facilities;
 for(const f of facilities){const ground=queries.old(...f.local);assert.notEqual(ground,null);assert.ok(Math.abs(ground-f.height)<.001,f.id);assert.ok(Math.abs(ground-(f.height+.1))>.001,`${f.id} corruption`);}
 const rampart=facilities.find(x=>x.id==='nm-rampart');assert.ok(Math.abs(queries.current(...rampart.local)-rampart.height)>.001,'new rampart must not be checked against old height');
 t.diagnostic(JSON.stringify({preservedMetadataChecks:facilities.length,metadataMutationRejections:facilities.length}));
});

test('Section oracle rejects non-finite and degenerate evidence instead of returning a NaN success',()=>{
 const base={length:1,segments:[{from:0,to:1,h0:2,h1:3}]};
 assert.deepEqual(verifyProfile(base,[0,0],[1,0],e=>2+e),{count:3,maxError:0});
 for(const field of ['from','to','h0','h1'])for(const value of [NaN,Infinity,-Infinity]){const bad=structuredClone(base);bad.segments[0][field]=value;assert.throws(()=>verifyProfile(bad,[0,0],[1,0],e=>2+e),/Invalid finite section segment/,`${field} ${value}`);}
 for(const value of [NaN,Infinity,-Infinity,0])assert.throws(()=>verifyProfile({...base,length:value},[0,0],[1,0],e=>2+e),/Invalid finite profile/);
 for(const to of [0,-1]){const bad=structuredClone(base);bad.segments[0].to=to;assert.throws(()=>verifyProfile(bad,[0,0],[1,0],e=>2+e),/Invalid finite section segment/);}
 for(const value of [NaN,Infinity,-Infinity,undefined])assert.throws(()=>verifyProfile(base,[0,0],[1,0],()=>value),/Non-finite section height/);
 assert.throws(()=>verifyProfile({...base,segments:[]},[0,0],[1,0],e=>2+e),/No section coverage/);
 assert.throws(()=>verifyProfile(base,[NaN,0],[1,0],e=>2+e),/Invalid finite section coordinates/);
});
