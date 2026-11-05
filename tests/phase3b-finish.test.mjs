import test from 'node:test';
import assert from 'node:assert/strict';
import {Mesh,MeshStandardMaterial,BoxGeometry} from 'three';
import {createSurfaceFinish} from '../src/phase3b.js';
// Canvas pixels are irrelevant to this material ownership test; the browser
// suite separately exercises actual CanvasTexture creation and rendered pixels.
globalThis.document={createElement:()=>({getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}})})};
for(const appearanceEvidence of [false,true])test(`finish restores base without source mutation, appearance=${appearanceEvidence}`,()=>{
 const source=new MeshStandardMaterial({vertexColors:true}),mesh=new Mesh(new BoxGeometry(),source);mesh.geometry.deleteAttribute('uv');mesh.userData.appearanceEvidence=appearanceEvidence;
 const json=JSON.stringify(source.toJSON()),position=mesh.geometry.attributes.position.array.slice(),index=mesh.geometry.index.array.slice(),finish=createSurfaceFinish();
 finish.apply(mesh,false);const base=mesh.material;assert.equal(JSON.stringify(source.toJSON()),json);assert.equal(mesh.castShadow,false);assert.equal(mesh.receiveShadow,false);assert.equal(mesh.geometry.attributes.uv,undefined);assert.equal(base.vertexColors,!appearanceEvidence);
 for(let i=0;i<5;i++){finish.apply(mesh,true);assert.ok(mesh.material.map);assert.notEqual(mesh.material,base);assert.equal(JSON.stringify(source.toJSON()),json);finish.apply(mesh,false);assert.equal(mesh.material,base);assert.equal(mesh.receiveShadow,false);assert.equal(mesh.castShadow,false);assert.equal(mesh.geometry.attributes.uv,undefined);assert.deepEqual(mesh.geometry.attributes.position.array,position);assert.deepEqual(mesh.geometry.index.array,index);}
});
test('existing UV and non-default shadow flags restore exactly',()=>{
 const mesh=new Mesh(new BoxGeometry(),new MeshStandardMaterial()),uv=mesh.geometry.attributes.uv;mesh.castShadow=true;mesh.receiveShadow=false;const finish=createSurfaceFinish();finish.apply(mesh,true);finish.apply(mesh,false);assert.equal(mesh.geometry.attributes.uv,uv);assert.equal(mesh.castShadow,true);assert.equal(mesh.receiveShadow,false);
});
