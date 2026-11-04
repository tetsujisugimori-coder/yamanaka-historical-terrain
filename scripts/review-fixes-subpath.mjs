import {chromium,webkit,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {readGlb,meshData,triangleSurface} from '../tests/glb-surface.mjs';
const root=process.env.TEST_URL??'http://127.0.0.1:4320/yamanaka-historical-terrain/';
const f=JSON.parse(await readFile('public/data/nishinomaru.json','utf8')).facilities.find(f=>f.id==='nm-moat');
const heights={};for(const [variant,file,name]of [['restored','nishinomaru','nm-moat'],['current','castle','A_castle_current']]){const m=meshData(readGlb(`public/data/${file}.glb`),name);heights[variant]=triangleSurface(m.positions,m.indices)(f.local[0],-f.local[1]);}
const results=[];
for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch();
 for(const width of [390,1280]){
  const row={engine:name,width,status:'RUNNING',pageerrors:[],assetFailures:[]};const page=await browser.newPage({viewport:{width,height:960},reducedMotion:'reduce'});page.on('pageerror',e=>row.pageerrors.push(e.message));page.on('response',r=>{if(r.url().includes('/data/')&&r.status()!==200)row.assetFailures.push({url:r.url(),status:r.status()});});
  try{
   await page.goto(root);await page.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready);await page.locator('[data-view=reconstruction]').click();await page.waitForFunction(()=>window.__terrainDiagnostics().state.ready&&window.__terrainDiagnostics().state.view==='reconstruction');
   await page.locator('#reconstruction-list [data-id=nm-moat]').click();await page.locator('#focus-feature').click();await expect.poll(()=>page.evaluate(()=>window.__terrainDiagnostics().target[1])).toBeCloseTo(heights.restored,3);
   const before=await page.evaluate(()=>window.__terrainDiagnostics());await page.locator('[data-compare=current]').click();await page.waitForFunction(()=>window.__terrainDiagnostics().state.ready&&window.__terrainDiagnostics().reconstruction.comparison==='current');const after=await page.evaluate(()=>window.__terrainDiagnostics());expect(after.camera).toEqual(before.camera);expect(after.target).toEqual(before.target);
   await page.locator('#focus-feature').click();await expect.poll(()=>page.evaluate(()=>window.__terrainDiagnostics().target[1])).toBeCloseTo(heights.current,3);row.expectedHeights=heights;row.actualAHeight=(await page.evaluate(()=>window.__terrainDiagnostics())).target[1];expect(row.pageerrors).toEqual([]);expect(row.assetFailures).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);row.status='PASS';
  }catch(e){row.status='FAIL';row.reason=e.message;}
  results.push(row);await page.close();console.log(`${row.status} static subpath ${name} ${width}`);
 }
 await browser.close();
}
await writeFile('evidence/review-fixes/subpath.json',JSON.stringify({root,scope:'local static Pages build; no public deployment',results},null,2));if(results.some(r=>r.status!=='PASS'))process.exitCode=1;
