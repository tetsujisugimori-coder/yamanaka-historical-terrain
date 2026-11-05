import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=process.env.TEST_URL??'http://127.0.0.1:4317',stage=process.env.SEPARATION_STAGE??'green',dir=process.env.SEPARATION_EVIDENCE??`evidence/phase3b/p2-separation/${stage}`;
const engines=(process.env.SEPARATION_ENGINES??'chromium,webkit').split(','),widths=(process.env.SEPARATION_WIDTHS??'375,390,765,1280').split(',').map(Number),rows=[];
await mkdir(dir,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const hashes={};for(const f of ['src/main.js','src/phase3b.js','scripts/phase3b-separation-browser.mjs'])hashes[f]=hash(await readFile(f));
const ready=async p=>{await p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready,{timeout:45000});await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
const snapshot=p=>p.evaluate(()=>window.__separationProbe());
function checkBase(s){assert.equal(s.shadows,false,'A/C base renderer shadowMap');assert.equal(s.castShadow,false,'A/C light castShadow');assert.deepEqual(s.light,[-1500,3000,-1500],'A/C base light position');assert.deepEqual(s.target,[0,0,0]);assert.equal(s.intensity,2);assert.equal(s.ambient,2.1);assert.equal(s.fog,null,'A/C fog absent');assert.equal(s.background,'e2e9de');assert.equal(s.materials.filter(m=>m.map||m.bump||m.roughnessMap).length,0,'A/C material D maps absent');assert.equal(s.western,false);}
for(const name of engines){
 const browser=await (name==='webkit'?webkit:chromium).launch(name==='chromium'&&process.env.SEPARATION_CHROMIUM_PATH?{executablePath:process.env.SEPARATION_CHROMIUM_PATH,args:['--no-sandbox']}:{});
 for(const width of widths)for(const reducedMotion of ['no-preference','reduce']){
  const row={engine:name,browser:browser.version(),width,reducedMotion,stage,checks:[]},context=await browser.newContext({viewport:{width,height:960},reducedMotion,deviceScaleFactor:1}),p=await context.newPage();p.setDefaultTimeout(45000);const pageerrors=[];p.on('pageerror',e=>pageerrors.push(e.message));
  try{
   let source=await (await p.request.get(root+'/src/main.js')).text();
   if(stage==='mutation')source=source.replace("active&&comparison==='restored'&&state.drama","active&&state.drama");
   const probe=`window.__separationProbe=()=>({shadows:renderer.shadowMap.enabled,castShadow:light.castShadow,light:light.position.toArray(),target:light.target.position.toArray(),intensity:light.intensity,ambient:ambient.intensity,fog:scene.fog?{near:scene.fog.near,far:scene.fog.far}:null,background:scene.background.getHexString(),western:westernGroup.visible,materials:currentModel.children.filter(o=>o.isMesh).map(o=>({name:o.name,map:Boolean(o.material.map),bump:Boolean(o.material.bumpMap),roughnessMap:Boolean(o.material.roughnessMap),vertexColors:o.material.vertexColors,cast:o.castShadow,receive:o.receiveShadow})),camera:camera.position.toArray(),cameraTarget:controls.target.toArray()});`;
   assert.ok(source.includes('window.__terrainDiagnostics='),'probe injection anchor');source=source.replace('window.__terrainDiagnostics=',probe+'window.__terrainDiagnostics=');
   await p.route('**/src/main.js*',r=>r.fulfill({status:200,contentType:'application/javascript',body:source}));
   await p.goto(root);await ready(p);await p.locator('#landscape-enter').click();await ready(p);await p.locator('[data-landscape-mode=cd]').click();await ready(p);await p.locator('#surface-finish').check();await p.locator('#quality').selectOption('high');await ready(p);
   row.cd=await snapshot(p);assert.equal(row.cd.fog.near,220);assert.equal(row.cd.shadows,true);assert.ok(row.cd.materials.some(m=>m.map));
   await p.locator('[data-landscape-mode=a]').click();await ready(p);row.a=await snapshot(p);
   const a1=await p.locator('#viewport canvas').screenshot();await writeFile(`${dir}/${name}-${width}-${reducedMotion}-a-after-d.png`,a1);
   // Simulate stale/programmatic control values as well as normal UI transitions. Disabled UI alone is not a rendering guard.
   await p.locator('#surface-finish').evaluate(el=>{el.checked=false;el.dispatchEvent(new Event('change',{bubbles:true}));});await ready(p);
   const a2=await p.locator('#viewport canvas').screenshot();await writeFile(`${dir}/${name}-${width}-${reducedMotion}-a-without-d.png`,a2);
   row.aHashes=[hash(a1),hash(a2)];row.equalPixels=a1.equals(a2);row.aWithoutD=await snapshot(p);
   checkBase(row.a);assert.ok(row.equalPixels,'same A camera/canvas PNG bytes are invariant to D switch');row.checks.push('A actual materials/light/shadows/fog/background and exact PNG invariant');
   for(const mode of ['cd','a','c','cd','a']){await p.locator(`[data-landscape-mode=${mode}]`).click();await ready(p);if(mode==='cd'){await p.locator('#surface-finish').check();await ready(p);}if(mode==='a')checkBase(await snapshot(p));if(mode==='c'){const s=await snapshot(p);s.western=false;checkBase(s);}}
   row.checks.push('repeated A/C/C+D transitions');
   await p.locator('[data-landscape-mode=a]').click();await ready(p);
   for(const quality of ['light','balanced','high']){await p.locator('#quality').evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));},quality);await p.locator('#surface-finish').evaluate(el=>{el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}));});await ready(p);checkBase(await snapshot(p));}
   await p.setViewportSize({width:width===375?1280:375,height:960});await ready(p);checkBase(await snapshot(p));await p.setViewportSize({width,height:960});await ready(p);
   await p.locator('#exaggeration').check();await ready(p);checkBase(await snapshot(p));await p.locator('#exaggeration').uncheck();await ready(p);checkBase(await snapshot(p));row.checks.push('quality/stale finish changes, resize and exaggeration do not introduce D in A');
   await p.locator('#reset').click();await ready(p);checkBase(await snapshot(p));row.checks.push('reset exits landscape into base renderer');
   assert.deepEqual(pageerrors,[],'no pageerror');row.status='PASS';
  }catch(e){row.status='FAIL';row.error=e.stack;}
  rows.push(row);await context.close();
 }
 await browser.close();
}
await writeFile(`${dir}/results.json`,JSON.stringify({stage,head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),hashes,utc:new Date().toISOString(),scope:'Implementation self-verification. Actual automated browser click paths and read-only instrumentation of actual renderer state. Synthetic stale-control dispatch explicitly identified. Not hardware Safari.',rows},null,2));
console.log(JSON.stringify({stage,total:rows.length,pass:rows.filter(r=>r.status==='PASS').length,fail:rows.filter(r=>r.status==='FAIL').length,errors:rows.filter(r=>r.status==='FAIL').map(r=>r.error.split('\n')[0])}));
if(stage==='red'||stage==='mutation'){assert.ok(rows.every(r=>r.status==='FAIL'&&r.error.includes('A/C base renderer shadowMap')),'all negative cases must reject specifically D leakage');}else assert.ok(rows.every(r=>r.status==='PASS'),'all checks must complete');
