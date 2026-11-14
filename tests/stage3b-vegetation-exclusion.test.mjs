import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {landscapeModel} from '../src/landscape.js';
// Independent raw-file fixture: verifies why four batches, not any hidden mesh,
// are covered by the pre-existing docs/phase3b.md exclusion contract.
test('saved vegetation GLB batches retain four overlap and four non-overlap groups',async()=>{
 const bytes=readFileSync('public/data/landscape.glb'),bounds=JSON.parse(readFileSync('public/data/phase3b.json')).bounds;
 assert.deepEqual(bounds,[-205,-55,-80,55]);
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const group=landscapeModel(gltf,bounds);const batches=group.children.filter(m=>m.userData.elementId==='sc-vegetation');
 assert.equal(batches.length,8);
 assert.deepEqual(batches.filter(m=>m.userData.westernOverlap).map(m=>m.geometry.attributes.position.count).sort((a,b)=>a-b),[84,210,252,546]);
 assert.deepEqual(batches.filter(m=>!m.userData.westernOverlap).map(m=>m.geometry.attributes.position.count).sort((a,b)=>a-b),[504,546,672,1722]);
 group.traverse(m=>{if(m.isMesh){m.geometry.dispose();m.material.dispose();}});
});
