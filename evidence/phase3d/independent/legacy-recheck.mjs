import {chromium,webkit} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const rows=[];
for(const [engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch(),p=await browser.newPage({viewport:{width:390,height:960},reducedMotion:'reduce'});p.setDefaultTimeout(60000);
 const ready=()=>p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready);
 try{
  await p.goto(process.env.TEST_URL??'http://127.0.0.1:4393');await ready();await p.locator('#landscape-enter').click();await ready();await p.locator('#connected-load').click();await p.waitForFunction(()=>window.__terrainDiagnostics().phase3d.loaded);await p.locator('#connected-rays').check();
  await p.locator('[data-defence-pair=entrance][data-side=attacker]').click();await p.waitForFunction(()=>window.__terrainDiagnostics().state.station==='ic-koguchi');await p.locator('[data-station=bailey]').click();await p.waitForFunction(()=>window.__terrainDiagnostics().state.station==='bailey');await ready();
  const d=await p.evaluate(()=>window.__terrainDiagnostics());rows.push({engine,status:d.phase3d.ray===null?'PASS':'FAIL',signature:d.phase3d.ray===null?null:'STALE_PAIR_AFTER_LEGACY_STATION',station:d.state.station,camera:d.camera,ray:d.phase3d.ray});
 }catch(e){rows.push({engine,status:'ERROR',reason:e.stack});}
 await browser.close();
}
writeFileSync('evidence/phase3d/independent/legacy-recheck.json',JSON.stringify({method:'UI-only recheck explicitly waits for requested bailey station and ready state before reading ray identity.',rows},null,2));console.log(JSON.stringify(rows,null,2));
