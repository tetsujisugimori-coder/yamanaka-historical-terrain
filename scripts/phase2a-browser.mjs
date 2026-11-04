import {chromium,webkit,expect} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {canonicalSha256,normalization} from './evidence-hash.mjs';
const root=process.env.TEST_URL??'http://127.0.0.1:4317';
const sourceHashes={};for(const file of ['index.html','src/main.js','src/intent.js','src/surface.js','src/reading.js','src/style.css','public/data/nishinomaru.glb','public/data/nishinomaru.json'])sourceHashes[file]=createHash('sha256').update(await readFile(file)).digest('hex');
const sourceHashesAtExecution={...sourceHashes};for(const file of Object.keys(sourceHashes))sourceHashes[file]=canonicalSha256(file,await readFile(file));
const results=[];await mkdir('evidence/phase2a/browser',{recursive:true});
const meta=JSON.parse(await readFile('public/data/nishinomaru.json','utf8'));
const ready=(p)=>p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready&&window.__terrainDiagnostics().state.view==='reconstruction',null,{timeout:25000});
for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 for(const width of [375,390,765,1280])for(const reducedMotion of ['no-preference','reduce']){
  const row={engine:name,width,reducedMotion,status:'RUNNING',checks:[],pageerrors:[],requestFailures:[]};const key=`${name}-${width}-${reducedMotion}`;
  const context=await browser.newContext({viewport:{width,height:960},hasTouch:width<800,isMobile:width<700,reducedMotion});const page=await context.newPage();page.on('pageerror',e=>row.pageerrors.push(e.message));page.on('requestfailed',r=>row.requestFailures.push({url:r.url(),error:r.failure()?.errorText}));
  try{
   await page.goto(root);await page.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready);
   await page.locator('[data-view=reconstruction]').click();await ready(page);let d=await page.evaluate(()=>window.__terrainDiagnostics());expect(d.reconstruction.visible.filter(id=>id?.startsWith('nm-'))).toHaveLength(6);row.checks.push('new metric GLB loaded with six independently editable meshes');
   if([375,1280].includes(width))await page.screenshot({path:`evidence/phase2a/browser/${key}-overview.png`,fullPage:true});
   async function clickMoat(){await page.locator('#viewport').scrollIntoViewIfNeeded();const box=await page.locator('#viewport').boundingBox(),point=(await page.evaluate(()=>window.__terrainDiagnostics())).facilityScreen.find(f=>f.id==='nm-moat').ndc;await page.mouse.click(box.x+(point[0]+1)*box.width/2,box.y+(1-point[1])*box.height/2);}
   await clickMoat();await expect(page.locator('#detail h2')).toHaveText('西ノ丸 障子堀候補');
   await page.locator('[data-facility=nm-moat]').uncheck();await page.locator('#reconstruction-list [data-id=nm-bailey]').click();await clickMoat();await expect(page.locator('#detail h2')).toHaveText('西ノ丸 曲輪候補');await page.locator('[data-facility=nm-moat]').check();row.checks.push('real mesh picking selects ID; hidden surface cannot be picked');
   for(const f of meta.facilities){await page.locator(`#reconstruction-list [data-id="${f.id}"]`).click();await expect(page.locator('#detail h2')).toHaveText(f.name);await expect(page.locator('#detail')).toContainText('UNKNOWN');await expect(page.locator('#detail .evidence-tag')).toContainText('C');}
   row.checks.push('five IDs select exact names, C status, explanation and sources');
   await page.locator('[data-eye=nm-bailey]').click();await ready(page);d=await page.evaluate(()=>window.__terrainDiagnostics());const camera=d.camera,target=d.target;
   await page.locator('[data-compare=current]').click();await ready(page);d=await page.evaluate(()=>window.__terrainDiagnostics());expect(d.camera).toEqual(camera);expect(d.target).toEqual(target);expect(d.reconstruction.comparison).toBe('current');expect(d.reconstruction.visible).toHaveLength(1);
   await page.locator('[data-compare=restored]').click();await ready(page);d=await page.evaluate(()=>window.__terrainDiagnostics());expect(d.camera).toEqual(camera);expect(d.target).toEqual(target);row.checks.push('A/C comparison preserves exact camera and target in both directions');
   await page.locator('[data-facility=nm-moat]').uncheck();expect((await page.evaluate(()=>window.__terrainDiagnostics())).reconstruction.visible).not.toContain('nm-moat');await page.locator('[data-facility=nm-moat]').check();
   await page.locator('#category-c').uncheck();expect((await page.evaluate(()=>window.__terrainDiagnostics())).reconstruction.visible).toEqual(['nm-context']);await page.locator('#category-c').check();row.checks.push('individual and C category visibility changes actual scene objects');
   await page.locator('#viewport').focus();await page.keyboard.press('ArrowRight');expect((await page.evaluate(()=>window.__terrainDiagnostics())).camera).not.toEqual(camera);await expect(page.locator('#viewport')).toBeFocused();
   await page.locator('#zoom-in').click();await page.locator('#zoom-out').click();await page.locator('[data-eye=nm-passage]').click();await ready(page);row.checks.push('keyboard rotation, focus, zoom and low viewpoint');
   const vp=await page.locator('#viewport').boundingBox();await page.mouse.move(vp.x+vp.width*.45,vp.y+vp.height*.45);await page.mouse.down();await page.mouse.move(vp.x+vp.width*.55,vp.y+vp.height*.5,{steps:5});await page.mouse.up();
   if(width<800)await page.touchscreen.tap(vp.x+vp.width*.5,vp.y+vp.height*.5);row.checks.push('trusted pointer drag and browser touch tap where enabled');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);expect(row.pageerrors).toEqual([]);expect(row.requestFailures).toEqual([]);
   if([375,1280].includes(width))await page.screenshot({path:`evidence/phase2a/browser/${key}.png`,fullPage:true});
   await page.locator('[data-facility=nm-bailey]').uncheck();await page.locator('#reset').click();await page.waitForFunction(()=>window.__terrainDiagnostics().state.ready&&window.__terrainDiagnostics().state.view==='regional');await page.locator('[data-view=reconstruction]').click();await ready(page);expect((await page.evaluate(()=>window.__terrainDiagnostics())).reconstruction.hidden).toEqual([]);await expect(page.locator('[data-facility=nm-bailey]')).toBeChecked();row.checks.push('Reset clears hidden layers and repeated view switches recover');
   row.status='PASS';
  }catch(e){row.status='FAIL';row.reason=e.message;await page.screenshot({path:`evidence/phase2a/browser/${key}-failure.png`,fullPage:true}).catch(()=>{});}
  results.push(row);console.log(`${row.status} ${key}`);await context.close();await writeFile('evidence/phase2a/browser.json',JSON.stringify({scope:'implementation self-verification; emulated engine/viewport, not physical Safari or VoiceOver',testUrl:root,utc:new Date().toISOString(),sourceHashes,sourceHashesAtExecution,hashNormalization:normalization,results},null,2));
 }
 await browser.close();
}
if(results.some(r=>r.status!=='PASS'))process.exitCode=1;
