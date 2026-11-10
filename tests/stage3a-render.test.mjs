import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(process.env.STAGE3A_RENDER_SOURCE??new URL('../src/main.js',import.meta.url),'utf8');
const highlight=source.split('\n').find(line=>line.startsWith(' function highlightPart('));
test('CAD highlights preserve selection while batched placement avoids an intermediate draw',()=>{
 const materials=[0,1].map(()=>({emissive:{value:null,set(value){this.value=value;}},emissiveIntensity:0}));
 const parts=materials.map((_,i)=>({id:String(i),glb_node:String(i)}));
 const cadPanel={asset:{parts,group:{getObjectByName(name){return{material:materials[Number(name)]};}}}};
 let renders=0;
 const apply=new Function('cadPanel','render',highlight+';return highlightPart;')(cadPanel,()=>renders++);
 apply('0',false);
 assert.equal(renders,0,'syncParts is within a larger scene update; it must not draw halfway through');
 assert.equal(materials[0].emissive.value,0xa83300);assert.equal(materials[0].emissiveIntensity,.55);
 assert.equal(materials[1].emissive.value,0);assert.equal(materials[1].emissiveIntensity,0);
 apply('1');
 assert.equal(renders,1,'direct list/SVG/3D selection still draws immediately');
 assert.equal(materials[0].emissive.value,0);assert.equal(materials[1].emissive.value,0xa83300);
});
test('placement explicitly batches highlights and leaves rendering to its existing caller',()=>{
 const placement=source.slice(source.indexOf(' function syncParts(){'),source.indexOf(" for(const id of ['parts-visible'"));
 assert.match(placement,/highlightPart\(cadPanel\.selected,false\)/);
});
