/** Fixed production matrix. Synthetic renderer is a separate build and result class. */
import {chromium,webkit,expect} from '@playwright/test';
import {mkdir,writeFile,readFile,stat,statfs} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {deliveryPath,preserveEntity} from './stage3b-delivery-evidence.mjs';
import {createResponseObserver} from './stage3b6-response-observer.mjs';
import {matrixPlan,assertMatrix} from './stage3b6-matrix-contract.mjs';
const fixedPlan=matrixPlan(process.env.BROWSER_FILTER??null,Boolean(process.env.SMOKE_ONLY));
const out=process.env.EVIDENCE_DIR,base=process.env.TEST_URL??'http://127.0.0.1:4395',harnessBase=process.env.HARNESS_URL??'http://127.0.0.1:4399';
if(!out)throw Error('EVIDENCE_DIR required');
await mkdir(out,{recursive:true});
try{await stat(path.join(out,'results.json'));throw Error('Refuse evidence overwrite');}catch(e){if(e.code!=='ENOENT')throw e;}
const hash=b=>createHash('sha256').update(b).digest('hex'),git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const identity={head:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),dirty:git('status','--porcelain'),parents:git('show','-s','--format=%P'),githubSha:process.env.GITHUB_SHA??null,prHead:process.env.PR_HEAD_SHA??null,run:process.env.GITHUB_RUN_ID??null,attempt:process.env.GITHUB_RUN_ATTEMPT??null,node:process.version,platform:process.platform};
const capacity=await statfs(out);if(Number(capacity.bavail)*Number(capacity.bsize)<2*1024**3)throw Error('2 GiB free required for bounded evidence');
const sourceFiles=git('ls-files','src','scripts','tests','.github','docs/stage3b6','docs/stage3b6a','docs/stage3b6b','research','package.json','package-lock.json','vite.config.js','index.html','AGENTS.md','public/data/castle-overview.json','public/data/castle-overview.json').split('\n').filter(Boolean);
const sources=[];for(const file of sourceFiles){const b=await readFile(file),dest=path.join(out,'source',file);await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,b,{flag:'wx'});sources.push({file,bytes:b.length,sha256:hash(b),gitBlob:git('rev-parse',`HEAD:${file}`)});}
const realData=JSON.parse(await readFile('public/data/castle-overview.json','utf8'));
const {widths,motions}=fixedPlan;let matrixCoverage=null;
const rows=[],engines={},runnerErrors=[];
const diag=p=>p.evaluate(()=>window.__terrainDiagnostics());
const inferred=async p=>(await diag(p)).castleOverview.inferred;
const ready=p=>p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready,null,{timeout:60000});
const state=async(p,value)=>expect.poll(async()=>(await inferred(p)).state,{timeout:15000}).toBe(value);
const snapshot=d=>({view:d.state.view,landscape:d.state.landscape,selected:d.state.selected,camera:d.camera,target:d.target,fov:d.cameraFov});
async function opened(p){await expect(p.locator('#castle-overview-open')).toBeEnabled();await p.locator('#castle-overview-open').click();await expect.poll(async()=>(await diag(p)).castleOverview.active).toBe(true);}
async function settled(p){let prior='';await expect.poll(async()=>{const value=JSON.stringify(snapshot(await diag(p))),same=value===prior;prior=value;return same;},{timeout:10000}).toBe(true);}
async function checkpoint(p,row,name){row.observations.push({name,diagnostics:await diag(p)});}
async function screenshot(p,row,name){const file=`${row.key}-${name}.png`,b=await p.screenshot({path:path.join(out,file),fullPage:false});row.images.push({file,bytes:b.length,sha256:hash(b)});}
async function save(){await writeFile(path.join(out,'results.json'),JSON.stringify({schema:1,identity,endHead:git('rev-parse','HEAD'),at:new Date().toISOString(),sources,engines,capacity:{availableBytes:Number(capacity.bavail)*Number(capacity.bsize),freeInodes:Number(capacity.ffree),plannedEvidenceBytes:4*1024**3},scope:'B6a: normal A reverse click / B native keys, plus separately counted controlled C races; historical polygons and transforms NOT_TESTED',fixedPlan,matrixCoverage,rows,runnerErrors},null,2));}
async function runCase(browser,key,options,work,{kind='PRODUCTION',injected=false,allow503=false,synthetic=false}={}){
 const row={key,kind,status:'RUNNING',pageErrors:[],consoleErrors:[],cleanupErrors:[],captureErrors:[],responseObservations:[],http:[],observations:[],images:[],injected};rows.push(row);
 const endpoint=synthetic?harnessBase:base,dist=synthetic?'.work/stage3b5-harness':'dist';
 let context,page,tracing=false;const pending=[];
 try{
  context=await browser.newContext({...options,recordHar:{path:path.join(out,`${key}.har`),mode:'full',content:'omit'}});
  await context.tracing.start({screenshots:true,snapshots:true,sources:true});tracing=true;
  page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>row.pageErrors.push(String(e)));page.on('console',m=>{if(m.type()==='error')row.consoleErrors.push({text:m.text(),location:m.location()});});
  const observer=createResponseObserver({contextId:key,pageId:key+':page-1',onRecord:r=>row.responseObservations.push(r)});
  page.on('response',r=>{if(deliveryPath(r.url(),endpoint)||(synthetic&&new URL(r.url()).pathname==='/tests/stage3b5-harness.html'))pending.push((async()=>{try{await observer.capture(r,async(b,observation)=>{let entry;if(synthetic&&new URL(r.url()).pathname==='/tests/stage3b5-harness.html'){const sha256=hash(b),rawFile=`harness-html-${sha256}.html`,buildPath=dist+'/tests/stage3b5-harness.html',built=await readFile(buildPath);await writeFile(path.join(out,rawFile),b);entry={url:r.url(),status:r.status(),bytes:b.length,sha256,rawFile,buildPath,buildSha256:hash(built),matchesBuild:hash(built)===sha256};}else entry=await preserveEntity({body:b,url:r.url(),status:r.status(),headers:observation.responseHeaders,base:endpoint,out,dist});entry.injected=injected&&new URL(r.url()).pathname==='/data/castle-overview.json';entry.observationId=observation.responseId;row.http.push(entry);});}catch(e){row.captureErrors.push({operation:'response-capture',responseId:e.observation?.responseId??null,requestId:e.observation?.requestId??null,url:e.observation?.url??null,status:e.observation?.status??null,error:'response capture failed',body:e.observation?.body??null});}})());});
  await work(page,row);
  await page.evaluate(({key,kind})=>{window.__b6EvidenceMarker={key,kind};},{key,kind});
  await Promise.all(pending);expect(row.responseObservations.flatMap(r=>r.observerErrors),'observer metadata complete').toEqual([]);expect(row.pageErrors).toEqual([]);expect(row.captureErrors).toEqual([]);
  const unexpected=row.consoleErrors.filter(e=>!(allow503&&e.text.includes('503')&&/Failed to load resource/.test(e.text)&&(!e.location.url||e.location.url.includes('castle-overview.json'))));expect(unexpected).toEqual([]);
  expect(row.http.some(e=>e.buildPath.endsWith('.js')),'served JS required').toBe(true);expect(row.http.some(e=>e.buildPath.endsWith('.html')),'served HTML required').toBe(true);
  for(const e of row.http)if(!e.injected){expect(e.status,`status ${e.url}`).toBe(200);expect(e.matchesBuild,`served byte identity ${e.url}`).toBe(true);}
  row.status='PASS';
 }catch(e){row.status='FAIL';row.error=String(e);row.stack=e.stack;if(page)try{await screenshot(page,row,'failure');}catch(c){row.captureErrors.push(String(c));}}
 finally{
  await Promise.all(pending);
  if(tracing)try{await context.tracing.stop({path:path.join(out,`${key}.trace.zip`)});}catch(e){row.cleanupErrors.push({operation:'trace.stop',error:String(e)});}
  if(context)try{await context.close();}catch(e){row.cleanupErrors.push({operation:'context.close',error:String(e)});}
  try{const h=await readFile(path.join(out,`${key}.har`)),j=JSON.parse(h);expect(j.log.entries.length).toBeGreaterThan(0);const t=await readFile(path.join(out,`${key}.trace.zip`));row.evidence={har:{file:`${key}.har`,bytes:h.length,sha256:hash(h)},trace:{file:`${key}.trace.zip`,bytes:t.length,sha256:hash(t)}};
   execFileSync('python3',['-c','import zipfile,sys,json\nz=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None\nn=[n for n in z.namelist() if n.endswith(".trace")]; assert n\nrows=[json.loads(s) for f in n for s in z.read(f).decode().splitlines() if s]; assert rows\n',path.join(out,`${key}.trace.zip`)],{encoding:'utf8'});
  }catch(e){row.captureErrors.push({operation:'evidence-integrity',error:String(e)});}
  if(row.cleanupErrors.length||row.captureErrors.length)row.status='FAIL';await save();
 }
}
const focusState=p=>p.evaluate(()=>{const e=document.activeElement;return {id:e?.id??'',tag:e?.tagName??'',text:e?.textContent?.trim().slice(0,160)??'',region:e?.dataset.guideRegion??null,model:e?.dataset.guideModel??null,returned:e?.dataset.guideReturn??null};});
async function key(p,row,value){await p.keyboard.press(value);const f=await focusState(p);row.keyboard??=[];row.keyboard.push({key:value,focus:f});expect(await p.evaluate(()=>{const e=document.activeElement;return e===document.body||Boolean(e&&e.getClientRects().length&&!e.closest('[hidden]')&&!e.disabled);}),`native ${value} focus excludes hidden/disabled`).toBe(true);return f;}
async function tabTo(p,row,selector,direction='Tab'){
 for(let i=0;i<160;i++){if(await p.locator(selector).evaluate(e=>e===document.activeElement))return;await key(p,row,direction);}
 throw Error(`Native ${direction} did not reach ${selector} within fixed 160 keys`);
}
async function keyboardPath(p,row){
 await p.goto(base+'/');await ready(p);await tabTo(p,row,'#castle-overview-open');await key(p,row,'Space');await expect.poll(async()=>(await diag(p)).castleOverview.active).toBe(true);
 const ids=overview.regions.map(x=>x.id);await tabTo(p,row,`[data-guide-region="${ids[0]}"]`);
 await key(p,row,'Tab');await expect(p.locator(`[data-guide-region="${ids[1]}"]`)).toBeFocused();
 await key(p,row,'Shift+Tab');await expect(p.locator(`[data-guide-region="${ids[0]}"]`)).toBeFocused();await key(p,row,'Space');await expect(p.locator('#historical-guide-detail')).toContainText(ids[0]);
 await key(p,row,'Tab');await key(p,row,'Enter');await expect(p.locator('#historical-guide-detail')).toContainText(ids[1]);
 await tabTo(p,row,'[data-guide-region="nishinomaru"]');await key(p,row,'Space');await tabTo(p,row,'[data-guide-model="nm-bailey"]');await key(p,row,'Space');await expect(p.locator('#castle-overview-detail')).toContainText('nm-bailey');
 await tabTo(p,row,'[data-guide-return="nishinomaru"]','Shift+Tab');await key(p,row,'Enter');await expect(p.locator('[data-guide-region="nishinomaru"]')).toBeFocused();
 await key(p,row,'Escape');await expect(p.locator('[data-guide-region="nishinomaru"]')).toBeFocused();
 await expect(p.locator('#historical-guide-back')).toBeHidden();await checkpoint(p,row,'B-native-keyboard');
}
async function guideState(p){const d=await diag(p);return {snapshot:snapshot(d),guide:d.castleOverview.guide,selectedModelId:d.castleOverview.selectedModelId,active:d.castleOverview.active,terrainVisible:d.castleOverview.terrainVisible,renderObjects:d.castleOverview.renderObjects,meshes:d.modelMeshes.map(m=>({featureId:m.featureId,effectiveVisible:m.effectiveVisible,name:m.name})),detail:await p.locator('#castle-overview-detail').innerText(),guideText:await p.locator('#historical-guide-detail').innerText(),focus:await focusState(p)};}
async function reverseClick(p,row){
 await p.locator('[data-guide-region="nishinomaru"]').click();await p.locator('[data-guide-model="nm-bailey"]').click();await settled(p);
 const before=await diag(p),expected={snapshot:snapshot(before),meshes:before.modelMeshes,terrain:before.castleOverview.terrainVisible,selectedModel:before.castleOverview.selectedModelId};
 await p.locator('[data-guide-return="nishinomaru"]').click();await expect(p.locator('[data-guide-region="nishinomaru"]')).toBeFocused();
 for(const text of ['史料から直接','研究上の推論','未確認・不明・未検証','UNKNOWN'])await expect(p.locator('#historical-guide-detail')).toContainText(text);
 await settled(p);const after=await diag(p);expect({snapshot:snapshot(after),meshes:after.modelMeshes,terrain:after.castleOverview.terrainVisible,selectedModel:after.castleOverview.selectedModelId}).toEqual(expected);
 row.reverseClick={before:expected,after:{snapshot:snapshot(after),meshes:after.modelMeshes,terrain:after.castleOverview.terrainVisible,selectedModel:after.castleOverview.selectedModelId},focus:await focusState(p)};await checkpoint(p,row,'A-real-reverse-click');
}
async function newIntent(p,row,action){
 const beforeIntent=await diag(p);
 if(action==='region'){await p.locator('[data-guide-region="honmaru"]').click();await expect(p.locator('#historical-guide-detail')).toContainText('honmaru');await expect(p.locator('[data-guide-region="honmaru"]')).toBeFocused();}
 if(action==='model'){await p.locator('[data-overview-item="nm-bailey"]').click();await p.locator('[data-overview-detail="nm-bailey"]').click();await p.waitForFunction(()=>window.__terrainDiagnostics().castleOverview.detailOperations.some(o=>o.modelId==='nm-bailey'&&o.terminal&&o.status==='completed'),null,{timeout:60000});await ready(p);expect((await diag(p)).state.selected).toBe('nm-bailey');expect((await diag(p)).modelMeshes.some(m=>m.featureId==='nm-bailey'&&m.effectiveVisible)).toBe(true);}
 if(action==='overview'){await opened(p);await ready(p);expect((await diag(p)).state.view).toBe('regional');}
 if(action==='return'){await p.locator('[data-overview-item="nm-bailey"]').click();await p.locator('[data-guide-return="nishinomaru"]').click();await expect(p.locator('[data-guide-region="nishinomaru"]')).toBeFocused();await expect(p.locator('#historical-guide-detail')).toContainText('nishinomaru');}
 await settled(p);const confirmed=await diag(p);
 if(action==='region'||action==='return'){expect(snapshot(confirmed)).toEqual(snapshot(beforeIntent));expect(confirmed.castleOverview.guide.selectedRegionId).toBe(action==='region'?'honmaru':'nishinomaru');}
 if(action==='model'){const m=overview.models.find(m=>m.id==='nm-bailey');expect(confirmed.target[0]).toBeCloseTo(m.center[0]-overview.origin.easting,6);expect(confirmed.target[2]).toBeCloseTo(-(m.center[1]-overview.origin.northing),6);for(const [i,offset]of [-60,65,80].entries())expect(confirmed.camera[i]-confirmed.target[i]).toBeCloseTo(offset,6);await expect(p.locator('[data-overview-detail="nm-bailey"]')).toBeFocused();}
 if(action==='overview'){expect(confirmed.target).toEqual([0,480,0]);await expect(p.locator('#castle-overview-open')).toBeFocused();}
 row.order.push('new-'+action+'-confirmed');
}
async function controlledRace(p,row,action,order){
 let release,hit=false,released=false;const held=new Promise(r=>release=()=>{released=true;r();});row.order=[];row.action=action;row.arrivalOrder=order;
 await p.route('**/phase3i-inner.glb',async route=>{hit=true;row.order.push('old-request-held');await held;row.order.push('old-request-released');await route.continue();});
 try{
  await p.goto(base+'/');await ready(p);await opened(p);await p.locator('[data-overview-item="ic-lookout"]').click();await p.locator('[data-overview-detail="ic-lookout"]').click();
  await expect.poll(()=>hit,{timeout:60000}).toBe(true);row.old=(await diag(p)).castleOverview.detailOperations.findLast(o=>o.modelId==='ic-lookout');expect(row.old?.terminal).toBe(false);row.oldInner=(await diag(p)).phase3c.operations.findLast(o=>!o.terminal);expect(row.oldInner?.status).toBe('pending');
  if(order==='normal'){release();await p.waitForFunction(id=>window.__terrainDiagnostics().castleOverview.detailOperations.some(o=>o.id===id&&o.terminal),row.old.id,{timeout:60000});row.oldTerminal=(await diag(p)).castleOverview.detailOperations.find(o=>o.id===row.old.id);expect(row.oldTerminal.status).toBe('completed');row.oldInnerTerminal=(await diag(p)).phase3c.operations.find(o=>o.id===row.oldInner.id);expect(row.oldInnerTerminal).toMatchObject({id:row.oldInner.id,terminal:true,status:'attached'});row.order.push('old-normal-completed');}
  await newIntent(p,row,action);row.newer=await guideState(p);
  if(order==='delayed'){expect(released).toBe(false);release();await p.waitForFunction(id=>window.__terrainDiagnostics().castleOverview.detailOperations.some(o=>o.id===id&&o.terminal),row.old.id,{timeout:60000});row.oldTerminal=(await diag(p)).castleOverview.detailOperations.find(o=>o.id===row.old.id);expect(row.oldTerminal.status).toBe('not-completed');row.oldInnerTerminal=(await diag(p)).phase3c.operations.find(o=>o.id===row.oldInner.id);expect(row.oldInnerTerminal).toMatchObject({id:row.oldInner.id,terminal:true,status:'stale-discarded'});row.order.push('old-stale-terminal');}
  await settled(p);row.after=await guideState(p);expect(row.after).toEqual(row.newer);await checkpoint(p,row,'C-'+order+'-'+action);expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }finally{if(!released)release();}
}
async function normal(p,row){
 await keyboardPath(p,row);await reverseClick(p,row);await p.goto(base+'/');await ready(p);await opened(p);await settled(p);
 await expect(p.locator('[data-guide-region]')).toHaveCount(11);
 for(const model of overview.models){await p.locator(`[data-overview-item="${model.id}"]`).click();if(model.id==='nm-bailey')await expect(p.locator('[data-guide-return="nishinomaru"]')).toBeVisible();else await expect(p.locator('#castle-overview-detail')).toContainText('関連区域未確証');}
 row.before=snapshot(await diag(p));const objects=(await diag(p)).castleOverview.renderObjects;
 for(const r of overview.regions){
  const b=p.locator(`[data-guide-region="${r.id}"]`);await b.focus();await p.keyboard.press('Enter');await expect(b).toBeFocused();
  const d=p.locator('#historical-guide-detail');await expect(d).toContainText(r.id);await expect(d).toContainText('史料から直接');await expect(d).toContainText('研究上の推論');await expect(d).toContainText('現況A');await expect(d).toContainText('UNKNOWN');await expect(d).toContainText('NOT_TESTED');
  if(r.id!=='nishinomaru')await expect(d).toContainText('関連模型なし');
 }
 await p.locator('[data-guide-region="nishinomaru"]').click();await screenshot(p,row,'sources');
 await p.locator('[data-guide-model="nm-bailey"]').click();await expect(p.locator('#historical-guide-status')).toContainText('3D表示成功を意味しません');
 await expect(p.locator('#castle-overview-detail')).toContainText('nm-bailey');
 await p.locator('#historical-guide-back').click();await expect(p.locator('[data-guide-region="nishinomaru"]')).toBeFocused();
 await p.locator('[data-guide-model="nm-bailey"]').click();await p.locator('#historical-guide-back').focus();await p.keyboard.press('Escape');await expect(p.locator('[data-guide-region="nishinomaru"]')).toBeFocused();
 expect((await diag(p)).castleOverview.renderObjects).toEqual(objects);await settled(p);expect(snapshot(await diag(p))).toEqual(row.before);
 await p.locator('[data-guide-model="nm-bailey"]').click();await p.getByRole('button',{name:'既存の詳細3Dへ',exact:true}).click();await ready(p);await expect.poll(async()=>(await diag(p)).state.selected).toBe('nm-bailey');expect((await diag(p)).modelMeshes.some(m=>m.featureId==='nm-bailey'&&m.effectiveVisible)).toBe(true);await p.locator('[data-compare="current"]').click();await expect.poll(async()=>(await diag(p)).modelMeshes.filter(m=>m.featureId==='nm-bailey').some(m=>m.effectiveVisible)).toBe(false);await p.locator('[data-compare="restored"]').click();await expect.poll(async()=>(await diag(p)).modelMeshes.some(m=>m.featureId==='nm-bailey'&&m.effectiveVisible)).toBe(true);
 await p.locator('#historical-guide-back').click();await expect(p.locator('[data-guide-region="nishinomaru"]')).toBeFocused();
 await opened(p);await p.locator('#castle-overview-back').click();await ready(p);await expect(p.locator('#castle-overview-open')).toBeFocused();
 expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await checkpoint(p,row,'roundtrip');
}
const overview=JSON.parse(await readFile('public/data/castle-overview.json','utf8'));
async function faultCase(p,row,fault){
 let broken=true;await p.route('**/data/castle-overview.json',route=>broken?(fault==='503'?route.fulfill({status:503,body:'planned unavailable'}):route.fulfill({json:{...overview,regions:overview.regions.map((r,i)=>i? r:{...r,geometry:{type:'Point',coordinates:[0,0]}})}})):route.fulfill({json:overview}));
 await p.goto(base+'/');await ready(p);await expect(p.locator('#historical-guide-status')).toContainText('読込失敗');await expect(p.locator('[data-guide-region]')).toHaveCount(0);row.rejected=await p.locator('#historical-guide-status').textContent();
 broken=false;await p.locator('#castle-overview-retry').click();await expect(p.locator('[data-guide-region]')).toHaveCount(11);await checkpoint(p,row,'recovered');
}
async function emptyRelations(p,row){await p.route('**/data/castle-overview.json',r=>r.fulfill({json:{...overview,regionModelRelations:[]}}));await p.goto(base+'/');await ready(p);await p.locator('[data-guide-region="nishinomaru"]').click();await expect(p.locator('#historical-guide-detail')).toContainText('関連模型なし');await expect(p.locator('[data-guide-model]')).toHaveCount(0);await checkpoint(p,row,'empty-relations');}
for(const [name,engine] of Object.entries({chromium,webkit}).filter(([n])=>fixedPlan.engines.includes(n))){
 let browser;try{browser=await engine.launch({headless:true,...(name==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})}: {})});engines[name]={version:browser.version(),executable:engine.executablePath()};}catch(e){rows.push({key:name,kind:'ENVIRONMENT',status:'NOT_TESTED',error:String(e)});await save();continue;}
 for(const width of widths)for(const reducedMotion of motions)await runCase(browser,`${name}-${width}-${reducedMotion}`,{viewport:{width,height:900},reducedMotion},normal);
 for(const width of widths)for(const reducedMotion of motions)for(const action of ['region','model','overview','return'])for(const order of ['normal','delayed'])await runCase(browser,`${name}-${width}-${reducedMotion}-race-${action}-${order}`,{viewport:{width,height:900},reducedMotion},(p,r)=>controlledRace(p,r,action,order),{kind:'CONTROLLED_RACE'});
 for(const fault of ['503','invalid'])await runCase(browser,`${name}-${fault}`,{viewport:{width:375,height:900},reducedMotion:'reduce'},(p,r)=>faultCase(p,r,fault),{kind:'INJECTED',injected:true,allow503:fault==='503'});
 await runCase(browser,`${name}-empty`,{viewport:{width:375,height:900},reducedMotion:'reduce'},emptyRelations,{kind:'INJECTED',injected:true});
 await browser.close();await save();
}
try{matrixCoverage=assertMatrix(rows,fixedPlan);}catch(e){matrixCoverage={status:'FAIL',reason:String(e)};runnerErrors.push({operation:'fixed-matrix-coverage',error:String(e)});}
await save();console.log(JSON.stringify(rows.map(({key,status,error})=>({key,status,error})),null,2));if(rows.some(r=>r.status!=='PASS')||runnerErrors.length)process.exitCode=1;
