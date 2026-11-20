import {chromium,webkit,expect} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {groundOracle} from '../tests/phase3f-ground-oracle.mjs';
import {oracle,verifyProfile} from '../tests/section-oracle.mjs';

const BASE='148317e52a7dc5efba8aa519538a476dfead18c5';
const git=(cwd,args)=>execFileSync('git',args,{cwd,encoding:'utf8'}).trim();
const baseline=process.env.ISSUE29_BASELINE_DIR;
assert.ok(baseline,'baseline checkout path required');
assert.equal(git(baseline,['rev-parse','HEAD']),BASE);
const dir=process.env.ISSUE29_OUT??'.work/issue-29/browser';
await mkdir(dir,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const files=['public/data/castle.glb','public/data/phase3i.glb','public/data/phase3b.glb','public/data/phase3i-inner.glb','public/data/landscape.glb','public/data/phase3b.json','package-lock.json'];
const sources={};
for(const file of files){
 const a=hash(await readFile(join(baseline,file))),b=hash(await readFile(file));assert.equal(a,b,file);sources[file]=a;
}
const head=git('.',['rev-parse','HEAD']),tree=git('.',['rev-parse','HEAD^{tree}']);
const report={head,tree,base:BASE,baseTree:git(baseline,['rev-parse','HEAD^{tree}']),sources,
 environment:{node:process.version,platform:process.platform,arch:process.arch},run:process.env.GITHUB_RUN_ID??null,
 attempt:process.env.GITHUB_RUN_ATTEMPT??null,job:process.env.GITHUB_JOB??null,startedAt:new Date().toISOString(),rows:[]};
const output=()=>writeFile(join(dir,'results.json'),JSON.stringify(report,null,2));
const A=oracle(files[0]),C=oracle(files[1]),west=groundOracle(files[2]);
const specs={moat:[[-66,-10],[-38,-10]],rampart:[[-15,15],[-45,15]]};
const checkpoint=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const snap=p=>p.evaluate(()=>window.__terrainDiagnostics());
const ready=p=>p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready);
const mode=async(p,mode)=>{await p.locator(`[data-landscape-mode=${mode}]`).click();await expect(p.locator(`[data-landscape-mode=${mode}]`)).toHaveAttribute('aria-pressed','true');await ready(p);};
const views={
 gate:'[data-station=wb-gate]',join:'[data-western-overview=wb-gate]',bridge:'[data-exploration-station=ic-bridge]',
 moat:'[data-station=wb-moat]',bank:'[data-station=bank]',far:'#landscape-overview',
};
const protectedViews=new Set(['current','inferred','finishOff']);
const captureRaw=(p,includePng=false)=>p.evaluate(async includePng=>{
 const source=document.querySelector('#viewport canvas');
 if(document.hidden||!source?.width||!source.height)throw Error('raw terrain frame unavailable');
 const {width,height}=source,c=document.createElement('canvas');c.width=width;c.height=height;
 const ctx=c.getContext('2d',{willReadFrequently:true});
 function frame(){
  // The existing visibilitychange listener renders synchronously. Copy before this
  // task returns: WebGL is intentionally not configured to preserve its buffer.
  document.dispatchEvent(new Event('visibilitychange'));
  ctx.clearRect(0,0,width,height);ctx.drawImage(source,0,0);
  const {data}=ctx.getImageData(0,0,width,height);
  let opaque=0,first=null,diverse=false;
  for(let i=0;i<data.length;i+=4)if(data[i+3]===255){
   opaque++;
   const rgb=(data[i]<<16)|(data[i+1]<<8)|data[i+2];
   if(first===null)first=rgb;
   else if(first!==rgb)diverse=true;
  }
  if(opaque!==width*height||!diverse)throw Error('raw terrain frame is transparent or uniform');
  return data;
 }
 const digest=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),x=>x.toString(16).padStart(2,'0')).join('');
 const pixels=frame(),repeat=frame();
 // The canvas is opaque; encode precisely the audited RGBA, independently
 // decodable without DOM compositing or premultiplication loss.
 let pngData=null;
 if(includePng){
  ctx.putImageData(new ImageData(pixels,width,height),0,0);
  pngData=c.toDataURL('image/png');
 }
 const sha256=await digest(pixels),repeatSha256=await digest(repeat);
 if(repeatSha256!==sha256)throw Error('same-scene raw terrain frames differ');
 const changed=pixels.slice();changed[(Math.floor(height/2)*width+Math.floor(width/2))*4]^=1;
 return {width,height,sha256,mutatedSha256:await digest(changed),pngData};
},includePng);
function requireSameRaw(a,b,label){
 assert.equal(a.width,b.width,`raw width drift: ${label}`);
 assert.equal(a.height,b.height,`raw height drift: ${label}`);
 assert.equal(a.sha256,b.sha256,`raw terrain pixels drift: ${label}`);
}
const metrics=d=>({camera:d.camera,target:d.target,fov:d.cameraFov,canvas:d.canvas,drawCalls:d.drawCalls,triangles:d.triangles});
async function view(p,key,selector,out,row){
 await p.locator(selector).click();
 if(key==='bridge')await p.waitForFunction(()=>window.__terrainDiagnostics().state.station==='ic-bridge');
 if(key==='gate'||key==='moat'||key==='bank')await p.waitForFunction(id=>window.__terrainDiagnostics().state.station===id,{gate:'wb-gate',moat:'wb-moat',bank:'bank'}[key]);
 await checkpoint(p);const d=await snap(p),result={...metrics(d),station:d.state.station,western:d.phase3b.visible,shadows:d.phase3b.shadows};
 if(protectedViews.has(key)||out){
  const {mutatedSha256,pngData,...raw}=await captureRaw(p,Boolean(out));result.raw=raw;
  if(out){
   assert.ok(pngData?.startsWith('data:image/png;base64,'),'raw terrain PNG missing');
   const rawPng=Buffer.from(pngData.slice('data:image/png;base64,'.length),'base64');
   const rawPath=out.replace(/\.png$/,'-raw.png');
   await writeFile(rawPath,rawPng,{flag:'wx'});
   result.rawPng={name:rawPath.split('/').at(-1),bytes:rawPng.length,sha256:hash(rawPng)};row.rawImages++;
   const canvas=p.locator('#viewport canvas');
   const bytes=await canvas.screenshot({path:out,timeout:15000});
   result.png={name:out.split('/').at(-1),bytes:bytes.length,sha256:hash(bytes)};row.images++;
   if(key==='current'&&out.endsWith('-after.png')){
    // A one-channel one-level pixel change must fail the exact same comparator.
    assert.throws(()=>requireSameRaw(raw,{...raw,sha256:mutatedSha256},'one-channel negative control'),/raw terrain pixels drift/);
    // Move only the DOM compositing, not the WebGL framebuffer or product layout.
    const style=await p.addStyleTag({content:'#viewport canvas{transform:translateY(1px)!important}'});
    try{
     const shifted=hash(await canvas.screenshot({timeout:15000}));
     assert.notEqual(shifted,result.png.sha256,'composited shift control did not change screenshot');
     requireSameRaw(raw,await captureRaw(p),'composited shift control');
     row.imageControls={oneChannelChange:'REJECTED',compositedShift:'RAW_IDENTICAL',shiftedScreenshotSha256:shifted,mutatedRawSha256:mutatedSha256};
    }finally{await style.evaluate(e=>e.remove());}
   }
  }
 }
 return result;
}
async function probe(browser,config,url,version,row,recordImages){
 const context=await browser.newContext({viewport:{width:config.width,height:960},reducedMotion:config.motion,hasTouch:true,deviceScaleFactor:1});
 const p=await context.newPage(),errors=[],failures=[];
 p.on('pageerror',e=>errors.push(e.message));
 p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 p.on('requestfailed',r=>failures.push({path:new URL(r.url()).pathname,reason:r.failure()?.errorText}));
 p.setDefaultTimeout(20000);
 const filename=key=>recordImages?join(dir,`${row.key}-${key}-${version}.png`):undefined;
 const run={errors,failures,views:{}};row[version]=run;
 try{
  const t=performance.now();await p.goto(url,{waitUntil:'load'});await ready(p);
  run.readyWallMs=performance.now()-t;
  await p.locator('#landscape-enter').click();await ready(p);await mode(p,'cd');
  await p.locator('#quality').selectOption('balanced');
  const d0=await snap(p);expect(d0.phase3b.visible).toBe(true);
  if(version==='after')expect(d0.nature.westGateFinish).toBe('west-gate-continuity-d-v1');
  await p.locator('#inner-load').click();await p.waitForFunction(()=>window.__terrainDiagnostics().phase3c.loaded);
  for(const [key,sel] of Object.entries(views))run.views[key]=await view(p,key,sel,filename(key),row);
  // Collect fixed sample heights from the original western mesh, not a display tint.
  for(const key of ['gate','moat']){
   const [e,y,z]=run.views[key].camera;const h=Math.max(A(e,-z)??-Infinity,C(e,-z)??-Infinity,west(e,-z)??-Infinity);
   expect(y-h).toBeCloseTo(1.7,3);
  }
  run.sections={};
  for(const [id,[start,end]] of Object.entries(specs)){
   await p.locator('#section-choice').selectOption(id);
   await p.waitForFunction(id=>window.__terrainDiagnostics().section.id===id&&window.__terrainDiagnostics().section.status==='ready',id);
   const {data}=(await snap(p)).section;
   run.sections[id]={a:verifyProfile(data.A,start,end,A),c:verifyProfile(data.C,start,end,C),hash:hash(JSON.stringify({A:data.A,C:data.C}))};
  }
  await p.locator('#cad-mode').selectOption('legacy');await p.locator('#parts-visible').check();
  await p.waitForFunction(()=>window.__terrainDiagnostics().parts.visible);
  run.posts=(await snap(p)).parts.posts;
  expect(run.posts.length).toBe(5);
  await p.locator('#parts-visible').uncheck();expect((await snap(p)).parts.visible).toBe(false);
  await p.locator('[data-exploration-station=ic-station-nishinomaru]').click();
  await p.locator('#walk-start').click();await p.waitForFunction(()=>window.__terrainDiagnostics().phase3e.active);
  run.walkStart=(await snap(p)).camera;
  await p.locator('#viewport').focus();await p.keyboard.down('w');
  await p.waitForFunction(()=>window.__terrainDiagnostics().phase3e.trace.some(t=>t.type==='move'));
  await p.keyboard.up('w');
  const d=await snap(p);
  expect(d.camera[1]-d.phase3e.support.height).toBeCloseTo(1.7,7);
  expect(Math.hypot(d.camera[0]-run.walkStart[0],d.camera[2]-run.walkStart[2])).toBeGreaterThan(0);
  await p.locator('#walk-input').selectOption('touch');
  await p.locator('[data-walk=ArrowUp]').tap(); // actual Playwright touchscreen delivery, not physical touch
  run.touch=(await snap(p)).phase3e.trace.find(t=>t.type==='pad-down');
  expect(run.touch).toMatchObject({key:'ArrowUp',pointerType:'touch',trusted:true});
  await p.locator('#walk-stop-overlay').tap();
  expect((await snap(p)).phase3e.active).toBe(false);
  await mode(p,'a');
  const current=await snap(p);expect(current.phase3b.visible).toBe(false);expect(current.nature.visible).toBe(false);expect(current.phase3b.shadows).toBe(false);
  if(version==='after')expect(current.nature.westGateFinish).toBe(null);
  run.views.current=await view(p,'current',views.far,filename('current'),row);
  await mode(p,'c');
  const inferred=await snap(p);expect(inferred.nature.visible).toBe(false);expect(inferred.phase3b.shadows).toBe(false);
  if(version==='after')expect(inferred.nature.westGateFinish).toBe(null);
  run.views.inferred=await view(p,'inferred',views.gate,filename('inferred'),row);
  await mode(p,'cd');await p.locator('#surface-finish').uncheck();expect((await snap(p)).nature.visible).toBe(false);
  if(version==='after')expect((await snap(p)).nature.westGateFinish).toBe(null);
  run.views.finishOff=await view(p,'finishOff',views.gate,filename('finishOff'),row);
  await p.locator('#surface-finish').check();
  if(version==='after')expect((await snap(p)).nature.westGateFinish).toBe('west-gate-continuity-d-v1');
  await p.locator('#reset').click();await ready(p);expect((await snap(p)).state.view).toBe('regional');
  expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  expect(errors).toEqual([]);expect(failures).toEqual([]);
  run.status='PASS';
 }catch(e){
  run.status='FAIL';run.reason=String(e.message);
  await p.screenshot({path:join(dir,`${row.key}-${version}-failure.png`),timeout:3000}).catch(()=>{});
 }finally{await context.close();}
}
const strip=({png,raw,rawPng,...rest})=>rest;
const requested=process.env.ISSUE29_ENGINE?[process.env.ISSUE29_ENGINE]:['chromium','webkit'];
const widths=process.env.ISSUE29_LOCAL_WIDTH?[Number(process.env.ISSUE29_LOCAL_WIDTH)]:[375,390,765,1280];
const motions=['no-preference','reduce'];
await output();
for(const engine of requested){
 let browser;
 try{browser=await ({chromium,webkit})[engine].launch(engine==='chromium'&&process.env.ISSUE29_CHROMIUM?{executablePath:process.env.ISSUE29_CHROMIUM}:{});}
 catch(e){
  for(const width of widths)for(const motion of motions)report.rows.push({engine,width,motion,status:'NOT_TESTED',reason:e.message.split('\n')[0]});
  await output();continue;
 }
 for(const width of widths)for(const motion of motions){
  const row={key:`${engine}-${width}-${motion}`,engine,width,motion,browserVersion:browser.version(),images:0,rawImages:0};
  const images=(width===1280&&motion==='no-preference')||(width===375&&motion==='reduce');
  try{
   await probe(browser,{width,motion},process.env.ISSUE29_BASE_URL??'http://127.0.0.1:4370','before',row,images);
   await probe(browser,{width,motion},process.env.ISSUE29_CANDIDATE_URL??'http://127.0.0.1:4371','after',row,images);
   for(const version of ['before','after'])assert.equal(row[version].status,'PASS',row[version].reason);
   for(const [key,after] of Object.entries(row.after.views)){
    const before=row.before.views[key];assert.deepEqual(strip(after),strip(before),`pose/draw/triangle drift: ${key}`);
    if(protectedViews.has(key))requireSameRaw(after.raw,before.raw,key);
   }
   assert.deepEqual(row.after.posts,row.before.posts);
   assert.deepEqual(row.after.sections,row.before.sections);
   assert.deepEqual(row.after.walkStart,row.before.walkStart);
   if(images)assert.ok(Object.keys(views).some(key=>row.before.views[key].raw.sha256!==row.after.views[key].raw.sha256),'D image change not observed');
   row.status='PASS';
  }catch(e){row.status='FAIL';row.reason=e.message;}
  report.rows.push(row);console.log(row.key,row.status,row.reason??'');await output();
 }
 await browser.close();
}
report.completedAt=new Date().toISOString();await output();
if(report.rows.length!==requested.length*widths.length*motions.length||report.rows.some(r=>r.status!=='PASS'))process.exitCode=1;
