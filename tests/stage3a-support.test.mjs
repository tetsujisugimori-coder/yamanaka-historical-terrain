import test from 'node:test';
import assert from 'node:assert/strict';
import {BufferGeometry,Float32BufferAttribute,Mesh,MeshBasicMaterial,DoubleSide,FrontSide,Group} from 'three';
import {createCadSupportCache} from '../src/cad-support.js';
import {triangleSampler} from '../src/library-parts.js';
function surface(y=0){
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute([-30,y,-10,-10,y,-10,-30,y,10,-10,y,10],3));g.setIndex([0,2,1,1,2,3]);
 return new Mesh(g,new MeshBasicMaterial({side:DoubleSide}));
}
test('indexed sampler uses highest real displayed triangle and reuses unchanged snapshot',()=>{
 const low=surface(2),high=surface(5),cache=createCadSupportCache(),meshes=[low,high],sample=cache.get(meshes);
 for(const [x,z]of [[-20,0],[-24,3],[-11,-9]]){
  const expected=triangleSampler(meshes)(x,z),actual=sample(x,z);assert.ok(Math.abs(actual.height-expected.height)<1e-10);assert.equal(actual.slope,expected.slope);assert.ok(Number.isInteger(actual.face));
 }
 assert.equal(sample(-40,0),null);assert.equal(cache.get(meshes),sample);assert.equal(cache.diagnostics().builds,1);assert.equal(cache.diagnostics().hits,1);
});
test('matrix/exaggeration, collection, position/index versions and identity invalidate',()=>{
 const m=surface(2),parent=new Group();parent.add(m);const c=createCadSupportCache();let old=c.get([m]);
 parent.scale.y=2;let next=c.get([m]);assert.notEqual(next,old);assert.equal(next(-20,0).height,4);old=next;
 m.geometry.attributes.position.setY(0,8);m.geometry.attributes.position.needsUpdate=true;next=c.get([m]);assert.notEqual(next,old);old=next;
 m.geometry.index.needsUpdate=true;next=c.get([m]);assert.notEqual(next,old);old=next;
 m.geometry.setIndex([0,2,1]);next=c.get([m]);assert.notEqual(next,old);old=next;
 m.geometry=m.geometry.clone();next=c.get([m]);assert.notEqual(next,old);old=next;
 next=c.get([m,surface(9)]);assert.notEqual(next,old);assert.equal(next(-20,0).height,9);
 c.clear();assert.notEqual(c.get([m,surface(9)]),next);
});
test('outside clipped index and non-DoubleSide/drawRange semantics fall back to ray',()=>{
 const m=surface(4);m.position.x=100;const c=createCadSupportCache(),s=c.get([m]);assert.equal(s(80,0).height,4);assert.equal(c.diagnostics().fallbackQueries,1);
 m.material.side=FrontSide;const t=c.get([m]);assert.equal(c.diagnostics().mode,'ray-fallback');assert.deepEqual(t(80,0),triangleSampler([m])(80,0));
 m.material.side=DoubleSide;m.geometry.setDrawRange(0,3);c.get([m]);assert.equal(c.diagnostics().mode,'ray-fallback');
});
test('visible-surface collection changes do not retain hidden higher surface',()=>{
 const a=surface(1),b=surface(7),c=createCadSupportCache();assert.equal(c.get([a,b])(-20,0).height,7);
 b.visible=false;assert.equal(c.get([a])(-20,0).height,1);
});
test('groups, layers, custom raycasts and instancing cannot silently use the walk index',()=>{
 for(const change of [
  m=>m.geometry.addGroup(0,3,0),
  m=>m.layers.set(2),
  m=>{m.raycast=function(){}},
  m=>{m.isInstancedMesh=true},
  m=>{m.morphTargetInfluences=[.1]},
 ]){
  const m=surface(),c=createCadSupportCache();c.get([m]);change(m);c.get([m]);assert.equal(c.diagnostics().mode,'ray-fallback');
 }
});
test('failed cache rebuild never returns a previous geometry snapshot',()=>{
 const m=surface(),c=createCadSupportCache(),old=c.get([m]),position=m.geometry.attributes.position;m.geometry.attributes.position=undefined;
 assert.throws(()=>c.get([m]));assert.throws(()=>c.get([m]));
 m.geometry.attributes.position=position;const repaired=c.get([m]);assert.notEqual(repaired,old);assert.equal(repaired(-20,0).height,0);
});
test('optional ground cell bounds preserve default walking and same actual triangle/face in retained cells',async()=>{
 const {createWalkWorld}=await import('../src/exploration.js');
 const mesh=surface(3),full=createWalkWorld([mesh],[]),explicit=createWalkWorld([mesh],[],{groundCellBounds:[-102,8,-26,24]}),small=createWalkWorld([mesh],[],{groundCellBounds:[-14,-6,-4,4]});
 assert.equal(full.groundCellCount,explicit.groundCellCount);assert.equal(full.indexedTriangleCount,explicit.indexedTriangleCount);
 for(const [x,z] of [[-20,0],[-25,4],[-12,-6]]){assert.deepEqual(full.sample(x,z),explicit.sample(x,z));assert.deepEqual(full.sample(x,z),small.sample(x,z));}
 assert.ok(full.sample(-29,0));assert.equal(small.sample(-29,0),null);
 assert.ok(small.groundCellCount<full.groundCellCount);assert.equal(small.indexedTriangleCount,2);
 for(const bounds of [null,[],[0,1,0],[2,1,0,1],[0,1,2,1],[0,Infinity,0,1],[0,.5,0,1],[0,1,NaN,2]])assert.throws(()=>createWalkWorld([mesh],[],{groundCellBounds:bounds}),/bounds/);
});
test('CAD cache rays outside its small footprint even inside the walking grid',()=>{
 const m=surface(6),c=createCadSupportCache(),sample=c.get([m]);
 assert.equal(sample(-29,0).height,6);assert.equal(c.diagnostics().fallbackQueries,1);
 assert.equal(sample(-20,0).height,6);assert.equal(c.diagnostics().groundCellCount,81);
 assert.equal(c.diagnostics().indexedTriangleCount,2);
});
