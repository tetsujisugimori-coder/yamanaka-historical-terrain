import {chromium,webkit,expect} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {canonicalSha256} from './evidence-hash.mjs';
import {oracle} from '../tests/section-oracle.mjs';
const root=process.env.TEST_URL??'http://127.0.0.1:4317',dir=process.env.LANDSCAPE_EVIDENCE??'evidence/landscape/browser';
const mutation=process.argv.find(a=>a.startsWith('--mutation='))?.split('=')[1];
await mkdir(dir,{recursive:true});const rows=[],meta=JSON.parse(await readFile('public/data/landscape.json','utf8'));
const hashFiles=['index.html','src/main.js','src/reading.js','src/style.css','src/landscape.js','public/data/landscape.json','public/data/landscape.glb','public/data/castle.glb','public/data/nishinomaru.glb','scripts/landscape-browser.mjs'];
const hashes={};for(const f of hashFiles)hashes[f]=canonicalSha256(f,await readFile(f));
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
console.log('landscape: preparing raw GLB oracle');const qA=oracle('public/data/castle.glb'),qC=oracle('public/data/nishinomaru.glb');
async function save(){await writeFile(`${dir}/${mutation??'matrix'}.json`,JSON.stringify({scope:'Implementation self-verification. Automated WebKit is not real iPhone Safari. No independent reviewer claim.',head,sourceHashes:hashes,utc:new Date().toISOString(),root,mutation,rows},null,2));}
async function snap(p){return p.evaluate(()=>window.__terrainDiagnostics());}
async function ready(p){await p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready,{timeout:30000});}
async function settle(p){await p.waitForFunction(()=>window.__jobs===0);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function instrument(p){let code=await (await p.request.get(root+'/src/main.js')).text();code=code.replace('models.set(file,pending);','window.__jobs=(window.__jobs??0)+1;pending.then(()=>window.__jobs--,()=>window.__jobs--);models.set(file,pending);');
 if(mutation==='drama')code=code.replace("o.userData.evidenceCategory!=='D'||state.drama",'true');
 if(mutation==='ground')code=code.replace('Math.max(...heights)*state.exaggeration+1.7','Math.max(...heights)*state.exaggeration-1.7');
 await p.route('**/src/main.js*',r=>r.fulfill({status:200,contentType:'application/javascript',body:code}));}
function visible(d){return new Set(d.landscape.objects.map(o=>o.id));}
function assertCamera(d,station){const [e,n]=station.eye,expected=Math.max(qA(e,n),qC(e,n))*d.state.exaggeration+1.7;if(Math.abs(d.camera[1]-expected)>.001)throw Error('Low camera clearance mismatch');expect(d.camera[0]).toBe(e);expect(d.camera[2]).toBe(-n);expect(d.landscape.scale).toBe(d.state.exaggeration);}
for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
 console.log('landscape: launching',name);const browser=await engine.launch();
 for(const width of mutation?[390]:[375,390,765,1280])for(const reducedMotion of mutation?['reduce']:['no-preference','reduce']){
  const key=`${name}-${width}-${reducedMotion}`,row={kind:'matrix',key,engine:name,version:browser.version(),width,reducedMotion,checks:[]};
  console.log('landscape: starting',key);const ctx=await browser.newContext({viewport:{width,height:960},hasTouch:width<800,isMobile:width<700,reducedMotion,deviceScaleFactor:1}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(15000);await instrument(p);
  try{
   await p.goto(root);await ready(p);console.log(key,'regional ready');let t=performance.now();await p.locator('#landscape-enter').click();await p.waitForFunction(()=>window.__terrainDiagnostics().state.landscape&&window.__terrainDiagnostics().state.ready);row.firstLandscapeReadyMs=performance.now()-t;await settle(p);console.log(key,'landscape ready');
   let d=await snap(p);expect([...visible(d)].sort()).toEqual(meta.elements.map(e=>e.id).sort());row.overview=d;row.checks.push('five scenery IDs visible including flags and people D');
   if([390,1280].includes(width)&&reducedMotion==='reduce')await p.locator('#viewport').screenshot({path:`${dir}/${key}-overview-cd.png`});
   for(const f of meta.elements){await p.locator(`#landscape-list [data-id=${f.id}]`).click();await ready(p);await expect(p.locator('#detail h2')).toHaveText(f.name);await expect(p.locator('#detail .evidence-tag b')).toHaveText(f.category);for(const text of [f.assumptions,f.unknown,f.direction,f.editor])await expect(p.locator('#detail')).toContainText(text);}
   row.checks.push('captions bind exact category, role, assumptions, unknowns, direction and editor');
   const before=await snap(p);await p.locator('[data-landscape-mode=c]').click();await ready(p);d=await snap(p);if(d.landscape.objects.some(o=>o.category==='D'))throw Error('D visibility leak');expect(d.camera).toEqual(before.camera);expect(d.target).toEqual(before.target);expect(d.state.selected).toBe('sc-people');await expect(p.locator('#landscape-selection-status')).toContainText('非表示');row.cOnly=d;
   if([390,1280].includes(width)&&reducedMotion==='reduce')await p.locator('#viewport').screenshot({path:`${dir}/${key}-overview-c.png`});
   await p.locator('[data-landscape-mode=a]').click();await ready(p);d=await snap(p);expect(d.landscape.objects).toEqual([]);expect(d.camera).toEqual(before.camera);expect(d.target).toEqual(before.target);await expect(p.locator('#landscape-selection-status')).toContainText('対応物はありません');row.current=d;
   if([390,1280].includes(width)&&reducedMotion==='reduce')await p.locator('#viewport').screenshot({path:`${dir}/${key}-overview-a.png`});
   await p.locator('[data-landscape-mode=cd]').click();await ready(p);row.checks.push('C-only removes every D mesh; A removes all scenery; all preserve exact camera and selection');
   row.stations=[];
   for(const station of meta.stations){await p.locator(`[data-station=${station.id}]`).click();await p.waitForFunction(id=>window.__terrainDiagnostics().state.station===id,station.id);d=await snap(p);assertCamera(d,station);const eye=d.camera;await p.locator('#viewport').focus();await p.keyboard.press('ArrowRight');expect((await snap(p)).camera).toEqual(eye);await p.locator('[data-landscape-mode=a]').click();await ready(p);expect((await snap(p)).camera).toEqual(eye);await p.locator('[data-landscape-mode=cd]').click();await ready(p);row.stations.push({id:station.id,eye,groundA:qA(...station.eye),groundC:qC(...station.eye)});
    if([390,1280].includes(width)&&reducedMotion==='reduce')await p.locator('#viewport').screenshot({path:`${dir}/${key}-low-${station.id}.png`});
   }
   row.checks.push('four fixed eye points above independent raw A/C GLB surfaces; look input and A/C preserve eye');
   await p.locator('#viewport').scrollIntoViewIfNeeded();const box=await p.locator('#viewport').boundingBox(),eye=(await snap(p)).camera,target=(await snap(p)).target;
   await p.mouse.move(box.x+box.width*.4,box.y+box.height*.4);await p.mouse.down();await p.mouse.move(box.x+box.width*.6,box.y+box.height*.5,{steps:5});await p.mouse.up();expect((await snap(p)).camera).toEqual(eye);expect((await snap(p)).target).not.toEqual(target);
   if(width<800){await p.touchscreen.tap(box.x+box.width*.5,box.y+box.height*.5);await ready(p);}
   await p.locator('#landscape-overview').click();expect((await snap(p)).state.station).toBe(null);await p.locator('#category-c').uncheck();expect((await snap(p)).landscape.objects).toEqual([]);await p.locator('#category-c').check();
   for(const f of ['nm-bailey','nm-moat','nm-rampart','nm-passage','nm-transition']){await p.locator(`#reconstruction-list [data-id=${f}]`).click();expect((await snap(p)).state.selected).toBe(f);}
   for(const id of ['moat','rampart']){await p.locator('#section-choice').selectOption(id);await p.waitForFunction(()=>window.__terrainDiagnostics().section.status==='ready');const signature=JSON.stringify((await snap(p)).section.data);await p.locator('#section-locate').click();await ready(p);await p.locator('#exaggeration').check();expect(JSON.stringify((await snap(p)).section.data)).toBe(signature);await p.locator('#exaggeration').uncheck();}
   row.checks.push('trusted drag/touch equivalent; five legacy facilities, category visibility, two sections and real dimensions unchanged at 1/2x');
   for(const station of meta.stations){await p.locator('#exaggeration').check();await p.locator(`[data-station=${station.id}]`).click();await p.waitForFunction(id=>window.__terrainDiagnostics().state.station===id,station.id);assertCamera(await snap(p),station);await p.locator('#exaggeration').uncheck();}
   expect(await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);expect(errors).toEqual([]);await p.locator('#reset').click();await ready(p);expect((await snap(p)).state.landscape).toBe(false);expect((await snap(p)).landscape.objects).toEqual([]);row.status='PASS';
  }catch(e){row.status='FAIL';row.reason=e.message;await p.screenshot({path:`${dir}/${mutation??'matrix'}-${key}-failure.png`,fullPage:true}).catch(()=>{});}
  rows.push(row);console.log(mutation??'matrix',row.status,key,row.reason??'');await save();await ctx.close();
 }
 if(!mutation)for(const outcome of ['200','404'])for(const cancel of ['view','selection']){
  const row={kind:'gated-landscape-race',engine:name,outcome,cancel},ctx=await browser.newContext({viewport:{width:390,height:960}}),p=await ctx.newPage();await instrument(p);let release;const gate=new Promise(r=>release=r);await p.route('**/data/landscape.glb',async r=>{await gate;await r.fulfill(outcome==='200'?{status:200,contentType:'model/gltf-binary',body:await readFile('public/data/landscape.glb')}:{status:404,body:'deliberate 404'});});
  try{await p.goto(root);await ready(p);const request=p.waitForRequest('**/data/landscape.glb');await p.locator('#landscape-enter').click();await request;
   if(cancel==='view')await p.locator('[data-view=castle]').click();else await p.locator('#feature-list [data-id=west]').click();await ready(p);const before=await snap(p);release();await settle(p);const after=await snap(p);expect(after.state).toEqual(before.state);expect(after.camera).toEqual(before.camera);expect(after.target).toEqual(before.target);expect(after.landscape.objects).toEqual([]);await expect(p.locator('body')).toHaveAttribute('data-render-state','ready');row.before=before;row.after=after;row.status='PASS';
  }catch(e){row.status='FAIL';row.reason=e.message;}release();rows.push(row);console.log(row.status,name,'race',outcome,cancel);await save();await ctx.close();
 }
 if(!mutation)for(const failure of ['webgl','scenery404']){
  const row={kind:'fallback',engine:name,failure},ctx=await browser.newContext(),p=await ctx.newPage();await instrument(p);
  if(failure==='webgl')await p.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /webgl/i.test(kind)?null:original.call(this,kind,...args);};});else await p.route('**/data/landscape.glb',r=>r.fulfill({status:404,body:'deliberate 404'}));
  try{await p.goto(root);if(failure==='scenery404'){await ready(p);await p.locator('#landscape-enter').click();}await p.waitForFunction(()=>['error','unavailable'].includes(document.body.dataset.renderState));for(const f of meta.elements){await p.locator(`#landscape-list [data-id=${f.id}]`).click();await expect(p.locator('#detail h2')).toHaveText(f.name);await expect(p.locator('#detail')).toContainText(f.assumptions);}row.status='PASS';}catch(e){row.status='FAIL';row.reason=e.message;}rows.push(row);await save();await ctx.close();
 }
 await browser.close();
}
if(mutation){const reason=mutation==='drama'?'D visibility leak':'Low camera clearance mismatch';if(rows.length!==2||!rows.every(r=>r.status==='FAIL'&&r.reason===reason))process.exitCode=1;}
else if(rows.length!==28||rows.some(r=>r.status!=='PASS'))process.exitCode=1;
