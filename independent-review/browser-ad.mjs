import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=process.env.REVIEW_ROOT??'http://127.0.0.1:4317',out=process.env.REVIEW_OUT??'independent-review/output',expectBad=process.env.REVIEW_EXPECT_BAD==='1',mutation=process.env.REVIEW_MUTATION==='1';
await mkdir(out,{recursive:true});const rows=[];
const probe=`window.__independentAD=()=>{const meshes=[];terrainGroup.traverse(o=>{if(o.isMesh)meshes.push({name:o.name,map:!!o.material.map,bump:!!o.material.bumpMap,rough:!!o.material.roughnessMap,vertexColors:o.material.vertexColors,cast:o.castShadow,receive:o.receiveShadow});});return {meshes,light:light.intensity,ambient:ambient.intensity,lightPosition:light.position.toArray(),target:light.target.position.toArray(),fog:scene.fog?{near:scene.fog.near,far:scene.fog.far}:null,background:scene.background.getHexString(),shadows:renderer.shadowMap.enabled,lightShadow:light.castShadow,western:westernGroup.visible,scenery:sceneryGroup.visible,camera:camera.position.toArray(),look:controls.target.toArray()};};`;
const plain=d=>{assert.equal(d.light,2,'base directional light');assert.equal(d.ambient,2.1,'base hemisphere light');assert.equal(d.fog,null,'no D fog');assert.equal(d.background,'e2e9de','base background');assert.equal(d.shadows,false,'shadow renderer disabled');assert.equal(d.lightShadow,false,'light shadow disabled');assert.deepEqual(d.lightPosition,[-1500,3000,-1500]);assert.deepEqual(d.target,[0,0,0]);assert.ok(d.meshes.length,'actual terrain meshes');assert.ok(d.meshes.every(m=>!m.map&&!m.bump&&!m.rough),'no D texture on terrain');};
const ready=async p=>{await p.waitForFunction(()=>document.body.dataset.renderState==='ready'&&window.__terrainDiagnostics?.().state.ready);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
let failures=0;
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch();
 for(const width of [375,390,765,1280])for(const reducedMotion of ['no-preference','reduce']){
 const name=`${engine}-${width}-${reducedMotion}`,row={name,engine,browser:browser.version(),width,reducedMotion,checks:[],failures:[]};rows.push(row);
 const context=await browser.newContext({viewport:{width,height:960},reducedMotion,deviceScaleFactor:1}),p=await context.newPage();p.setDefaultTimeout(45000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/src/main.js*',async r=>{const response=await r.fetch();let source=await response.text();assert.ok(source.includes('window.__terrainDiagnostics='),'instrumentation anchor present');source=source.replace('window.__terrainDiagnostics=',probe+'\n window.__terrainDiagnostics=');if(mutation){assert.ok(source.includes('syncWestern(active);'),'mutation anchor');source=source.replace('syncWestern(active);',"syncWestern(active);if(comparison==='current'){light.intensity=2.6;scene.fog=new THREE.Fog('#cfdee1',220,1300);}");}await r.fulfill({response,body:source});});
 const check=async(label,fn)=>{try{await fn();row.checks.push(label);}catch(e){row.failures.push({label,message:e.message});failures++;}};
 try{
 await p.goto(root);await ready(p);await p.locator('#landscape-enter').click();await ready(p);await p.locator('[data-landscape-mode=cd]').click();await ready(p);await p.locator('#surface-finish').check();await p.locator('#quality').selectOption('high');
 const cd=await p.evaluate(()=>window.__independentAD());row.cd=cd;await check('C+D positive rendering',()=>{assert.equal(cd.light,2.6);assert.ok(cd.fog);assert.equal(cd.shadows,true);assert.ok(cd.meshes.some(m=>m.map));});
 await p.locator('[data-landscape-mode=a]').click();await ready(p);row.a=await p.evaluate(()=>window.__independentAD());await check('A actual plain renderer after C+D',()=>{plain(row.a);assert.equal(row.a.western,false);assert.equal(row.a.scenery,false);});
 const first=await p.locator('#viewport canvas').screenshot({path:`${out}/${name}-a-on.png`});
 // UI toggles may correctly be disabled in A. Real operations change D options in allowed C+D, then return A.
 await p.locator('[data-landscape-mode=cd]').click();await ready(p);await p.locator('#surface-finish').uncheck();await p.locator('[data-landscape-mode=a]').click();await ready(p);
 const second=await p.locator('#viewport canvas').screenshot({path:`${out}/${name}-a-off.png`});
 row.pixels={first:createHash('sha256').update(first).digest('hex'),second:createHash('sha256').update(second).digest('hex'),exactEqual:first.equals(second)};
 await check('A same camera/dimensions D preference invariant pixels',()=>{assert.deepEqual((()=>row.a.camera)(),row.cd.camera);assert.ok(first.equals(second),'canvas PNG exact equality, tolerance 0');});
 await p.locator('[data-landscape-mode=c]').click();await ready(p);await check('C-only plain',async()=>plain(await p.evaluate(()=>window.__independentAD())));
 await p.locator('[data-landscape-mode=cd]').click();await ready(p);await p.locator('#surface-finish').check();await p.locator('#quality').selectOption('balanced');await p.locator('[data-landscape-mode=a]').click();await ready(p);
 await p.locator('#exaggeration').check();await ready(p);await check('A 2x plain',async()=>plain(await p.evaluate(()=>window.__independentAD())));await p.locator('#exaggeration').uncheck();
 await p.setViewportSize({width:width===375?1280:375,height:960});await ready(p);await check('A resize plain',async()=>plain(await p.evaluate(()=>window.__independentAD())));
 await p.locator('#viewport').focus();await p.keyboard.press('ArrowRight');const box=await p.locator('#viewport canvas').boundingBox();await p.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await p.mouse.down();await p.mouse.move(box.x+box.width*.6,box.y+box.height*.5,{steps:3});await p.mouse.up();await check('A trusted pointer/keyboard plain',async()=>plain(await p.evaluate(()=>window.__independentAD())));
 await p.locator('#reset').click();await ready(p);await check('exit landscape plain',async()=>plain(await p.evaluate(()=>window.__independentAD())));await check('pageerror absent',()=>assert.deepEqual(errors,[]));
 }catch(e){row.failures.push({label:'execution',message:e.message});failures++;}
 await context.close();await writeFile(`${out}/results.json`,JSON.stringify({scope:'Independent reviewer-authored fresh automated browser operations; not hardware Safari/touch/VoiceOver. Raw scene instrumentation is read-only. Baseline and candidate use identical oracle.',root,head:process.env.REVIEW_HEAD??execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),mutation,expectBad,failures,rows},null,2));
 }
 await browser.close();
}
if(expectBad){assert.ok(rows.every(r=>r.failures.some(f=>f.label==='A actual plain renderer after C+D')),'baseline/negative must fail intended A renderer assertion for every condition');}else assert.equal(failures,0,'independent browser checks failed');
