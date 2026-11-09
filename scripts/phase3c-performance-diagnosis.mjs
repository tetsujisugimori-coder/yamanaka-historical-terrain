// Isolate rendering from optional-patch and surface-finish costs on the same browser/pose.
import {webkit,expect} from '@playwright/test';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const out=process.env.DIAGNOSIS_OUT??'evidence/phase3c/performance-diagnosis',root=process.env.TEST_URL??'http://127.0.0.1:4317';
await mkdir(out,{recursive:true});
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),tree=execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim();
const prior=execFileSync('git',['show','05a0df3bf6bba6b90b5b61bbfa16bc85069c9776:src/main.js'],{encoding:'utf8'});
const source=await readFile('src/main.js','utf8'),oldCamera=prior.split('\n').find(l=>l.startsWith(' function beginCameraIntent()')),oldKey=prior.split('\n').find(l=>l.startsWith(" viewport.addEventListener('keydown'"));
const paths=['src/main.js','src/phase3b.js','scripts/phase3c-performance-diagnosis.mjs','public/data/phase3h-inner.glb','public/data/phase3c.json'];
const hashes=Object.fromEntries(await Promise.all(paths.map(async f=>[f,createHash('sha256').update(await readFile(f)).digest('hex')])));
const rows=[];const save=()=>writeFile(out+'/results.json',JSON.stringify({head,tree,hashes,priorCameraSource:'05a0df3bf6bba6b90b5b61bbfa16bc85069c9776',scope:'Linux automated WebKit1280x960, identical600px terrain panel and initial camera, light(no shadows), newcontext percase. finish toggles only surface-finish textures/lighting/fog; C+D flags/people remain because state.drama stays true. Prior variant restores only the exact previous camera-intent and key handler, retaining current fixed materials and geometry. Dispatch CPU+renderer wall time and twoRAF wait are separate. No sustained FPS/GPU memory/real Safari claim.',rows},null,2));
const browser=await webkit.launch();
try{for(const cameraPath of ['current','prior-reintroduced'])for(const inner of [false,true])for(const finish of [false,true])for(let trial=0;trial<3;trial++){
 const row={cameraPath,inner,finish,trial,engine:'webkit',browser:browser.version()},ctx=await browser.newContext({viewport:{width:1280,height:960},deviceScaleFactor:1}),p=await ctx.newPage();p.setDefaultTimeout(60000);
 try{
  await p.route('**/src/main.js*',async r=>{const response=await r.fetch();let body=await response.text();if(cameraPath==='prior-reintroduced'){
   const cameraLine=body.split('\n').find(l=>l.startsWith(' function beginCameraIntent()')),keyLine=body.split('\n').find(l=>l.startsWith(" viewport.addEventListener('keydown'"));
   if(!cameraLine||!keyLine||cameraLine===oldCamera||keyLine===oldKey)throw Error('Prior camera reintroduction anchor missing or unchanged');body=body.replace(cameraLine,oldCamera).replace(keyLine,oldKey);
  }
  const renderLine=body.split('\n').find(l=>/^ function render\([^)]*\)\{/.test(l));if(!renderLine)throw Error('Render instrumentation anchor missing');
  body=body.replace(renderLine,renderLine.replace(/^ function render\(/,' function measuredRenderBody(')+'\n function render(){const t=performance.now();__perf.renderCount++;try{return measuredRenderBody();}finally{__perf.renderMs+=performance.now()-t;}}');
  body=body.replace('function syncLandscape(){','function syncLandscape(){__perf.syncCount++;').replace('function restoreCurrentPresentation(){','function restoreCurrentPresentation(){__perf.restoreCount++;');
  body='const __perf={renderCount:0,renderMs:0,syncCount:0,restoreCount:0};window.__phase3cPerf=__perf;\n'+body;
  await r.fulfill({response,body});});
  await p.goto(root);await p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready);await p.addStyleTag({content:'.workspace{height:600px!important}.guide{height:600px!important;max-height:600px!important;overflow:auto}.terrain-panel{height:600px!important;min-height:600px!important}'});
  await p.locator('#landscape-enter').click();await p.waitForFunction(()=>window.__terrainDiagnostics().state.ready&&window.__terrainDiagnostics().phase3b.visible);
  if(inner){await p.locator('#inner-load').click();await p.waitForFunction(()=>window.__terrainDiagnostics().phase3c.loaded);}
  await p.locator('#quality').selectOption('light');await p.locator('#surface-finish').setChecked(finish);
  await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  row.initial=await p.evaluate(()=>{const d=window.__terrainDiagnostics();return{camera:d.camera,target:d.target,canvas:d.canvas,triangles:d.triangles,drawCalls:d.drawCalls};});
  row.samples=await p.evaluate(async()=>{const samples=[],el=document.querySelector('#viewport');for(let i=0;i<6;i++){Object.assign(window.__phase3cPerf,{renderCount:0,renderMs:0,syncCount:0,restoreCount:0});const t=performance.now();el.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));const dispatched=performance.now();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const ended=performance.now();samples.push({dispatchMs:dispatched-t,rafWaitMs:ended-dispatched,totalMs:ended-t,...window.__phase3cPerf});}return samples;});
  for(const s of row.samples){expect(s.renderCount).toBe(cameraPath==='current'?1:3);expect(s.syncCount).toBe(cameraPath==='current'?0:1);expect(s.restoreCount).toBe(cameraPath==='current'?0:1);}
  row.status='PASS';
 }catch(e){row.status='FAIL';row.reason=e.stack;}
 rows.push(row);await save();console.log(cameraPath,inner,finish,trial,row.status,row.reason??'');await ctx.close();
}}finally{await browser.close();}
if(rows.some(r=>r.status!=='PASS'))process.exitCode=1;
