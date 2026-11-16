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
export function createResponseObserver({contextId,pageId,onRecord}){
 const ids=new WeakMap();let next=0,seq=0;const records=[];
 const requestId=r=>{if(!ids.has(r))ids.set(r,`${contextId}:request-${++next}`);return ids.get(r);};
 return {records,async capture(response,consume){
  const req=response.request(),record={contextId,pageId,requestId:requestId(req),responseId:`${contextId}:response-${++seq}`,sequence:seq,observedAt:new Date().toISOString(),idSemantics:'observer-local; native identifier unavailable',url:safeUrl(response.url()),urlIdentity:createHash('sha256').update(response.url()).digest('hex'),method:req.method(),status:response.status(),requestHeaders:{},responseHeaders:{},body:{status:'NOT_TESTED'},observerErrors:[]};
  records.push(record);onRecord(record);
  try{record.requestHeaders=safeHeaders(await req.allHeaders());const headers=await response.allHeaders();record.responseHeaders=safeHeaders(headers);record.location=headers.location?safeUrl(new URL(headers.location,response.url()).href):null;const redirected=req.redirectedFrom();record.redirectedFrom=redirected?requestId(redirected):null;}catch{record.observerErrors.push({operation:'metadata',error:'metadata acquisition failed'});}
  let operation='response.body';
  try{const body=await response.body();record.body={status:'CAPTURED',bytes:body.length};operation='preserve/validate';await consume(body,record);}catch(e){record.body={status:'FAIL',operation,errorClass:e?.name??'Error',errorCode:String(e?.message).includes('Response body is unavailable for redirect responses')?'BODY_UNAVAILABLE_REDIRECT_MESSAGE':'CAPTURE_OR_PRESERVATION_ERROR'};throw Object.assign(Error('response capture failed'),{observation:record});}
  finally{record.correlation=correlate304(record,records.filter(p=>p!==record));}
 }};
}
