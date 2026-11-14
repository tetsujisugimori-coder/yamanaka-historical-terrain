import {inventoryEvidence} from './stage3b-evidence-inventory.mjs';
/** Supplementary production acceptance. Never replaces historic dev/failed records. */
import {chromium,webkit,expect} from '@playwright/test';
import {mkdir,writeFile,readFile,readdir,stat,statfs} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const base=process.env.TEST_URL??'http://127.0.0.1:4394';
const out=process.env.EVIDENCE_DIR;
if(!out)throw Error('EVIDENCE_DIR must name a new case-specific directory');
await mkdir(out,{recursive:true});
try{await stat(path.join(out,'results.json'));throw Error('Existing evidence must not be overwritten');}catch(e){if(e.code!=='ENOENT')throw e;}
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const identity={head:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),branch:git('branch','--show-current'),dirty:git('status','--porcelain'),run:process.env.GITHUB_RUN_ID??null,attempt:process.env.GITHUB_RUN_ATTEMPT??null};
const data=JSON.parse(await readFile('public/data/castle-overview.json','utf8'));
const expectedFeatures={};for(const name of ['nishinomaru','landscape','phase3b','phase3c','phase3d']){const doc=JSON.parse(await readFile(`public/data/${name}.json`,'utf8'));for(const f of doc.facilities??doc.elements??[])expectedFeatures[f.id]=f;}
// The landscape data intentionally amends the historic baseline description (e.g. nm-passage).
const captions=JSON.parse(await readFile('public/data/landscape.json','utf8')).surfaceCaptions;
for(const [id,caption] of Object.entries(captions))if(expectedFeatures[id])Object.assign(expectedFeatures[id],caption);
const sources=['scripts/stage3b-evidence-inventory.mjs','src/main.js','src/castle-overview.js','src/castle-overview-contract.js','scripts/stage3b-limited-browser.mjs','public/data/castle-overview.json','src/overview-destinations.js',...['nishinomaru','landscape','phase3b','phase3c','phase3d'].map(n=>`public/data/${n}.json`)];
const sourceHashes=Object.fromEntries(await Promise.all(sources.map(async p=>[p,sha(await readFile(p))])));
const buildFiles=['dist/index.html',...(await readdir('dist/assets')).map(p=>'dist/assets/'+p),'dist/data/castle-overview.json'];
const buildHashes=Object.fromEntries(await Promise.all(buildFiles.map(async p=>[p,sha(await readFile(p))])));
const capacity=async()=>{const s=await statfs(out);return {availableBytes:Number(s.bavail)*Number(s.bsize),freeInodes:Number(s.ffree),type:s.type};};
const capacityBefore=await capacity();if(capacityBefore.availableBytes<1024**3)throw Error('Need 1 GiB free before capped 500 MiB evidence generation');
const rows=[],engines={};
const diag=p=>p.evaluate(()=>window.__terrainDiagnostics());
async function ready(p){await p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready,null,{timeout:60000});}
async function settled(p){let old=null;await expect.poll(async()=>{const d=await diag(p),value=JSON.stringify([d.camera,d.target,d.cameraFov]);const same=value===old;old=value;return same;},{timeout:10000}).toBe(true);}
async function opened(p){await p.locator('#castle-overview-open').click();await expect.poll(async()=>(await diag(p)).castleOverview.active).toBe(true);await settled(p);}
function snapshot(d){return {view:d.state.view,landscape:d.state.landscape,drama:d.state.drama,selected:d.state.selected,variant:d.reconstruction.comparison,camera:d.camera,target:d.target,fov:d.cameraFov};}
function compare(a,b){const result={exact:{},numeric:{},tolerance:1e-7};for(const k of ['view','landscape','drama','selected','variant']){result.exact[k]=a[k]===b[k];expect(b[k],k).toEqual(a[k]);}for(const k of ['camera','target','fov']){const aa=Array.isArray(a[k])?a[k]:[a[k]],bb=Array.isArray(b[k])?b[k]:[b[k]];result.numeric[k]=aa.map((v,i)=>Math.abs(v-bb[i]));expect(result.numeric[k].every(n=>Number.isFinite(n)&&n<=result.tolerance),k).toBe(true);}return result;}
async function canvas(p,file){await settled(p);const b=await p.locator('#viewport').screenshot({path:path.join(out,file),animations:'disabled'});return {file,sha256:sha(b),bytes:b.length};}
async function renderChecks(p,row,key){
 row.render=[];
 for(const layer of ['terrain','models','zones','signs','names','plan']){
  if(layer==='names')await p.locator('[data-overview-layer="signs"]').uncheck();
  const selector=p.locator(`[data-overview-layer="${layer}"]`);await selector.check();
  const before=(await diag(p)).castleOverview;
  // A second same-state capture guards against unrelated animation being counted as a layer effect.
  const a=await canvas(p,`${key}-${layer}-on.png`),control=await canvas(p,`${key}-${layer}-control.png`);
  expect(control.sha256,'same-state image stability').toBe(a.sha256);
  await selector.uncheck();const off=(await diag(p)).castleOverview;
  const b=await canvas(p,`${key}-${layer}-off.png`);
  if(layer==='terrain'){expect(before.terrainVisible).toBe(true);expect(off.terrainVisible).toBe(false);}
  if(['models','zones'].includes(layer)){expect(before.renderObjects.filter(x=>x.layer===layer).length).toBeGreaterThan(0);expect(before.renderObjects.filter(x=>x.layer===layer).every(x=>x.visible)).toBe(true);expect(off.renderObjects.filter(x=>x.layer===layer).every(x=>!x.visible)).toBe(true);}
  if(layer==='plan'){expect(before.renderObjects.filter(x=>x.layer==='plan')).toEqual([]);expect(b.sha256).toBe(a.sha256);}else expect(b.sha256,`${layer} visible change`).not.toBe(a.sha256);
  row.render.push({layer,before,off,onImage:a,stableControl:control,offImage:b});await selector.check();if(layer==='names')await p.locator('[data-overview-layer="signs"]').check();
 }
 await p.locator('#castle-overview-opacity').fill('1');const full=await canvas(p,`${key}-opacity-full.png`);
 await p.locator('#castle-overview-opacity').fill('0.1');const low=await canvas(p,`${key}-opacity-low.png`);
 const render=(await diag(p)).castleOverview.renderObjects;expect(render.length).toBeGreaterThan(0);expect(render.every(x=>x.opacity===0.1)).toBe(true);expect(full.sha256).not.toBe(low.sha256);row.opacity={full,low,render};await p.locator('#castle-overview-opacity').fill('0.6');
}
async function mappingChecks(p,row){row.links=[];for(const model of data.models){console.log('detail-check',row.key,model.id);await p.locator(`[data-overview-item="${model.id}"]`).click();const d=(await diag(p)).castleOverview;const link=d.detailLinks.find(x=>x.modelId===model.id);expect(link,'all models have explicit destination inventory').toBeTruthy();expect(link.featureId).toBe(model.featureId);expect(link.available,`${model.id} has a fixed existing metadata-backed detail route`).toBe(true);await expect(p.locator('#castle-overview-detail')).toContainText(model.name);if(!link.available){expect(link.reason).toBeTruthy();await expect(p.locator('#castle-overview-detail')).toContainText(link.reason);row.links.push({modelId:model.id,...link,status:'UNAVAILABLE_EXPLAINED'});continue;}
 await p.getByRole('button',{name:'既存の詳細3Dへ',exact:true}).click();await ready(p);await expect.poll(async()=>(await diag(p)).state.selected).toBe(model.featureId);await settled(p);const after=await diag(p);expect(after.state.view).toBe('reconstruction');expect(after.castleOverview.active).toBe(false);expect(after.castleOverview.signs).toBe(0);const title=await p.locator('#detail h2').innerText();expect(title).toBe(expectedFeatures[model.featureId].name);await expect(p.locator('#detail')).toContainText(expectedFeatures[model.featureId].description);row.links.push({modelId:model.id,...link,selected:after.state.selected,title,snapshot:snapshot(after),status:'PASS'});await opened(p);
}}
async function saveResult(){await writeFile(path.join(out,'results.json'),JSON.stringify({schema:1,identity,endHead:git('rev-parse','HEAD'),sourceHashes,buildHashes,delivery:'production: HTTP index and JS bytes must match dist',at:new Date().toISOString(),node:process.version,engines,capacityBefore,capacityAfter:await capacity(),rows},null,2));}
async function caseRun(browser,key,options,work){const row={key,status:'RUNNING',checks:[],pageErrors:[],consoleErrors:[],responseHashes:[]};rows.push(row);const context=await browser.newContext(options);await context.tracing.start({screenshots:false,snapshots:true,sources:true});const page=await context.newPage();page.on('pageerror',e=>row.pageErrors.push(String(e)));page.on('console',m=>{if(m.type()==='error')row.consoleErrors.push(m.text());});const pending=[];page.on('response',r=>{if(r.url().startsWith(base)&&(/\.js(?:\?|$)/.test(r.url())||r.url()===base+'/'))pending.push((async()=>{try{const body=await r.body();row.responseHashes.push({url:r.url(),status:r.status(),sha256:sha(body)});}catch(e){row.responseHashes.push({url:r.url(),error:String(e)});}})());});
 let deadline;try{await Promise.race([work(page,row),new Promise((_,reject)=>{deadline=setTimeout(()=>reject(Error('case time budget exceeded (300000 ms)')),300000);})]);clearTimeout(deadline);await Promise.all(pending);for(const response of row.responseHashes){const pathname=new URL(response.url).pathname;const local=pathname==='/'?'dist/index.html':`dist${pathname}`;if(buildHashes[local])expect(response.sha256,`served production byte identity ${local}`).toBe(buildHashes[local]);}expect(row.pageErrors).toEqual([]);if(!key.includes('fault'))expect(row.consoleErrors).toEqual([]);row.status='PASS';}catch(e){row.status='FAIL';row.error=String(e);row.stack=e.stack;await page.screenshot({path:path.join(out,`${key}-failure.png`)}).catch(()=>{});}finally{clearTimeout(deadline);await context.tracing.stop({path:path.join(out,`${key}.trace.zip`)});await context.close();await saveResult();}return row;}
for(const [name,engine]of Object.entries({chromium,webkit}).filter(([n])=>!process.env.BROWSER_FILTER||n===process.env.BROWSER_FILTER)){
 let browser;try{browser=await engine.launch({headless:true,...(name==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader']}:{} )});engines[name]={version:browser.version(),executable:engine.executablePath()};}catch(e){rows.push({key:name,status:'NOT_TESTED',error:String(e)});continue;}
 for(const width of process.env.SMOKE_ONLY?[375]:[375,390,765,1280])for(const reducedMotion of process.env.SMOKE_ONLY?['no-preference']:['no-preference','reduce']){
  const key=`${name}-${width}-${reducedMotion}`;
  await caseRun(browser,key,{viewport:{width,height:900},reducedMotion},async(p,row)=>{
   await p.goto(base+'/');await ready(p);await expect(p.locator('#castle-overview-open')).toBeEnabled();await p.locator('#castle-overview-open').focus();await p.keyboard.press('Enter');await expect.poll(async()=>(await diag(p)).castleOverview.active).toBe(true);
   const text=await p.locator('#castle-overview').innerText();for(const word of ['外接','歴史','B0','B1','B2','植生','旧','22'])expect(text).toContain(word);expect((await diag(p)).castleOverview.unplaced).toBe(11);row.checks.push('keyboard entry; 5 asset/22 model extent/exclusions disclosed; 11 historic regions unplaced');
   await renderChecks(p,row,key);await mappingChecks(p,row);row.checks.push('all detail destinations and real rendered layers');
   await p.locator('#castle-overview-close').click();await expect(p.locator('#castle-overview-open')).toBeFocused();
   await p.locator('#landscape-enter').click();await ready(p);await p.locator('[data-landscape-mode="a"]').click();await ready(p);await p.locator('#zoom-in').click();await settled(p);row.before=snapshot(await diag(p));await opened(p);await p.locator('#castle-overview-back').click();await ready(p);await settled(p);row.after=snapshot(await diag(p));row.restore=compare(row.before,row.after);expect((await diag(p)).state.station).toBe(null);row.checks.push('real app state and camera restoration (absolute tolerance 1e-7), ordinary observation');
   expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   const served=row.responseHashes; // pending response collectors are joined at case completion; also assert the index now.
   expect(sha(Buffer.from(await (await p.request.get(base+'/')).body()))).toBe(buildHashes['dist/index.html']);
  });
 }
 for(const fault of ['503','invalid-coordinate','network'])await caseRun(browser,`${name}-fault-${fault}`,{},async(p,row)=>{let broken=true;await p.route('**/data/castle-overview.json',r=>broken?(fault==='503'?r.fulfill({status:503,body:'unavailable'}):fault==='network'?r.abort('failed'):r.fulfill({json:{...data,origin:{...data.origin,easting:0}}})):r.fulfill({json:data}));await p.goto(base+'/');await ready(p);await expect(p.locator('#castle-overview-status')).toContainText('利用できません');await expect(p.locator('#castle-overview-open')).toBeDisabled();row.failure=await diag(p);expect(row.failure.state.ready).toBe(true);broken=false;await p.locator('#castle-overview-retry').click();await expect(p.locator('#castle-overview-open')).toBeEnabled();await opened(p);row.recovered=await diag(p);row.checks.push('failure not empty success; existing terrain ready; explicit retry recovery');});
 // Real GLB response is withheld until a newer user action has completed: not a fast-network coincidence.
 await caseRun(browser,`${name}-reverse-detail-response`,{},async(p,row)=>{let release,hit;const reached=new Promise(r=>hit=r);await p.route('**/phase3i-inner.glb',async r=>{hit();await new Promise(r=>release=r);await r.continue();});await p.goto(base+'/');await ready(p);await opened(p);await p.locator('[data-overview-item="ic-lookout"]').click();await p.getByRole('button',{name:'既存の詳細3Dへ',exact:true}).click();await Promise.race([reached,new Promise((_,reject)=>setTimeout(()=>reject(Error('planned response interception not reached')),30000))]);const oldOperation=(await diag(p)).castleOverview.detailOperations.findLast(o=>o.modelId==='ic-lookout');expect(oldOperation).toBeTruthy();expect(oldOperation.status).toBe('pending');expect(oldOperation.terminal).not.toBe(true);row.oldOperationId=oldOperation.id;row.order=['old detail response held'];await p.locator('[data-view="castle"]').click();await ready(p);await settled(p);row.newer=snapshot(await diag(p));row.order.push('new castle operation completed');const oldResponse=p.waitForResponse('**/phase3i-inner.glb');release();await oldResponse;await p.waitForFunction(id=>window.__terrainDiagnostics().castleOverview.detailOperations.some(o=>o.id===id&&o.terminal),oldOperation.id,{timeout:30000});row.oldOperation=(await diag(p)).castleOverview.detailOperations.find(o=>o.id===oldOperation.id);expect(row.oldOperation.status).not.toBe('completed');await settled(p);row.order.push('old detail response released');row.after=snapshot(await diag(p));row.comparison=compare(row.newer,row.after);});
 await browser.close();
}
await saveResult();
await writeFile(path.join(out,'manifest.json'),JSON.stringify(await inventoryEvidence(out),null,2));
console.log(JSON.stringify(rows.map(({key,status,error})=>({key,status,error})),null,2));if(rows.some(r=>r.status!=='PASS')||(!process.env.SMOKE_ONLY&&!process.env.BROWSER_FILTER&&rows.filter(r=>/^\w+-\d+-/.test(r.key)).length!==16))process.exitCode=1;
