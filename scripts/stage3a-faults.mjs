import {chromium,expect} from '@playwright/test';import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const out=process.env.STAGE3A_FAULT_OUT||'evidence/stage3a/faults',url=process.env.TEST_URL||'http://127.0.0.1:4391';mkdirSync(out,{recursive:true});
const browser=await chromium.launch(),report={scope:'Browser network fault injection, no physical device claim',rows:[]},save=()=>writeFileSync(out+'/results.json',JSON.stringify(report,null,2));
for(const kind of ['missing-glb','corrupt-glb','wrong-manifest-id','missing-research','bad-drawing-id','late-load','webgl-unavailable']){
 const context=await browser.newContext({viewport:{width:390,height:960}}),p=await context.newPage(),row={kind};p.setDefaultTimeout(60000);let broken=true,release;const gate=new Promise(r=>release=r);
 try{
  if(kind==='webgl-unavailable')await p.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...rest){return /webgl/i.test(type)?null:original.call(this,type,...rest)};});
  await p.route('**/parts/cad/**',async route=>{const path=new URL(route.request().url()).pathname;if(kind==='late-load'&&path.endsWith('/B1/assembly.glb')){await gate;return route.continue();}if(!broken)return route.continue();
   if(kind==='missing-glb'&&path.endsWith('/B0/assembly.glb'))return route.fulfill({status:404,body:'missing'});
   if(kind==='corrupt-glb'&&path.endsWith('/B0/assembly.glb'))return route.fulfill({status:200,body:'broken GLB'});
   if(kind==='missing-research'&&path.endsWith('/research-cache.json'))return route.fulfill({status:404,body:'missing'});
   if(kind==='wrong-manifest-id'&&path.endsWith('/B0/link-manifest.json')){const r=await route.fetch(),j=await r.json();j.assembly_id='wrong';return route.fulfill({response:r,json:j});}
   if(kind==='bad-drawing-id'&&path.endsWith('/B0/drawing.svg')){const r=await route.fetch();return route.fulfill({response:r,body:(await r.text()).replace(/data-part-id="[^"]+"/,'data-part-id="wrong"')});}
   return route.continue();});
  await p.goto(url);
  if(kind==='late-load'){
   await p.waitForFunction(()=>window.__terrainDiagnostics?.().parts.loaded==='B0');await p.locator('#cad-revision').selectOption('B1');await p.locator('#cad-revision').selectOption('B2');await p.waitForFunction(()=>window.__terrainDiagnostics().parts.loaded==='B2');release();await p.waitForTimeout(300);expect((await p.evaluate(()=>window.__terrainDiagnostics())).parts.loaded).toBe('B2');row.check='late B1 cannot replace B2';
  }else if(kind==='webgl-unavailable'){
   await p.waitForFunction(()=>document.querySelector('#cad-status')?.textContent.includes('照合済み'));await p.locator('#cad-tab-drawing').click();expect(await p.locator('#cad-drawing svg').count()).toBe(1);await p.locator('#cad-tab-research').click();expect(await p.locator('#cad-research details').count()).toBeGreaterThan(0);row.check='drawings and research retained without WebGL';
  }else{
   await p.waitForFunction(()=>document.querySelector('#cad-status')?.textContent.startsWith('CAD連携停止'));row.failureMessage=await p.locator('#cad-status').textContent();expect(await p.locator('#cad-drawing svg').count()).toBe(0);broken=false;await p.locator('#cad-retry').click();await p.waitForFunction(()=>document.querySelector('#cad-status')?.textContent.includes('照合済み'));row.check='reject then successful explicit retry';
  }
  row.status='PASS';
 }catch(e){row.status='FAIL';row.reason=e.message;}finally{release?.();}
 report.rows.push(row);save();console.log(kind,row.status,row.reason||'');await context.close();
}
await browser.close();report.runnerSha256=createHash('sha256').update(readFileSync('scripts/stage3a-faults.mjs')).digest('hex');save();if(report.rows.some(x=>x.status!=='PASS'))process.exitCode=1;
