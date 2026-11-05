// Independent reviewer: reads actual Three.js objects via a test-only closure probe.
// No production support/visibility predicate or implementation test result is an oracle.
import {chromium,webkit,expect} from '@playwright/test';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const out=process.env.INDEPENDENT_OUT??'evidence/phase3c/independent/visual';
const url=process.env.TEST_URL??'http://127.0.0.1:4317';
const meta=JSON.parse(await readFile('public/data/phase3c.json','utf8'));
const rows=[];await mkdir(out,{recursive:true});
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const tree=execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim();
const evidenceFiles=['src/main.js','src/phase3b.js','src/phase3c.js','src/reading.js','src/style.css','scripts/phase3c-independent-browser.mjs','public/data/phase3c.glb','public/data/phase3c.json','public/data/regional.glb','public/data/castle.glb','public/data/nishinomaru.glb','public/data/moat-study.glb','public/data/phase3b.glb','public/data/landscape.glb'];
const sha256=Object.fromEntries(await Promise.all(evidenceFiles.map(async file=>[file,createHash('sha256').update(await readFile(file)).digest('hex')])));
const worktreeStatus=execFileSync('git',['status','--porcelain','--',...evidenceFiles],{encoding:'utf8'}).trim();
const startedAt=new Date().toISOString();
const probe=String.raw`
 window.__independentRead=()=>{
 scene.updateMatrixWorld(true);
 const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
 const meshes=[];scene.traverse(o=>{if(o.isMesh&&visible(o))meshes.push(o);});
 const surfaces=meshes.filter(o=>o.userData.surface||o.parent===currentModel);
 const down=new THREE.Raycaster(new THREE.Vector3(camera.position.x,10000,camera.position.z),new THREE.Vector3(0,-1,0));
 const support=down.intersectObjects(surfaces,false).map(h=>({y:h.point.y,name:h.object.name,id:h.object.userData.elementId??h.object.userData.facilityId}));
 const center=new THREE.Raycaster();center.setFromCamera(new THREE.Vector2(0,0),camera);
 const seen=center.intersectObjects(meshes,false).slice(0,8).map(h=>({distance:h.distance,name:h.object.name,id:h.object.userData.elementId??h.object.userData.facilityId,point:h.point.toArray()}));
 function hash(a){if(!a)return null;let h=2166136261;for(const n of a){const s=String(n);for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);}return (h>>>0).toString(16);}
 function signature(o){const m=o.material;return {name:o.name,id:o.userData.elementId??o.userData.facilityId,index:hash(o.geometry.index?.array),uv:hash(o.geometry.attributes.uv?.array),position:hash(o.geometry.attributes.position.array),map:m.map?.uuid??null,normal:m.normalMap?.uuid??null,bump:m.bumpMap?.uuid??null,color:m.color?.getHex(),roughness:m.roughness,cast:o.castShadow,receive:o.receiveShadow};}
 return {eye:camera.position.toArray(),target:controls.target.toArray(),support,seen,visible:meshes.map(signature),base:currentModel?.children.filter(o=>o.isMesh).map(signature),canvasVisibility:getComputedStyle(renderer.domElement).visibility,background:scene.background?.getHex(),fog:scene.fog?{color:scene.fog.color.getHex(),near:scene.fog.near,far:scene.fog.far}:null,shadows:renderer.shadowMap.enabled,light:light.position.toArray().concat(light.intensity),ambient:ambient.intensity,controls:controls.enabled};
 };
`;
async function instrument(p){await p.route('**/src/main.js*',async r=>{const res=await r.fetch();const body=await res.text();if(!body.includes('window.__terrainDiagnostics='))throw Error('Probe anchor missing');await r.fulfill({response:res,body:body.replace('window.__terrainDiagnostics=',probe+'\n window.__terrainDiagnostics=')});});}
const read=p=>p.evaluate(()=>window.__independentRead());
const ready=p=>p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready);
async function start(p){await instrument(p);await p.goto(url);await ready(p);await p.locator('#landscape-enter').click();await ready(p);await p.locator('#inner-load').click();await p.waitForFunction(()=>document.querySelectorAll('[data-inner-station]').length>0);}
async function mode(p,m){await p.locator(`[data-landscape-mode=${m}]`).click();await ready(p);}
async function save(){await writeFile(`${out}/results.json`,JSON.stringify({head,tree,sha256,worktreeStatus,startedAt,scope:'Independent live object raycasts and state hashes; screenshots require separate human visual inspection. Automated WebKit is not hardware Safari. No production pass predicate used.',rows},null,2));}
for(const [engine,type]of Object.entries({chromium,webkit})){
 let browser;try{browser=await type.launch(process.env[`${engine.toUpperCase()}_PATH`]?{executablePath:process.env[`${engine.toUpperCase()}_PATH`]}:{});}catch(e){rows.push({engine,status:'NOT_TESTED',kind:'launch',reason:e.message});await save();continue;}
 for(const width of [375,390,765,1280])for(const reducedMotion of ['no-preference','reduce']){
  const key=`${engine}-${width}-${reducedMotion}`,row={key,engine,width,reducedMotion,version:browser.version(),stations:[],images:[]};
  const ctx=await browser.newContext({viewport:{width,height:960},hasTouch:width<800,reducedMotion,deviceScaleFactor:1});const p=await ctx.newPage();p.setDefaultTimeout(60000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{
   await start(p);await mode(p,'c');
   for(const s of meta.stations){
    const button=p.locator(`[data-inner-station="${s.id}"]`);if(width<800)await button.tap();else{await button.focus();await p.keyboard.press('Enter');}
    await p.waitForFunction(id=>window.__terrainDiagnostics().state.station===id,s.id);
    const c=await read(p);expect(c.eye[0]).toBe(s.eye[0]);expect(c.eye[2]).toBe(-s.eye[1]);expect(c.support.length).toBeGreaterThan(0);expect(Math.abs(c.eye[1]-c.support[0].y-1.7)).toBeLessThan(.002);expect(c.canvasVisibility).toBe('visible');expect(c.controls).toBe(false);
    await expect(p.locator('#inner-location')).toContainText(s.name);await expect(p.locator('#inner-direction')).not.toBeEmpty();
    expect(c.fog).toBe(null);expect(c.shadows).toBe(false);expect(c.visible.every(o=>o.map===null&&o.bump===null&&o.normal===null)).toBe(true);
    const station={id:s.id,C:c};
    if([390,1280].includes(width)&&reducedMotion==='reduce'){const file=`${key}-${s.id}-c.png`;await p.locator('#viewport').screenshot({path:`${out}/${file}`});row.images.push(file);}
    await p.locator('#viewport').focus();await p.keyboard.press('ArrowRight');const turn=await read(p);expect(turn.eye).toEqual(c.eye);expect(turn.target).not.toEqual(c.target);await p.keyboard.press('ArrowLeft');
    await mode(p,'a');const a=await read(p);expect(a.eye).toEqual(c.eye);expect(a.visible.filter(o=>o.id?.startsWith('ic-'))).toHaveLength(0);
    const supported=a.support.length>0&&Math.abs(a.eye[1]-a.support[0].y-1.7)<=.25;expect(a.canvasVisibility).toBe(supported?'visible':'hidden');if(!supported)await expect(p.locator('#inner-comparison')).not.toBeEmpty();station.A={...a,supported};
    await mode(p,'cd');const cd=await read(p);expect(cd.eye).toEqual(c.eye);expect(cd.canvasVisibility).toBe('visible');expect(cd.support[0].y).toBeCloseTo(c.support[0].y,6);station.CD=cd;
    await mode(p,'a');const a2=await read(p);for(const k of ['base','background','fog','shadows','light','ambient'])expect(a2[k],`A restoration ${k}`).toEqual(a[k]);
    await mode(p,'c');const c2=await read(p);expect(c2.base).toEqual(c.base);row.stations.push(station);
   }
   // Old five facilities and fixed sections remain accessible through actual controls.
   row.legacy={facilities:await p.locator('[data-facility]').count()};expect(row.legacy.facilities).toBeGreaterThanOrEqual(5);
   for(const id of ['moat','rampart']){await p.locator('#section-choice').selectOption(id);await expect(p.locator('#section-status')).toContainText('実三角形面を取得済み');await expect(p.locator('#section-graph')).toBeVisible();}

   await p.locator('#section-choice').selectOption('');
   for(const quality of ['light','balanced','high']){await mode(p,'cd');await p.locator('#quality').selectOption(quality);const d=await read(p);expect(d.canvasVisibility).toBe('visible');}
   await p.locator('#exaggeration').check();await p.locator(`[data-inner-station="${meta.stations[0].id}"]`).click();const doubled=await read(p);expect(Math.abs(doubled.eye[1]-doubled.support[0].y-1.7)).toBeLessThan(.002);await p.locator('#exaggeration').uncheck();
   await p.setViewportSize({width:width<800?1280:375,height:960});expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   expect(errors).toEqual([]);row.status='PASS';
  }catch(e){row.status='FAIL';row.reason=e.stack;row.errors=errors;await p.screenshot({path:`${out}/${key}-failure.png`,fullPage:true}).catch(()=>{});}
  rows.push(row);await save();console.log(key,row.status,row.reason??'');await ctx.close();
 }
 // Independent failures: reject missing support while retaining old landscape and HTML.
 for(const fault of ['asset404','missing-support','webgl']){
  const row={engine,fault};const p=await browser.newPage({viewport:{width:390,height:960}});p.setDefaultTimeout(60000);
  try{
   if(fault==='asset404')await p.route('**/data/phase3c.glb',r=>r.fulfill({status:404,body:'independent fault'}));
   if(fault==='missing-support'){const broken=structuredClone(meta);broken.stations[0].eye=[1e6,1e6];await p.route('**/data/phase3c.json',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(broken)}));}
   if(fault==='webgl'){await p.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /webgl/i.test(kind)?null:original.call(this,kind,...args);};});await p.goto(url);await p.waitForFunction(()=>document.body.dataset.renderState==='unavailable');for(const f of meta.elements){await p.locator(`[data-id="${f.id}"]`).click();await expect(p.locator('#detail h2')).toHaveText(f.name);}}
   else if(fault==='missing-support'){await start(p);const before=await read(p);await p.locator(`[data-inner-station="${meta.stations[0].id}"]`).click();await expect(p.locator('#inner-comparison')).toContainText('観察不可');expect((await read(p)).eye).toEqual(before.eye);}
   else{await instrument(p);await p.goto(url);await ready(p);await p.locator('#landscape-enter').click();await ready(p);await p.locator('#inner-load').click();await expect(p.locator('#inner-asset-status')).toContainText('読み込めません');const d=await read(p);expect(d.visible.length).toBeGreaterThan(5);expect(d.canvasVisibility).toBe('visible');}
   row.status='PASS';
  }catch(e){row.status='FAIL';row.reason=e.stack;}
  rows.push(row);await save();await p.close();
 }
 await browser.close();
}
if(rows.some(r=>r.status!=='PASS'))process.exitCode=1;
