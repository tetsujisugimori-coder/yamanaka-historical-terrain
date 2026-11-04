import {chromium,webkit,expect} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {canonicalSha256,sha256,normalization} from './evidence-hash.mjs';
const label=process.argv.find(x=>x.startsWith('--label='))?.split('=')[1]??'fixed';
if(!['legacy','defect','fixed','mutation'].includes(label))throw Error('Unknown label');
const root=process.env.TEST_URL??'http://127.0.0.1:4317',sourceRoot=process.env.SOURCE_ROOT??'.';
const body=await readFile(`${sourceRoot}/public/data/regional.glb`),sourceHashes={};
for(const file of ['src/main.js','public/data/regional.glb'])sourceHashes[file]=canonicalSha256(file,await readFile(`${sourceRoot}/${file}`));
if(label!=='legacy')sourceHashes['src/intent.js']=canonicalSha256('src/intent.js',await readFile(`${sourceRoot}/src/intent.js`));
const response=await fetch(root+'/src/main.js');if(!response.ok)throw Error('Cannot load real module');let main=await response.text();
if(label==='mutation'){
 const key='function beginCameraIntent(){if(currentModel)return beginIntent();intents.adjustCamera();}';
 if(!main.includes(key))throw Error('Initial-input mutation did not apply');main=main.replace(key,'function beginCameraIntent(){return beginIntent();}');
}
const marker='async function setView(view,';if(!main.includes(marker))throw Error('Missing completion instrumentation anchor');
main=main.replace(marker,'async function setView(...args){window.__activeViews=(window.__activeViews??0)+1;try{return await measuredView(...args);}finally{window.__activeViews--;}} async function measuredView(view,');
const results=[];await mkdir('evidence/initial-camera',{recursive:true});
const snapshot=p=>p.evaluate(()=>({d:window.__terrainDiagnostics(),renderState:document.body.dataset.renderState,status:document.querySelector('#app-status').textContent,heading:document.querySelector('#detail h2')?.textContent,inputs:window.__trustedInputs}));
for(const [engine,type]of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch();
 const cases=[];
 if(['legacy','defect'].includes(label))for(const input of ['drag','wheel'])for(const outcome of ['success','404'])cases.push({input,outcome,width:1280,motion:'no-preference'});
 else{
  for(const width of [375,390,765,1280])for(const motion of ['no-preference','reduce'])for(const input of ['drag','wheel'])for(const outcome of ['success','404'])cases.push({input,outcome,width,motion});
  for(const input of ['key','tap'])for(const outcome of ['success','404'])cases.push({input,outcome,width:390,motion:'reduce'});
 }
 for(const spec of cases){
  const row={engine,...spec,status:'RUNNING',pageerrors:[],mutationApplied:label==='mutation'};
  const context=await browser.newContext({viewport:{width:spec.width,height:960},reducedMotion:spec.motion});const page=await context.newPage();page.on('pageerror',e=>row.pageerrors.push(e.message));
  await page.addInitScript(()=>{window.__trustedInputs=[];for(const type of ['pointerdown','pointermove','pointerup','wheel','keydown'])document.addEventListener(type,e=>{if(type!=='pointermove'||e.buttons)window.__trustedInputs.push({type,trusted:e.isTrusted});},true);});
  await page.route('**/src/main.js*',r=>r.fulfill({status:200,contentType:'application/javascript',body:main}));
  let release;const gate=new Promise(r=>release=r);
  await page.route('**/data/regional.glb',async r=>{await gate;await r.fulfill(spec.outcome==='success'?{status:200,contentType:'model/gltf-binary',body}:{status:404,body:'explicit initial model failure'});});
  try{
   const requested=page.waitForRequest('**/data/regional.glb');await page.goto(root);await requested;row.before=await snapshot(page);
   await page.locator('#viewport').scrollIntoViewIfNeeded();const box=await page.locator('#viewport canvas').boundingBox(),x=box.x+box.width*.3,y=box.y+box.height*.25;
   if(spec.input==='drag'){await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+45,y+25,{steps:6});await page.mouse.up();}
   if(spec.input==='wheel'){await page.mouse.move(x,y);await page.mouse.wheel(0,240);await page.waitForFunction(()=>window.__trustedInputs.some(x=>x.type==='wheel'));}
   if(spec.input==='key'){await page.locator('#viewport').focus();await page.keyboard.press('ArrowRight');}
   if(spec.input==='tap')await page.mouse.click(x,y);
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));row.afterInput=await snapshot(page);
   release();await page.waitForFunction(()=>window.__activeViews===0);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));row.actual=await snapshot(page);
   expect(row.actual.inputs.length).toBeGreaterThan(0);expect(row.actual.inputs.every(x=>x.trusted)).toBe(true);
   if(spec.outcome==='success'){
    expect(row.actual.d.state.ready).toBe(true);expect(row.actual.d.modelBounds).not.toBeNull();expect(row.actual.renderState).toBe('ready');await expect(page.locator('#reset')).toBeEnabled();
    if(label==='fixed'||label==='mutation'){expect(row.actual.d.camera).toEqual(row.afterInput.d.camera);expect(row.actual.d.target).toEqual(row.afterInput.d.target);if(spec.input!=='tap')expect(row.afterInput.d.camera).not.toEqual(row.before.d.camera);}
   }else{
    expect(row.actual.d.state.ready).toBe(false);expect(row.actual.d.modelBounds).toBeNull();expect(row.actual.renderState).toBe('error');await expect(page.locator('#focus-feature')).toBeDisabled();await page.locator('#feature-list [data-id=west]').click();await expect(page.locator('#detail h2')).toHaveText('西ノ丸・障子堀を読む');
   }
   expect(row.pageerrors).toEqual([]);row.status='PASS';
  }catch(e){row.status='FAIL';row.reason=e.message;}
  release();results.push(row);console.log(`${label} ${row.status} ${engine} ${spec.input} ${spec.outcome} ${spec.width}/${spec.motion}`);await context.close();
  await writeFile(`evidence/initial-camera/${label}.json`,JSON.stringify({label,sourceHashes,hashNormalization:normalization,actualGlbSha256:sha256(body),scope:'Windows implementation self-verification; explicit response gate; actual GLB; trusted Playwright input; only view-completion counter instrumented',results},null,2));
 }
 await browser.close();
}
const count=['legacy','defect'].includes(label)?8:72;
if(results.length!==count||results.some(r=>r.status!==(['defect','mutation'].includes(label)?'FAIL':'PASS')))process.exitCode=1;
