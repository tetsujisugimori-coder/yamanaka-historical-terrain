/** One trial only. The separate supervisor enforces operation + cleanup hard bounds. */
import {writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,appendFileSync} from 'node:fs';
import path from 'node:path';
import {validateTerminalEvidence} from './stage3b6g-notifications.mjs';
import {runCacheDiagnostics} from './stage3b6c-cache-diagnostic.mjs';
const [engine,mode]=process.argv.slice(2);
if(!['chromium','webkit'].includes(engine)||!['no-store','missing'].includes(mode))throw Error('INVALID_FIXED_PLAN');
const out=process.env.B6G_OUT;if(!out)throw Error('OUTPUT_REQUIRED');
await mkdir(out,{recursive:true});
const events=[];const mark=kind=>events.push({kind,monotonicMs:performance.now()});
const result={status:'BLOCKED',firstFailure:null,engine,mode,events};let browser;
const fail=code=>{result.firstFailure??=code;mark(code);};
const checkpoint=entry=>{
 appendFileSync(path.join(out,'progress.jsonl'),JSON.stringify(entry)+'\n');
 if(entry.kind==='first-error')result.firstFailure??=entry.error.errorCode;
 writeFileSync(path.join(out,'worker-result.json'),JSON.stringify({...result,lastCheckpoint:entry}));
};
const save=()=>writeFile(path.join(out,'worker-result.json'),JSON.stringify(result,null,2));
try {
 const modulePath=process.env.B6G_PLAYWRIGHT_MODULE??'playwright';
 const {chromium,webkit}=await import(modulePath);
 // Runner cannot silently select a newer runtime. Supplied package.json is read-only.
 const pkgBytes=readFileSync(process.env.B6G_PLAYWRIGHT_PACKAGE??new URL('../node_modules/playwright/package.json',import.meta.url));
 const pkg=JSON.parse(pkgBytes);
 if(pkg.version!=='1.56.1')throw Error('RUNTIME_VERSION_MISMATCH');
 result.runtime={version:pkg.version,packageSha256:createHash('sha256').update(pkgBytes).digest('hex')};
 mark('launch-start');browser=await ({chromium,webkit})[engine].launch({headless:true,timeout:10000});mark('launch-end');
 result.status='OBSERVED';
 const diagnostic=await runCacheDiagnostics(browser,engine,{out,plans:[{id:`b6g-${mode}`,mode,bodyTiming:'AS_OBSERVED'}],terminalNotifications:true,onProgress:checkpoint});
 result.row=diagnostic.rows[0];result.firstFailure=result.row.runError?.errorCode??null;
 // Observed diagnostic failure is never promoted to acceptance success.
 result.diagnostic=result.row.runError?'INCOMPLETE':result.row.assessment.status;
 result.notificationIntegrity=validateTerminalEvidence(result.row);
 if(result.notificationIntegrity.status==='FAIL'){fail(result.notificationIntegrity.reason);result.status='FAIL';}
} catch {
 fail(browser?'DIAGNOSTIC_OPERATION_FAILED':'LAUNCH_OR_RUNTIME_BLOCKED');result.status=browser?'FAIL':'BLOCKED';
} finally {
 await save();
 if(browser){
  mark('browser.close-start');let timer;
  try {await Promise.race([browser.close(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('CLOSE_DEADLINE')),Number(process.env.B6G_CLOSE_MS??5000));})]);mark('browser.close-end');}
  catch {fail('BROWSER_CLOSE_FAILED');result.status='FAIL';}
  finally {clearTimeout(timer);}
 }
 await save();
}
// Do not force process.exit(): supervisor must detect and terminate residual handles/processes.
process.exitCode=result.status==='BLOCKED'?2:result.status==='FAIL'?1:0;
