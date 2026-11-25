import test from 'node:test';
import assert from 'node:assert/strict';
import {route404Plans,evaluateRoute404} from '../scripts/stage3b6n-route-evaluator.mjs';
const sha='a'.repeat(64);
function sample(plan){
 const routeOn=plan.routeControl==='enabled';
 return {id:plan.id,mode:'missing',routeContrast:{policy:plan.routeControl,scope:'B6N_SYNTHETIC_ONLY',
   events:routeOn?[{phase:1,kind:'ROUTE_CONTINUE'},{phase:2,kind:'ROUTE_CONTINUE'}]:[]},
  server:[
   {phase:1,path:'/'+plan.id+'/asset.js',status:200,
    requestHeaders:{},responseHeaders:{'cache-control':'no-store'}},
   {phase:2,path:'/'+plan.id+'/asset.js',status:404,bodyBytes:96,bodySha256:sha,
    requestHeaders:{},responseHeaders:{'cache-control':'no-store'},responseFinishEventMs:35}
  ],
  responses:[{diagnosticPhase:2,status:404,body:{status:'CAPTURED',bytes:0},
    completion:{status:'FAIL'}}],
  terminalEvents:['request','response','requestfailed'].map(event=>({
    event,scope:'TARGET',phase:2,
    ...(event==='requestfailed'?{failure:{category:'ABORT_OR_CANCEL'}}:{})
  })),
  runError:{errorCode:'DIAGNOSTIC_DEADLINE',operation:'capture.settle'}};
}
test('B6n A-B-B-A compares same 404 body with route toggle only',()=>{
 assert.deepEqual(route404Plans.map(p=>p.routeControl),
  ['disabled','enabled','enabled','disabled']);
 const result=evaluateRoute404(route404Plans.map(sample));
 assert.equal(result.status,'CONTRAST_OBSERVED');
 assert.equal(result.routeAssociation,'NO_DIFFERENCE_OBSERVED');
 assert.equal(result.repeatability,'SAME');
 assert.equal(result.rootCause,'UNKNOWN');
});
test('B6n rejects wrong cache headers, injected validators, response drift and unverified routes',()=>{
 const mutate=[
  rows=>{rows[0].server[0].responseHeaders['cache-control']='no-cache';},
  rows=>{rows[1].server[1].requestHeaders['if-none-match']='"first"';},
  rows=>{rows[2].server[1].bodyBytes=0;},
  rows=>{rows[3].server[1].status=304;},
  rows=>{rows[0].server[1].bodySha256='b'.repeat(64);},
  rows=>{delete rows[1].server[1].responseFinishEventMs;},
  rows=>{rows[1].routeContrast.events=[];},
  rows=>{rows[0].routeContrast.events=[{phase:2,kind:'ROUTE_CONTINUE'}];},
  rows=>{rows[2].responses=[];},
  rows=>{rows.push(structuredClone(rows[0]));}
 ];
 for(const change of mutate){
  const rows=route404Plans.map(sample);change(rows);
  assert.equal(evaluateRoute404(rows).status,'INCOMPLETE');
 }
});
test('B6n observed route association is not proven causal mechanism',()=>{
 const rows=route404Plans.map(sample);
 for(const r of rows)if(r.routeContrast.policy==='disabled'){
  r.responses[0].completion={status:'FINISHED'};
  r.terminalEvents[2].event='requestfinished';
  delete r.terminalEvents[2].failure;
  delete r.runError;
 }
 const result=evaluateRoute404(rows);
 assert.equal(result.status,'CONTRAST_OBSERVED');
 assert.equal(result.routeAssociation,'DIFFERENCE_OBSERVED');
 assert.equal(result.rootCause,'UNKNOWN');
});
