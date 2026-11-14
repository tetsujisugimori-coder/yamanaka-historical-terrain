import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {overviewDestination,overviewPresentation} from '../src/overview-destinations.js';
const data=JSON.parse(fs.readFileSync('public/data/castle-overview.json'));
const metadata=['nishinomaru','landscape','phase3b','phase3c','phase3d'].flatMap(n=>{const d=JSON.parse(fs.readFileSync(`public/data/${n}.json`));return d.elements??d.facilities??[];});
test('all 22 overview destinations have existing metadata and no invented fallback',()=>{assert.equal(data.models.length,22);for(const m of data.models){assert.ok(overviewDestination(m.featureId));assert.ok(metadata.some(f=>f.id===m.featureId),m.featureId);}for(const bad of [null,undefined,'','nm-unknown','dc-unknown'])assert.equal(overviewDestination(bad),null);});
test('lazy inner/connected destinations exist before asset acquisition',()=>{for(const m of data.models){if(m.featureId.startsWith('ic-'))assert.equal(overviewDestination(m.featureId),'inner');if(m.featureId.startsWith('dc-'))assert.equal(overviewDestination(m.featureId),'connected');}});

test('detail explicitly selects inferred C or creative C+D, never current A',()=>{for(const m of data.models){const f=metadata.find(x=>x.id===m.featureId);assert.deepEqual(overviewPresentation(f),{variant:'restored',drama:f.category==='D'});}assert.equal(overviewPresentation({id:'unknown',category:'D'}),null);assert.equal(overviewPresentation(null),null);});
