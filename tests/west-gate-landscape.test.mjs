import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createNatureFinish} from '../src/nature-finish.js';
import {westGateEdgeWeight,westGateRelief} from '../src/west-gate-finish.js';
import {groundOracle} from './phase3f-ground-oracle.mjs';
import {oracle} from './section-oracle.mjs';

const bounds=[-205,-55,-80,55];
function surface(e,n,key){
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute([e,550,-n],3));
 geometry.setAttribute('normal',new T.Float32BufferAttribute([0,.6,.8],3));
 geometry.setAttribute('color',new T.Float32BufferAttribute([.12,.18,.07],3));
 geometry.setIndex([0,0,0]);
 const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial());
 mesh.userData=key==='nm-context'?{facilityId:key}:{surface:true,elementId:key};
 return mesh;
}
const rgb=m=>m.geometry.attributes.color.array;
test('connected edge receives identical world-space color despite different material families',()=>{
 const edge=[surface(-80,12,'nm-context'),surface(-80,12,'wb-moat')];
 const d=createNatureFinish(bounds);
 edge.forEach(m=>d.apply(m,true));
 assert.deepEqual(rgb(edge[0]),rgb(edge[1]));
 assert.notDeepEqual(rgb(edge[0]),new Float32Array([.12,.18,.07]));
 d.dispose();
});
test('negative control: repainting the old sides separately leaves their edge colors unequal',()=>{
 const a=surface(-80,12,'nm-context'),b=surface(-80,12,'wb-moat');
 const d=createNatureFinish(bounds);d.apply(a,false);d.apply(b,false);
 assert.notDeepEqual(rgb(a),rgb(b));d.dispose();
});
test('collar decays to zero and context outside it is unchanged',()=>{
 assert.equal(westGateEdgeWeight(-80,12,bounds),1);
 assert.equal(westGateEdgeWeight(-69,12,bounds),.5);
 assert.equal(westGateEdgeWeight(-91,12,bounds),.5);
 assert.equal(westGateEdgeWeight(-58,12,bounds),0);
 const m=surface(-45,12,'nm-context'),before=rgb(m).slice(),d=createNatureFinish(bounds);d.apply(m,true);
 assert.deepEqual(rgb(m),before);d.dispose();
});
test('same geometry, support attributes, and original material/color identity after D is removed',()=>{
 const d=createNatureFinish(bounds);
 for(const m of [surface(-80,12,'nm-context'),surface(-80,12,'wb-gate')]){
  const g=m.geometry,{position,normal,color}=g.attributes,index=g.index,material=m.material;
  d.apply(m,true);assert.notEqual(m.material,material);
  assert.equal(m.geometry,g);assert.equal(g.attributes.position,position);assert.equal(g.attributes.normal,normal);assert.equal(g.index,index);
  d.restore();assert.equal(m.material,material);assert.equal(g.attributes.color,color);
  d.apply(m,true);d.restore();assert.equal(g.attributes.color,color);
 }
 d.dispose();
});
test('west moat opposite slopes read differently; unrelated terrain relief stays normal',()=>{
 assert.ok(westGateRelief('wb-moat',-185,-23,.6,.8)>westGateRelief('wb-moat',-185,-23,.6,-.8));
 assert.equal(westGateRelief('nm-moat',-185,-23,.6,-.8),1);
});
test('raw C triangles already have coverage and matching height at west-patch perimeter (0.5m sample spacing)',()=>{
 const patch=groundOracle('public/data/phase3b.glb'),adjacent=oracle('public/data/phase3i.glb');
 const [west,south,east,north]=bounds,points=[];
 for(let x=west;x<=east;x+=.5)points.push([x,south],[x,north]);
 for(let n=south+.5;n<north;n+=.5)points.push([west,n],[east,n]);
 assert.equal(points.length,940);
 const check=(sample)=>{for(const [x,n] of points){
  const a=adjacent(x,n),b=sample(x,n);
  assert.ok(Number.isFinite(a)&&Number.isFinite(b),'missing seam coverage');
  assert.ok(Math.abs(a-b)<.001,'seam height mismatch');
 }};
 check(patch);assert.throws(()=>check((e,n)=>patch(e,n)+.02),/height mismatch/);
 assert.throws(()=>check(()=>null),/missing seam/);
});
