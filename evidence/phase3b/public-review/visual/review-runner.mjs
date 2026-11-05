import {chromium,webkit} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const dir='evidence/phase3b/public-review/visual';await mkdir(dir,{recursive:true});
const rows=[];const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const ready=p=>p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready,null,{timeout:60000});
const snap=p=>p.evaluate(()=>window.__terrainDiagnostics());
for(const [name,engine]of [['chrome',chromium],['webkit',webkit]]){
const b=await engine.launch(name==='chrome'?{channel:'chrome'}:{});
for(const width of name==='chrome'?[1280,375,390,765]:[390]){
const ctx=await b.newContext({viewport:{width,height:960},reducedMotion:'reduce',hasTouch:width<800});const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
const row={name,width};try{
await p.goto('http://127.0.0.1:4317');await ready(p);await p.locator('#landscape-enter').click();await ready(p);await p.waitForFunction(()=>window.__terrainDiagnostics().phase3b.visible);
for(const id of width===1280||width===390?['wb-gate','wb-moat','wb-bailey','wb-earth','wb-wood']:['wb-gate']){await p.locator(`[data-station=${id}]`).click();await ready(p);await p.locator('#viewport').screenshot({path:`${dir}/${name}-${width}-${id}-default.png`});}
await p.locator('[data-western-overview=wb-moat]').click();await ready(p);
if(width===1280||width===390){await p.locator('#surface-finish').uncheck();await p.locator('#viewport').screenshot({path:`${dir}/${name}-${width}-finish-before.png`});await p.locator('#surface-finish').check();await p.locator('#viewport').screenshot({path:`${dir}/${name}-${width}-finish-after.png`});}
await p.locator('#landscape-list [data-id=wb-building]').click();await ready(p);const prior=await snap(p);await p.locator('#western-building').uncheck();const hidden=await snap(p);row.buildingToggle={selection: hidden.state.selected,hidden:!hidden.phase3b.objects.some(x=>x.id==='wb-building'),cameraPreserved:JSON.stringify(hidden.camera)===JSON.stringify(prior.camera),explanation:await p.locator('#detail').innerText()};await p.locator('#western-building').check();
await p.locator('[data-landscape-mode=a]').click();await ready(p);const a=await snap(p);row.aMode={cameraPreserved:JSON.stringify(a.camera)===JSON.stringify(prior.camera),selectionPreserved:a.state.selected===prior.state.selected,newMeshes:a.phase3b.objects.length};await p.locator('[data-landscape-mode=cd]').click();await ready(p);
row.overflow=await p.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth}));await p.screenshot({path:`${dir}/${name}-${width}-ui.png`,fullPage:true});
if(width===1280){await p.locator('#quality').selectOption('balanced');row.beforeResize=await snap(p);await p.setViewportSize({width:390,height:960});await p.waitForTimeout(100);row.afterResize=await snap(p);await p.locator('#viewport').screenshot({path:`${dir}/chrome-wide-to-narrow.png`});}
row.errors=errors;row.status='completed';
}catch(e){row.status='ERROR';row.reason=e.message;}rows.push(row);await ctx.close();}
await b.close();}
await writeFile(`${dir}/results.json`,JSON.stringify({head,utc:new Date().toISOString(),scope:'Independent browser review runner; no product response mutation in core checks. Reduced motion, existing browsers, no hardware Safari.',rows},null,2));console.log(rows.map(x=>({name:x.name,width:x.width,status:x.status,reason:x.reason,shadowsBefore:x.beforeResize?.phase3b.shadows,shadowsAfter:x.afterResize?.phase3b.shadows,canvasAfter:x.afterResize?.canvas,overflow:x.overflow,errors:x.errors})));
