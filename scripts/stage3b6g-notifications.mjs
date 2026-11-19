/** Synchronous notification bookkeeping; IDs never claim native/protocol identity. */
import {safeUrl} from './stage3b6-response-observer.mjs';
export function attachTerminalNotifications(page, observer, {target, phase, events}) {
 const records=new WeakMap(),phases=new WeakMap();
 const mark=(event,req,extra={})=>{
  try {
   const url=req?safeUrl(req.url()):null;
   if(req&&!phases.has(req))phases.set(req,phase());
   events.push({event,monotonicMs:performance.now(),phase:req?phases.get(req):phase(),
    requestId:req?observer.requestId(req):null,responseId:req?records.get(req)?.responseId??null:null,
    scope:req?(req.url()===target?'TARGET':'OUTSIDE_TARGET'):'PAGE',url,
    status:req?records.get(req)?.status??null:null,...extra});
  } catch {events.push({event:'RECORD_FAILED',sourceEvent:event,monotonicMs:performance.now(),phase:phase()});}
 };
 const request=req=>mark('request',req);
 const response=res=>{try{mark('response',res.request(),{status:res.status()});}catch{events.push({event:'RECORD_FAILED',sourceEvent:'response',monotonicMs:performance.now(),phase:phase()});}};
 const finished=req=>mark('requestfinished',req);
 const failed=req=>{
  let failure;
  try {const text=req.failure()?.errorText;failure={status:typeof text==='string'?'RECORDED':'UNAVAILABLE',
    // Fixed categories only. Raw error text may contain private URLs/messages.
    category:typeof text!=='string'?'UNKNOWN':/abort|cancel/i.test(text)?'ABORT_OR_CANCEL':/fail|error/i.test(text)?'FAILURE':'OTHER'};}
  catch {failure={status:'RECORD_FAILED',category:'UNKNOWN'};}
  mark('requestfailed',req,{failure});
 };
 const close=()=>mark('Page.Close',null);
 page.on('request',request);page.on('response',response);page.on('requestfinished',finished);page.on('requestfailed',failed);page.on('close',close);
 return {bind(req,record){records.set(req,record);for(const event of events)if(event.requestId===record.requestId){event.responseId=record.responseId;event.status??=record.status;}},
  summary(requestId){const rows=events.filter(e=>e.requestId===requestId&&e.scope==='TARGET');return {requestfinished:rows.some(e=>e.event==='requestfinished')?'RECORDED':'NOT_RECORDED',requestfailed:rows.some(e=>e.event==='requestfailed')?'RECORDED':'NOT_RECORDED',recordFailure:events.some(e=>e.event==='RECORD_FAILED')};}};
}

export function validateTerminalEvidence(row){
 const events=row.terminalEvents;
 if(!Array.isArray(events)||events.some(e=>e.event==='RECORD_FAILED'||e.failure?.status==='RECORD_FAILED'))return {status:'FAIL',reason:'NOTIFICATION_RECORD_FAILED'};
 if(!row.responses.length)return {status:'FAIL',reason:'TARGET_EVIDENCE_MISSING'};
 for(const response of row.responses){
  const matching=events.filter(e=>e.scope==='TARGET'&&e.requestId===response.requestId);
  if(!matching.some(e=>e.event==='request')||!matching.some(e=>e.event==='response')||matching.some(e=>e.responseId!==response.responseId||e.phase!==response.diagnosticPhase))return {status:'FAIL',reason:'TARGET_CORRESPONDENCE_INVALID'};
 }
 return {status:'OBSERVED',reason:'Request/response correspondence recorded; absent terminal events remain NOT_RECORDED'};
}
