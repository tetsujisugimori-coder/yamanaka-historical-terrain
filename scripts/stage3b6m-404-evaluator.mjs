/** B6m: control-only evaluation; never turns a synthetic HTTP result into production acceptance. */
export const conditional404Plans = Object.freeze([
  {id:'b6m-present-a',mode:'missing',bodyTiming:'AS_OBSERVED',ifNoneMatchControl:'present'},
  {id:'b6m-absent-a',mode:'missing',bodyTiming:'AS_OBSERVED',ifNoneMatchControl:'absent'},
  {id:'b6m-absent-b',mode:'missing',bodyTiming:'AS_OBSERVED',ifNoneMatchControl:'absent'},
  {id:'b6m-present-b',mode:'missing',bodyTiming:'AS_OBSERVED',ifNoneMatchControl:'present'}
]);
const target=entry=>entry?.path?.endsWith('/asset.js');
const term=e=>e?.scope==='TARGET'&&e.phase===2&&
  ['request','response','requestfinished','requestfailed'].includes(e.event);

export function evaluate404ConditionRows(rows){
 const expected=conditional404Plans;
 const summaries=expected.map(plan=>{
  const matching=(rows??[]).filter(r=>r.id===plan.id);
  const row=matching.length===1?matching[0]:null;
  const asset=(row?.server??[]).filter(target);
  const first=asset.filter(e=>e.phase===1);
  const second=asset.filter(e=>e.phase===2);
  const phase1=first.length===1?first[0]:null,phase2=second.length===1?second[0]:null;
  const actualHeader=phase2?.requestHeaders?.['if-none-match']??null;
  const correctHeader=plan.ifNoneMatchControl==='present'?actualHeader==='"first"':actualHeader===null;
  const routes=row?.conditionalRoute?.events??[];
  const routeOk=row?.conditionalRoute?.scope==='BOTH_PHASES_SAME_ROUTE' &&
    row.conditionalRoute.policy===plan.ifNoneMatchControl &&
    routes.length===2 && routes.some(e=>e.phase===1) &&
    routes.some(e=>e.phase===2&&e.after===(plan.ifNoneMatchControl==='present'?'PRESENT':'ABSENT'));
  const serverOk=phase1?.status===200 && phase2?.status===404 &&
    phase2?.bodyBytes===96 && typeof phase2.bodySha256==='string' &&
    typeof phase2.responseFinishEventMs==='number';
  const reply=(row?.responses??[]).filter(e=>e.diagnosticPhase===2);
  const b=reply.length===1?reply[0]:null;
  const events=(row?.terminalEvents??[]).filter(term);
  const notes=[];
  if(!row)notes.push('CONTROL_ROW_MISSING_OR_DUPLICATED');
  if(!routeOk)notes.push('ROUTE_CONTRAST_UNVERIFIED');
  if(!correctHeader)notes.push('SERVER_RECEIVED_HEADER_UNEXPECTED');
  if(!serverOk)notes.push('SERVER_404_OR_96BYTE_CONTROL_INCOMPLETE');
  if(!b)notes.push('BROWSER_404_RESPONSE_MISSING');
  return {
   id:plan.id,condition:plan.ifNoneMatchControl,verified:notes.length===0,
   problems:notes,requestHeader:actualHeader,serverStatus:phase2?.status??null,
   serverBytes:phase2?.bodyBytes??null,serverBodySha256:phase2?.bodySha256??null,
   responseFinishObserved:typeof phase2?.responseFinishEventMs==='number',
   browserStatus:b?.status??null,bodyBytes:b?.body?.bytes??null,
   bodyStatus:b?.body?.status??'UNKNOWN',completion:b?.completion?.status??'UNKNOWN',
   notificationSequence:events.map(e=>e.event),
   firstFailure:row?.runError?.errorCode??null,firstFailureOperation:row?.runError?.operation??null,
   cleanupFailure:row?.cleanupError?.errorCode??null,
   routeEvents:routes,rootCause:'UNKNOWN'
  };
 });
 const baseline=summaries[0]?.serverBodySha256;
 const sameEntity=summaries.every(s=>s.verified&&s.serverBodySha256===baseline);
 const allVerified=summaries.length===4&&sameEntity;
 const signatures=summaries.map(s=>JSON.stringify([s.browserStatus,s.bodyStatus,s.bodyBytes,
   s.completion,s.firstFailure,s.notificationSequence]));
 const uniquePresent=new Set([signatures[0],signatures[3]]);
 const uniqueAbsent=new Set([signatures[1],signatures[2]]);
 return {
  schema:1,scope:'SYNTHETIC_404_IF_NONE_MATCH_ONLY',
  status:allVerified?'CONTRAST_OBSERVED':'INCOMPLETE',
  order:expected.map(p=>p.id),same404EntityAcrossControls:sameEntity,
  controls:summaries,repeatability:uniquePresent.size===1&&uniqueAbsent.size===1?'SAME':'DIFFERENT_OR_UNKNOWN',
  conditionAssociation:allVerified && uniquePresent.size===1 && uniqueAbsent.size===1
    ? (signatures[0]===signatures[1]?'NO_DIFFERENCE_OBSERVED':'DIFFERENCE_OBSERVED')
    :'UNKNOWN',
  rootCause:'UNKNOWN',browserUsedBytes:'UNKNOWN',
  limitations:['Routing is active in both conditions and may alter browser caching.',
    'The only intended contrast is the phase-2 If-None-Match header; verify actual server headers.',
    'A single controlled comparison does not prove causation or production equivalence.']
 };
}
