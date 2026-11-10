import {ACTIVE_TERRAIN,ACTIVE_CONTRACT_SHA256} from './active-terrain-contract.mjs';
import {chromium,webkit,expect} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),tree=execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim();
import {canonicalSha256,normalization} from './evidence-hash.mjs';
import {applyPhase2aFault,phase2aNegativeAccepted} from './phase2a-fallback-mutation.mjs';
const root=process.env.TEST_URL??'http://127.0.0.1:4317';
const output=process.env.PHASE2A_FALLBACK_OUT??'evidence/phase2a';
const sourceHashes={};for(const file of ['scripts/phase2a-fallback.mjs','scripts/phase2a-fallback-mutation.mjs','index.html','src/main.js','src/intent.js','src/surface.js','src/reading.js',`public/data/${ACTIVE_TERRAIN.stem}.glb`,'public/data/nishinomaru.json'])sourceHashes[file]=createHash('sha256').update(await readFile(file)).digest('hex');
const sourceHashesAtExecution={...sourceHashes};for(const file of Object.keys(sourceHashes))sourceHashes[file]=canonicalSha256(file,await readFile(file));
const baseline=process.argv.includes('--negative-control');const results=[];
for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch(name==='webkit'&&process.env.WEBKIT_EXECUTABLE?{executablePath:process.env.WEBKIT_EXECUTABLE}:{});
 for(const scenario of baseline?['hidden-pick','superseded-load']:['no-webgl','new-model-404','new-reading-404','context-lost','hidden-pick','superseded-load']){
  const row={engine:name,scenario,status:'RUNNING',pageerrors:[],injectionHits:[]};const context=await browser.newContext({viewport:{width:390,height:960},reducedMotion:'reduce'});const page=await context.newPage();page.on('pageerror',e=>row.pageerrors.push(e.message));
  let release;const gate=new Promise(resolve=>release=resolve);
  if(baseline){
   const module=scenario==='hidden-pick'?'main':'intent';
   await page.route(`**/src/${module}.js*`,async route=>{const response=await route.fetch(),before=await response.text(),mutation=applyPhase2aFault(before,scenario);row.mutationApplied=mutation.code!==before;row.mutatedModule=module;row.mutationAnchor=mutation.anchor;await route.fulfill({response,body:mutation.code});});
  }
  if(scenario==='no-webgl')await page.addInitScript(()=>{const old=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes('webgl')?null:old.call(this,type,...args);};});
  if(['new-model-404','superseded-load'].includes(scenario))await page.route(`**/data/${ACTIVE_TERRAIN.stem}.glb`,async route=>{row.injectionHits.push(route.request().url());if(scenario==='superseded-load')await gate;await route.fulfill({status:404,body:'deliberate missing reconstruction'});});
  if(scenario==='new-reading-404')await page.route('**/data/nishinomaru.json',r=>r.fulfill({status:404,body:'deliberate missing reading'}));
  try{
   await page.goto(root);
   if(scenario==='new-reading-404'){await expect(page.locator('body')).toHaveAttribute('data-reading-state','error');await expect(page.locator('#app-status')).not.toContainText('解説と出典は利用できます');}
   else{
    if(scenario!=='no-webgl')await page.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready);
    if(scenario==='new-model-404'){await page.locator('[data-view=reconstruction]').click();await expect(page.locator('body')).toHaveAttribute('data-render-state','error');}
    if(scenario==='context-lost'){
     await page.locator('[data-view=reconstruction]').click();await page.waitForFunction(()=>window.__terrainDiagnostics().state.ready&&window.__terrainDiagnostics().state.view==='reconstruction');
     row.lossKind=await page.evaluate(()=>{const c=document.querySelector('canvas'),gl=c.getContext('webgl2'),ext=gl.getExtension('WEBGL_lose_context');if(ext){ext.loseContext();return 'native extension';}c.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));return 'synthetic event';});await expect(page.locator('body')).toHaveAttribute('data-render-state','error');
    }
    if(scenario==='superseded-load'){
     const requested=page.waitForRequest(`**/data/${ACTIVE_TERRAIN.stem}.glb`);await page.locator('[data-view=reconstruction]').click();await requested;await page.locator('[data-view=regional]').click();
     await page.waitForFunction(()=>window.__terrainDiagnostics().state.ready&&window.__terrainDiagnostics().state.view==='regional');const response=page.waitForResponse(`**/data/${ACTIVE_TERRAIN.stem}.glb`);release();await response;await page.waitForTimeout(250);row.failureWitness=await page.evaluate(()=>({renderState:document.body.dataset.renderState,view:window.__terrainDiagnostics().state.view}));await expect(page.locator('body')).toHaveAttribute('data-render-state','ready');expect((await page.evaluate(()=>window.__terrainDiagnostics())).state.view).toBe('regional');
    }else if(scenario==='hidden-pick'){
     await page.locator('[data-view=reconstruction]').click();await page.waitForFunction(()=>window.__terrainDiagnostics().state.ready&&window.__terrainDiagnostics().state.view==='reconstruction');
     async function pick(){await page.locator('#viewport').scrollIntoViewIfNeeded();const d=await page.evaluate(()=>window.__terrainDiagnostics()),box=await page.locator('#viewport').boundingBox(),ndc=d.facilityScreen.find(f=>f.id==='nm-moat').ndc;await page.mouse.click(box.x+(ndc[0]+1)*box.width/2,box.y+(1-ndc[1])*box.height/2);}
     await pick();await expect(page.locator('#detail h2')).toHaveText('西ノ丸 障子堀候補');await page.locator('[data-facility=nm-moat]').uncheck();await page.locator('#reconstruction-list [data-id=nm-bailey]').click();await pick();row.failureWitness=await page.evaluate(()=>({selected:window.__terrainDiagnostics().state.selected,hidden:window.__terrainDiagnostics().reconstruction.hidden}));await expect(page.locator('#detail h2')).toHaveText('西ノ丸 曲輪候補');
    }else{
     for(const id of ['nm-bailey','nm-moat','nm-rampart','nm-passage','nm-transition']){await page.locator(`#reconstruction-list [data-id="${id}"]`).click();await expect(page.locator('#detail')).toContainText('UNKNOWN');}
     await expect(page.locator('#focus-feature')).toBeDisabled();expect(await page.locator('#reconstruction-controls fieldset:enabled').count()).toBe(0);await page.locator('#sources-open').click();await expect(page.locator('#source-list')).toContainText('環境整備事業');await page.keyboard.press('Escape');await expect(page.locator('#sources-open')).toBeFocused();
    }
   }
   if(['new-model-404','superseded-load'].includes(scenario))expect(row.injectionHits.length,'active terrain fault route reached').toBeGreaterThan(0);expect(row.pageerrors).toEqual([]);if(baseline)expect(row.mutationApplied,'negative control must change the served implementation').toBe(true);row.status='PASS';
  }catch(e){row.status='FAIL';row.reason=e.message;}
  release();results.push(row);console.log(`${row.status} ${name} ${scenario}`);await context.close();
 }
 await browser.close();
}
await mkdir(output,{recursive:true});await writeFile(`${output}/${baseline?'negative-controls':'fallback'}.json`,JSON.stringify({head,tree,activeContractSha256:ACTIVE_CONTRACT_SHA256,scope:baseline?'Mutation negative control: deliberately remove visibility and stale-request safeguards; expected FAIL':'Implementation self-verification with deliberate faults; physical device NOT_TESTED',utc:new Date().toISOString(),sourceHashes,sourceHashesAtExecution,hashNormalization:normalization,results},null,2));
if(baseline?!phase2aNegativeAccepted(results):results.some(r=>r.status!=='PASS'))process.exitCode=1;
