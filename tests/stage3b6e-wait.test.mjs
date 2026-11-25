import test from 'node:test';
import assert from 'node:assert/strict';
import {createResponseObserver} from '../scripts/stage3b6-response-observer.mjs';
import {evaluateDiagnosticResources,evaluateCacheDiagnostic} from '../scripts/stage3b6c-cache-diagnostic.mjs';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
function response(finished,body=async()=>Buffer.alloc(0)) { const req={method:()=> 'GET',allHeaders:async()=>({}),redirectedFrom:()=>null};return {request:()=>req,url:()=> 'http://example.invalid/asset.js',status:()=>404,allHeaders:async()=>({}),finished:()=>finished,body}; }
for(const timing of ['AS_OBSERVED','AFTER_FINISHED'])test(`pending completion versus body: ${timing}`,async()=>{
 const finish=deferred(),saved=deferred();let row;const observer=createResponseObserver({contextId:'synthetic',pageId:'p',bodyTiming:timing,onRecord:r=>row=r});let settled=false;
 const task=observer.capture(response(finish.promise),async()=>saved.resolve()).then(()=>{settled=true;},()=>{settled=true;});
 await new Promise(r=>setImmediate(r));
 assert.ok(row.events.some(e=>e.phase==='response-finished-start'));assert.equal(settled,false);
 assert.equal(row.events.some(e=>e.phase==='body-succeeded'),timing==='AS_OBSERVED');
 if(timing==='AS_OBSERVED'){assert.ok(row.events.some(e=>e.phase==='capture-await-completion'));assert.equal(row.body.bytes,0);}
 finish.resolve(null);await task;assert.equal(settled,true);assert.equal(row.completion.status,'FINISHED');assert.equal(row.events.at(-1).phase,'capture-settled');assert.ok(row.events.some(e=>e.phase==='capture-completion-released'));
});
test('completion failure remains separate from captured body',async()=>{
 let row;const observer=createResponseObserver({contextId:'s',pageId:'p',onRecord:r=>row=r});await observer.capture(response(Promise.resolve(Error('SECRET'))),async()=>{});
 assert.equal(row.body.status,'CAPTURED');assert.equal(row.completion.status,'FAIL');assert.ok(!JSON.stringify(row).includes('SECRET'));
});
test('deadline cannot become success after settlement; mismatch is not accepted',()=>{
 const r={runError:{errorCode:'DIAGNOSTIC_DEADLINE'},mode:'missing',responses:[],server:[],pages:[],captureSettlement:{status:'SETTLED'}};
 assert.equal(evaluateCacheDiagnostic(r).status,'UNKNOWN');assert.equal(evaluateDiagnosticResources(r).status,'UNKNOWN');
 const row={responses:[1,2].map(diagnosticPhase=>({diagnosticPhase,status:200,body:{status:'CAPTURED'},savedBody:{matchesServerEntity:false}})),server:[1,2].map(phase=>({phase,path:'/asset.js',status:200}))};assert.equal(evaluateDiagnosticResources(row).status,'FAIL');
});
test('diagnostic snapshot preserves pre-close deadline when close releases completion',async(t)=>{
 const {runCacheDiagnostics}=await import('../scripts/stage3b6c-cache-diagnostic.mjs');
 const {mkdtemp,mkdir}=await import('node:fs/promises');const root='.work/stage3b6e-synthetic';await mkdir(root,{recursive:true});const out=await mkdtemp(root+'/case-');
 const finish=deferred();let contexts=0,phase=0,callbacks={};
 const page={setDefaultTimeout(){},setDefaultNavigationTimeout(){},on(event,cb){callbacks[event]=cb;},async setExtraHTTPHeaders(){},async goto(url){phase++;const req={url:()=>url+'asset.js',method:()=> 'GET',allHeaders:async()=>({}),redirectedFrom:()=>null};callbacks.request(req);callbacks.response({request:()=>req,url:()=>req.url(),status:()=>phase===1?200:404,allHeaders:async()=>({}),finished:()=>phase===1?Promise.resolve(null):finish.promise,body:async()=>Buffer.alloc(0)});},async evaluate(){return phase===1?'first':null;},locator(){return {async textContent(){return 'synthetic';}}}};
 const browser={async newContext(){if(contexts++)throw Error('SECRET_UNUSED_CONTEXT');return {async newPage(){return page;},async close(){finish.resolve(Error('SECRET_COMPLETION'));throw Error('SECRET_CLEANUP');}}}};
 let result;try{result=await runCacheDiagnostics(browser,'synthetic-not-browser',{out});}catch(e){if(['EPERM','EACCES'].includes(e.code)){t.skip('loopback permission BLOCKED; not executed');return;}throw e;}
 const row=result.rows[0];assert.equal(row.runError.errorCode,'DIAGNOSTIC_DEADLINE');assert.equal(row.runError.phase,2);assert.equal(row.captureSettlement.status,'SETTLED');assert.equal(row.cleanupError.operation,'context.close');assert.equal(row.assessment.status,'UNKNOWN');
 const deadline=row.operations.find(e=>e.state==='DEADLINE'),close=row.operations.find(e=>e.operation==='context.close');assert.ok(deadline.monotonicMs<=close.monotonicMs);assert.equal(deadline.captures[1].body,'CAPTURED');assert.equal(deadline.captures[1].completion,'PENDING');assert.equal(deadline.captures[1].settled,false);assert.equal(deadline.captures[1].lastEvent,'capture-await-completion');assert.equal(row.responses[1].completion.status,'FAIL');assert.equal(deadline.captures[1].completion,'PENDING');assert.ok(!JSON.stringify(result).includes('SECRET'));
});
