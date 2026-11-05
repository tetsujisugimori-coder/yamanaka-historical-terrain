import {chromium,webkit,expect} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const baseline=process.argv.includes('--baseline');
const results=[],features=JSON.parse(await readFile('public/data/features.json','utf8'));
const sources=JSON.parse(await readFile('public/data/sources.json','utf8'));
await mkdir('evidence/fallback',{recursive:true});
async function verifyReading(page,row){
 expect(await page.locator('#feature-list button').count(),'facility navigation must initialize without WebGL').toBe(features.length);
 for(const f of features){await page.getByRole('button',{name:f.name,exact:true}).click();await expect(page.locator('#detail h2')).toHaveText(f.name);await expect(page.locator('#detail')).toContainText(f.description);expect(await page.locator('#detail .source-inline a').count()).toBe(f.sourceIds.length);}
 row.checks.push('all four facility descriptions and per-facility source links remain usable');
 await page.locator('#sources-open').click();await expect(page.locator('#sources')).toBeVisible();expect(await page.locator('#source-list .source a').count()).toBe(sources.length);
 for(const source of sources){const link=page.locator(`#source-list a[data-source-id="${source.id}"]`);await expect(link).toHaveText(source.title+' ↗');await expect(link).toHaveAttribute('href',source.url);}
 await page.keyboard.press('Escape');await expect(page.locator('#sources-open')).toBeFocused();row.checks.push('complete sources accessible and dialog focus restored');
 await expect(page.locator('#focus-feature')).toBeDisabled();for(const button of ['#zoom-in','#zoom-out','#north','#reset'])await expect(page.locator(button)).toBeDisabled();
 expect(await page.locator('.controls :enabled').count(),'unavailable 3D controls must not stay enabled').toBe(0);row.checks.push('3D controls disabled without disabling reading controls');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);
}
for(const [engineName,engine]of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 const scenarios=baseline?['no-webgl-390','no-webgl-1280']:['no-webgl-390','no-webgl-1280','missing-model','missing-reading','context-lost'];
 for(const scenario of scenarios){
  const width=scenario.endsWith('1280')?1280:390;
  const context=await browser.newContext({viewport:{width,height:960},hasTouch:width===390});const page=await context.newPage();
  const row={engine:engineName,scenario,width,status:'RUNNING',checks:[],pageerrors:[],consoleErrors:[],dataRequests:[]};
  page.on('pageerror',e=>row.pageerrors.push(e.message));page.on('console',m=>{if(m.type()==='error')row.consoleErrors.push(m.text());});page.on('request',r=>{if(r.url().includes('/data/'))row.dataRequests.push(new URL(r.url()).pathname);});
  if(scenario.startsWith('no-webgl')||scenario==='missing-reading')await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;window.__blockedWebGLCalls=0;HTMLCanvasElement.prototype.getContext=function(type,...args){if(['webgl','webgl2','experimental-webgl'].includes(type)){window.__blockedWebGLCalls++;return null;}return original.call(this,type,...args);};});
  if(scenario==='missing-model')await page.route('**/data/regional.glb',r=>r.fulfill({status:404,body:'Deliberate missing terrain model'}));
  if(scenario==='missing-reading')await page.route('**/data/sources.json',r=>r.fulfill({status:404,body:'Deliberate missing reading data'}));
  try{
   await page.goto('http://127.0.0.1:4317');
   if(scenario.startsWith('no-webgl')){
    await expect(page.locator('#app-status')).toContainText('WebGL');
    row.actual={facilityButtons:await page.locator('#feature-list button').count(),detailText:await page.locator('#detail').innerText(),sourceLinks:await page.locator('#source-list a').count(),status:await page.locator('#app-status').innerText()};
    expect(await page.evaluate(()=>window.__blockedWebGLCalls)).toBeGreaterThan(0);row.checks.push('actual WebGL context creation denied; 2D capability unchanged');
    await verifyReading(page,row);await expect(page.locator('body')).toHaveAttribute('data-render-state','unavailable');expect(row.dataRequests.some(p=>p.endsWith('.glb'))).toBe(false);
    row.checks.push('no false 3D-ready status or model fetch');
   }else if(scenario==='missing-model'){
    await expect(page.locator('body')).toHaveAttribute('data-render-state','error');await expect(page.locator('#app-status')).toContainText('3D');await verifyReading(page,row);row.checks.push('model 404 leaves text and sources intact, error visible');
   }else if(scenario==='missing-reading'){
    await expect(page.locator('body')).toHaveAttribute('data-reading-state','error');await expect(page.locator('#reading-status')).toContainText('読み込めません');await expect(page.locator('#source-list')).toContainText('読み込めません');expect(await page.locator('#feature-list button').count()).toBe(0);await expect(page.locator('body')).not.toHaveAttribute('data-render-state','ready');expect(await page.evaluate(()=>window.__blockedWebGLCalls)).toBe(0);await expect(page.locator('#app-status')).not.toContainText('解説と出典は利用できます');row.checks.push('negative control: reading 404 is explicit failure, not a successful text fallback');
   }else{
    await page.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready);
    const kind=await page.evaluate(()=>{const canvas=document.querySelector('#viewport canvas'),gl=canvas.getContext('webgl2'),extension=gl?.getExtension('WEBGL_lose_context');if(extension){extension.loseContext();return 'real WEBGL_lose_context extension';}canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));return 'synthetic context-loss event only';});row.eventKind=kind;
    await expect(page.locator('body')).toHaveAttribute('data-render-state','error');await verifyReading(page,row);expect(await page.evaluate(()=>window.__terrainDiagnostics().state.ready)).toBe(false);row.checks.push('runtime context loss preserves reading and stops reporting ready');
   }
   expect(row.consoleErrors.length,'original failures must be logged').toBeGreaterThan(0);expect(row.pageerrors).toEqual([]);row.status='PASS';
  }catch(e){row.status='FAIL';row.reason=e.message;}
  if(scenario.startsWith('no-webgl')||row.status==='FAIL')await page.screenshot({path:`evidence/fallback/${baseline?'red':'green'}-${engineName}-${scenario}.png`,fullPage:true});
  results.push(row);console.log(`${row.status} ${engineName} ${scenario}: ${row.reason??row.checks.length+' checks'}`);await context.close();
 }
 await browser.close();
}
const sourceHashes={};for(const file of ['index.html','src/main.js','src/intent.js','src/surface.js','src/reading.js']){try{sourceHashes[file]=createHash('sha256').update(await readFile(file)).digest('hex');}catch(e){if(e.code!=='ENOENT')throw e;}}
await writeFile(`evidence/fallback-${baseline?'red':'results'}.json`,JSON.stringify({scope:'implementation self-verification; context injection and missing assets are deliberate, errors must remain observable',sourceHashes,results},null,2));if(results.some(r=>r.status!=='PASS'))process.exitCode=1;
