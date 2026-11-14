import test from 'node:test';import assert from 'node:assert/strict';
import {inspectDetailVisibility} from '../scripts/stage3b-detail-visibility.mjs';
const mesh={featureId:'ic-lookout',name:'lookout',positionCount:8,visible:true,effectiveVisible:true,ancestors:[{name:'inner',visible:true},{name:'scene',visible:true}],worldBounds:[0,0,0,1,1,1]};
test('detail visibility accepts actual visible mesh, rejects selected-only, hidden mesh and parent',()=>{
 assert.equal(inspectDetailVisibility({modelMeshes:[mesh]},'ic-lookout').valid,true);
 for(const m of [{...mesh,visible:false},{...mesh,effectiveVisible:false},{...mesh,ancestors:[{visible:false}]},{...mesh,positionCount:0}])assert.equal(inspectDetailVisibility({state:{selected:'ic-lookout'},modelMeshes:[m]},'ic-lookout').valid,false);
 assert.equal(inspectDetailVisibility({state:{selected:'ic-lookout'},modelMeshes:[]},'ic-lookout').valid,false);
});
