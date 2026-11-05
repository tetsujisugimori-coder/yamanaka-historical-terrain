import test from 'node:test';
import assert from 'node:assert/strict';
import {Mesh,MeshStandardMaterial,BoxGeometry} from 'three';
const {createSurfaceFinish}=await import(process.env.FINISH_SOURCE??'../src/phase3b.js');
globalThis.document={createElement:()=>({getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}})})};
test('shared source geometry stays UV-free through staggered D activation and deactivation',()=>{
 const source=new BoxGeometry();source.deleteAttribute('uv');
 const a=new Mesh(source,new MeshStandardMaterial()),b=new Mesh(source,new MeshStandardMaterial());
 const finish=createSurfaceFinish(),position=source.attributes.position.array.slice(),index=source.index.array.slice();
 finish.apply(a,true);
 assert.equal(source.attributes.uv,undefined,'D must never write to shared source geometry');
 finish.apply(b,true);finish.apply(a,false);finish.apply(b,false);
 assert.notEqual(a.geometry,source);assert.notEqual(b.geometry,source);assert.notEqual(a.geometry,b.geometry);assert.equal(a.geometry.attributes.uv,source.attributes.uv);assert.equal(b.geometry.attributes.uv,source.attributes.uv);assert.equal(source.attributes.uv,undefined);
 assert.deepEqual(source.attributes.position.array,position);assert.deepEqual(source.index.array,index);
});
test('two finish controllers cannot contaminate a shared source UV reference',()=>{
 const source=new BoxGeometry(),uv=source.attributes.uv,old=uv.array.slice();
 const a=new Mesh(source,new MeshStandardMaterial()),b=new Mesh(source,new MeshStandardMaterial());
 const x=createSurfaceFinish(),y=createSurfaceFinish();
 for(let i=0;i<3;i++){
  x.apply(a,true);y.apply(b,false);y.apply(b,true);x.apply(a,false);y.apply(b,false);
  assert.notEqual(a.geometry,source);assert.notEqual(b.geometry,source);assert.notEqual(a.geometry,b.geometry);assert.equal(a.geometry.attributes.uv,source.attributes.uv);assert.equal(b.geometry.attributes.uv,source.attributes.uv);assert.equal(source.attributes.uv,uv);assert.deepEqual(uv.array,old);
 }
});
