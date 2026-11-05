import {chromium,webkit,expect} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {oracle} from '../tests/section-oracle.mjs';
import {readGlb,meshData} from '../tests/glb-surface.mjs';

const root=process.env.TEST_URL??'http://127.0.0.1:4317';
const mutation=process.argv.find(a=>a.startsWith('--mutation='))?.split('=')[1];
if(mutation&&!['gate-sightline','gate-framing'].includes(mutation))throw Error('Unknown mutation');
const baseDir=process.env.PHASE3B_EVIDENCE??`evidence/phase3b/browser/run-${new Date().toISOString().replaceAll(':','-')}`;
const dir=mutation?`${baseDir}/mutation-${mutation}`:baseDir;
const channel=process.env.PHASE3B_CHROMIUM_CHANNEL;
const engines=process.env.PHASE3B_ENGINE?[process.env.PHASE3B_ENGINE]:['chromium','webkit'];
const rows=[],meta=JSON.parse(await readFile('public/data/phase3b.json','utf8'));
if(mutation==='gate-sightline')Object.assign(meta.stations.find(s=>s.id==='wb-gate'),{eye:[-200,-35],lookDown:.1});
if(mutation==='gate-framing')meta.stations.find(s=>s.id==='wb-gate').fov=38;
const oldMeta=JSON.parse(await readFile('public/data/landscape.json','utf8'));
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const hashes={};for(const file of ['src/main.js','src/phase3b.js','src/style.css','src/reading.js','src/landscape.js','index.html','public/data/phase3b.json','public/data/phase3b.glb','scripts/phase3b-browser.mjs'])hashes[file]=createHash('sha256').update(await readFile(file)).digest('hex');
await mkdir(dir,{recursive:true});
const qA=oracle('public/data/castle.glb'),qC=oracle('public/data/nishinomaru.glb');

// Raw GLB accessor + metric transforms + barycentric oracle, separate from product
// surface/interpolation helpers. Only new ground meshes count as a supporting floor.
function surfaceOracle(file){
 const model=readGlb(file),triangles=[];
 for(const node of model.g.nodes.filter(n=>n.mesh!==undefined&&n.extras?.surface)){
  if(node.matrix||node.rotation||model.g.nodes.some(n=>n.children?.includes(model.g.nodes.indexOf(node))))throw Error('Extend QA oracle before accepting hierarchical/rotated terrain');
  const m=meshData(model,node.name),p=m.positions.map(v=>v.map((x,k)=>x*(node.scale?.[k]??1)+(node.translation?.[k]??0)));
  for(let i=0;i<m.indices.length;i+=3)triangles.push(m.indices.slice(i,i+3).map(j=>p[j]));
 }
 if(!triangles.length)throw Error('No independently decoded new surface');
 return(e,n)=>{let highest=null;for(const [a,b,c]of triangles){const z=-n,den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-10)continue;const u=((b[2]-c[2])*(e-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(e-c[0])+(a[0]-c[0])*(z-c[2]))/den,w=1-u-v;if(Math.min(u,v,w)>=-1e-8){const h=u*a[1]+v*b[1]+w*c[1];highest=highest===null?h:Math.max(h,highest);}}return highest;};
}
const qW=surfaceOracle('public/data/phase3b.glb');
function rawTransform(point,node){if(node.matrix){const m=node.matrix,[x,y,z]=point,w=m[3]*x+m[7]*y+m[11]*z+m[15];return[(m[0]*x+m[4]*y+m[8]*z+m[12])/w,(m[1]*x+m[5]*y+m[9]*z+m[13])/w,(m[2]*x+m[6]*y+m[10]*z+m[14])/w];}let v=point.map((x,k)=>x*(node.scale?.[k]??1));if(node.rotation){const [qx,qy,qz,qw]=node.rotation,[x,y,z]=v,tx=2*(qy*z-qz*y),ty=2*(qz*x-qx*z),tz=2*(qx*y-qy*x);v=[x+qw*tx+qy*tz-qz*ty,y+qw*ty+qz*tx-qx*tz,z+qw*tz+qx*ty-qy*tx];}return v.map((x,k)=>x+(node.translation?.[k]??0));}
const gatePoints=[];{const model=readGlb('public/data/phase3b.glb');for(const node of model.g.nodes.filter(n=>n.mesh!==undefined&&n.name.startsWith('wb-gate.gate.'))){if(model.g.nodes.some(n=>n.children?.includes(model.g.nodes.indexOf(node))))throw Error('Extend gate framing oracle for hierarchical transforms');const m=meshData(model,node.name);gatePoints.push(...m.positions.map(v=>rawTransform(v,node)));}if(!gatePoints.length)throw Error('No independent gate framing points');}
async function save(){await writeFile(`${dir}/results.json`,JSON.stringify({scope:'Implementation-authored automated verification; screenshots require separate visual assessment. Automated WebKit is not an iPhone Safari hardware test.',head,hashes,utc:new Date().toISOString(),root,channel:channel??null,mutation:mutation??null,mutationDetails:mutation==='gate-sightline'?{source:'phase3b.json response only',station:'wb-gate',eye:[-200,-35],lookDown:.1,expectedRejection:'sightline intersects its own C terrain'}:mutation==='gate-framing'?{source:'phase3b.json response only',station:'wb-gate',fov:38,expectedRejection:'gate structural vertices fall outside camera frustum'}:null,rows},null,2));}
async function snap(p){return p.evaluate(()=>window.__terrainDiagnostics());}
async function ready(p){await p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready,{timeout:45000});}
async function frame(p){await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function instrumentJobs(p){let code=await (await p.request.get(root+'/src/main.js')).text();if(!code.includes('models.set(file,pending);'))throw Error('Pending-job instrumentation must follow current loader');code=code.replace('models.set(file,pending);','window.__qaJobs=(window.__qaJobs??0)+1;pending.then(()=>window.__qaJobs--,()=>window.__qaJobs--);models.set(file,pending);');await p.route('**/src/main.js*',r=>r.fulfill({status:200,contentType:'application/javascript',body:code}));}
function ids(d){return [...new Set(d.phase3b.objects.map(o=>o.id))].sort();}
function assertEye(d,s){const heights=[qA(...s.eye),qC(...s.eye),qW(...s.eye)].filter(h=>h!==null);const expected=Math.max(...heights)*d.state.exaggeration+1.7;expect(Math.abs(d.camera[1]-expected)).toBeLessThan(.001);expect(d.camera[0]).toBe(s.eye[0]);expect(d.camera[2]).toBe(-s.eye[1]);return{expected,actual:d.camera[1],groundA:qA(...s.eye),groundC:qC(...s.eye),groundWestern:qW(...s.eye)};}
function assertNewSightline(d,s){let clearance=Infinity;for(let i=1;i<=20;i++){const t=i/20,e=s.eye[0]+(s.look[0]-s.eye[0])*t,n=s.eye[1]+(s.look[1]-s.eye[1])*t,h=qW(e,n);if(h===null)continue;const sight=d.camera[1]+(d.target[1]-d.camera[1])*t;clearance=Math.min(clearance,sight-h*d.state.exaggeration);}if(clearance<-.05)throw Error(`Fixed station ${s.id} sightline intersects its own C terrain (${clearance.toFixed(3)}m clearance)`);return clearance;}
function assertGateFraming(d){const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),unit=a=>{const len=Math.hypot(...a);return a.map(v=>v/len);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];const forward=unit(sub(d.target,d.camera)),right=unit(cross(forward,[0,1,0])),up=cross(right,forward),half=Math.tan(d.cameraFov*Math.PI/360),aspect=d.canvas[0]/d.canvas[1];let maxAbsX=0,maxAbsY=0,minDepth=Infinity;for(const point of gatePoints){const p=[point[0],point[1]*d.state.exaggeration,point[2]],v=sub(p,d.camera),depth=dot(v,forward);minDepth=Math.min(minDepth,depth);maxAbsX=Math.max(maxAbsX,Math.abs(dot(v,right)/(depth*half*aspect)));maxAbsY=Math.max(maxAbsY,Math.abs(dot(v,up)/(depth*half)));}if(!(minDepth>0))throw Error('Gate framing has vertices behind camera');if(!(maxAbsX<1))throw Error(`Gate framing outside horizontal frustum: max absolute NDC ${maxAbsX}`);if(!(maxAbsY<1))throw Error(`Gate framing outside vertical frustum: max absolute NDC ${maxAbsY}`);return{maxAbsX,maxAbsY,minDepth,points:gatePoints.length};}
const expectedIds=meta.elements.map(e=>e.id).sort();
for(const name of engines){
 const engine=name==='webkit'?webkit:chromium,browser=await engine.launch(name==='chromium'&&channel?{channel}:{});
 const widths=process.env.PHASE3B_SKIP_MATRIX?[]:process.env.PHASE3B_WIDTH?[Number(process.env.PHASE3B_WIDTH)]:mutation?[390]:[375,390,765,1280];
 for(const width of widths)for(const reducedMotion of mutation?['reduce']:['no-preference','reduce']){
  const key=`${name}-${width}-${reducedMotion}`,row={kind:'matrix',key,engine:name,browser:browser.version(),width,reducedMotion,checks:[]};
  const ctx=await browser.newContext({viewport:{width,height:960},deviceScaleFactor:1,hasTouch:width<800,isMobile:width<700,reducedMotion}),p=await ctx.newPage(),errors=[];
  row.loadEvents=[];for(const event of ['request','requestfinished','requestfailed'])p.on(event,r=>{if(r.url().includes('/data/'))row.loadEvents.push({event,file:r.url().split('/').at(-1),utc:new Date().toISOString(),failure:event==='requestfailed'?r.failure():undefined});});
  p.on('response',r=>{if(r.url().includes('/data/'))row.loadEvents.push({event:'response',file:r.url().split('/').at(-1),status:r.status(),utc:new Date().toISOString()});});
  p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(45000);
  if(mutation)await p.route('**/data/phase3b.json',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(meta)}));
  try{
   row.stage='initial page and regional ready';await p.goto(root);await ready(p);row.stage='landscape entry and model ready';await p.locator('#landscape-enter').click();await ready(p);
   row.stage='western visible';await p.waitForFunction(()=>window.__terrainDiagnostics().phase3b.visible);
   expect(ids(await snap(p))).toEqual(expectedIds);
   for(const f of meta.elements){await p.locator(`#landscape-list [data-id=${f.id}]`).click();await ready(p);await expect(p.locator('#detail h2')).toHaveText(f.name);await expect(p.locator('#detail .evidence-tag b')).toHaveText(f.category);for(const text of [f.assumptions,f.unknown,f.direction])if(text)await expect(p.locator('#detail')).toContainText(text);}
   row.checks.push('all new element IDs and exact C/D captions, assumptions, unknowns and stage direction');
   await p.locator('#landscape-list [data-id=wb-building]').click();await ready(p);await p.locator('#western-building').uncheck();let d=await snap(p);expect(ids(d)).not.toContain('wb-building');expect(d.state.selected).toBe('wb-building');await expect(p.locator('#detail')).toContainText(meta.elements.find(e=>e.id==='wb-building').name);await p.locator('#western-building').check();expect(ids(await snap(p))).toContain('wb-building');
   row.checks.push('replaceable building can be hidden independently while its explanation remains available');
   for(const id of ['wb-bailey','wb-gate','wb-moat']){await p.locator(`[data-western-overview=${id}]`).click();await ready(p);expect((await snap(p)).state.station).toBe(null);expect((await snap(p)).cameraFov).toBe(38);if([390,1280].includes(width)&&reducedMotion==='reduce')await p.locator('#viewport').screenshot({path:`${dir}/${key}-${id}-overview.png`});}
   const before=await snap(p);await p.locator('[data-landscape-mode=a]').click();await ready(p);d=await snap(p);expect(d.phase3b.objects).toEqual([]);expect(d.camera).toEqual(before.camera);expect(d.target).toEqual(before.target);expect(d.state.selected).toBe(before.state.selected);
   await p.locator('[data-landscape-mode=c]').click();await ready(p);expect(ids(await snap(p))).toEqual(expectedIds.filter(id=>meta.elements.find(e=>e.id===id).category!=='D'));
   await p.locator('#category-c').uncheck();expect((await snap(p)).phase3b.objects).toEqual([]);await p.locator('#category-c').check();await p.locator('[data-landscape-mode=cd]').click();await ready(p);
   row.checks.push('A/C/C+D, C category visibility and camera/selection preservation');
   row.eyes=[];
   for(const s of meta.stations){row.stage='new station '+s.id;await p.locator(`[data-station=${s.id}]`).click();await p.waitForFunction(id=>window.__terrainDiagnostics().state.station===id,s.id);d=await snap(p);expect(d.cameraFov).toBe(s.fov??38);expect(d.state.selected).toBe(s.elementId);row.eyes.push({id:s.id,...assertEye(d,s),sightlineClearance:assertNewSightline(d,s),framing:s.id==='wb-gate'?assertGateFraming(d):undefined});
    if([390,1280].includes(width)&&reducedMotion==='reduce')await p.locator('#viewport').screenshot({path:`${dir}/${key}-low-${s.id}.png`});
    const eye=d.camera;await p.locator('#viewport').focus();await p.keyboard.press('ArrowRight');expect((await snap(p)).camera).toEqual(eye);expect((await snap(p)).target).not.toEqual(d.target);
    await p.locator('[data-landscape-mode=a]').click();await ready(p);expect((await snap(p)).camera).toEqual(eye);expect((await snap(p)).cameraFov).toBe(s.fov??38);await p.locator('[data-landscape-mode=cd]').click();await ready(p);expect((await snap(p)).cameraFov).toBe(s.fov??38);
   }
   for(const s of oldMeta.stations){await p.locator(`[data-station=${s.id}]`).click();await p.waitForFunction(id=>window.__terrainDiagnostics().state.station===id,s.id);assertEye(await snap(p),s);}
   row.checks.push('all new and four old fixed eyes agree with independent raw A/C/new surface oracle; keyboard look changes direction only');
   if(width===390&&reducedMotion==='reduce'){row.stage='2x eyes and fixed sections';
    await p.locator('#exaggeration').check();for(const s of meta.stations){await p.locator(`[data-station=${s.id}]`).click();await p.waitForFunction(id=>window.__terrainDiagnostics().state.station===id,s.id);assertEye(await snap(p),s);}await p.locator('#exaggeration').uncheck();
    for(const id of ['moat','rampart']){await p.locator('#section-choice').selectOption(id);await p.waitForFunction(()=>window.__terrainDiagnostics().section.status==='ready');const signature=JSON.stringify((await snap(p)).section.data);await p.locator('#exaggeration').check();expect(JSON.stringify((await snap(p)).section.data)).toBe(signature);await p.locator('#exaggeration').uncheck();}
    row.checks.push('new eyes at 2x and both fixed sections retain metric data at 1x/2x');
   }
   await p.locator('[data-station='+meta.stations[0].id+']').click();await ready(p);await p.locator('#viewport').scrollIntoViewIfNeeded();const box=await p.locator('#viewport').boundingBox(),prior=await snap(p);
   await p.mouse.move(box.x+box.width*.4,box.y+box.height*.4);await p.mouse.down();await p.mouse.move(box.x+box.width*.6,box.y+box.height*.5,{steps:5});await p.mouse.up();expect((await snap(p)).camera).toEqual(prior.camera);expect((await snap(p)).target).not.toEqual(prior.target);if(width<800){await p.touchscreen.tap(box.x+box.width*.5,box.y+box.height*.5);await ready(p);}
   row.checks.push('trusted drag and touch tap equivalent; fixed eye remains in place');
   await p.locator('[data-western-overview=wb-moat]').click();await ready(p);
   for(const quality of ['light','balanced','high']){await p.locator('#quality').selectOption(quality);d=await snap(p);expect(d.phase3b.quality).toBe(quality);expect(d.phase3b.shadows).toBe(quality==='high'||quality==='balanced'&&d.canvas[0]>=700);}
   if(width===1280&&reducedMotion==='reduce'){await p.locator('#quality').selectOption('balanced');await p.setViewportSize({width:390,height:960});await p.waitForFunction(()=>window.__terrainDiagnostics().canvas[0]<700);await frame(p);expect((await snap(p)).phase3b.shadows).toBe(false);await p.setViewportSize({width,height:960});await p.waitForFunction(()=>window.__terrainDiagnostics().canvas[0]>=700);await frame(p);expect((await snap(p)).phase3b.shadows).toBe(true);await p.locator('#quality').selectOption('high');row.checks.push('balanced shadow quality recomputes after wide-to-mobile-to-wide resize');}
   await p.locator('#surface-finish').uncheck();await frame(p);const unlit=await snap(p);expect(unlit.phase3b.shadows).toBe(false);let beforeImage;
   if([390,1280].includes(width)&&reducedMotion==='reduce')beforeImage=await p.locator('#viewport').screenshot({path:`${dir}/${key}-finish-before.png`});
   await p.locator('#surface-finish').check();await frame(p);d=await snap(p);expect(d.camera).toEqual(unlit.camera);expect(d.target).toEqual(unlit.target);
   if(beforeImage){const afterImage=await p.locator('#viewport').screenshot({path:`${dir}/${key}-finish-after.png`});row.finishImageBytesDiffer=!beforeImage.equals(afterImage);expect(row.finishImageBytesDiffer).toBe(true);}
   row.checks.push('light/balanced/high and D surface/light finish preserve camera; same-view finish comparison saved where specified');
   row.stage='overflow, errors and reset';expect(await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);expect(errors).toEqual([]);await p.locator('#reset').click();await ready(p);expect((await snap(p)).phase3b.objects).toEqual([]);row.stage='complete';row.status='PASS';
  }catch(error){const rejected=mutation==='gate-sightline'&&error.message.includes('Fixed station wb-gate sightline intersects its own C terrain')||mutation==='gate-framing'&&error.message.includes('Gate framing outside ');row.status=rejected?'EXPECTED_REJECTION':'FAIL';row.reason=error.message;row.errors=errors;row.diagnostics=await snap(p).catch(()=>null);await p.screenshot({path:`${dir}/${key}-failure.png`,fullPage:true}).catch(()=>{});}
  if(mutation&&row.status==='PASS'){row.status='FAIL';row.reason='Intentional obstructed viewpoint escaped detection';}
  rows.push(row);console.log(row.status,key,row.reason??'');await save();await ctx.close();
 }
 if(!mutation&&!process.env.PHASE3B_MATRIX_ONLY)for(const outcome of ['200','404'])for(const cancel of ['view','selection']){
  const row={kind:'gated-new-model-race',engine:name,outcome,cancel},ctx=await browser.newContext({viewport:{width:390,height:960}}),p=await ctx.newPage();let release;const gate=new Promise(r=>release=r);let handled;
  const complete=new Promise(r=>handled=r);await instrumentJobs(p);await p.route('**/data/phase3b.glb',async route=>{await gate;await route.fulfill(outcome==='200'?{status:200,contentType:'model/gltf-binary',body:await readFile('public/data/phase3b.glb')}:{status:404,body:'deliberate missing optional model'});handled();});
  try{await p.goto(root);await ready(p);const request=p.waitForRequest('**/data/phase3b.glb');await p.locator('#landscape-enter').click();await request;if(cancel==='view')await p.locator('[data-view=castle]').click();else await p.locator('#feature-list [data-id=west]').click();await ready(p);const before=await snap(p);release();await complete;await p.waitForFunction(()=>window.__qaJobs===0);await frame(p);const after=await snap(p);expect(after.state).toEqual(before.state);expect(after.camera).toEqual(before.camera);expect(after.target).toEqual(before.target);expect(after.phase3b.objects).toEqual([]);row.before=before;row.after=after;row.status='PASS';}catch(error){row.status='FAIL';row.reason=error.message;}release();rows.push(row);console.log(row.status,name,'gated',outcome,cancel,row.reason??'');await save();await ctx.close();
 }
 if(!mutation&&!process.env.PHASE3B_MATRIX_ONLY)for(const failure of ['webgl','western404']){
  const row={kind:'fallback',engine:name,failure},ctx=await browser.newContext(),p=await ctx.newPage();let fail=true;
  if(failure==='webgl')await p.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /webgl/i.test(kind)?null:original.call(this,kind,...args);};});else await p.route('**/data/phase3b.glb',route=>fail?route.fulfill({status:404,body:'deliberate optional 404'}):route.continue());
  try{await p.goto(root);if(failure==='webgl')await p.waitForFunction(()=>document.body.dataset.renderState==='unavailable');else{await ready(p);await p.locator('#landscape-enter').click();await ready(p);expect((await snap(p)).phase3b.unavailable).toBe(true);expect((await snap(p)).phase3b.objects).toEqual([]);await expect(p.locator('#western-asset-status')).toBeVisible();expect((await snap(p)).landscape.objects.length).toBeGreaterThan(0);}
   for(const f of meta.elements){await p.locator(`#landscape-list [data-id=${f.id}]`).click();await expect(p.locator('#detail h2')).toHaveText(f.name);}
   if(failure==='western404'){await ready(p);await p.locator('[data-station=bailey]').click();await p.waitForFunction(()=>window.__terrainDiagnostics().state.station==='bailey');await ready(p);expect((await snap(p)).state.station).toBe('bailey');await p.locator('#landscape-overview').click();await p.locator('#zoom-in').click();await p.locator('[data-landscape-mode=a]').click();await ready(p);await p.locator('[data-landscape-mode=c]').click();await ready(p);expect((await snap(p)).state.ready).toBe(true);fail=false;await p.locator('[data-landscape-mode=cd]').click();await ready(p);await p.waitForFunction(()=>window.__terrainDiagnostics().phase3b.visible&&!window.__terrainDiagnostics().phase3b.unavailable);expect(ids(await snap(p))).toEqual(expectedIds);await expect(p.locator('#western-asset-status')).toBeHidden();}
   row.status='PASS';
  }catch(error){row.status='FAIL';row.reason=error.message;row.diagnostics=await snap(p).catch(()=>null);}rows.push(row);console.log(row.status,name,failure,row.reason??'');await save();await ctx.close();
 }
 await browser.close();
}
if(rows.some(r=>r.status!==(mutation?'EXPECTED_REJECTION':'PASS')))process.exitCode=1;
