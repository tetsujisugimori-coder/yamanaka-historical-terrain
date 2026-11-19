import {createHash} from 'node:crypto';
/** Observation IDs are local correlation only, never protocol/native IDs. */
export const safeHeaders = input => Object.fromEntries(Object.entries(input ?? {}).map(([k,v])=>[k.toLowerCase(),v]).filter(([k])=>['etag','if-none-match','if-modified-since','vary','cache-control','last-modified','content-type','content-length','accept','accept-encoding','accept-language','origin'].includes(k)));
export function safeUrl(value){const u=new URL(value);u.username='';u.password='';u.search='';u.hash='';return u.href;}
export function correlate304(row,prior){
 if(row.status!==304)return {status:'NOT_APPLICABLE'};
 const candidates=prior.filter(p=>p.status===200&&p.contextId===row.contextId&&p.pageId===row.pageId&&p.url===row.url&&p.urlIdentity===row.urlIdentity&&p.method===row.method&&p.sequence<row.sequence);
 const matched=candidates.filter(p=>{
  const etag=p.responseHeaders?.etag,conditional=row.requestHeaders?.['if-none-match'],current=row.responseHeaders?.etag;
  if(!etag||conditional!==etag||(current!==undefined&&current!==etag))return false;
  const vary=p.responseHeaders?.vary??'',nextVary=row.responseHeaders?.vary;
  if(nextVary!==undefined&&nextVary!==vary)return false;
  return vary.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean).every(k=>['accept','accept-encoding','accept-language','origin'].includes(k)&&typeof p.requestHeaders?.[k]==='string'&&p.requestHeaders[k]===row.requestHeaders?.[k]);
 });
 return {status:matched.length===1?'CANDIDATE_ONLY':'UNKNOWN',candidateIds:matched.map(p=>p.responseId),reason:matched.length===1?'ETag/Vary match is not cache-use or byte proof':'missing, inconsistent or ambiguous prior response',usedBytes:'UNKNOWN'};
}
export function createResponseObserver({contextId,pageId,onRecord,bodyTiming='AS_OBSERVED'}){
 if(!['AS_OBSERVED','AFTER_FINISHED'].includes(bodyTiming))throw Error('UNKNOWN_BODY_TIMING');
 const ids=new WeakMap(),requests=new WeakMap();let next=0,seq=0,inFlight=0;const records=[];
 const requestId=r=>{if(!ids.has(r))ids.set(r,`${contextId}:request-${++next}`);return ids.get(r);};
 const event=phase=>({phase,at:new Date().toISOString(),monotonicMs:performance.now()});
 const observeRequest=req=>{requestId(req);if(!requests.has(req))requests.set(req,event('request'));};
 const finalize=()=>{
  if(inFlight)throw Error('CAPTURES_PENDING');
  for(const record of records){record.correlation=correlate304(record,records.filter(p=>p!==record));record.correlationPhase='ALL_CAPTURES_SETTLED';}
  return {records:records.length,status:'SETTLED',scope:'observed records only; not completeness or used-byte proof'};
 };
 return {records,observeRequest,requestId,finalize,async capture(response,consume){
  const req=response.request(),record={contextId,pageId,requestId:requestId(req),responseId:`${contextId}:response-${++seq}`,sequence:seq,observedAt:new Date().toISOString(),idSemantics:'observer-local; native identifier unavailable',url:safeUrl(response.url()),urlIdentity:createHash('sha256').update(response.url()).digest('hex'),method:req.method(),status:response.status(),requestHeaders:{},responseHeaders:{},body:{status:'NOT_TESTED'},observerErrors:[],events:[...(requests.has(req)?[requests.get(req)]:[]),event('response')],requestTiming:requests.has(req)?'OBSERVED':'NOT_OBSERVED',bodyTiming};
  inFlight++;records.push(record);onRecord(record);
  // Completion observation does not gate the original metadata -> body path.
  const completion=typeof response.finished==='function'?Promise.resolve().then(()=>{record.events.push(event('response-finished-start'));return response.finished();}).then(error=>{record.events.push(event(error?'response-finish-failed':'response-finished'));record.completion={status:error?'FAIL':'FINISHED'};if(error)record.observerErrors.push({operation:'response.finished',error:'response completion failed'});},()=>{record.completion={status:'FAIL'};record.events.push(event('response-finish-failed'));record.observerErrors.push({operation:'response.finished',error:'response completion acquisition failed'});}):Promise.resolve().then(()=>{record.completion={status:'NOT_OBSERVED'};});
  try{
   record.events.push(event('metadata-start'));
   try{record.requestHeaders=safeHeaders(await req.allHeaders());const headers=await response.allHeaders();record.responseHeaders=safeHeaders(headers);record.location=headers.location?safeUrl(new URL(headers.location,response.url()).href):null;const redirected=req.redirectedFrom();record.redirectedFrom=redirected?requestId(redirected):null;record.events.push(event('metadata-succeeded'));}catch{record.observerErrors.push({operation:'metadata',error:'metadata acquisition failed'});record.events.push(event('metadata-failed'));}
   let operation='response.body';
   try{if(bodyTiming==='AFTER_FINISHED'){await completion;if(record.completion.status!=='FINISHED')throw Error('RESPONSE_FINISH_UNCONFIRMED');}record.events.push(event('body-start'));const body=await response.body();record.body={status:'CAPTURED',bytes:body.length};record.events.push(event('body-succeeded'));operation='preserve/validate';record.events.push(event('preservation-start'));await consume(body,record);record.events.push(event('preservation-succeeded'));}catch(e){record.events.push(event(operation==='response.body'?'body-failed':'preservation-failed'));record.body={status:'FAIL',operation,errorClass:e?.name??'Error',errorCode:String(e?.message).includes('Response body is unavailable for redirect responses')?'BODY_UNAVAILABLE_REDIRECT_MESSAGE':'CAPTURE_OR_PRESERVATION_ERROR'};throw Object.assign(Error('response capture failed'),{observation:record});}
  }finally{
   record.events.push(event('capture-await-completion'));await completion;record.events.push(event('capture-completion-released'));record.correlation=correlate304(record,records.filter(p=>p!==record));record.correlationAtCaptureEnd={...record.correlation};record.correlationPhase='CAPTURE_END_PROVISIONAL';inFlight--;record.events.push(event('capture-settled'));
  }
 }};
}
