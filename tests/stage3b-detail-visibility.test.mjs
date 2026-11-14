import test from 'node:test';import assert from 'node:assert/strict';
import {inspectDetailVisibility} from '../scripts/stage3b-detail-visibility.mjs';
const mesh={featureId:'ic-lookout',name:'lookout',positionCount:8,visible:true,effectiveVisible:true,ancestors:[{name:'inner',visible:true},{name:'scene',visible:true}],worldBounds:[0,0,0,1,1,1]};
test('detail visibility accepts actual visible mesh, rejects selected-only, hidden mesh and parent',()=>{
 assert.equal(inspectDetailVisibility({modelMeshes:[mesh]},'ic-lookout').valid,true);
 for(const m of [{...mesh,visible:false},{...mesh,effectiveVisible:false},{...mesh,ancestors:[{visible:false}]},{...mesh,positionCount:0}])assert.equal(inspectDetailVisibility({state:{selected:'ic-lookout'},modelMeshes:[m]},'ic-lookout').valid,false);
 assert.equal(inspectDetailVisibility({state:{selected:'ic-lookout'},modelMeshes:[]},'ic-lookout').valid,false);
});
test('documented western vegetation overlap: four visible and four excluded, never all hidden',()=>{
 const visible={...mesh,featureId:'sc-vegetation'},excluded={...visible,visible:false,effectiveVisible:false,visibilityExclusion:{reason:'western-terrain-overlap',replacementGroupVisible:true,replacementMeshCount:1,sourceFlag:true}};
 const original={modelMeshes:[...Array.from({length:4},()=>structuredClone(visible)),...Array.from({length:4},()=>structuredClone(excluded))]};
 const accepted=inspectDetailVisibility(original,'sc-vegetation');assert.equal(accepted.valid,true);assert.equal(accepted.excluded.length,4);assert.equal(accepted.visibleRequiredMeshes,4);
 for(const mutation of [
  d=>{d.modelMeshes=d.modelMeshes.map(()=>structuredClone(excluded));},
  d=>{d.modelMeshes[0].visible=false;d.modelMeshes[0].effectiveVisible=false;},
  d=>{d.modelMeshes[4].visibilityExclusion.reason='unknown';},
  d=>{d.modelMeshes[4].visibilityExclusion.sourceFlag=false;},
  d=>{d.modelMeshes[4].visibilityExclusion.replacementGroupVisible=false;},
  d=>{d.modelMeshes[4].visibilityExclusion.replacementMeshCount=0;},
  d=>{d.modelMeshes[4].ancestors=[{visible:false}];},
  d=>{d.modelMeshes[4].positionCount=0;},
  d=>{d.modelMeshes[4].worldBounds=null;}
 ]){const d=structuredClone(original);mutation(d);assert.equal(inspectDetailVisibility(d,'sc-vegetation').valid,false);}
 assert.equal(inspectDetailVisibility({modelMeshes:[{...excluded,featureId:'ic-lookout'},mesh]},'ic-lookout').valid,false);
});
