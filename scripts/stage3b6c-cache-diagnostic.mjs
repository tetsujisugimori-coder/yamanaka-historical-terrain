/** B6c bounded synthetic HTTP diagnostic. Never a substitute for production acceptance. */
import {createServer} from 'node:http';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {createResponseObserver,safeHeaders} from './stage3b6-response-observer.mjs';
export const cacheDiagnosticPlan=Object.freeze([
 {id:'revalidate-immediate',mode:'revalidate',bodyTiming:'AS_OBSERVED'},
 {id:'revalidate-finished',mode:'revalidate',bodyTiming:'AFTER_FINISHED'},
 {id:'no-store',mode:'no-store',bodyTiming:'AS_OBSERVED'},
 {id:'etag-change',mode:'etag-change',bodyTiming:'AS_OBSERVED'},
 {id:'vary-change',mode:'vary-change',bodyTiming:'AS_OBSERVED'},
 {id:'bad-etag-304',mode:'bad-etag-304',bodyTiming:'AS_OBSERVED'},
 {id:'missing',mode:'missing',bodyTiming:'AS_OBSERVED'},
 {id:'corrupt',mode:'corrupt',bodyTiming:'AS_OBSERVED'},
 {id:'routed',mode:'routed',bodyTiming:'AS_OBSERVED'}
]);
const sha=b=>createHash('sha256').update(b).digest('hex');
async function bounded(promise){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(Error('diagnostic observation deadline'),{code:'DIAGNOSTIC_DEADLINE'})),5000);})]);}finally{clearTimeout(timer);}}
const accepts={first:'application/x-diagnostic-first',second:'application/x-diagnostic-second'};
/** Only fixed labels/IDs are emitted; Playwright messages can contain URLs or headers. */
export function diagnosticFailure(error,{operation,phase,pending=[]}){
 const observation=error?.observation;
 const bodyCode=observation?.body?.errorCode;
 return {operation,phase,at:new Date().toISOString(),monotonicMs:performance.now(),
  errorClass:error?.name==='TimeoutError'?'TimeoutError':'Error',
  errorCode:error?.code==='DIAGNOSTIC_DEADLINE'?'DIAGNOSTIC_DEADLINE':error?.name==='TimeoutError'?'BROWSER_TIMEOUT':['BODY_UNAVAILABLE_REDIRECT_MESSAGE','CAPTURE_OR_PRESERVATION_ERROR'].includes(bodyCode)?bodyCode:'OPERATION_FAILED',
  responseId:observation?.responseId??null,requestId:observation?.requestId??null,
  captureOperation:['response.body','preserve/validate'].includes(observation?.body?.operation)?observation.body.operation:null,
  pending:pending.map(({responseId,requestId})=>({responseId,requestId}))};
}
export function diagnosticEntity(mode,phase,requestHeaders={}){
 const changed=phase===2&&mode==='etag-change';
 const marker=mode==='vary-change'?Object.keys(accepts).find(id=>accepts[id]===requestHeaders.accept)??null:changed?'second':'first';
 const body=Buffer.from(marker===null?'/* unsupported diagnostic Accept */':phase===2&&mode==='corrupt'?'window.__cacheMarker = ;':`window.__cacheMarker=${JSON.stringify(marker)};document.getElementById('marker').textContent=window.__cacheMarker;`);
 const headers={'content-type':'application/javascript','cache-control':mode==='no-store'?'no-store':'no-cache',etag:JSON.stringify(marker??'unacceptable'),vary:'Accept'};
 const representation={id:marker,etag:headers.etag,bytes:body.length,sha256:sha(body),selectionBasis:mode==='vary-change'?'request.accept':'fixed-control'};
 let status=200;
 if(marker===null)status=406;
 else if(phase===2&&mode==='missing')status=404;
 else if(phase===2&&mode==='bad-etag-304'){status=304;headers.etag='"contradictory"';}
 else if(phase===2&&!['no-store','missing','corrupt'].includes(mode)&&requestHeaders['if-none-match']===headers.etag)status=304;
 return {status,headers,body:status===304?Buffer.alloc(0):body,marker,representation};
}
export function evaluateCacheDiagnostic(row){
 const a=row.server.filter(r=>r.path.endsWith('/asset.js')&&r.phase===1),b=row.server.filter(r=>r.path.endsWith('/asset.js')&&r.phase===2);
 if(row.runError)return {status:'UNKNOWN',reason:'diagnostic did not complete'};
 if(a.length!==1||b.length!==1||row.pages.length!==2)return {status:'UNKNOWN',reason:'exact two-phase resource requests not established'};
 if(a[0].status!==200||row.pages[0].marker!=='first')return {status:'FAIL',reason:'initial 200/function control failed'};
 const second=b[0],marker=row.pages[1].marker;
 if(row.mode==='bad-etag-304')return second.status===304&&second.responseHeaders.etag!==second.requestHeaders['if-none-match']?{status:'EXPECTED_REJECTION',reason:'deliberately inconsistent revalidation; browser outcome not accepted'}:{status:'UNKNOWN',reason:'inconsistent 304 injection not established'};
 if(row.mode==='missing')return second.status===404&&marker===null?{status:'EXPECTED_REJECTION',reason:'missing resource and absent function marker'}:{status:'FAIL',reason:'missing-resource refusal not established'};
 if(row.mode==='corrupt')return second.status===200&&marker===null&&row.pages[1].pageErrorCount>0?{status:'EXPECTED_REJECTION',reason:'invalid script rejected; function marker absent'}:{status:'FAIL',reason:'invalid-script refusal not established'};
 const expected=row.mode==='revalidate'?304:200;
 if(second.status!==expected)return {status:'UNKNOWN',reason:`required raw HTTP ${expected} not observed`};
 if(row.mode==='vary-change'){
  if(a[0].requestHeaders.accept!==accepts.first||second.requestHeaders.accept!==accepts.second)return {status:'UNKNOWN',reason:'required actual Accept contrast not established'};
  for(const [record,id] of [[a[0],'first'],[second,'second']]){
   const selected=record.representation;
   if(!selected)return {status:'UNKNOWN',reason:'server representation selection not recorded'};
   if(selected.id!==id||selected.selectionBasis!=='request.accept'||record.responseHeaders.etag!==JSON.stringify(id)||selected.etag!==record.responseHeaders.etag||selected.sha256!==record.bodySha256||selected.bytes!==record.bodyBytes||!record.responseHeaders.vary?.toLowerCase().split(',').map(v=>v.trim()).includes('accept'))return {status:'FAIL',reason:'server selection, validator or entity correspondence differs'};
  }
  if(a[0].representation.sha256===second.representation.sha256)return {status:'FAIL',reason:'Vary entities are not distinguishable'};
 }
 if(marker!==(['etag-change','vary-change'].includes(row.mode)?'second':'first'))return {status:'FAIL',reason:'diagnostic function marker differs'};
 return {status:'OBSERVED',reason:'required HTTP pattern and synthetic function marker observed; not production or used-byte proof'};
}
/** Completeness/order of recorded timing only; failed body acquisition can still be observed. */
export function evaluateDiagnosticTiming(row){
 const unknown=reason=>({status:'UNKNOWN',reason,scope:'timing evidence only; not resource or production acceptance'});
 if(row.runError||row.responses?.length!==2)return unknown('exact two completed response observations not established');
 if(![1,2].every(phase=>row.responses.filter(r=>r.diagnosticPhase===phase).length===1))return unknown('phase correspondence missing or duplicated');
 for(const response of row.responses){
  const events=response.events??[],index=phase=>events.findIndex(e=>e.phase===phase);
  if(response.completion?.status!=='FINISHED')return unknown('response completion not confirmed');
  for(const phase of ['metadata-start','metadata-succeeded','body-start','response-finished'])if(index(phase)<0)return unknown('required timing event missing');
  const terminal=events.filter(e=>['body-succeeded','body-failed'].includes(e.phase));
  if(terminal.length!==1)return unknown('body outcome missing or ambiguous');
  if(events.some(e=>!Number.isFinite(e.monotonicMs)))return unknown('monotonic timing unavailable');
  const start=index('body-start'),end=events.indexOf(terminal[0]),finished=index('response-finished');
  if(index('metadata-start')>=index('metadata-succeeded')||index('metadata-succeeded')>=start||end<=start)return unknown('metadata/body event order inconsistent');
  if(row.bodyTiming==='AFTER_FINISHED'&&(finished>=start||events[finished].monotonicMs>events[start].monotonicMs))return unknown('AFTER_FINISHED body call precedes completion');
 }
 return {status:'OBSERVED',reason:'metadata, completion and body outcome timings recorded for both phases; body failure is not acceptance',scope:'timing evidence only; not resource or production acceptance'};
}
export function evaluateDiagnosticResources(row){
 if(row.runError||row.responses.length!==2)return {status:'UNKNOWN',reason:'complete observed resource pair missing'};
 const phases=row.responses.map(r=>r.diagnosticPhase).sort();if(phases.join(',')!=='1,2')return {status:'UNKNOWN',reason:'resource phase correspondence incomplete'};
 if(row.responses.some(r=>r.observerErrors?.length))return {status:'FAIL',reason:'resource metadata acquisition failed'};
 const raw=row.server?.filter(r=>r.path.endsWith('/asset.js'))??[];if(raw.length!==2||raw.map(r=>r.phase).sort().join(',')!=='1,2')return {status:'UNKNOWN',reason:'raw server response correspondence incomplete'};
 const first=row.responses.find(r=>r.diagnosticPhase===1);if(raw.find(r=>r.phase===1).status!==200||first.status!==200||first.body?.status!=='CAPTURED'||first.savedBody?.matchesServerEntity!==true)return {status:'FAIL',reason:'initial normal entity control incomplete'};
 if(['bad-etag-304','missing','corrupt'].includes(row.mode))return {status:'EXPECTED_INVALID',reason:'injected resource is not accepted; rejection evaluated separately'};
 const results=row.responses.map(r=>{
  if(raw.find(s=>s.phase===r.diagnosticPhase).status===304||r.status===304||r.savedBody?.serverEntityStatus===304)return 'UNKNOWN';
  if(r.status!==200||r.body?.status!=='CAPTURED'||!r.savedBody)return 'FAIL';
  return r.savedBody.matchesServerEntity===true?'CAPTURE_MATCH':'FAIL';
 });
 return {status:results.includes('FAIL')?'FAIL':results.includes('UNKNOWN')?'UNKNOWN':'CAPTURE_MATCH',phases:results,scope:'captured entity versus synthetic server only; used browser bytes UNKNOWN'};
}
export async function runCacheDiagnostics(browser,engine,{out}){
 if(!out)throw Error('diagnostic output required');
 const rows=[];let active;
 const server=createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost');
  if(!active){res.writeHead(503);res.end();return;}
  const row=active.row,phase=active.phase;
  let status,headers,body,representation=null;
  if(u.pathname.endsWith('/asset.js'))({status,headers,body,representation}=diagnosticEntity(row.mode,phase,safeHeaders(req.headers)));
  else if(u.pathname===`/${row.id}/`){status=200;headers={'content-type':'text/html','cache-control':'no-store'};body=Buffer.from('<!doctype html><meta charset="utf-8"><div id="marker">unset</div><script src="asset.js"></script>');}
  else {status=404;headers={'content-type':'text/plain','cache-control':'no-store'};body=Buffer.from('not found');}
  row.server.push({sequence:row.server.length+1,phase,at:new Date().toISOString(),monotonicMs:performance.now(),method:req.method,path:u.pathname,requestHeaders:safeHeaders(req.headers),status,responseHeaders:safeHeaders(headers),representation,bodyBytes:body.length,bodySha256:sha(body)});
  const entry=row.server.at(-1);res.once('finish',()=>{entry.responseFinishEventMs=performance.now();});res.writeHead(status,headers);entry.responseEndBeforeCallMs=performance.now();res.end(body);
 });
 server.requestTimeout=5000;server.headersTimeout=5000;
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
  for(const plan of cacheDiagnosticPlan){
   const row={...plan,engine,scope:'SYNTHETIC_HTTP_DIAGNOSTIC',routing:plan.mode==='routed',usedBytes:'UNKNOWN',server:[],responses:[],captureFailures:[],operationErrors:[],operations:[],pages:[]};rows.push(row);active={row,phase:1};
   let context,observer;const pending=[];let currentPhase=1,operation='context.new';
   const failure=(error,failedOperation)=>diagnosticFailure(error,{operation:failedOperation,phase:currentPhase,pending:row.responses.filter(r=>!r.events.some(e=>e.phase==='capture-settled'))});
   const snapshot=()=>row.responses.map(r=>({requestId:r.requestId,responseId:r.responseId,body:r.body.status,completion:r.completion?.status??'PENDING',lastEvent:r.events.at(-1)?.phase??null,settled:r.events.some(e=>e.phase==='capture-settled')}));
   const mark=(operation,state)=>row.operations.push({operation,state,phase:currentPhase,monotonicMs:performance.now(),captures:snapshot()});
   const drain=async(label='capture.settle')=>{mark(label,'START');try{let n=0;while(n<pending.length){const next=pending.length;await bounded(Promise.all(pending.slice(n,next)));n=next;}if(observer)observer.finalize();mark(label,'END');}catch(e){mark(label,e?.code==='DIAGNOSTIC_DEADLINE'?'DEADLINE':'FAILED');throw e;}};
   try{
    context=await browser.newContext({viewport:{width:375,height:900},serviceWorkers:'block'});
    operation='page.new';const page=await context.newPage();page.setDefaultTimeout(5000);page.setDefaultNavigationTimeout(5000);
    if(row.routing){operation='page.route';await page.route('**/*',route=>route.continue());}
    observer=createResponseObserver({contextId:`diagnostic:${engine}:${row.id}`,pageId:'page',bodyTiming:row.bodyTiming,onRecord:r=>{r.diagnosticPhase=currentPhase;row.responses.push(r);}});let errors=0;
    page.on('pageerror',()=>{errors++;});page.on('request',r=>{if(r.url()===`${base}/${row.id}/asset.js`)observer.observeRequest(r);});
    page.on('response',r=>{if(r.url()!==`${base}/${row.id}/asset.js`)return;const phase=currentPhase;pending.push(observer.capture(r,async(body,record)=>{const raw=row.server.filter(s=>s.phase===phase&&s.path===`/${row.id}/asset.js`),entry=raw.length===1?raw[0]:null;record.savedBody={bytes:body.length,sha256:sha(body),base64:body.toString('base64'),serverSequence:entry?.sequence??null,serverEntityStatus:entry?.status??null,matchesServerEntity:!entry||entry.status===304?null:sha(body)===entry.bodySha256,comparisonScope:!entry?'raw server correspondence UNKNOWN':entry.status===304?'304 has no server body; captured bytes are not equated with wire bytes':'captured body versus actual synthetic server record'};}).catch(e=>{row.captureFailures.push(diagnosticFailure(e,{operation:'response.capture',phase}));}));});
    for(const phase of [1,2]){
     active.phase=phase;currentPhase=phase;
     operation='page.setExtraHTTPHeaders';await page.setExtraHTTPHeaders({Accept:row.mode==='vary-change'&&phase===2?accepts.second:accepts.first});
     const before=errors;operation='page.goto';await page.goto(`${base}/${row.id}/`,{waitUntil:'load'});
     operation='page.evaluate';const marker=await page.evaluate(()=>window.__cacheMarker??null);
     operation='marker.textContent';const text=await page.locator('#marker').textContent();
     row.pages.push({phase,at:new Date().toISOString(),marker,text,pageErrorCount:errors-before});operation='capture.settle';await drain();
    }
   }catch(e){row.runError=failure(e,operation);row.operationErrors.push(row.runError);}
   finally{
    if(context)try{mark('context.close','START');await bounded(context.close());mark('context.close','END');}catch(e){mark('context.close','FAILED');row.cleanupError=failure(e,'context.close');row.operationErrors.push(row.cleanupError);row.runError??=row.cleanupError;}
    try{await drain('capture.settle.after-close');row.captureSettlement={status:'SETTLED',observed:row.responses.length};}catch(e){const error=failure(e,'capture.settle.after-close');row.operationErrors.push(error);row.captureSettlement={status:'UNKNOWN',observed:row.responses.length};row.runError??=error;}
    row.assessment=evaluateCacheDiagnostic(row);row.timingAssessment=evaluateDiagnosticTiming(row);row.resourceIntegrity=evaluateDiagnosticResources(row);
   }
  }
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
 const result={schema:3,engine,scope:'synthetic loopback diagnostic only; original production acceptance unchanged',conditions:cacheDiagnosticPlan.length,rows,usedBytes:'UNKNOWN',limitations:['Server wire status and Playwright response status may differ.','DOM marker is a narrow function observation, not proof of every browser-used byte.','Routing and service-worker blocking are explicit diagnostic conditions, not production equivalence.','No screenshots or trace are generated by this diagnostic.']};
 await mkdir(out,{recursive:true});await writeFile(path.join(out,`cache-diagnostic-${engine}.json`),JSON.stringify(result,null,2),{flag:'wx'});return result;
}
