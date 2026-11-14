import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {inspect} from '../scripts/stage3b2-evidence.mjs';
const ledger=JSON.parse(readFileSync('research/stage3b2/ledger.json')),sources=JSON.parse(readFileSync('research/stage3b2/sources.json'));
test('real ledger stays unplaced, residual UNKNOWN not zero',()=>assert.equal(inspect(ledger,sources).placed,0));
for(const [name,mutate,reason] of [
 ['missing source',(l,s)=>s.splice(0,1),/source missing/],['CRS mismatch',l=>l.crs='EPSG:4326',/CRS/],['origin altered',l=>l.origin[0]++,/origin/],
 ['invented region',l=>l.regions[0].id='new-region',/scope/],['fabricated fit',l=>l.regions[0].acceptedFitCount=3,/accepted control/],
 ['unassessed warp placement',l=>{l.regions[0].status='placed';l.regions[0].geometry={type:'Point',coordinates:[1,2]};},/unproven placement/],
 ['zero residual substitution',l=>l.regions[0].fitRmseMetres=0,/invented residual/],['missing point lineage',l=>l.regions[0].controlPointIds=['absent'],/control provenance/],
 ['name-only accepted control',l=>l.controlPoints[0].accepted=true,/control identity/],['source coordinate fabrication',l=>l.controlPoints[0].sourceCoordinates=[1,2],/control identity/],
 ['invented distortion certainty',l=>l.regions[0].distortion='PASS',/certainty/],['duplicate source',(_l,s)=>s.push(s[0]),/duplicate source/]])test(name,()=>{const l=structuredClone(ledger),s=structuredClone(sources);mutate(l,s);assert.throws(()=>inspect(l,s),reason);});
