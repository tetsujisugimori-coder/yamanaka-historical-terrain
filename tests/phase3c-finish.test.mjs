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

test('real inner GLB without COLOR never enables vertex colors; old western colors are preserved',async()=>{
 const {readFile}=await import('node:fs/promises');const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
 const finish=createSurfaceFinish();let inner=0,western=0;
 for(const file of ['phase3c','phase3b']){
  const bytes=await readFile(new URL(`../public/data/${file}.glb`,import.meta.url));
  const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  gltf.scene.traverse(mesh=>{if(!mesh.isMesh)return;const color=mesh.geometry.attributes.color,original=mesh.material;
   if(file==='phase3c'){inner++;assert.equal(color,undefined,'fixture must exercise the absent-color path');}else if(color)western++;
   finish.apply(mesh,true);assert.equal(mesh.material.vertexColors,Boolean(color),'VERTEX_COLOR_WITHOUT_ATTRIBUTE '+mesh.name);
   if(color)assert.equal(mesh.geometry.attributes.color,color,'existing authored vertex colors must be retained');
   finish.apply(mesh,false);assert.equal(mesh.material.vertexColors,false,'C-neutral appearance must not contain D vertex colors');assert.deepEqual(mesh.material.color,original.color);
  });
 }
 assert.equal(inner,7);assert.ok(western>0);
});
