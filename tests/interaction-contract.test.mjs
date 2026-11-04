import test from 'node:test';
import assert from 'node:assert/strict';
import {BufferGeometry,Float32BufferAttribute,Mesh,MeshBasicMaterial,DoubleSide,Group} from 'three';
import {createIntentController} from '../src/intent.js';
import {sampleSurfaceHeight} from '../src/surface.js';
test('a later synchronous selection supersedes both successful and failed earlier work',async()=>{
 for(const reject of [false,true]){
  const intents=createIntentController(),old=intents.begin();let release;const gate=new Promise(r=>release=r);let state='initial';
  const pending=(async()=>{await gate;try{if(reject)throw Error('late 404');if(old.isCurrent())state='old success';}catch{if(old.isCurrent())state='old error';}})();
  const latest=intents.begin();state='latest selection';release();await pending;assert.equal(state,'latest selection');assert.ok(latest.isCurrent());
 }
});
test('initial camera input preserves model ownership and errors, but supersedes default camera effects',()=>{
 const intents=createIntentController(),initial=intents.begin();
 intents.adjustCamera();intents.adjustCamera();
 assert.ok(initial.isCurrent());assert.equal(initial.canMoveCamera(),false);
 const selection=intents.begin();
 assert.equal(initial.isCurrent(),false);assert.equal(initial.canMoveCamera(),false);
 assert.ok(selection.isCurrent());assert.ok(selection.canMoveCamera());
});
test('surface height uses triangle geometry and world scaling; missing geometry is an error',()=>{
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute([0,10,0, 10,10,0, 0,10,10, 10,14,10],3));g.setIndex([0,2,1,1,2,3]);
 const mesh=new Mesh(g,new MeshBasicMaterial({side:DoubleSide})),parent=new Group();parent.add(mesh);
 assert.equal(sampleSurfaceHeight([mesh],5,-5),10,'bilinear interpolation would be 11');
 parent.scale.y=2;assert.equal(sampleSurfaceHeight([mesh],5,-5,2),10);assert.equal(sampleSurfaceHeight([mesh],10,-10,2),14);
 assert.throws(()=>sampleSurfaceHeight([mesh],20,-20,2),/No displayed triangle/);assert.throws(()=>sampleSurfaceHeight([],0,0),/No surface/);
});
