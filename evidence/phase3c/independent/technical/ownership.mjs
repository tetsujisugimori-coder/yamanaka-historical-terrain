import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createSurfaceFinish,contextOutsidePatch} from '../../../../src/phase3b.js';
globalThis.document={createElement:()=>({getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:()=>{}})})};
const data=fs.readFileSync('public/data/phase3c.glb');const gltf=await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.length),'');
const results=[];
const hash=g=>crypto.createHash('sha256').update(Buffer.from(g.attributes.position.array.buffer)).update(Buffer.from(g.index.array.buffer)).digest('hex');
gltf.scene.traverse(mesh=>{
 if(!mesh.isMesh)return;
 const source=mesh.geometry,sourceMaterial=mesh.material,sourceHash=hash(source),origUv=source.attributes.uv;
 const sibling=new THREE.Mesh(source,sourceMaterial);sibling.userData={...mesh.userData};const finish=createSurfaceFinish();
 for(let i=0;i<5;i++){
  finish.apply(mesh,true);assert.notEqual(mesh.geometry,source);assert.notEqual(mesh.material,sourceMaterial);if(i===0)assert.equal(sibling.geometry,source);assert.equal(source.attributes.uv,origUv);assert.equal(hash(source),sourceHash);
  finish.apply(sibling,false);assert.notEqual(sibling.geometry,mesh.geometry);assert.equal(sibling.geometry.attributes.uv,origUv);
  finish.apply(mesh,false);assert.equal(mesh.geometry.attributes.uv,origUv);assert.equal(mesh.castShadow,false);assert.equal(mesh.receiveShadow,false);assert.equal(mesh.material.map,null);assert.equal(mesh.material.bumpMap,null);assert.equal(hash(source),sourceHash);
 }
 results.push({name:mesh.name,cycles:5,sourceHash,privateGeometry:true,sourceUnchanged:true,uvRestored:true,neutralMaterialRestored:true});
});
console.log(JSON.stringify({head:process.env.HEAD,actualGLB:crypto.createHash('sha256').update(data).digest('hex'),results},null,2));
