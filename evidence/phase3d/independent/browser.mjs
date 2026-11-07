// Fresh independent review at the pinned rebuilt product. No producer PASS predicate.
import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const out='evidence/phase3d/independent',url=process.env.TEST_URL??'http://127.0.0.1:4393';
const meta=JSON.parse(readFileSync('public/data/phase3c.json'));
const hashes=Object.fromEntries(['src/main.js','src/phase3b.js','src/phase3d.js','public/data/phase3d.glb','public/data/phase3d.json','evidence/phase3d/independent/browser.mjs'].map(f=>[f,createHash('sha256').update(readFileSync(f)).digest('hex')]));
const result={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),tree:execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim(),hashes,started:new Date().toISOString(),rows:[],scope:'Fresh independent actual-object inspection. No prior run result adopted. Linux automated WebKit is not hardware Safari.'};
mkdirSync(out,{recursive:true});
const save=()=>writeFileSync(out+'/browser-results.json',JSON.stringify(result,null,2));save();
const probe=String.raw`
 window.__independent=()=>{
  scene.updateMatrixWorld(true);
  const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
  const all=[];scene.traverse(o=>{if(o.isMesh&&visible(o))all.push(o);});
  const ground=all.filter(o=>o.userData.surface||o.parent===currentModel);
  const down=new THREE.Raycaster(new THREE.Vector3(camera.position.x,10000,camera.position.z),new THREE.Vector3(0,-1,0));
  const support=down.intersectObjects(ground,false).map(x=>({y:x.point.y,id:x.object.userData.elementId??x.object.userData.facilityId}));
  function hash(a){if(!a)return null;const b=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);let h=2166136261;for(const x of b)h=Math.imul(h^x,16777619);return (h>>>0).toString(16);}
  function sign(o){const g=o.geometry,m=o.material;return {id:o.userData.elementId??o.userData.facilityId,name:o.name,position:hash(g.attributes.position.array),index:hash(g.index?.array),uv:hash(g.attributes.uv?.array),color:hash(g.attributes.color?.array),map:Boolean(m.map),bump:Boolean(m.bumpMap),roughMap:Boolean(m.roughnessMap),vertexColors:m.vertexColors,colorValid:!m.vertexColors||g.attributes.color?.count===g.attributes.position.count,materialColor:m.color?.getHex(),roughness:m.roughness,cast:o.castShadow,receive:o.receiveShadow};}
  let expectedRay=null;
  if(connectedRay?.start){
   // Independent target support and explicit triangle Moller-Trumbore; no product helper/raycast oracle.
   const targetXY=connectedRay.pair==='entrance'?[-75,35]:[-85,29];
   const targetDown=new THREE.Raycaster(new THREE.Vector3(targetXY[0],10000,targetXY[1]),new THREE.Vector3(0,-1,0));
   const targetHit=targetDown.intersectObjects(ground,false)[0];
   const start=camera.position.clone(),end=new THREE.Vector3(targetXY[0],targetHit.point.y+.2,targetXY[1]),d=end.clone().sub(start),distance=d.length();d.normalize();
   let best=null,triangles=0;const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),u=new THREE.Vector3(),v=new THREE.Vector3(),h=new THREE.Vector3(),s=new THREE.Vector3(),q=new THREE.Vector3();
   for(const o of all){if(o.userData.kind)continue;const p=o.geometry.attributes.position,ix=o.geometry.index;for(let j=0;j<(ix?.count??p.count);j+=3){triangles++;a.fromBufferAttribute(p,ix?ix.getX(j):j).applyMatrix4(o.matrixWorld);b.fromBufferAttribute(p,ix?ix.getX(j+1):j+1).applyMatrix4(o.matrixWorld);c.fromBufferAttribute(p,ix?ix.getX(j+2):j+2).applyMatrix4(o.matrixWorld);u.subVectors(b,a);v.subVectors(c,a);h.crossVectors(d,v);const det=u.dot(h);if(Math.abs(det)<1e-9)continue;const inv=1/det;s.subVectors(start,a);const bu=s.dot(h)*inv;if(bu<0||bu>1)continue;q.crossVectors(s,u);const bv=d.dot(q)*inv;if(bv<0||bu+bv>1)continue;const t=v.dot(q)*inv;if(t>=.03&&t<=distance-.03&&(!best||t<best.distance))best={distance:t,id:o.userData.elementId??o.userData.facilityId,name:o.name};}}
   expectedRay={start:start.toArray(),end:end.toArray(),blocked:Boolean(best),hit:best,triangles};
  }
  return {eye:camera.position.toArray(),target:controls.target.toArray(),support,canvas:getComputedStyle(renderer.domElement).visibility,base:currentModel.children.filter(o=>o.isMesh).map(sign),connected:all.filter(o=>o.userData.elementId?.startsWith('dc-')).map(sign),visible:all.map(sign),background:scene.background.getHex(),fog:scene.fog?{color:scene.fog.color.getHex(),near:scene.fog.near,far:scene.fog.far}:null,light:light.position.toArray().concat(light.intensity,ambient.intensity),shadows:renderer.shadowMap.enabled,ray:connectedRay,expectedRay,station:state.station,comparison,view:state.view};
 };
`;
const near=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
const read=p=>p.evaluate(()=>window.__independent());
const ready=p=>p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready);
const mode=async(p,m)=>{await p.locator(`[data-landscape-mode=${m}]`).click();await ready(p);};
const signatures=s=>({base:s.base,background:s.background,fog:s.fog,light:s.light,shadows:s.shadows});
async function instrument(p,mutation){await p.route('**/src/main.js*',async r=>{const response=await r.fetch();let body=await response.text();assert.equal(body.split('window.__terrainDiagnostics=').length,2);body=body.replace('window.__terrainDiagnostics=',probe+'\n window.__terrainDiagnostics=');if(mutation==='stale-loader-camera'){const anchor='connectedMeta=meta;connectedGroup.clear();';assert.equal(body.split(anchor).length,2);body=body.replace(anchor,'camera.position.x+=17;'+anchor);}await r.fulfill({response,body});});}
async function start(p){await p.goto(url);await ready(p);await p.locator('#landscape-enter').click();await ready(p);}
async function loaded(p){await p.locator('#connected-load').click();await p.waitForFunction(()=>window.__terrainDiagnostics().phase3d.loaded);}
function checkRay(s){assert.ok(s.ray?.start,'RAY_MISSING');assert.deepEqual(s.ray.start,s.eye);s.ray.end.forEach((v,i)=>near(v,s.expectedRay.end[i],1e-5));assert.equal(s.ray.blocked,s.expectedRay.blocked);if(s.ray.blocked)near(s.ray.hit.distance,s.expectedRay.hit.distance,1e-5);assert.ok(s.expectedRay.triangles>1000);}
async function test(browser,name,fn){const row={name,started:new Date().toISOString()};const p=await browser.newPage({viewport:{width:name.includes('375')?375:390,height:960},reducedMotion:'reduce'});p.setDefaultTimeout(60000);const errors=[];p.on('pageerror',e=>errors.push(e.message));try{await fn(p,row);assert.deepEqual(errors,[]);row.status='PASS';}catch(e){row.status='FAIL';row.reason=e.stack;row.errors=errors;}row.ended=new Date().toISOString();result.rows.push(row);save();console.log(name,row.status,row.reason??'');await p.close();}
for(const [engine,type]of Object.entries({chromium,webkit})){
 if(process.env.ONLY_ENGINE&&process.env.ONLY_ENGINE!==engine)continue;
 let browser;try{browser=await type.launch();}catch(e){result.rows.push({engine,status:'NOT_TESTED',reason:e.message});save();continue;}
 result[engine+'Version']=browser.version();
 for(const width of [375,390])await test(browser,`${engine}-${width}-support-material-ray-sections`,async(p,row)=>{
  await instrument(p);await start(p);await mode(p,'a');const a0=await read(p);await loaded(p);const a1=await read(p);assert.deepEqual(a1.eye,a0.eye);assert.deepEqual(a1.target,a0.target);assert.deepEqual(signatures(a1),signatures(a0));assert.equal(a1.connected.length,0);await mode(p,'c');
  row.stations=[];
  for(const scale of [1,2]){
   if(scale===2)await p.locator('#exaggeration').check();
   for(const station of meta.stations){await p.locator(`[data-inner-station="${station.id}"]`).click();await p.waitForFunction(id=>window.__terrainDiagnostics().state.station===id&&window.__terrainDiagnostics().state.ready,station.id);const c=await read(p);near(c.eye[0],station.eye[0]);near(c.eye[2],-station.eye[1]);assert.ok(c.support.length);near(c.eye[1]-c.support[0].y,1.7,.002);assert.equal(c.canvas,'visible');assert.ok(c.visible.every(x=>x.colorValid));
    await mode(p,'cd');const cd=await read(p);assert.deepEqual(cd.eye,c.eye);assert.deepEqual(cd.connected.map(x=>[x.position,x.index]),c.connected.map(x=>[x.position,x.index]));assert.ok(cd.connected.every(x=>x.map&&x.bump&&x.roughMap&&x.colorValid));
    await mode(p,'c');const c2=await read(p);assert.deepEqual(c2.connected,c.connected);row.stations.push({id:station.id,scale,eye:c.eye,support:c.support[0],connected:c.connected.length});
   }
  }
  await p.locator('#exaggeration').uncheck();await p.locator('#connected-rays').check();row.pairs=[];
  for(const pair of ['entrance','bridge'])for(const side of ['attacker','defender']){await p.locator(`[data-defence-pair=${pair}][data-side=${side}]`).click();const s=await read(p);checkRay(s);row.pairs.push({pair,side,actual:s.ray,independent:s.expectedRay});await p.locator('#viewport').focus();await p.keyboard.press('ArrowRight');const turn=await read(p);checkRay(turn);assert.deepEqual(turn.eye,s.eye);}
  await p.locator('#connected-rays').uncheck();assert.equal((await read(p)).ray,null);
  await mode(p,'a');const a=await read(p);for(const q of ['light','high','balanced']){await mode(p,'cd');await p.locator('#quality').selectOption(q);await mode(p,'a');assert.deepEqual(signatures(await read(p)),signatures(a));}
  row.sections=[];for(const id of ['moat','rampart']){await p.locator('#section-choice').selectOption(id);await p.waitForFunction(()=>window.__terrainDiagnostics().section?.status==='ready');const before=await p.evaluate(()=>window.__terrainDiagnostics().section.data);await p.locator('#exaggeration').check();const after=await p.evaluate(()=>window.__terrainDiagnostics().section.data);assert.deepEqual(after,before);row.sections.push({id,data:before});await p.locator('#exaggeration').uncheck();}
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 });
 for(const mutation of [null,'stale-loader-camera'])await test(browser,`${engine}-delay-${mutation??'normal'}`,async(p,row)=>{
  await instrument(p,mutation);let release,requested;const gate=new Promise(r=>release=r),seen=new Promise(r=>requested=r);await p.route('**/data/phase3d.glb',async r=>{requested();await gate;await r.continue();});
  await start(p);await p.locator('#connected-load').click();await seen;await mode(p,'a');await p.locator('#viewport').focus();await p.keyboard.press('ArrowRight');const before=await read(p);release();await p.waitForFunction(()=>window.__terrainDiagnostics().phase3d.loaded);const after=await read(p);row.before=signatures(before);row.after=signatures(after);row.cameraBefore=before.eye;row.cameraAfter=after.eye;
  let reason=null;try{assert.deepEqual(after.eye,before.eye,'LATE_CAMERA_OVERWRITE');assert.deepEqual(after.target,before.target,'LATE_TARGET_OVERWRITE');assert.equal(after.comparison,'current');assert.deepEqual(signatures(after),signatures(before),'LATE_A_CONTAMINATION');assert.equal(after.connected.length,0);}catch(e){reason=e.message;}
  if(mutation){assert.ok(reason?.includes('LATE_CAMERA_OVERWRITE'),'specific negative signature');row.negative='EXPECTED_REJECTION';}else assert.equal(reason,null);
 });
 await test(browser,`${engine}-retry-and-legacy-station`,async(p,row)=>{
  await instrument(p);await start(p);let fail=true;await p.route('**/data/phase3d.glb',r=>fail?r.fulfill({status:404,body:'independent injected 404'}):r.continue());await p.locator('#connected-load').click();await p.waitForFunction(()=>window.__terrainDiagnostics().phase3d.error);assert.equal((await read(p)).connected.length,0);fail=false;await loaded(p);await p.locator('#connected-rays').check();await p.locator('[data-defence-pair=entrance][data-side=attacker]').click();checkRay(await read(p));await p.locator('[data-station=bailey]').click();await p.waitForFunction(()=>window.__terrainDiagnostics().state.station==='bailey'&&window.__terrainDiagnostics().state.ready);const s=await read(p);row.legacy={station:s.station,ray:s.ray};assert.equal(s.ray,null,'STALE_PAIR_AFTER_LEGACY_STATION');
 });
 await browser.close();
}
result.finished=new Date().toISOString();save();if(result.rows.some(x=>x.status!=='PASS'))process.exitCode=1;
