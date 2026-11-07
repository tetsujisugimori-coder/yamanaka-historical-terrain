import {chromium,webkit,expect} from '@playwright/test';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=process.env.TEST_URL??'http://127.0.0.1:4317',dir=process.env.PHASE3D_EVIDENCE??'evidence/phase3d/browser';
await mkdir(dir,{recursive:true});
const files=['src/main.js','src/phase3b.js','src/phase3d.js','public/data/phase3d.glb','public/data/phase3d.json','scripts/phase3d-browser.mjs'];
const fingerprint=async()=>Object.fromEntries(await Promise.all(files.map(async f=>[f,createHash('sha256').update(await readFile(f)).digest('hex')])));
const hashes=await fingerprint(),head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),tree=execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim();
const rows=[],startedAt=new Date().toISOString();
const save=()=>writeFile(dir+'/results.json',JSON.stringify({head,tree,hashes,startedAt,updatedAt:new Date().toISOString(),scope:'new implementation-authored Playwright input, not physical input/Safari/VoiceOver',rows},null,2));
const snap=p=>p.evaluate(()=>window.__terrainDiagnostics());
const ready=p=>p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready);
await save();
for(const engine of process.env.PHASE3D_ENGINE?[process.env.PHASE3D_ENGINE]:['chromium','webkit']){
 let browser;try{browser=await(engine==='chromium'?chromium:webkit).launch();}catch(e){rows.push({engine,status:'NOT_TESTED',reason:e.message});await save();continue;}
 for(const width of [375,390,765,1280])for(const reducedMotion of ['no-preference','reduce']){
  const key=engine+'-'+width+'-'+reducedMotion,row={key,engine,width,reducedMotion,browserVersion:browser.version(),startedAt:new Date().toISOString()},context=await browser.newContext({viewport:{width,height:960},reducedMotion}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(45000);
  try{
   await p.goto(root);await ready(p);await p.locator('#landscape-enter').click();await ready(p);
   const before=await snap(p);await p.locator('#connected-load').click();await p.waitForFunction(()=>window.__terrainDiagnostics().phase3d.loaded);
   const after=await snap(p);expect(after.camera).toEqual(before.camera);expect(after.target).toEqual(before.target);expect(after.phase3d.objects.length).toBeGreaterThan(0);expect(after.phase3d.objects.every(o=>o.category==='C')).toBe(true);
   row.pairs=[];await p.locator('#connected-rays').check();
   for(const pair of ['entrance','bridge'])for(const side of ['attacker','defender']){
    await p.locator('[data-defence-pair="'+pair+'"][data-side="'+side+'"]').click();const d=await snap(p);
    expect(d.phase3c.pose.clearance).toBeCloseTo(1.7,6);expect(d.phase3d.ray.pair).toBe(pair);expect(d.phase3d.ray.status).not.toBe('UNKNOWN');row.pairs.push({pair,side,camera:d.camera,target:d.target,ray:d.phase3d.ray});
   }
   const fixed=await snap(p);await p.locator('[data-landscape-mode=a]').click();await ready(p);const a=await snap(p);expect(a.camera).toEqual(fixed.camera);expect(a.target).toEqual(fixed.target);expect(a.phase3d.objects).toEqual([]);expect(a.phase3d.ray).toBeNull();
   await p.locator('[data-landscape-mode=cd]').click();await ready(p);await p.locator('#connected-visible').uncheck();expect((await snap(p)).phase3d.objects).toEqual([]);await p.locator('#connected-visible').check();expect((await snap(p)).phase3d.objects.length).toBeGreaterThan(0);
   await p.locator('#exaggeration').check();await p.locator('[data-defence-pair=bridge][data-side=defender]').click();expect((await snap(p)).phase3c.pose.clearance).toBeCloseTo(1.7,6);await p.locator('#exaggeration').uncheck();
   expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(errors).toEqual([]);
   row.metrics=await snap(p);if([390,1280].includes(width)&&reducedMotion==='reduce')await p.locator('#viewport').screenshot({path:dir+'/'+key+'.png'});
   row.status='PASS';
  }catch(e){row.status='FAIL';row.reason=e.message;row.errors=errors;row.actual=await snap(p).catch(()=>null);}
  row.completedAt=new Date().toISOString();rows.push(row);console.log(key,row.status,row.reason??'');await save();await context.close();
 }
 await browser.close();
}
const finalHashes=await fingerprint();rows.push({kind:'source-stability',status:JSON.stringify(hashes)===JSON.stringify(finalHashes)?'PASS':'FAIL',finalHashes});await save();
if(rows.filter(r=>r.key).length!==16||rows.some(r=>r.status!=='PASS'))process.exitCode=1;
