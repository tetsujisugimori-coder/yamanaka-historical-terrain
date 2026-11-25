/** B6l independent synthetic 404/304 transport observer; never product acceptance. */
import {chromium,webkit} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {runCacheDiagnostics} from './stage3b6c-cache-diagnostic.mjs';

const engine=process.argv[2];
const out=process.argv[3];
if(!['chromium','webkit'].includes(engine)||!out)throw Error('ENGINE_OR_OUTPUT_INVALID');
await mkdir(out,{recursive:true});
const startedAt=new Date().toISOString();
let browser,diag,runFailure=null,cleanupFailure=null;
const plans=[
 {id:'b6l-missing-404',mode:'missing',bodyTiming:'AS_OBSERVED'},
 {id:'b6l-revalidate-304',mode:'revalidate',bodyTiming:'AS_OBSERVED'}
];
try{
 browser=await ({chromium,webkit})[engine].launch({headless:true,timeout:10000});
 diag=await runCacheDiagnostics(browser,engine,{out,plans,terminalNotifications:true});
}catch(e){runFailure={kind:'DIAGNOSTIC_OR_LAUNCH_FAILED',exceptionType:e?.constructor?.name??'Unknown'};}
finally{
 if(browser){
  let timer;
  try{
   await Promise.race([browser.close(),new Promise((_,reject)=>{
    timer=setTimeout(()=>reject(Error('CLOSE_DEADLINE')),8000);
   })]);
  }catch(e){cleanupFailure={kind:'BROWSER_CLOSE_FAILED',exceptionType:e?.constructor?.name??'Unknown'};}
  finally{clearTimeout(timer);}
 }
}
const rows=(diag?.rows??[]).map(row=>{
 const asset=row.server.filter(entry=>entry.path.endsWith('/asset.js'));
 const expectedSecond=row.mode==='missing'?404:304;
 const serverSequence=[200,expectedSecond];
 const serverStatusObserved=asset.length===2&&asset.every((entry,i)=>entry.status===serverSequence[i]);
 const finished=asset.map(entry=>({
  phase:entry.phase,status:entry.status,socketId:entry.socketId??null,
  responseFinish:typeof entry.responseFinishEventMs==='number'?'RECORDED':'NOT_RECORDED',
  responseClose:entry.transportEvents?.some(e=>e.kind==='response-close')??false,
  requestClose:entry.transportEvents?.some(e=>e.kind==='request-close')??false,
  requestAborted:entry.transportEvents?.some(e=>e.kind==='request-aborted')??false,
  responseError:entry.transportEvents?.some(e=>e.kind==='response-error')??false
 }));
 const browser= row.responses.map(entry=>({
  phase:entry.diagnosticPhase,status:entry.status,requestId:entry.requestId,
  responseId:entry.responseId,bodyStatus:entry.body?.status??'UNKNOWN',
  bodyBytes:entry.body?.bytes??null,completion:entry.completion?.status??'UNKNOWN',
  terminal:row.terminalEvents?.filter(ev=>ev.requestId===entry.requestId)
    .filter(ev=>['request','response','requestfinished','requestfailed'].includes(ev.event))
    .map(ev=>ev.event)??[]
 }));
 return {id:row.id,mode:row.mode,serverStatusObserved,server:finished,browser,
  rawRunError:row.runError?.errorCode??null,rawAssessment:row.assessment?.status??'UNKNOWN',
  observationStatus:serverStatusObserved?'SERVER_STATUS_OBSERVED':'INCOMPLETE',
  browserUsedBytes:'UNKNOWN',causalLayer:'UNKNOWN'};
});
const record={
 schema:1,scope:'B6L_SYNTHETIC_HTTP_DIAGNOSTIC_ONLY',engine,startedAt,
 endedAt:new Date().toISOString(),status:runFailure||cleanupFailure||rows.length!==2?'INCOMPLETE':'RECORDED',
 runFailure,cleanupFailure,transport:diag?.transport??[],rows,
 source:'cache-diagnostic-'+engine+'.json',
 browserUsedBytes:'UNKNOWN',rootCause:'UNKNOWN',
 notes:[
  'A 304 body is empty; server status, Playwright body capture, DOM marker and actual cache-used bytes are distinct.',
  'A 404 body dispatched by the server is not proof of bytes observed by the browser.',
  'Synthetic loopback is independent from B6a production matrix; no acceptance is inferred.'
 ]
};
await writeFile(path.join(out,'b6l-http-observation-'+engine+'.json'),JSON.stringify(record,null,2),{flag:'wx'});
if(record.status==='INCOMPLETE'||rows.some(row=>!row.serverStatusObserved))process.exitCode=1;
console.log(JSON.stringify({status:record.status,engine,rows:rows.map(r=>({id:r.id,serverStatusObserved:r.serverStatusObserved,rawRunError:r.rawRunError,causalLayer:r.causalLayer})),browserUsedBytes:'UNKNOWN'}));
