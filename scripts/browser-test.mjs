import {chromium,webkit,expect} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=process.env.TEST_URL??'http://127.0.0.1:4317';
await mkdir('evidence/browser',{recursive:true});
const results=[];let failures=0;
const sourceHashes={};for(const file of ['index.html','src/main.js','src/reading.js','src/style.css','src/coordinates.js','src/scale.js','public/data/regional.glb','public/data/castle.glb','public/data/moat-study.glb'])sourceHashes[file]=createHash('sha256').update(await readFile(file)).digest('hex');
async function ready(page,view){await page.waitForFunction(v=>window.__terrainDiagnostics?.().state.ready&&(!v||window.__terrainDiagnostics().state.view===v),view,{timeout:20000});}
for(const [engineName,engine]of [['chromium',chromium],['webkit',webkit]]){
 let browser;try{browser=await engine.launch({headless:true});}catch(e){results.push({engine:engineName,status:'NOT_TESTED',reason:e.message});failures++;continue;}
 for(const width of [375,390,765,1280])for(const reducedMotion of ['no-preference','reduce']){
  const key=`${engineName}-${width}-${reducedMotion}`;const row={key,engine:engineName,width,reducedMotion,status:'RUNNING',checks:[],pageerrors:[],failedRequests:[]};const started=performance.now();
  const context=await browser.newContext({viewport:{width,height:960},hasTouch:width<800,isMobile:width<700,reducedMotion,deviceScaleFactor:1});const page=await context.newPage();page.on('pageerror',e=>row.pageerrors.push(e.message));page.on('requestfailed',r=>row.failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
  try{
   await page.goto(root);await ready(page,'regional');row.firstReadyMs=performance.now()-started;
   await expect(page.locator('#detail')).toContainText('山中城の立地');row.initial=await page.evaluate(()=>window.__terrainDiagnostics());
   const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));expect(overflow.scroll).toBeLessThanOrEqual(overflow.client+1);row.checks.push('no horizontal page overflow');
   expect(row.initial.triangles).toBeGreaterThan(80000);expect(row.initial.modelBounds).toEqual([-2000,expect.closeTo(215.29,2),-2000,2000,expect.closeTo(802.57,2),2000]);row.checks.push('actual WebGL and metric terrain bounds');
   if([375,1280].includes(width))await page.screenshot({path:`evidence/browser/${key}-regional.png`,fullPage:true});
   const before=row.initial.camera;await page.locator('#viewport').focus();await page.keyboard.press('ArrowRight');const after=await page.evaluate(()=>window.__terrainDiagnostics().camera);expect(after).not.toEqual(before);expect(await page.locator('#viewport').evaluate(el=>document.activeElement===el)).toBe(true);row.checks.push('keyboard rotation and visible focus target');
   await page.getByRole('button',{name:'拡大',exact:true}).click();await page.getByRole('button',{name:'縮小',exact:true}).click();row.checks.push('zoom controls');
   const vp=await page.locator('#viewport').boundingBox();await page.mouse.move(vp.x+vp.width*.45,vp.y+vp.height*.45);await page.mouse.down();await page.mouse.move(vp.x+vp.width*.6,vp.y+vp.height*.55,{steps:5});await page.mouse.up();const drag=await page.evaluate(()=>window.__terrainDiagnostics().camera);expect(drag).not.toEqual(after);row.checks.push('trusted pointer rotation');
   await page.getByRole('button',{name:'斜面の急さ',exact:true}).click();await expect(page.locator('#legend')).toContainText('60°');await page.getByRole('button',{name:'50m等高帯',exact:true}).click();await expect(page.locator('#legend')).toContainText('50m帯');row.checks.push('slope and contour modes');
   await page.locator('#route-toggle').check();await expect(page.locator('#route-toggle')).toBeChecked();await page.locator('#features-toggle').uncheck();await expect(page.locator('#point-labels')).toBeHidden();await page.locator('#features-toggle').check();row.checks.push('layer controls');
   await page.getByRole('button',{name:'西ノ丸・障子堀を読む',exact:true}).click();await expect(page.locator('#detail h2')).toHaveText('西ノ丸・障子堀を読む');await page.locator('#focus-feature').click();await ready(page,'castle');row.checks.push('facility selection and camera preset');
   await page.locator('#exaggeration').check();await expect(page.locator('#height-mode')).toHaveText('標高倍率 2×（誇張）');const doubled=await page.evaluate(()=>window.__terrainDiagnostics());expect(doubled.modelBounds[4]).toBeCloseTo(610.19*2,2);expect(doubled.modelBounds[0]).toBe(-350);row.checks.push('2x vertical only, disclosed');await page.locator('#exaggeration').uncheck();
   await page.getByRole('button',{name:'障子堀の断面教材',exact:true}).click();await ready(page,'study');await expect(page.locator('#study-note')).toBeVisible();await expect(page.locator('#detail')).toContainText('推定・案内');row.study=await page.evaluate(()=>window.__terrainDiagnostics());expect(row.study.triangles).toBe(203128);row.checks.push('C study, source note, terrain replacement rendering');
   const s=row.study.scale;const measured=await page.locator('#scale').evaluate(el=>el.getBoundingClientRect().width);expect(measured).toBeCloseTo(s.pixels,0);row.checks.push('scale bar CSS width matches perspective projection');
   await page.getByRole('button',{name:'斜面の急さ',exact:true}).click();await expect(page.locator('#legend')).toContainText('茶色のC教材は標高・傾斜・等高帯の凡例対象外（固定色）');row.checks.push('study fixed colour explicitly excluded from measurement legend');
   if([375,1280].includes(width))await page.screenshot({path:`evidence/browser/${key}-study.png`,fullPage:true});
   if(width<800){await page.touchscreen.tap(vp.x+vp.width*.5,vp.y+vp.height*.5);row.checks.push('trusted browser touch tap');}
   await page.getByRole('button',{name:'初期視点に戻す',exact:true}).click();await ready(page,'regional');const reset=await page.evaluate(()=>window.__terrainDiagnostics().state);expect(reset).toEqual({view:'regional',mode:'terrain',selected:'castle',exaggeration:1,route:false,features:true,ready:true});row.checks.push('Reset restores every display state');
   await page.getByRole('button',{name:'資料と精度 ↗',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeHidden();await expect(page.locator('#sources-open')).toBeFocused();row.checks.push('sources dialog keyboard and focus return');
   await expect(page.locator('canvas')).toHaveCount(1);expect(row.pageerrors).toEqual([]);expect(row.failedRequests).toEqual([]);row.status='PASS';
  }catch(e){row.status='FAIL';row.reason=e.stack;failures++;await page.screenshot({path:`evidence/browser/${key}-failure.png`,fullPage:true}).catch(()=>{});}
  row.totalMs=performance.now()-started;results.push(row);console.log(`${row.status} ${key} ${row.checks.length} checks`);await context.close();await writeFile('evidence/browser-results.json',JSON.stringify({scope:'implementation self-verification; browser engines, not physical iPhone',timestamp:new Date().toISOString(),sourceHashes,results},null,2));
 }
 await browser.close();
}
console.log(JSON.stringify({conditions:results.length,pass:results.filter(r=>r.status==='PASS').length,failures}));if(failures)process.exitCode=1;
