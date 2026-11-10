import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {applyPhase2aFault,phase2aNegativeAccepted} from '../scripts/phase2a-fallback-mutation.mjs';
const main=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
const intent=await readFile(new URL('../src/intent.js',import.meta.url),'utf8');
test('hidden-pick fault changes the facility selection query, not CAD occlusion',()=>{
 const r=applyPhase2aFault(main,'hidden-pick');assert.equal(r.code,main.replace(r.anchor,r.replacement));
 assert.ok(r.code.includes('const groundHits=ray.intersectObjects(currentModel.children.filter(o=>o.visible),true);'));
 assert.ok(r.code.includes('const hits=ray.intersectObjects(currentModel.children,true);'));
 assert.ok(!r.code.includes(r.anchor));
});
test('stale intent fault changes only isCurrent, preserving camera guard',()=>{
 const r=applyPhase2aFault(intent,'superseded-load');assert.equal(r.code,intent.replace(r.anchor,r.replacement));
 assert.ok(r.code.includes('canMoveCamera:()=>token===revision&&cameraToken===cameraRevision'));
});
for(const [scenario,source]of [['hidden-pick',main],['superseded-load',intent]])test(scenario+' fails closed on missing, wrong or ambiguous target',()=>{
 const r=applyPhase2aFault(source,scenario);
 assert.throws(()=>applyPhase2aFault(r.code,scenario),/exactly once/);
 assert.throws(()=>applyPhase2aFault(source+'\n'+r.anchor,scenario),/exactly once/);
 assert.throws(()=>applyPhase2aFault('const groundHits=ray.intersectObjects(currentModel.children.filter(o=>o.visible),true);',scenario),/exactly once/);
});
const rows=()=>['chromium','webkit'].flatMap(engine=>['hidden-pick','superseded-load'].map(scenario=>({engine,scenario,status:'FAIL',mutationApplied:true,pageerrors:[],injectionHits:scenario==='superseded-load'?['active-model.glb']:[],failureWitness:scenario==='hidden-pick'?{selected:'nm-moat',hidden:['nm-moat']}:{renderState:'error',view:'regional'}})));
test('negative acceptance requires the exact hidden-pick/stale-error witness',()=>{
 assert.equal(phase2aNegativeAccepted(rows()),true);
 for(const mutate of [r=>r.pop(),r=>r.push(r[0]),r=>r[0].status='PASS',r=>r[0].mutationApplied=false,r=>r[0].pageerrors.push('unrelated'),r=>delete r[0].failureWitness,r=>r[0].failureWitness.hidden=[],r=>r[0].failureWitness.selected='nm-bailey',r=>r[1].failureWitness.renderState='ready',r=>r[1].failureWitness.view='reconstruction',r=>r[1].injectionHits=[]]){const r=rows();mutate(r);assert.equal(phase2aNegativeAccepted(r),false);}
});
