import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const require=createRequire(import.meta.url);
/** Fixed installed-source observation. Does not alter Playwright or browser behavior. */
export async function runtimeObservation(out){
 const root=path.dirname(require.resolve('playwright-core/package.json'));
 const file=path.join(root,'lib/server/network.js'),bytes=await readFile(file),sha256=createHash('sha256').update(bytes).digest('hex');
 const {Response}=require(file),controls=[];
 for(const status of [200,304,404])for(const timing of ['BEFORE_FINISHED','AFTER_FINISHED']){
  let release,callbackCount=0;const finished=new Promise(r=>release=r),receiver={_status:status,_finishedPromise:finished,_request:{},_getResponseBodyCallback:async()=>{callbackCount++;return Buffer.from('synthetic-control');}};
  if(timing==='AFTER_FINISHED')release();
  const promise=Response.prototype.body.call(receiver);if(timing==='BEFORE_FINISHED')release();
  let result;try{const value=await promise;result={status:'CAPTURED',bytes:value.length};}catch(e){result={status:'FAIL',errorClass:e.name,errorCode:e.message==='Response body is unavailable for redirect responses'?'BODY_UNAVAILABLE_REDIRECT_MESSAGE':'OTHER'};}
  controls.push({status,timing,callbackCount,result});
 }
 await mkdir(path.join(out,'dependency-source'),{recursive:true});await writeFile(path.join(out,'dependency-source/playwright-network.js'),bytes,{flag:'wx'});
 const result={playwright:require('playwright-core/package.json').version,networkSha256:sha256,networkBytes:bytes.length,scope:'installed actual Response.body function with synthetic receiver; not browser/resource acceptance',controls};
 await writeFile(path.join(out,'runtime-observation.json'),JSON.stringify(result,null,2),{flag:'wx'});return result;
}
