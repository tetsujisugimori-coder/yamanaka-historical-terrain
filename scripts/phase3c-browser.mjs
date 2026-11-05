import {chromium,webkit,expect} from '@playwright/test';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {oracle} from '../tests/section-oracle.mjs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=process.env.TEST_URL??'http://127.0.0.1:4317',dir=process.env.PHASE3C_EVIDENCE??'evidence/phase3c/browser',rows=[];
const startedAt=new Date().toISOString();
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const tree=execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim();
const worktreeStatusAtStart=execFileSync('git',['status','--porcelain=v1'],{encoding:'utf8'}).trim();
const fingerprintPaths=['src/main.js','src/phase3c.js','src/phase3b.js','src/reading.js','src/style.css','src/landscape.js','src/surface.js','src/intent.js','index.html','scripts/phase3c-browser.mjs','tests/section-oracle.mjs','tests/glb-surface.mjs','public/data/phase3c.json','public/data/phase3c.glb','public/data/phase3b.json','public/data/phase3b.glb','public/data/castle.glb','public/data/nishinomaru.glb','public/data/regional.glb','public/data/moat-study.glb'];
async function fingerprints(){const hashes={};for(const path of fingerprintPaths)hashes[path]=createHash('sha256').update(await readFile(path)).digest('hex');return hashes;}
const hashes=await fingerprints();
await mkdir(dir,{recursive:true});
const meta=JSON.parse(await readFile('public/data/phase3c.json','utf8'));
const q=oracle('public/data/phase3c.glb');
const snap=p=>p.evaluate(()=>window.__terrainDiagnostics());
const ready=p=>p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready);
async function enter(p){await p.goto(root);await ready(p);await p.locator('#landscape-enter').click();await ready(p);await p.locator('#inner-load').click();await p.waitForFunction(()=>window.__terrainDiagnostics().phase3c.loaded);}
async function save(){await writeFile(dir+'/results.json',JSON.stringify({head,tree,hashes,worktreeStatusAtStart,startedAt,updatedAt:new Date().toISOString(),root,chromiumExecutable:process.env.PHASE3C_CHROMIUM_PATH??'Playwright bundled',scope:'Implementation-authored automated browsers, not hardware Safari/VoiceOver. Screenshot inspection recorded separately. Fixed same-camera A/C comparison may be unsupported, explicitly labelled.',rows},null,2));}
await save();
for(const name of process.env.PHASE3C_ENGINE?[process.env.PHASE3C_ENGINE]:['chromium','webkit']){
 const browserStartedAt=new Date().toISOString();let browser;try{browser=await (name==='chromium'?chromium:webkit).launch(name==='chromium'&&process.env.PHASE3C_CHROMIUM_PATH?{executablePath:process.env.PHASE3C_CHROMIUM_PATH,args:['--no-sandbox']}:{});}catch(e){rows.push({kind:'browser-startup',engine:name,browserVersion:null,startedAt:browserStartedAt,completedAt:new Date().toISOString(),status:'NOT_TESTED',reason:e.message});await save();continue;}
 for(const width of process.env.PHASE3C_WIDTH?[+process.env.PHASE3C_WIDTH]:[375,390,765,1280])for(const reducedMotion of ['no-preference','reduce']){
  const key=`${name}-${width}-${reducedMotion}`,row={kind:'matrix',key,engine:name,browserVersion:browser.version(),width,reducedMotion,startedAt:new Date().toISOString()},ctx=await browser.newContext({viewport:{width,height:960},reducedMotion,hasTouch:width<800}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(45000);
  try{await enter(p);expect((await snap(p)).phase3c.visible).toBe(true);row.stations=[];
   for(const s of meta.stations){await p.locator(`[data-inner-station="${s.id}"]`).click();await p.waitForFunction(id=>window.__terrainDiagnostics().state.station===id,s.id);const d=await snap(p);expect(d.camera[0]).toBe(s.eye[0]);expect(d.camera[2]).toBe(-s.eye[1]);expect(d.phase3c.pose.clearance).toBeCloseTo(1.7,6);if(s.lookTargetHeight!==undefined)expect(d.target[1]).toBeCloseTo(d.camera[1]-1.7+(s.lookTargetHeight-s.lookHeightOffset-s.groundHeight)*d.state.exaggeration+s.lookHeightOffset,6);const independent=q(...s.eye);if(independent!==null)expect(Math.abs(d.camera[1]-independent-1.7)).toBeLessThan(.002);await expect(p.locator('#inner-location')).toContainText(s.name);await expect(p.locator('#inner-direction')).not.toBeEmpty();row.stations.push({id:s.id,eye:d.camera,independentGround:independent,pose:d.phase3c.pose});
    if([390,1280].includes(width)&&reducedMotion==='reduce')await p.locator('#viewport').screenshot({path:`${dir}/${key}-${s.id}.png`});
    await p.locator('#viewport').focus();await p.keyboard.press('ArrowRight');expect((await snap(p)).camera).toEqual(d.camera);
    await p.locator('[data-landscape-mode=a]').click();await ready(p);expect((await snap(p)).camera).toEqual(d.camera);expect((await snap(p)).phase3c.objects).toEqual([]);await expect(p.locator('#inner-location')).toContainText('A 現況');await expect(p.locator('#inner-comparison')).not.toBeEmpty();
    await p.locator('[data-landscape-mode=c]').click();await ready(p);expect((await snap(p)).camera).toEqual(d.camera);await p.locator('[data-landscape-mode=cd]').click();await ready(p);
   }
   // Category toggles must recompute support after western group visibility, not one event late.
   const fixedEye=(await snap(p)).camera;await p.locator('#category-c').uncheck();expect((await snap(p)).phase3b.objects).toEqual([]);expect((await snap(p)).phase3c.objects).toEqual([]);
   await p.locator('#category-c').check();await expect(p.locator('#inner-comparison')).toContainText('同一視点で比較中');await expect(p.locator('#viewport canvas')).toBeVisible();expect((await snap(p)).camera).toEqual(fixedEye);
   await p.locator('#inner-previous').click();await p.waitForFunction(id=>window.__terrainDiagnostics().state.station===id,meta.stations.at(-2).id);await p.locator('#inner-next').click();await p.waitForFunction(id=>window.__terrainDiagnostics().state.station===id,meta.stations.at(-1).id);
   for(const quality of ['light','balanced','high'])await p.locator('#quality').selectOption(quality);
   await p.locator('#exaggeration').check();await p.locator(`[data-inner-station="${meta.stations[1].id}"]`).click();await p.waitForFunction(id=>window.__terrainDiagnostics().state.station===id,meta.stations[1].id);const two=await snap(p),scaledStation=meta.stations[1];expect(two.phase3c.pose.clearance).toBeCloseTo(1.7,6);if(scaledStation.lookTargetHeight!==undefined)expect(two.target[1]).toBeCloseTo(two.camera[1]-1.7+(scaledStation.lookTargetHeight-scaledStation.lookHeightOffset-scaledStation.groundHeight)*2+scaledStation.lookHeightOffset,6);await p.locator('#exaggeration').uncheck();
   await p.setViewportSize({width:width===1280?390:1280,height:960});await p.waitForTimeout(50);expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   expect(errors).toEqual([]);row.status='PASS';
  }catch(e){row.status='FAIL';row.reason=e.message;row.errors=errors;row.diagnostics=await snap(p).catch(()=>null);await p.screenshot({path:`${dir}/${key}-failure.png`,fullPage:true}).catch(()=>{});}
  row.completedAt=new Date().toISOString();rows.push(row);console.log(row.status,key,row.reason??'');await save();await ctx.close();
 }
 for(const kind of ['western404','dependency-negative','404-retry','stale-success','stale-failure','webgl','missing-support']){
  const row={kind,engine:name,browserVersion:browser.version(),startedAt:new Date().toISOString()},ctx=await browser.newContext({viewport:{width:390,height:960}}),p=await ctx.newPage();p.setDefaultTimeout(45000);let release,failed=true;const gate=new Promise(r=>release=r);
  if(kind==='webgl')await p.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(k,...args){return /webgl/i.test(k)?null:get.call(this,k,...args);};});
  if(['western404','dependency-negative'].includes(kind))await p.route('**/data/phase3b.glb',r=>failed?r.fulfill({status:404,body:'missing required western ground'}):r.continue());
  if(kind==='dependency-negative')await p.route('**/src/main.js*',async r=>{const response=await r.fetch();let code=await response.text();const guard='&&!westernUnavailable&&westernGroup.children.length>0&&Boolean(innerMeta)';if(!code.includes(guard))throw Error('Dependency mutation target missing');code=code.replace(guard,'&&Boolean(innerMeta)');await r.fulfill({response,body:code});});
  if(kind==='404-retry')await p.route('**/data/phase3c.glb',r=>failed?r.fulfill({status:404,body:'negative control'}):r.continue());
  if(kind.startsWith('stale'))await p.route('**/data/phase3c.glb',async r=>{await gate;await r.fulfill(kind==='stale-success'?{status:200,body:await readFile('public/data/phase3c.glb'),contentType:'model/gltf-binary'}:{status:404,body:'negative control'});});
  if(kind==='missing-support'){const broken=structuredClone(meta);broken.stations[0].eye=[1e6,1e6];await p.route('**/data/phase3c.json',r=>r.fulfill({status:200,body:JSON.stringify(broken),contentType:'application/json'}));}
  try{
   if(kind==='webgl'){await p.goto(root);await p.waitForFunction(()=>document.body.dataset.renderState==='unavailable');for(const f of meta.elements){await p.locator(`[data-id="${f.id}"]`).click();await expect(p.locator('#detail h2')).toHaveText(f.name);}}
   else if(['western404','dependency-negative'].includes(kind)){
    await enter(p);const d=await snap(p);expect(d.phase3b.unavailable).toBe(true);expect(d.phase3c.dependencyUnavailable).toBe(true);
    if(kind==='dependency-negative'){let rejected=false;try{expect(d.phase3c.objects).toEqual([]);}catch{rejected=true;}expect(rejected).toBe(true);row.expectedRejection='Missing western support must prevent inner surfaces; fault reintroduction rejected';}
    else{expect(d.phase3c.objects).toEqual([]);await expect(p.locator('#inner-asset-status')).toContainText('接続先');await p.locator('[data-station=bailey]').click();await p.waitForFunction(()=>window.__terrainDiagnostics().state.station==='bailey');expect((await snap(p)).state.ready).toBe(true);failed=false;await p.locator('[data-landscape-mode=c]').click();await ready(p);expect((await snap(p)).phase3c.visible).toBe(true);expect((await snap(p)).phase3c.objects.length).toBeGreaterThan(0);await expect(p.locator('#inner-asset-status')).not.toContainText('読み込めない');}
   }
   else if(kind==='404-retry'){await p.goto(root);await ready(p);await p.locator('#landscape-enter').click();await ready(p);await p.locator('#inner-load').click();await p.waitForFunction(()=>window.__terrainDiagnostics().phase3c.unavailable);expect((await snap(p)).landscape.objects.length).toBeGreaterThan(0);failed=false;await p.locator('#inner-load').click();await p.waitForFunction(()=>window.__terrainDiagnostics().phase3c.loaded&&!window.__terrainDiagnostics().phase3c.unavailable);}
   else if(kind.startsWith('stale')){await p.goto(root);await ready(p);await p.locator('#landscape-enter').click();await ready(p);const request=p.waitForRequest('**/data/phase3c.glb');await p.locator('#inner-load').click();await request;await p.locator('[data-view=castle]').click();await ready(p);const before=await snap(p);release();await p.waitForFunction(()=>window.__terrainDiagnostics().phase3c.loaded||window.__terrainDiagnostics().phase3c.unavailable);const after=await snap(p);expect(after.state).toEqual(before.state);expect(after.camera).toEqual(before.camera);expect(after.target).toEqual(before.target);expect(after.phase3c.objects).toEqual([]);}
   else{await enter(p);const before=await snap(p);await p.locator(`[data-inner-station="${meta.stations[0].id}"]`).click();await expect(p.locator('#inner-comparison')).toContainText('観察不可');expect((await snap(p)).camera).toEqual(before.camera);}
   row.status='PASS';
  }catch(e){row.status='FAIL';row.reason=e.message;}release();row.completedAt=new Date().toISOString();rows.push(row);console.log(row.status,name,kind,row.reason??'');await save();await ctx.close();
 }
 await browser.close();
}
const finalHashes=await fingerprints(),changedFiles=fingerprintPaths.filter(path=>hashes[path]!==finalHashes[path]);
rows.push({kind:'source-stability',startedAt,completedAt:new Date().toISOString(),status:changedFiles.length?'FAIL':'PASS',changedFiles,finalHashes:changedFiles.length?finalHashes:undefined});
await save();
if(rows.some(r=>r.status!=='PASS'))process.exitCode=1;
