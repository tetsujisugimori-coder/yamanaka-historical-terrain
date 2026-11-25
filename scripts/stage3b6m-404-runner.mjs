/** Isolated B6m 404 conditional-header comparison. Does not run the production matrix. */
import {chromium,webkit} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {runCacheDiagnostics} from './stage3b6c-cache-diagnostic.mjs';
import {conditional404Plans,evaluate404ConditionRows} from './stage3b6m-404-evaluator.mjs';

const [engine,root]=process.argv.slice(2);
if(!['chromium','webkit'].includes(engine)||!root)throw Error('INVALID_B6M_ARGUMENTS');
const out=path.join(root,'if-none-match');
await mkdir(out,{recursive:true});
let browser,report=null,executionFailure=null,closeFailure=null;
try{
 browser=await ({chromium,webkit})[engine].launch({headless:true,timeout:10000});
 const raw=await runCacheDiagnostics(browser,engine,{out,plans:conditional404Plans,terminalNotifications:true});
 report=evaluate404ConditionRows(raw.rows);
}catch(e){executionFailure={code:'B6M_EXECUTION_FAILED',exceptionType:e?.constructor?.name??'Unknown'};}
finally{
 if(browser){
  let timer;
  try{
   await Promise.race([browser.close(),new Promise((_,reject)=>{
    timer=setTimeout(()=>reject(Error('B6M_CLOSE_DEADLINE')),8000);
   })]);
  }catch(e){closeFailure={code:'B6M_CLOSE_FAILED',exceptionType:e?.constructor?.name??'Unknown'};}
  finally{clearTimeout(timer);}
 }
}
const result={engine,head:process.env.GITHUB_SHA??null,
  status:executionFailure||closeFailure?'INCOMPLETE':report?.status??'INCOMPLETE',
  executionFailure,closeFailure,contrast:report,
  note:'No inference about historical 404 origin or product acceptance'};
await writeFile(path.join(out,'comparison.json'),JSON.stringify(result,null,2),{flag:'wx'});
console.log(JSON.stringify({engine,status:result.status,
 conditionAssociation:report?.conditionAssociation??'UNKNOWN',
 repeatability:report?.repeatability??'UNKNOWN',
 controls:report?.controls?.map(r=>({id:r.id,verified:r.verified,completion:r.completion,
  firstFailure:r.firstFailure,notifications:r.notificationSequence}))??[]},null,2));
if(result.status!=='CONTRAST_OBSERVED')process.exitCode=1;
