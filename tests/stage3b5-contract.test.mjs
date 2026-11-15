import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {validateInferredRegions,validateInferredPolygon,INFERRED_REGION_NAMES} from '../src/inferred-regions-contract.js';
import {syntheticFixture} from './stage3b5-fixture.mjs';
const clone=x=>structuredClone(x),real=JSON.parse(fs.readFileSync(new URL('../research/stage3b5/ledger.json',import.meta.url)));
const check=x=>validateInferredRegions(x,{allowSynthetic:true});
test('B5 actual research: 11 individually unplaced; no borrowed geometry',()=>{assert.equal(validateInferredRegions(real),real);assert.equal(real.regions.filter(r=>r.status==='ACCEPTED_C').length,0);assert.deepEqual(real.regions.map(r=>r.regionId),Object.keys(INFERRED_REGION_NAMES));assert.ok(real.regions.every(r=>r.geometry===null&&r.geometryBasis===null));});
test('B5 source records retain exact byte hashes',()=>{for(const s of real.sources){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL('../'+s.recordPath,import.meta.url))).digest('hex'),s.recordSha256,s.id);}});
test('B5 deployed JSON matches research ledger exact bytes',()=>{assert.ok(fs.readFileSync(new URL('../research/stage3b5/ledger.json',import.meta.url)).equals(fs.readFileSync(new URL('../public/data/inferred-regions.json',import.meta.url))));});
test('B5 accepted synthetic shape only through explicit harness option',()=>{assert.throws(()=>validateInferredRegions(syntheticFixture),/synthetic/);assert.equal(check(syntheticFixture),syntheticFixture);});
test('B5 validator does not mutate input or previous sources',()=>{const before=JSON.stringify(syntheticFixture);check(syntheticFixture);assert.equal(JSON.stringify(syntheticFixture),before);});
const cases=[
 ['schema',d=>d.schemaVersion=2,/schema/],
 ['data kind',d=>d.dataKind='UNSPECIFIED',/data kind/],
 ['CRS',d=>d.crs='EPSG:4326',/coordinate/],
 ['unit',d=>d.unit='mm',/coordinate/],
 ['axis',d=>d.axisOrder='N,E',/coordinate/],
 ['default on',d=>d.defaultVisible=true,/display/],
 ['offset changed',d=>d.displayOffsetMetres=0,/display/],
 ['offset explanation',d=>d.displayOffsetMeaning='',/display/],
 ['stage promotion',d=>d.stage3B='PASS',/stage/],
 ['missing sources',d=>d.sources=[],/sources/],
 ['source duplicate',d=>d.sources.push(clone(d.sources[0])),/source identity/],
 ['source URL',d=>d.sources[0].url='javascript:alert(1)',/source provenance/],
 ['source hash',d=>d.sources[0].recordSha256='UNKNOWN',/source provenance/],
 ['source path',d=>delete d.sources[0].recordPath,/source provenance/],
 ['missing region',d=>d.regions.pop(),/region set/],
 ['extra region',d=>d.regions.push(clone(d.regions[0])),/region set/],
 ['unknown region',d=>d.regions[0].regionId='unknown',/region identity/],
 ['duplicate region',d=>d.regions[1]=clone(d.regions[0]),/region identity/],
 ['name mismatch',d=>d.regions[0].name='西櫓',/region identity/],
 ['duplicate candidate',d=>d.regions[1].candidateId=d.regions[0].candidateId,/candidate identity/],
 ['missing candidate',d=>d.regions[0].candidateId='',/candidate identity/],
 ['evidence promoted',d=>d.regions[0].evidenceCategory='B',/historical/],
 ['historical promoted',d=>d.regions[0].historicalPosition='CONFIRMED',/historical/],
 ['false zero precision',d=>d.regions[0].precision.metres=0,/precision/],
 ['invented precision radius',d=>d.regions[0].precision.metres=20,/precision/],
 ['precision status',d=>d.regions[0].precision.status='VERIFIED',/precision/],
 ['transform promoted',d=>d.regions[0].transformStatus='PASS',/transformation/],
 ['residual zero',d=>d.regions[0].residualMetres=0,/precision/],
 ['no ref',d=>d.regions[0].sourceRefs=[],/source reference/],
 ['foreign source',d=>d.regions[0].sourceRefs[0].id='elsewhere',/source reference/],
 ['missing locator',d=>d.regions[0].sourceRefs[0].locator='',/source reference/],
 ['missing direct statement',d=>d.regions[0].directStatement='',/reasoning/],
 ['missing inference',d=>d.regions[0].inferenceProcedure='',/reasoning/],
 ['missing reason',d=>d.regions[0].decisionReason='',/reasoning/],
 ['missing limitation',d=>d.regions[0].limitations=[],/reasoning/],
 ['missing statement basis',d=>d.regions[0].statementBasis='',/reasoning/],
 ['invalid status',d=>d.regions[0].status='CONFIRMED',/candidate status/],
 ['unplaced borrowed geometry',d=>d.regions[0].status='UNPLACED',/unplaced geometry/],
 ['unplaced invented procedure',d=>d.regions[1].geometryBasis=clone(d.regions[0].geometryBasis),/unplaced geometry/],
 ['accepted no geometry',d=>d.regions[0].geometry=null,/Polygon/],
 ['accepted no method',d=>d.regions[0].geometryBasis.method='',/geometry procedure/],
 ['accepted no steps',d=>d.regions[0].geometryBasis.steps=[],/geometry procedure/],
 ['accepted foreign coordinate ref',d=>d.regions[0].geometryBasis.coordinateSourceRef='unknown',/geometry procedure/],
 ['coordinate ref not in candidate evidence',d=>d.regions[0].geometryBasis.coordinateSourceRef='b4-custody-ledger',/geometry procedure/],
];
for(const [name,mutate,reason] of cases)test(`B5 negative ${name}`,()=>{const d=clone(syntheticFixture);assert.doesNotThrow(()=>check(d));mutate(d);assert.throws(()=>check(d),reason);});
const origin=[44862.121277226666,-93478.07235405142];
const poly=points=>({type:'Polygon',coordinates:[points.map(p=>[p[0]+origin[0],p[1]+origin[1]])]});
for(const [name,points,reason] of [
 ['open',[[0,0],[20,0],[20,20],[0,20]],/not closed/],
 ['collinear',[[0,0],[10,0],[20,0],[0,0]],/degenerate/],
 ['duplicate',[[0,0],[20,0],[20,20],[20,0],[0,0]],/duplicate/],
 ['crossing',[[0,0],[20,20],[0,20],[30,0],[0,0]],/intersecting/],
 ['adjacent reversal',[[0,0],[20,0],[10,0],[10,20],[0,20],[0,0]],/intersecting|overlapping/],
 ['nonfinite',[[0,0],[Infinity,0],[20,20],[0,0]],/coordinate/],
 ['outside',[[0,0],[20000,0],[20,20],[0,0]],/coordinate/],
])test(`B5 polygon ${name}`,()=>assert.throws(()=>validateInferredPolygon(poly(points)),reason));
test('B5 polygon rejects holes, point geometry and nonnumeric coordinates',()=>{assert.throws(()=>validateInferredPolygon({type:'Polygon',coordinates:[syntheticFixture.regions[0].geometry.coordinates[0],syntheticFixture.regions[0].geometry.coordinates[0]]}),/single/);assert.throws(()=>validateInferredPolygon({type:'Point',coordinates:origin}),/single/);const g=clone(syntheticFixture.regions[0].geometry);g.coordinates[0][1][0]='44882';assert.throws(()=>validateInferredPolygon(g),/coordinate/);});
test('B5 clockwise and counterclockwise synthetic normal polygon accepted',()=>{const g=clone(syntheticFixture.regions[0].geometry);assert.doesNotThrow(()=>validateInferredPolygon(g));g.coordinates[0].reverse();assert.doesNotThrow(()=>validateInferredPolygon(g));});

test('B5 B4 locators resolve exact existing project/material records',()=>{
 const b4=JSON.parse(fs.readFileSync(new URL('../research/stage3b4/ledger.json',import.meta.url)));
 for(const region of real.regions) for(const ref of region.sourceRefs.filter(r=>r.id==='b4-custody-ledger')){
  assert.equal(ref.locator,'projects[id=survey-1972|survey-2012]; materials[id=target-1972|target-2012].facts; materials[id=target-1972|target-2012].rights');
  for(const year of [1972,2012]){
   assert.equal(b4.projects.find(p=>p.id===`survey-${year}`).status,'RECORDED');
   const m=b4.materials.find(m=>m.id===`target-${year}`);
   assert.equal(m.projectId,`survey-${year}`);
   assert.ok(Object.values(m.facts).every(f=>f.status==='UNKNOWN'));
   assert.ok(Object.values(m.rights).every(r=>r.status==='UNKNOWN'));
  }
 }
});
