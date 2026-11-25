/** B6n route-on/off synthetic 404 comparison, not a production acceptance gate. */
export const route404Plans = Object.freeze([
 {id:'b6n-off-a',mode:'missing',bodyTiming:'AS_OBSERVED',routeControl:'disabled'},
 {id:'b6n-on-a',mode:'missing',bodyTiming:'AS_OBSERVED',routeControl:'enabled'},
 {id:'b6n-on-b',mode:'missing',bodyTiming:'AS_OBSERVED',routeControl:'enabled'},
 {id:'b6n-off-b',mode:'missing',bodyTiming:'AS_OBSERVED',routeControl:'disabled'}
]);
const asset=entry=>typeof entry?.path==='string'&&entry.path.endsWith('/asset.js');
const validNum=n=>typeof n==='number'&&Number.isFinite(n);
const terminal=e=>e?.scope==='TARGET'&&e.phase===2&&
 ['request','response','requestfinished','requestfailed'].includes(e.event);
export function evaluateRoute404(rows){
 const controls=route404Plans.map(plan=>{
  const matched=(rows??[]).filter(r=>r?.id===plan.id);
  const r=matched.length===1?matched[0]:null;
  const entries=(r?.server??[]).filter(asset);
  const p1=entries.filter(e=>e.phase===1),p2=entries.filter(e=>e.phase===2);
  const first=p1.length===1?p1[0]:null,second=p2.length===1?p2[0]:null;
  const actual=(r?.responses??[]).filter(e=>e.diagnosticPhase===2);
  const observed=actual.length===1?actual[0]:null;
  const rt=r?.routeContrast;
  const events=rt?.events??[];
  const routeOk=rt?.scope==='B6N_SYNTHETIC_ONLY'&&rt.policy===plan.routeControl&&(
    plan.routeControl==='disabled'?events.length===0:
    events.length===2&&events.filter(e=>e.kind==='ROUTE_CONTINUE'&&e.phase===1).length===1&&
                      events.filter(e=>e.kind==='ROUTE_CONTINUE'&&e.phase===2).length===1);
  const sameServerConditions=first?.status===200&&second?.status===404&&
    first.responseHeaders?.['cache-control']==='no-store'&&
    second.responseHeaders?.['cache-control']==='no-store'&&
    first.requestHeaders?.['if-none-match']===undefined&&
    second.requestHeaders?.['if-none-match']===undefined&&
    second.bodyBytes===96&&validNum(second.responseFinishEventMs)&&
    typeof second.bodySha256==='string'&&second.bodySha256.length===64;
  const problems=[];
  if(!r)problems.push('MISSING_OR_DUPLICATE_CONTROL_ROW');
  if(!routeOk)problems.push('ROUTE_CONTROL_UNVERIFIED');
  if(!sameServerConditions)problems.push('SERVER_OR_HEADER_CONDITIONS_DIFFER');
  if(!observed)problems.push('BROWSER_404_RESPONSE_UNAVAILABLE');
  if(observed && observed.status!==404)problems.push('BROWSER_STATUS_NOT_404');
  const notifications=(r?.terminalEvents??[]).filter(terminal).map(e=>({
   event:e.event,failureCategory:e.failure?.category??null
  }));
  return {id:plan.id,route:plan.routeControl,verified:problems.length===0,
   problems,serverStatus:second?.status??null,serverBytes:second?.bodyBytes??null,
   serverBodySha256:second?.bodySha256??null,serverResponseFinished:validNum(second?.responseFinishEventMs),
   serverRequestIfNoneMatch:second?.requestHeaders?.['if-none-match']??null,
   browserStatus:observed?.status??null,bodyStatus:observed?.body?.status??'UNKNOWN',
   capturedBytes:observed?.body?.bytes??null,completion:observed?.completion?.status??'UNKNOWN',
   notificationEvents:notifications,firstFailure:r?.runError?.errorCode??null,
   firstFailureOperation:r?.runError?.operation??null,cleanupFailure:r?.cleanupError?.errorCode??null,
   routeEvents:events,rootCause:'UNKNOWN'};
 });
 const baseline=controls[0]?.serverBodySha256;
 const sameEntity=controls.every(c=>c.verified&&c.serverBodySha256===baseline);
 const signatures=controls.map(c=>JSON.stringify([c.browserStatus,c.bodyStatus,c.capturedBytes,
   c.completion,c.notificationEvents,c.firstFailure,c.firstFailureOperation]));
 const repeatOff=signatures[0]===signatures[3],repeatOn=signatures[1]===signatures[2];
 const verified=controls.length===4&&sameEntity;
 return {schema:1,scope:'B6N_SYNTHETIC_ROUTE_ONLY',status:verified?'CONTRAST_OBSERVED':'INCOMPLETE',
  order:route404Plans.map(p=>p.id),controls,same404EntityAcrossControls:sameEntity,
  repeatability:verified&&repeatOff&&repeatOn?'SAME':'DIFFERENT_OR_UNKNOWN',
  routeAssociation:verified&&repeatOff&&repeatOn?
   (signatures[0]===signatures[1]?'NO_DIFFERENCE_OBSERVED':'DIFFERENCE_OBSERVED'):'UNKNOWN',
  rootCause:'UNKNOWN',browserUsedBytes:'UNKNOWN',
  limitations:['Every response uses no-store to suppress automatic conditional requests in both groups.',
    'The only intended independent variable is route.continue enabled versus absent.',
    'A difference in a synthetic test does not prove historical or production causality.']};
}
