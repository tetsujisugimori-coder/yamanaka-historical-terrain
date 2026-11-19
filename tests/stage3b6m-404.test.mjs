import test from 'node:test';
import assert from 'node:assert/strict';
import {conditional404Plans,evaluate404ConditionRows} from '../scripts/stage3b6m-404-evaluator.mjs';
function sample(plan){
 const header=plan.ifNoneMatchControl==='present'?'"first"':undefined;
 return {id:plan.id,mode:'missing',conditionalRoute:{scope:'BOTH_PHASES_SAME_ROUTE',
  policy:plan.ifNoneMatchControl,events:[{phase:1,after:'ABSENT'},{phase:2,after:header?'PRESENT':'ABSENT'}]},
  server:[{phase:1,path:'/'+plan.id+'/asset.js',status:200},
          {phase:2,path:'/'+plan.id+'/asset.js',status:404,bodyBytes:96,bodySha256:'fixed-sha',
           responseFinishEventMs:42,requestHeaders:header?{'if-none-match':header}:{}}],
  responses:[{diagnosticPhase:2,status:404,body:{status:'CAPTURED',bytes:0},completion:{status:'FAIL'}}],
  terminalEvents:['request','response','requestfailed'].map(event=>({event,scope:'TARGET',phase:2})),
  runError:{errorCode:'DIAGNOSTIC_DEADLINE',operation:'capture.settle'}};
}
test('B6m A-B-B-A is a balanced conditional-header-only control',()=>{
 assert.deepEqual(conditional404Plans.map(p=>p.ifNoneMatchControl),
  ['present','absent','absent','present']);
 const result=evaluate404ConditionRows(conditional404Plans.map(sample));
 assert.equal(result.status,'CONTRAST_OBSERVED');
 assert.equal(result.conditionAssociation,'NO_DIFFERENCE_OBSERVED');
 assert.equal(result.repeatability,'SAME');
 assert(result.controls.every(row=>row.serverStatus===404 && row.serverBytes===96));
});
test('B6m rejects absent/wrong header, body drift, duplicate, missing response and route mismatch',()=>{
 const changes=[
  rows=>{rows[0].server[1].requestHeaders={};},
  rows=>{rows[1].server[1].requestHeaders={'if-none-match':'"wrong"'};},
  rows=>{rows[2].server[1].bodyBytes=95;},
  rows=>{rows[0].server[1].bodySha256='different';},
  rows=>{rows[3].server[1].status=304;},
  rows=>{rows[0].responses=[];},
  rows=>{rows[0].conditionalRoute.events=[];},
  rows=>{rows.push(structuredClone(rows[0]));}
 ];
 for(const change of changes){
  const rows=conditional404Plans.map(sample);change(rows);
  assert.equal(evaluate404ConditionRows(rows).status,'INCOMPLETE');
 }
});
test('B6m distinguishes a repeatable condition association from proof of cause',()=>{
 const rows=conditional404Plans.map(sample);
 for(const r of rows)if(r.conditionalRoute.policy==='absent'){
  r.responses[0].completion={status:'FINISHED'};
  r.terminalEvents[2].event='requestfinished';
  delete r.runError;
 }
 const result=evaluate404ConditionRows(rows);
 assert.equal(result.status,'CONTRAST_OBSERVED');
 assert.equal(result.conditionAssociation,'DIFFERENCE_OBSERVED');
 assert.equal(result.rootCause,'UNKNOWN');
 assert.equal(result.browserUsedBytes,'UNKNOWN');
});
