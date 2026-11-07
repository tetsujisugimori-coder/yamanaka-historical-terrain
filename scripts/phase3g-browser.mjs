import {chromium,webkit,expect} from '@playwright/test';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {groundOracle} from '../tests/phase3f-ground-oracle.mjs';
import {oracle,verifyProfile} from '../tests/section-oracle.mjs';
import {F_SOURCES,F_CHECKS} from './phase3g-evidence.mjs';
const dir=process.env.PHASE3G_EVIDENCE??'evidence/phase3g/browser',url=process.env.TEST_URL??'http://127.0.0.1:4317';await mkdir(dir,{recursive:true});
const hash=async f=>createHash('sha256').update(await readFile(f)).digest('hex');
const hashes=async()=>Object.fromEntries(await Promise.all(F_SOURCES.map(async f=>[f,await hash(f)])));
const report={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),tree:execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim(),hashes:await hashes(),startedAt:new Date().toISOString(),rows:[],input:'Playwright browser-delivered keyboard/mouse; blur and late pointerup synthetic; no physical-device claim'};
const save=()=>writeFile(dir+'/results.json',JSON.stringify(report,null,2)),snap=p=>p.evaluate(()=>window.__terrainDiagnostics()),ready=p=>p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready);
const q={A:oracle('public/data/castle.glb'),C:oracle('public/data/phase3g.glb'),inner:oracle('public/data/phase3g-inner.glb'),western:groundOracle('public/data/phase3b.glb')};
const specs={moat:[[-66,-10],[-38,-10]],rampart:[[-15,15],[-45,15]]};
await save();
for(const engine of process.env.PHASE3G_ENGINE?[process.env.PHASE3G_ENGINE]:['chromium','webkit']){
 const browser=await({chromium,webkit}[engine]).launch();
 for(const width of [375,390,765,1280])for(const motion of ['no-preference','reduce']){
  const context=await browser.newContext({viewport:{width,height:960},reducedMotion:motion}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(60000);
  const row={key:`${engine}-${width}-${motion}`,engine,width,motion,browserVersion:browser.version(),checks:[],sections:[],supports:[],errors};
  try{
   const started=performance.now();await p.goto(url);await ready(p);row.initialLoadMs=performance.now()-started;
   await p.locator('#landscape-enter').click();await ready(p);await p.locator('#inner-load').click();await p.waitForFunction(()=>window.__terrainDiagnostics().phase3c.loaded);expect((await snap(p)).phase3g.version).toBe('phase3g-v1');
   await p.locator('#parts-visible').check();await p.waitForFunction(()=>window.__terrainDiagnostics().parts.visible);const part= (await snap(p)).parts;expect(part.posts.length).toBe(5);row.parts=[part];
   for(const size of ['0.5','1.5','1']){await p.locator('#parts-size').selectOption(size);const d=(await snap(p)).parts;expect(d.visible).toBe(true);expect(d.posts[0].height).toBe(2*Number(size));row.parts.push(d);}
   for(const yaw of ['45','90','0']){await p.locator('#parts-yaw').selectOption(yaw);expect((await snap(p)).parts.visible).toBe(true);}
   await p.locator('#parts-select').click();expect(await p.locator('#parts-detail').isVisible()).toBe(true);await p.locator('#parts-visible').uncheck();expect((await snap(p)).parts.visible).toBe(false);
   row.resources=await p.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name).filter(x=>x.endsWith('.glb')));expect(row.resources.some(x=>x.endsWith('/phase3g.glb'))).toBe(true);expect(row.resources.some(x=>x.endsWith('/phase3g-inner.glb'))).toBe(true);row.checks.push(F_CHECKS[0]);
   for(const [id,[start,end]]of Object.entries(specs)){
    await p.locator('#section-choice').selectOption(id);await p.waitForFunction(id=>window.__terrainDiagnostics().section.id===id&&window.__terrainDiagnostics().section.status==='ready',id);const d=await snap(p);
    for(const key of ['A','C']){expect(d.section.data[key].segments.length).toBeGreaterThan(0);const stats=verifyProfile(d.section.data[key],start,end,q[key]);expect(stats.count).toBeGreaterThan(10);row.sections.push({id,key,...stats,data:d.section.data[key]});}
   }row.checks.push(F_CHECKS[1]);
   for(const id of ['ic-station-nishinomaru','ic-lookout','ic-bridge','ic-koguchi','ic-koguchi-inside','ic-station-western','ic-station-westgate','ic-station-westmoat']){
    await p.locator(`[data-exploration-station=${id}]`).click();await p.waitForFunction(id=>window.__terrainDiagnostics().state.station===id,id);const d=await snap(p),[x,y,z]=d.camera;
    const expected=q[id==='ic-station-nishinomaru'?'C':id.startsWith('ic-station-')?'western':'inner'](x,-z);expect(expected).not.toBeNull();expect(Math.abs(y-expected-1.7)).toBeLessThan(.001);row.supports.push({id,camera:d.camera,ground:expected,error:y-expected-1.7});
   }row.checks.push(F_CHECKS[2]);
   await p.locator('[data-exploration-station=ic-station-nishinomaru]').click();await p.locator('#walk-start').click();await p.waitForFunction(()=>window.__terrainDiagnostics().phase3e.active);const initial=await snap(p);await p.locator('#viewport').focus();await p.keyboard.down('w');await p.waitForFunction(()=>window.__terrainDiagnostics().phase3e.trace.filter(x=>x.type==='move').length>=10);await p.keyboard.up('w');const d=await snap(p);expect(Math.hypot(d.camera[0]-initial.camera[0],d.camera[2]-initial.camera[2])).toBeGreaterThan(.05);
   row.walk=d.phase3e;row.camera=d.camera;for(const item of d.phase3e.trace.filter(x=>x.type==='move'))expect(Math.abs(item.position[1]-q.C(item.position[0],-item.position[2]))).toBeLessThan(.001);expect(d.camera[1]-d.phase3e.support.height).toBeCloseTo(1.7,7);row.checks.push(F_CHECKS[3]);
   await p.evaluate(()=>window.dispatchEvent(new Event('blur')));await p.keyboard.up('w');const frozen=(await snap(p)).camera;await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));expect((await snap(p)).camera).toEqual(frozen);await p.locator('#quality').selectOption('light');expect((await snap(p)).phase3e.active).toBe(false);await p.dispatchEvent('#viewport canvas','pointerup',{pointerId:1});expect((await snap(p)).phase3e.active).toBe(false);row.checks.push(F_CHECKS[4]);
   await p.locator('#exaggeration').check();await p.locator('#walk-start').click();await p.waitForFunction(()=>window.__terrainDiagnostics().phase3e.active);const twice=await snap(p);expect(twice.camera[1]-2*q.C(twice.camera[0],-twice.camera[2])).toBeCloseTo(1.7,3);await p.locator('#walk-exit').click();await p.locator('#exaggeration').uncheck();row.checks.push(F_CHECKS[5]);
   row.quality=[];for(const quality of ['balanced','high','light']){const t=performance.now();await p.locator('#quality').selectOption(quality);const d=await snap(p);row.quality.push({quality,wallMs:performance.now()-t,triangles:d.triangles,drawCalls:d.drawCalls,geometries:d.geometries});}
   await p.locator('[data-landscape-mode=a]').click();await ready(p);const a=await snap(p);expect(a.phase3b.shadows).toBe(false);expect(a.phase3c.objects).toEqual([]);expect(a.phase3d.objects).toEqual([]);await p.locator('[data-landscape-mode=c]').click();await ready(p);expect((await snap(p)).phase3b.shadows).toBe(false);row.checks.push(F_CHECKS[6]);
   await p.locator('[data-exploration-station=ic-bridge]').click();await p.locator('#viewport').screenshot({path:dir+'/'+row.key+'.png'});row.pngSha256=await hash(dir+'/'+row.key+'.png');row.final=await snap(p);expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await p.locator('#reset').click();await ready(p);expect((await snap(p)).state.view).toBe('regional');expect(errors).toEqual([]);row.checks.push(F_CHECKS[7]);row.status='PASS';
  }catch(e){row.status='FAIL';row.reason=e.message;row.diagnostics=await snap(p).catch(()=>null);await p.screenshot({path:dir+'/'+row.key+'-failure.png'}).catch(()=>{});}
  report.rows.push(row);await save();console.log(row.key,row.status,row.reason??'');await context.close();
 }await browser.close();
}
report.finalHashes=await hashes();report.completedAt=new Date().toISOString();await save();if(report.rows.length!==16||report.rows.some(x=>x.status!=='PASS'))process.exitCode=1;
