/** B6n route-only diagnostic. Independent from B6a acceptance. */
import {chromium,webkit} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {runCacheDiagnostics} from './stage3b6c-cache-diagnostic.mjs';
import {route404Plans,evaluateRoute404} from './stage3b6n-route-evaluator.mjs';

const [engine,root]=process.argv.slice(2);
if(!['chromium','webkit'].includes(engine)||!root)throw Error('INVALID_ROUTE_COMPARE_ARGUMENT');
const out=path.join(root,'route-404');
await mkdir(out,{recursive:true});
let browser,report=null,executionFailure=null,closeFailure=null;
try {
 browser=await ({chromium,webkit})[engine].launch({headless:true,timeout:10000});
 const raw=await runCacheDiagnostics(browser,engine,{
  out,plans:route404Plans,terminalNotifications:true
 });
 report=evaluateRoute404(raw.rows);
} catch(e) {
 executionFailure={code:'ROUTE_COMPARE_EXECUTION_FAILED',exceptionType:e?.constructor?.name??'Unknown'};
} finally {
 if(browser) {
  let timer;
  try {
   await Promise.race([browser.close(),new Promise((_,reject)=>{
    timer=setTimeout(()=>reject(Error('ROUTE_COMPARE_CLOSE_DEADLINE')),8000);
   })]);
  } catch(e) {
   closeFailure={code:'ROUTE_COMPARE_CLOSE_FAILED',exceptionType:e?.constructor?.name??'Unknown'};
  } finally {clearTimeout(timer);}
 }
}
const result={engine,head:process.env.GITHUB_SHA??null,
 status:executionFailure||closeFailure?'INCOMPLETE':report?.status??'INCOMPLETE',
 executionFailure,closeFailure,comparison:report,
 scope:'B6N_SYNTHETIC_ONLY',rootCause:'UNKNOWN',productionAcceptance:'NOT_TESTED'};
await writeFile(path.join(out,'comparison.json'),JSON.stringify(result,null,2),{flag:'wx'});
console.log(JSON.stringify({engine,status:result.status,
 routeAssociation:report?.routeAssociation??'UNKNOWN',
 repeatability:report?.repeatability??'UNKNOWN',
 controls:report?.controls?.map(c=>({id:c.id,route:c.route,verified:c.verified,
  completion:c.completion,notificationEvents:c.notificationEvents,
  firstFailure:c.firstFailure}))??[]},null,2));
if(result.status!=='CONTRAST_OBSERVED')process.exitCode=1;
