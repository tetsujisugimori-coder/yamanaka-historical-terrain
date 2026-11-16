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
async function bounded(promise){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('diagnostic observation deadline')),5000);})]);}finally{clearTimeout(timer);}}
export function diagnosticEntity(mode,phase,requestHeaders={}){
 const changed=phase===2&&mode==='etag-change',marker=changed?'second':'first';
 const body=Buffer.from(phase===2&&mode==='corrupt'?'window.__cacheMarker = ;':`window.__cacheMarker=${JSON.stringify(marker)};document.getElementById('marker').textContent=window.__cacheMarker;`);
 const headers={'content-type':'application/javascript','cache-control':mode==='no-store'?'no-store':'no-cache',etag:changed?'"second"':'"first"',vary:'Accept'};
 let status=200;
 if(phase===2&&mode==='missing')status=404;
 else if(phase===2&&mode==='bad-etag-304'){status=304;headers.etag='"contradictory"';}
 else if(phase===2&&!['no-store','missing','corrupt'].includes(mode)&&requestHeaders['if-none-match']===headers.etag)status=304;
 return {status,headers,body:status===304?Buffer.alloc(0):body,marker};
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
 if(row.mode==='vary-change'&&a[0].requestHeaders.accept===second.requestHeaders.accept)return {status:'UNKNOWN',reason:'Vary request value did not change'};
 if(marker!==(row.mode==='etag-change'?'second':'first'))return {status:'FAIL',reason:'diagnostic function marker differs'};
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
  let status,headers,body;
  if(u.pathname.endsWith('/asset.js'))({status,headers,body}=diagnosticEntity(row.mode,phase,safeHeaders(req.headers)));
  else if(u.pathname===`/${row.id}/`){status=200;headers={'content-type':'text/html','cache-control':'no-store'};body=Buffer.from('<!doctype html><meta charset="utf-8"><div id="marker">unset</div><script src="asset.js"></script>');}
  else {status=404;headers={'content-type':'text/plain','cache-control':'no-store'};body=Buffer.from('not found');}
  row.server.push({sequence:row.server.length+1,phase,at:new Date().toISOString(),method:req.method,path:u.pathname,requestHeaders:safeHeaders(req.headers),status,responseHeaders:safeHeaders(headers),bodyBytes:body.length,bodySha256:sha(body)});
  res.writeHead(status,headers);res.end(body);
 });
 server.requestTimeout=5000;server.headersTimeout=5000;
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
  for(const plan of cacheDiagnosticPlan){
   const row={...plan,engine,scope:'SYNTHETIC_HTTP_DIAGNOSTIC',routing:plan.mode==='routed',usedBytes:'UNKNOWN',server:[],responses:[],captureFailures:[],pages:[]};rows.push(row);active={row,phase:1};
   let context,observer;const pending=[];let currentPhase=1;
   const drain=async()=>{let n=0;while(n<pending.length){const next=pending.length;await bounded(Promise.all(pending.slice(n,next)));n=next;}if(observer)observer.finalize();};
   try{
    context=await browser.newContext({viewport:{width:375,height:900},serviceWorkers:'block'});
    const page=await context.newPage();page.setDefaultTimeout(5000);page.setDefaultNavigationTimeout(5000);
    if(row.routing)await page.route('**/*',route=>route.continue());
    observer=createResponseObserver({contextId:`diagnostic:${engine}:${row.id}`,pageId:'page',bodyTiming:row.bodyTiming,onRecord:r=>{r.diagnosticPhase=currentPhase;row.responses.push(r);}});let errors=0;
    page.on('pageerror',()=>{errors++;});page.on('request',r=>{if(r.url()===`${base}/${row.id}/asset.js`)observer.observeRequest(r);});
    page.on('response',r=>{if(r.url()!==`${base}/${row.id}/asset.js`)return;const phase=currentPhase;pending.push(observer.capture(r,async(body,record)=>{const raw=row.server.filter(s=>s.phase===phase&&s.path===`/${row.id}/asset.js`),entry=raw.length===1?raw[0]:null;record.savedBody={bytes:body.length,sha256:sha(body),base64:body.toString('base64'),serverSequence:entry?.sequence??null,serverEntityStatus:entry?.status??null,matchesServerEntity:!entry||entry.status===304?null:sha(body)===entry.bodySha256,comparisonScope:!entry?'raw server correspondence UNKNOWN':entry.status===304?'304 has no server body; captured bytes are not equated with wire bytes':'captured body versus actual synthetic server record'};}).catch(e=>{row.captureFailures.push({responseId:e.observation?.responseId??null,requestId:e.observation?.requestId??null,phase,operation:e.observation?.body?.operation??'unknown'});}));});
    for(const phase of [1,2]){
     active.phase=phase;currentPhase=phase;
     await page.setExtraHTTPHeaders({Accept:row.mode==='vary-change'&&phase===2?'application/x-diagnostic-second':'application/x-diagnostic-first'});
     const before=errors;await page.goto(`${base}/${row.id}/`,{waitUntil:'load'});
     row.pages.push({phase,at:new Date().toISOString(),marker:await page.evaluate(()=>window.__cacheMarker??null),text:await page.locator('#marker').textContent(),pageErrorCount:errors-before});await drain();
    }
   }catch(e){row.runError={name:e.name,message:'diagnostic operation failed'};}
   finally{if(context)try{await bounded(context.close());}catch(e){row.cleanupError={operation:'context.close',name:e.name,message:'diagnostic context cleanup failed'};row.runError??={name:e.name,message:'diagnostic cleanup incomplete'};}try{await drain();row.captureSettlement={status:'SETTLED',observed:row.responses.length};}catch{row.captureSettlement={status:'UNKNOWN',observed:row.responses.length};row.runError??={name:'Error',message:'capture settlement incomplete'};}row.assessment=evaluateCacheDiagnostic(row);row.timingAssessment=evaluateDiagnosticTiming(row);row.resourceIntegrity=evaluateDiagnosticResources(row);}
  }
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
 const result={schema:1,engine,scope:'synthetic loopback diagnostic only; original production acceptance unchanged',conditions:cacheDiagnosticPlan.length,rows,usedBytes:'UNKNOWN',limitations:['Server wire status and Playwright response status may differ.','DOM marker is a narrow function observation, not proof of every browser-used byte.','Routing and service-worker blocking are explicit diagnostic conditions, not production equivalence.','No screenshots or trace are generated by this diagnostic.']};
 await mkdir(out,{recursive:true});await writeFile(path.join(out,`cache-diagnostic-${engine}.json`),JSON.stringify(result,null,2),{flag:'wx'});return result;
}
