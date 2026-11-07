// Test-only preserveDrawingBuffer enables reading real rendered framebuffer pixels.
// Product source on disk is never changed. Not a performance benchmark.
import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out='evidence/phase3d/independent/pixels';mkdirSync(out,{recursive:true});
const result={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),started:new Date().toISOString(),testOnlyRendererOption:{preserveDrawingBuffer:true},method:'Actual WebGL canvas PNG framebuffer; same camera A before load, after optional load and after C+D/material-quality cycles. No pixel claim is made from diagnostics alone.',sourceSha256:createHash('sha256').update(readFileSync('src/main.js')).digest('hex'),rows:[]};
const save=()=>writeFileSync(out+'/results.json',JSON.stringify(result,null,2));save();
for(const [engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch();
 for(const width of [375,390]){
  const key=`${engine}-${width}`,row={key},p=await browser.newPage({viewport:{width,height:960},reducedMotion:'reduce'});p.setDefaultTimeout(60000);
  const ready=()=>p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready);
  const mode=async m=>{await p.locator(`[data-landscape-mode=${m}]`).click();await ready();};
  const snap=()=>p.evaluate(()=>window.__terrainDiagnostics());
  const image=async name=>{await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const data=await p.evaluate(()=>window.__independentPixels());const b=Buffer.from(data.split(',')[1],'base64');writeFileSync(`${out}/${key}-${name}.png`,b);return {file:`${key}-${name}.png`,sha256:createHash('sha256').update(b).digest('hex'),bytes:b.length};};
  try{
   await p.route('**/src/main.js*',async route=>{const response=await route.fetch();let body=await response.text();const anchor='new THREE.WebGLRenderer({antialias:true,alpha:false})';assert.equal(body.split(anchor).length,2);body=body.replace(anchor,'new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true})');body=body.replace('window.__terrainDiagnostics=','window.__independentPixels=()=>renderer.domElement.toDataURL("image/png");window.__terrainDiagnostics=');await route.fulfill({response,body});});
   await p.goto(process.env.TEST_URL??'http://127.0.0.1:4393');await ready();await p.locator('#landscape-enter').click();await ready();await mode('a');const before=await snap();row.camera=before.camera;row.target=before.target;row.aBefore=await image('A-before');
   await p.locator('#connected-load').click();await p.waitForFunction(()=>window.__terrainDiagnostics().phase3d.loaded);row.aAfterLoad=await image('A-after-load');assert.equal(row.aAfterLoad.sha256,row.aBefore.sha256,'A_FRAME_CHANGED_BY_LOADER');
   await mode('c');row.c=await image('C');await mode('cd');row.cd=await image('CD');
   row.quality=[];for(const q of ['high','light','balanced']){await mode('cd');await p.locator('#quality').selectOption(q);await mode('a');const s=await snap();assert.deepEqual(s.camera,before.camera);assert.deepEqual(s.target,before.target);const a=await image(`A-after-${q}`);row.quality.push({quality:q,...a});assert.equal(a.sha256,row.aBefore.sha256,'A_FRAME_CHANGED_AFTER_D');}
   await mode('cd');row.stations=[];for(const id of ['ic-lookout','ic-bridge','ic-koguchi','ic-koguchi-inside']){await p.locator(`[data-inner-station=${id}]`).click();await p.waitForFunction(s=>window.__terrainDiagnostics().state.station===s,id);const s=await snap();row.stations.push({id,camera:s.camera,target:s.target,...await image(id)});}
   row.status='PASS';
  }catch(e){row.status='FAIL';row.reason=e.stack;}
  result.rows.push(row);save();console.log(key,row.status,row.reason??'');await p.close();
 }
 await browser.close();
}
result.finished=new Date().toISOString();save();if(result.rows.some(r=>r.status!=='PASS'))process.exitCode=1;
