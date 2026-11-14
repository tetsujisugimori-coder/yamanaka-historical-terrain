import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {inspect,inspectArtifacts} from '../scripts/stage3b2-evidence.mjs';
const ledger=JSON.parse(readFileSync('research/stage3b2/ledger.json')),sources=JSON.parse(readFileSync('research/stage3b2/sources.json'));
test('real ledger stays unplaced, residual UNKNOWN not zero',()=>assert.equal(inspect(ledger,sources).placed,0));
for(const [name,mutate,reason] of [
 ['missing source',(l,s)=>s.splice(0,1),/source missing/],['CRS mismatch',l=>l.crs='EPSG:4326',/CRS/],['origin altered',l=>l.origin[0]++,/origin/],
 ['invented region',l=>l.regions[0].id='new-region',/scope/],['fabricated fit',l=>l.regions[0].acceptedFitCount=3,/accepted control/],
 ['unassessed warp placement',l=>{l.regions[0].status='placed';l.regions[0].geometry={type:'Point',coordinates:[1,2]};},/unproven placement/],
 ['zero residual substitution',l=>l.regions[0].fitRmseMetres=0,/invented residual/],['missing point lineage',l=>l.regions[0].controlPointIds=['absent'],/control provenance/],
 ['name-only accepted control',l=>l.controlPoints[0].accepted=true,/control identity/],['source coordinate fabrication',l=>l.controlPoints[0].sourceCoordinates=[1,2],/control identity/],
 ['invented distortion certainty',l=>l.regions[0].distortion='PASS',/certainty/],['duplicate source',(_l,s)=>s.push(s[0]),/duplicate source/]])test(name,()=>{const l=structuredClone(ledger),s=structuredClone(sources);mutate(l,s);assert.throws(()=>inspect(l,s),reason);});

for(const [name,mutate,reason] of [['all provenance removed',(l,s)=>{s.length=0;l.controlPoints=[];for(const r of l.regions){r.sourceIds=[];r.controlPointIds=[];}},/control set|source/],['vertical swap',l=>l.vertical='WGS84 ellipsoidal feet',/vertical/],['axis reversal',l=>l.webAxes='x=N,y=E,z=H',/axes/],['false baseline',l=>l.baseline='0'.repeat(40),/baseline/]])test(name,()=>{const l=structuredClone(ledger),s=structuredClone(sources);mutate(l,s);assert.throws(()=>inspect(l,s),reason);});

const gis=JSON.parse(readFileSync('research/stage3b2/unplaced.geojson')),differences=JSON.parse(readFileSync('research/stage3b2/model-differences.json')),models=JSON.parse(readFileSync('public/data/castle-overview.json')).models;
test('artifact normal matches actual 22 models and two region identities',()=>assert.equal(inspectArtifacts(ledger,gis,differences,models).status,'PASS'));
for(const [name,mutate,reason] of [['GIS invented ID',g=>g.features[0].id='invented',/GIS identity/],['GIS fabricated geometry',g=>g.features[0].geometry={type:'Point',coordinates:[1,2]},/GIS unplaced/],['GIS status promotion',g=>g.features[0].properties.status='placed',/GIS unplaced/],['model hash swap',(_g,d)=>d[0].sha256='0'.repeat(64),/model difference/],['model zero distance',(_g,d)=>d[0].historicalDistanceMetres=0,/model difference/],['duplicate model',(_g,d)=>d[0]=d[1],/model set/]])test(name,()=>{const g=structuredClone(gis),d=structuredClone(differences);mutate(g,d);assert.throws(()=>inspectArtifacts(ledger,g,d,models),reason);});
