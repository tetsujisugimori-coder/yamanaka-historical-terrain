/** Fixed production matrix. Synthetic renderer is a separate build and result class. */
import {chromium,webkit,expect} from '@playwright/test';
import {mkdir,writeFile,readFile,stat,statfs} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {deliveryPath,preserveEntity} from './stage3b-delivery-evidence.mjs';
const out=process.env.EVIDENCE_DIR,base=process.env.TEST_URL??'http://127.0.0.1:4395',harnessBase=process.env.HARNESS_URL??'http://127.0.0.1:4399';
if(!out)throw Error('EVIDENCE_DIR required');
await mkdir(out,{recursive:true});
try{await stat(path.join(out,'results.json'));throw Error('Refuse evidence overwrite');}catch(e){if(e.code!=='ENOENT')throw e;}
const hash=b=>createHash('sha256').update(b).digest('hex'),git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const identity={head:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),dirty:git('status','--porcelain'),parents:git('show','-s','--format=%P'),githubSha:process.env.GITHUB_SHA??null,prHead:process.env.PR_HEAD_SHA??null,run:process.env.GITHUB_RUN_ID??null,attempt:process.env.GITHUB_RUN_ATTEMPT??null,node:process.version,platform:process.platform};
const capacity=await statfs(out);if(Number(capacity.bavail)*Number(capacity.bsize)<2*1024**3)throw Error('2 GiB free required for bounded evidence');
const sourceFiles=git('ls-files','src','scripts','tests','.github','docs/stage3b6','research','package.json','package-lock.json','vite.config.js','index.html','AGENTS.md','public/data/castle-overview.json','public/data/castle-overview.json').split('\n').filter(Boolean);
const sources=[];for(const file of sourceFiles){const b=await readFile(file),dest=path.join(out,'source',file);await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,b,{flag:'wx'});sources.push({file,bytes:b.length,sha256:hash(b),gitBlob:git('rev-parse',`HEAD:${file}`)});}
const realData=JSON.parse(await readFile('public/data/castle-overview.json','utf8'));
const widths=process.env.SMOKE_ONLY?[375]:[375,390,765,1280],motions=process.env.SMOKE_ONLY?['no-preference']:['no-preference','reduce'];
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
async function save(){await writeFile(path.join(out,'results.json'),JSON.stringify({schema:1,identity,endHead:git('rev-parse','HEAD'),at:new Date().toISOString(),sources,engines,capacity:{availableBytes:Number(capacity.bavail)*Number(capacity.bsize),freeInodes:Number(capacity.ffree),plannedEvidenceBytes:1024**3},scope:'B6 canonical guide; actual historical polygons and transforms NOT_TESTED',rows,runnerErrors},null,2));}
async function runCase(browser,key,options,work,{kind='PRODUCTION',injected=false,allow503=false,synthetic=false}={}){
 const row={key,kind,status:'RUNNING',pageErrors:[],consoleErrors:[],cleanupErrors:[],captureErrors:[],http:[],observations:[],images:[],injected};rows.push(row);
 const endpoint=synthetic?harnessBase:base,dist=synthetic?'.work/stage3b5-harness':'dist';
 let context,page,tracing=false;const pending=[];
 try{
  context=await browser.newContext({...options,recordHar:{path:path.join(out,`${key}.har`),mode:'full',content:'omit'}});
  await context.tracing.start({screenshots:true,snapshots:true,sources:true});tracing=true;
  page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>row.pageErrors.push(String(e)));page.on('console',m=>{if(m.type()==='error')row.consoleErrors.push({text:m.text(),location:m.location()});});
  page.on('response',r=>{if(deliveryPath(r.url(),endpoint)||(synthetic&&new URL(r.url()).pathname==='/tests/stage3b5-harness.html'))pending.push((async()=>{try{const b=await r.body();let entry;if(synthetic&&new URL(r.url()).pathname==='/tests/stage3b5-harness.html'){const sha256=hash(b),rawFile=`harness-html-${sha256}.html`,buildPath=dist+'/tests/stage3b5-harness.html',built=await readFile(buildPath);await writeFile(path.join(out,rawFile),b);entry={url:r.url(),status:r.status(),bytes:b.length,sha256,rawFile,buildPath,buildSha256:hash(built),matchesBuild:hash(built)===sha256};}else entry=await preserveEntity({body:b,url:r.url(),status:r.status(),headers:await r.allHeaders(),base:endpoint,out,dist});entry.injected=injected&&new URL(r.url()).pathname==='/data/castle-overview.json';row.http.push(entry);}catch(e){row.captureErrors.push(String(e));}})());});
  await work(page,row);
  await page.evaluate(({key,kind})=>{window.__b6EvidenceMarker={key,kind};},{key,kind});
  await Promise.all(pending);expect(row.pageErrors).toEqual([]);expect(row.captureErrors).toEqual([]);
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
async function normal(p,row){
 await p.goto(base+'/');await ready(p);await opened(p);await settled(p);
 await expect(p.locator('[data-guide-region]')).toHaveCount(11);
 for(const model of overview.models){await p.locator(`[data-overview-item="${model.id}"]`).click();if(model.id==='nm-bailey')await expect(p.locator('[data-guide-return="nishinomaru"]')).toBeVisible();else await expect(p.locator('#castle-overview-detail')).toContainText('関連区域未確証');}
 await p.locator('[data-guide-return="nishinomaru"]').count();
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
for(const [name,engine] of Object.entries({chromium,webkit}).filter(([n])=>!process.env.BROWSER_FILTER||n===process.env.BROWSER_FILTER)){
 let browser;try{browser=await engine.launch({headless:true,...(name==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})}: {})});engines[name]={version:browser.version(),executable:engine.executablePath()};}catch(e){rows.push({key:name,kind:'ENVIRONMENT',status:'NOT_TESTED',error:String(e)});await save();continue;}
 for(const width of widths)for(const reducedMotion of motions)await runCase(browser,`${name}-${width}-${reducedMotion}`,{viewport:{width,height:900},reducedMotion},normal);
 for(const fault of ['503','invalid'])await runCase(browser,`${name}-${fault}`,{viewport:{width:375,height:900},reducedMotion:'reduce'},(p,r)=>faultCase(p,r,fault),{kind:'INJECTED',injected:true,allow503:fault==='503'});
 await runCase(browser,`${name}-empty`,{viewport:{width:375,height:900},reducedMotion:'reduce'},emptyRelations,{kind:'INJECTED',injected:true});
 await browser.close();await save();
}
await save();console.log(JSON.stringify(rows.map(({key,status,error})=>({key,status,error})),null,2));if(rows.some(r=>r.status!=='PASS'))process.exitCode=1;
