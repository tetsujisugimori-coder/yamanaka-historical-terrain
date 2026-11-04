import {chromium,webkit,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {canonicalSha256,sha256} from './evidence-hash.mjs';
const mutation=process.argv.includes('--remove-reset-commit'),red=process.argv.includes('--red')||mutation,root='http://127.0.0.1:4317',body=await readFile('public/data/regional.glb');
let main=await(await fetch(root+'/src/main.js')).text();
if(mutation){const before=main;main=main.replace("if(currentModel){terrainGroup.scale.y=1;paint();applyLayers();placeMarkers();makeRoute();select('castle');focusPreset();}",'');if(main===before)throw Error('Reset mutation did not apply');}
const results=[];
for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch();
 for(const outcome of ['success','404']){
  const row={engine:name,outcome,status:'RUNNING',pageerrors:[]};const page=await browser.newPage({viewport:{width:390,height:960}});page.on('pageerror',e=>row.pageerrors.push(e.message));let release;const gate=new Promise(r=>release=r);
  await page.route('**/src/main.js*',r=>r.fulfill({status:200,contentType:'application/javascript',body:main.replace('async function setView(view,','async function setView(...args){window.__active=(window.__active??0)+1;try{return await measured(...args);}finally{window.__active--;}} async function measured(view,')}));
  await page.route('**/data/regional.glb',async r=>{await gate;await r.fulfill(outcome==='success'?{status:200,contentType:'model/gltf-binary',body}:{status:404,body:'initial A load deliberately delayed'});});
  try{
   const requested=page.waitForRequest('**/data/regional.glb');await page.goto(root);await requested;await page.locator('#reconstruction-list [data-id=nm-moat]').click();await page.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready&&window.__terrainDiagnostics().state.view==='reconstruction');await page.locator('#exaggeration').check();row.before=await page.evaluate(()=>window.__terrainDiagnostics());
   await page.locator('#reset').click();await page.locator('#reconstruction-list [data-id=nm-moat]').click();release();await page.waitForFunction(()=>window.__active===0);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));row.after=await page.evaluate(()=>window.__terrainDiagnostics());
   expect(row.after.state.selected).toBe('nm-moat');expect(row.after.state.view).toBe('reconstruction');expect(row.after.state.exaggeration).toBe(1);expect(row.after.state.ready).toBe(true);expect(row.after.modelBounds[4]).toBeCloseTo(row.before.modelBounds[4]/2,3);expect(row.after.target[1]).toBeLessThan(700);expect(row.pageerrors).toEqual([]);row.status='PASS';
  }catch(e){row.status='FAIL';row.reason=e.message;}
  release();results.push(row);console.log(`${row.status} pending initial A / Reset cancellation ${name} ${outcome}`);await page.close();
 }
 await browser.close();
}
await writeFile(`evidence/review-fixes/reset-cancel-${mutation?'mutation':red?'red':'green'}.json`,JSON.stringify({scope:'real initial A response held while C becomes usable; 2x -> Reset -> C selection -> release A',mutationApplied:mutation,servedModuleSha256:sha256(main),sourceHash:canonicalSha256('src/main.js',await readFile('src/main.js')),results},null,2));if(results.length!==4||(red?results.some(r=>r.status!=='FAIL'):results.some(r=>r.status!=='PASS')))process.exitCode=1;
