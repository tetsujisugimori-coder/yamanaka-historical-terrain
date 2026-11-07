import {chromium,webkit,expect} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {canonicalSha256,sha256,normalization} from './evidence-hash.mjs';
import {readGlb,meshData,triangleSurface} from '../tests/glb-surface.mjs';
const baseline=process.argv.includes('--baseline'),mutation=process.argv.find(x=>x.startsWith('--mutation='))?.split('=')[1];
const phase=baseline?'red':mutation?'mutation-'+mutation:'green',root=process.env.TEST_URL??'http://127.0.0.1:4317';
await mkdir('evidence/review-fixes',{recursive:true});
const original=JSON.parse(await readFile('public/data/features.json','utf8')),facilities=JSON.parse(await readFile('public/data/nishinomaru.json','utf8')).facilities;
const realGlb=await readFile('public/data/phase3f.glb');
const aMesh=meshData(readGlb('public/data/castle.glb'),'A_castle_current'),aHeight=triangleSurface(aMesh.positions,aMesh.indices);
// The preserved metadata describes the preserved Phase2A mesh, not the new C candidate.
const metadataGlb=readGlb('public/data/nishinomaru.glb'),metadataHeight=new Map(facilities.map(f=>{const m=meshData(metadataGlb,f.id);return[f.id,triangleSurface(m.positions,m.indices)];}));
const cGlb=readGlb('public/data/phase3f.glb'),cHeight=new Map(facilities.map(f=>{const m=meshData(cGlb,f.id);return[f.id,triangleSurface(m.positions,m.indices)];}));
const sourceRoot=baseline?(process.env.BASELINE_DIR??'.'):'.';
const hashes={};for(const file of ['src/main.js','src/coordinates.js','src/reading.js','public/data/phase3f.glb','public/data/castle.glb','public/data/nishinomaru.json','public/data/nishinomaru.glb','tests/glb-surface.mjs',...(!baseline?['src/intent.js','src/surface.js']:[])])hashes[file]=canonicalSha256(file,await readFile(`${sourceRoot}/${file}`));
const rawHashes={};for(const file of Object.keys(hashes))rawHashes[file]=sha256(await readFile(`${sourceRoot}/${file}`));
const servedMain=await (await fetch(new URL('src/main.js',root.endsWith('/')?root:root+'/'))).text();
const servedIntent=mutation==='intent'?await (await fetch(new URL('src/intent.js',root.endsWith('/')?root:root+'/'))).text():null;
const results=[];const snapshot=p=>p.evaluate(()=>({diagnostics:window.__terrainDiagnostics(),heading:document.querySelector('#detail h2')?.textContent,renderState:document.body.dataset.renderState,pressed:[...document.querySelectorAll('#feature-list button,#reconstruction-list button')].filter(x=>x.getAttribute('aria-pressed')==='true').map(x=>x.dataset.id)}));
const ready=(p,view)=>p.waitForFunction(v=>window.__terrainDiagnostics?.().state.ready&&(!v||window.__terrainDiagnostics().state.view===v),view,{timeout:30000});
async function instrument(page,row){
 await page.route('**/src/main.js*',async route=>{
  let code=servedMain;
  const marker='async function setView(view,';if(!code.includes(marker))throw Error('setView instrumentation anchor missing');
  code=code.replace(marker,"async function setView(...args){window.__viewActive=(window.__viewActive??0)+1;try{return await measuredView(...args);}finally{window.__viewActive--;}} async function measuredView(view,");
  if(mutation==='height'){const key='function displayedHeight(f){';if(!code.includes(key))throw Error('height mutation anchor missing');code=code.replace(key,key+'return sampleHeight(castle,...f.local);');row.mutationApplied=true;}
  await route.fulfill({status:200,contentType:'application/javascript',body:code}).catch(error=>{if(!row.closing)throw error;});
 });
 if(mutation==='intent')await page.route('**/src/intent.js*',async route=>{const code=servedIntent.replace('token===revision','true');if(code===servedIntent)throw Error('intent mutation anchor missing');row.mutationApplied=true;await route.fulfill({status:200,contentType:'application/javascript',body:code}).catch(error=>{if(!row.closing)throw error;});});
}
async function settled(page){await page.waitForFunction(()=>window.__viewActive===0);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function race(browser,engine,target,outcome,width=390,motion='reduce',matrix=false){
 const row={kind:'P2-01',engine,target,outcome,width,motion,matrix,status:'RUNNING',pageerrors:[]};
 const context=await browser.newContext({viewport:{width,height:960},hasTouch:width<800,isMobile:width<700,reducedMotion:motion}),page=await context.newPage();page.on('pageerror',e=>row.pageerrors.push(e.message));
 let release;const gate=new Promise(r=>release=r);let intercepted=0;
 await instrument(page,row);await page.route('**/data/phase3f.glb',async route=>{intercepted++;await gate;await route.fulfill(outcome==='success'?{status:200,contentType:'model/gltf-binary',body:realGlb}:{status:404,body:'deliberate gated model 404'});});
 try{
  await page.goto(root);await ready(page,'regional');row.before=await snapshot(page);
  const request=page.waitForRequest('**/data/phase3f.glb');await page.locator('#reconstruction-list [data-id=nm-moat]').click();await request;
  if(target.startsWith('view:')){await page.locator(`[data-view=${target.slice(5)}]`).click();await ready(page,target.slice(5));}
  else if(target==='reset'){await page.locator('#reset').click();await ready(page,'regional');}
  else await page.locator(`[data-id="${target}"]`).click();
  row.afterIntent=await snapshot(page);
  const response=page.waitForResponse('**/data/phase3f.glb');release();await response;await settled(page);row.actual=await snapshot(page);row.realGlbResponses=intercepted;
  const expectedId=target==='reset'?'castle':target==='view:study'?'west':target.startsWith('view:')?row.afterIntent.diagnostics.state.selected:target;
  row.expected={id:expectedId,renderState:target.startsWith('nm-')&&outcome==='404'?'error':'ready',view:target.startsWith('nm-')&&outcome==='success'?'reconstruction':target.startsWith('view:')?target.slice(5):'regional'};
  const expectedFeature=[...original,...facilities].find(f=>f.id===expectedId);
  expect(row.actual.diagnostics.state.selected).toBe(expectedId);expect(row.actual.heading).toBe(expectedFeature.name);expect(row.actual.pressed).toEqual([expectedId]);expect(row.actual.renderState).toBe(row.expected.renderState);
  expect(row.actual.diagnostics.state.ready).toBe(row.expected.renderState==='ready');
  if(row.expected.renderState==='ready')expect(row.actual.diagnostics.state.view).toBe(row.expected.view);
  if(!target.startsWith('nm-')){expect(row.actual.diagnostics.camera).toEqual(row.afterIntent.diagnostics.camera);expect(row.actual.diagnostics.target).toEqual(row.afterIntent.diagnostics.target);}
  expect(row.pageerrors).toEqual([]);row.status='PASS';
 }catch(e){row.status='FAIL';row.reason=e.message;if(row.actual&&target==='castle'&&outcome==='success')await page.screenshot({path:`evidence/review-fixes/${phase}-${engine}-selection.png`,fullPage:true});}
 release();results.push(row);console.log(`${phase} ${row.status} ${engine} P2 ${target} ${outcome} ${width}/${motion}`);row.closing=true;await context.close();delete row.closing;
}
async function heights(browser,engine){
 const context=await browser.newContext({viewport:{width:1280,height:960}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const instrumentRow={};await instrument(page,instrumentRow);await page.goto(root);await ready(page,'regional');await page.locator('[data-view=reconstruction]').click();await ready(page,'reconstruction');
 for(const variant of ['restored','current'])for(const scale of [1,2]){
  await page.locator(`[data-compare=${variant}]`).click();await settled(page);await page.locator('#exaggeration').setChecked(scale===2);
  for(const f of facilities){const row={kind:'P3-01',engine,id:f.id,variant,scale,status:'RUNNING',...instrumentRow};
   try{
    await page.locator(`#reconstruction-list [data-id="${f.id}"]`).click();await page.locator('#focus-feature').click();await settled(page);
    const d=(await snapshot(page)).diagnostics,ground=variant==='restored'?cHeight.get(f.id)(f.local[0],-f.local[1]):aHeight(f.local[0],-f.local[1]);
    row.metadataHeight=f.height;row.glbHeight=ground;row.expectedTarget=[f.local[0],ground*scale,-f.local[1]];row.actualTarget=d.target;row.errorMetres=Math.abs(d.target[1]-ground*scale);row.toleranceMetres=.001*scale;
    if(variant==='restored'){row.metadataSource='public/data/nishinomaru.glb';row.metadataGlbHeight=metadataHeight.get(f.id)(f.local[0],-f.local[1]);row.metadataErrorMetres=Math.abs(f.height-row.metadataGlbHeight);expect(row.metadataErrorMetres).toBeLessThan(.001);}
    row.displayedSurfaceSource=variant==='restored'?'public/data/phase3f.glb':'public/data/castle.glb';
    expect(row.errorMetres).toBeLessThanOrEqual(row.toleranceMetres);expect(Math.abs(d.target[0]-f.local[0])).toBeLessThan(1e-8);expect(Math.abs(d.target[2]+f.local[1])).toBeLessThan(1e-8);row.status='PASS';
   }catch(e){row.status='FAIL';row.reason=e.message;}
   results.push(row);console.log(`${phase} ${row.status} ${engine} P3 ${f.id} ${variant} ${scale}x Δ=${row.errorMetres}`);
  }
 }
 if(!baseline&&!mutation){
  for(const variant of ['restored','current'])for(const id of ['nm-bailey','nm-passage']){
   await page.locator(`[data-compare=${variant}]`).click();await settled(page);const before=await snapshot(page);await page.locator(`[data-compare=${variant==='current'?'restored':'current'}]`).click();await settled(page);const after=await snapshot(page);expect(after.diagnostics.camera).toEqual(before.diagnostics.camera);expect(after.diagnostics.target).toEqual(before.diagnostics.target);await page.locator(`[data-compare=${variant}]`).click();await settled(page);
   await page.locator(`[data-eye=${id}]`).click();await settled(page);const f=facilities.find(f=>f.id===id),d=(await snapshot(page)).diagnostics,ground=variant==='restored'?cHeight.get(id)(...f.local.map((x,i)=>i?-x:x)):aHeight(f.local[0],-f.local[1]);expect(d.target[1]).toBeCloseTo(ground*2+1.6,3);results.push({kind:'low-view-comparison',engine,id,variant,scale:2,status:'PASS',expectedTargetY:ground*2+1.6,actualTargetY:d.target[1]});
  }
 }
 expect(errors).toEqual([]);await context.close();
}
for(const [engine,type]of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch();
 if(mutation!=='height'){
  const targets=mutation==='intent'?original.map(f=>f.id):['castle','west','south','route',...facilities.map(f=>f.id),'reset','view:castle','view:study'];
  for(const target of targets)for(const outcome of ['success','404'])await race(browser,engine,target,outcome);
  if(!baseline&&!mutation){let i=0;for(const width of [375,390,765,1280])for(const motion of ['no-preference','reduce']){await race(browser,engine,original[i%4].id,i%2?'404':'success',width,motion,true);i++;}}
 }
 if(mutation!=='intent')await heights(browser,engine);
 await browser.close();await writeFile(`evidence/review-fixes/${phase}.json`,JSON.stringify({scope:'implementation self-verification; actual GLB responses gated explicitly; only setView completion counter instrumented; transformed main module captured once before contexts, not fetched during context shutdown; not physical Safari',baseline,baselineCommit:baseline?'77b015565b79493a05f45c6d959d459546e21526':null,mutation,testUrl:root,sourceHashes:hashes,sourceHashesAtExecution:rawHashes,hashNormalization:normalization,servedModuleSha256:sha256(servedMain),utc:new Date().toISOString(),results},null,2));
}
if(!baseline&&!mutation&&(results.length!==112||results.some(r=>r.status!=='PASS')))process.exitCode=1;
if(baseline&&(results.length!==88||!results.some(r=>r.kind==='P2-01'&&r.status==='FAIL')))process.exitCode=1;
if(mutation==='intent'&&(results.length!==16||results.some(r=>r.status!=='FAIL'||!r.mutationApplied)))process.exitCode=1;
if(mutation==='height'&&(results.length!==40||results.some(r=>!r.mutationApplied||r.status!==(r.variant==='restored'&&r.id!=='nm-transition'?'FAIL':'PASS'))))process.exitCode=1;
