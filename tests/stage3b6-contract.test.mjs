import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateHistoricalGuide} from '../src/historical-guide-contract.js';

const clone=value=>structuredClone(value);
const canonical=JSON.parse(fs.readFileSync(new URL('../public/data/castle-overview.json',import.meta.url)));
// Synthetic relationship test only: literal expectations are not derived by the product validator.
// This does not establish that the plan authenticates a model or its historical position.
const relation={id:'synthetic-b6-nm',regionId:'nishinomaru',modelId:'nm-bailey',sourceRef:{id:'plan-2023',locator:'printed p.66 表3-7'},relationType:'thematic',relationEvidence:'Synthetic contract fixture: thematic comparison only, not historical placement.',verificationStatus:'UNVERIFIED',limitations:['位置対応はUNKNOWN。合成試験の関連であり、史実認定ではない。']};
const fixture=()=>({schemaVersion:1,relations:[clone(relation)]});
const check=(d,overview=canonical)=>validateHistoricalGuide(d,overview);

test('B6 canonical baseline contains the fixed 11 regions and 22 existing models',()=>{
 assert.deepEqual(canonical.regions.map(r=>r.id),['honmaru','ninomaru','kitanomaru','nishinomaru','motonishi-yagura','nishi-yagura','sannomaru','daizaki','minami-yagura','raoshiba','nishikido']);
 assert.equal(canonical.models.length,22);
 assert.ok(canonical.regions.every(r=>r.geometry===null&&r.certainty==='unplaced'));
 assert.equal(canonical.models.find(m=>m.id==='nm-bailey').historicalPosition,'UNKNOWN');
});
test('B6 accepts explicitly unverified thematic relation without authenticating history',()=>assert.doesNotThrow(()=>check(fixture())));
test('B6 empty relation result is valid, not a missing record error',()=>assert.doesNotThrow(()=>check({schemaVersion:1,relations:[]})));
test('B6 supports distinct many-to-many thematic associations',()=>{
 const d=fixture();
 d.relations.push({...clone(relation),id:'synthetic-b6-nm-moat',modelId:'nm-moat'});
 d.relations.push({...clone(relation),id:'synthetic-b6-second-region',regionId:'nishi-yagura'});
 assert.doesNotThrow(()=>check(d));
});
test('B6 does not mutate relationship input or canonical source while checking',()=>{
 const d=fixture(),o=clone(canonical),before=JSON.stringify({d,o});check(d,o);assert.equal(JSON.stringify({d,o}),before);
});

const faults=[
 ['wrong schema',d=>d.schemaVersion=2,/schema/i],
 ['missing relations',d=>delete d.relations,/relation|関連/i],
 ['unknown region ID',d=>d.relations[0].regionId='not-a-region',/region|区域/i],
 ['nonexistent model ID',d=>d.relations[0].modelId='not-a-model',/model|模型/i],
 ['duplicate relation ID',d=>d.relations.push({...clone(relation),modelId:'nm-moat'}),/duplicate|重複|identity|ID/i],
 ['missing relation ID',d=>delete d.relations[0].id,/identity|ID|id/],
 ['missing source reference',d=>delete d.relations[0].sourceRef,/source|資料|reference/i],
 ['foreign source reference',d=>d.relations[0].sourceRef.id='unregistered-source',/source|資料|reference/i],
 ['missing source locator',d=>d.relations[0].sourceRef.locator='',/source|資料|reference|locator/i],
 ['missing relationship evidence',d=>delete d.relations[0].relationEvidence,/evidence|根拠/i],
 ['blank relationship evidence',d=>d.relations[0].relationEvidence='  ',/evidence|根拠/i],
 ['unjustified CONFIRMED promotion',d=>d.relations[0].verificationStatus='CONFIRMED',/status|verification|promotion|確証/i],
 ['empty status is not UNKNOWN',d=>d.relations[0].verificationStatus='',/status|verification|promotion|確証/i],
 ['unsupported relation type',d=>d.relations[0].relationType='historically-proven-location',/type|relation|関連/i],
 ['missing limitations',d=>d.relations[0].limitations=[],/limitation|制約/i],
 ['blank limitation',d=>d.relations[0].limitations=[' '],/limitation|制約/i],
 ['invented relationship geometry',d=>d.relations[0].geometry={type:'Point',coordinates:[44862,-93478]},/geometry|coordinate|配置|field/i],
];
for(const [name,mutate,reason] of faults)test(`B6 semantic negative: ${name}`,()=>{
 const d=fixture();assert.doesNotThrow(()=>check(d));mutate(d);assert.throws(()=>check(d),reason);
});
test('B6 rejects invented geometry in canonical unplaced region',()=>{
 const o=clone(canonical);o.regions.find(r=>r.id==='nishinomaru').geometry={type:'Point',coordinates:[44862,-93478]};
 assert.throws(()=>check(fixture(),o),/geometry|coordinate|配置|certainty/i);
});
test('B6 rejects missing canonical source rather than accepting a dangling source ID',()=>{
 const o=clone(canonical);o.sources=[];assert.throws(()=>check(fixture(),o),/source|資料|reference|provenance/i);
});

test('B6 actual adapter rejects duplicate pair and unjustified canonical promotion',async()=>{
 const {adaptHistoricalRelations}=await import('../src/historical-guide-contract.js');
 const d=JSON.parse(fs.readFileSync(new URL('../public/data/castle-overview.json',import.meta.url)));
 assert.equal(adaptHistoricalRelations(d).relations.length,1);
 const duplicate=structuredClone(d);duplicate.regionModelRelations.push(structuredClone(duplicate.regionModelRelations[0]));assert.throws(()=>adaptHistoricalRelations(duplicate),/duplicate/);
 const promoted=structuredClone(d);promoted.regions[0].certainty='confirmed';promoted.regions[0].geometry={type:'Point',coordinates:[44862,-93478]};assert.throws(()=>adaptHistoricalRelations(promoted),/geometry/);
});
