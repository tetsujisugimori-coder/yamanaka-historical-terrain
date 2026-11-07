import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const rows=[];
for(const [engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch();
 for(const fault of ['A-connected-contamination','UV-residue','stale-pair']){
  const p=await browser.newPage({viewport:{width:390,height:960},reducedMotion:'reduce'}),row={engine,fault};p.setDefaultTimeout(60000);let mutated=false;
  try{
   await p.route('**/src/main.js*',async r=>{const response=await r.fetch();let body=await response.text();const probe=String.raw`window.__faultRead=()=>{const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};const objects=[];connectedGroup.traverse(o=>{if(o.isMesh&&visible(o))objects.push({id:o.userData.elementId,uv:o.geometry.attributes.uv?Array.from(o.geometry.attributes.uv.array):null});});return {objects,ray:connectedRay,station:state.station};};`;
    if(fault==='A-connected-contamination'){const from='Boolean(connectedMeta)&&innerGroup.visible&&';assert.equal(body.split(from).length,2);body=body.replace(from,"Boolean(connectedMeta)&&(innerGroup.visible||comparison==='current')&&");mutated=true;}
    if(fault==='stale-pair'){const lines=body.split('\n'),matched=lines.filter(l=>l.includes('connectedPair')&&l.includes('attacker')&&l.includes('defender')&&l.includes('connectedPair=null'));assert.equal(matched.length,1,'unique stale-pair guard');body=body.replace(matched[0],'');mutated=true;}
    body=body.replace('window.__terrainDiagnostics=',probe+'window.__terrainDiagnostics=');await r.fulfill({response,body});
   });
   if(fault==='UV-residue')await p.route('**/src/phase3b.js*',async r=>{const response=await r.fetch();const body=await response.text(),anchor="else g.deleteAttribute('uv');";assert.equal(body.split(anchor).length,2);mutated=true;await r.fulfill({response,body:body.replace(anchor,'')});});
   const ready=()=>p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready);const mode=async m=>{await p.locator(`[data-landscape-mode=${m}]`).click();await ready();};const read=()=>p.evaluate(()=>window.__faultRead());
   await p.goto(process.env.TEST_URL??'http://127.0.0.1:4393');await ready();await p.locator('#landscape-enter').click();await ready();await p.locator('#connected-load').click();await p.waitForFunction(()=>window.__terrainDiagnostics().phase3d.loaded);assert.ok(mutated);
   let signature=null;
   if(fault==='A-connected-contamination'){await mode('a');row.observed=await read();if(row.observed.objects.length)signature='A_CONNECTED_CONTAMINATION';}
   if(fault==='UV-residue'){await mode('c');const before=await read();await mode('cd');await mode('c');const after=await read();row.beforeUv=before.objects.map(o=>o.uv===null?null:o.uv.length);row.afterUv=after.objects.map(o=>o.uv===null?null:o.uv.length);if(JSON.stringify(row.beforeUv)!==JSON.stringify(row.afterUv)||after.objects.some(o=>o.uv!==null))signature='UV_RESIDUE';}
   if(fault==='stale-pair'){await p.locator('#connected-rays').check();await p.locator('[data-defence-pair=entrance][data-side=attacker]').click();await p.waitForFunction(()=>window.__terrainDiagnostics().state.station==='ic-koguchi');await p.locator('[data-station=bailey]').click();await p.waitForFunction(()=>window.__terrainDiagnostics().state.station==='bailey'&&window.__terrainDiagnostics().state.ready);row.observed=await read();if(row.observed.ray!==null)signature='STALE_PAIR_AFTER_LEGACY_STATION';}
   assert.ok(signature,'negative did not produce dedicated rejection');row.signature=signature;row.status='EXPECTED_REJECTION';
  }catch(e){row.status='FAIL';row.reason=e.stack;}
  rows.push(row);writeFileSync('evidence/phase3d/independent/negative-render.json',JSON.stringify({method:'Test-only source response mutations; disk product untouched. Dedicated independent state/attribute rejection required.',rows},null,2));console.log(engine,fault,row.status,row.reason??'');await p.close();
 }
 await browser.close();
}
if(rows.some(r=>r.status!=='EXPECTED_REJECTION'))process.exitCode=1;
