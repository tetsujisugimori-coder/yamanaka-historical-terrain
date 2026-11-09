// Focused interaction probe. Run with a Vite server at BASE_URL; no app state setters.
import {chromium} from '@playwright/test';
import {PerspectiveCamera,Vector3} from 'three';
import fs from 'node:fs';
const base=process.env.BASE_URL||'http://127.0.0.1:4391/';
const out='evidence/stage3a/ui-interactions';fs.mkdirSync(out,{recursive:true});
const report={browser:'Chromium software WebGL',viewport:[390,844],physicalSafari:'NOT_TESTED',checks:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});page.setDefaultTimeout(120000);page.on('pageerror',e=>report.errors.push(e.message));
const check=(name,pass,detail)=>{report.checks.push({name,result:pass?'PASS':'FAIL',detail});console.log(name,pass?'PASS':'FAIL',detail??'');};
try{
 await page.goto(base);await page.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready);await page.waitForFunction(()=>window.__terrainDiagnostics().parts.loaded==='B0');
 await page.locator('#landscape-enter').click();await page.waitForFunction(()=>window.__terrainDiagnostics().parts.visible);await page.locator('#quality').selectOption('light');await page.locator('#parts-select').click();await page.locator('#viewport canvas').scrollIntoViewIfNeeded();
 const d=await page.evaluate(()=>window.__terrainDiagnostics());const box=await page.locator('#viewport canvas').boundingBox();const camera=new PerspectiveCamera(d.cameraFov,box.width/box.height,.15,30000);camera.position.fromArray(d.camera);camera.lookAt(new Vector3().fromArray(d.target));camera.updateMatrixWorld();
 const post=d.parts.posts[0];const v=new Vector3(post.x,post.base+2.05,post.z).project(camera);await page.mouse.click(box.x+(v.x+1)*box.width/2,box.y+(1-v.y)*box.height/2);
 const selection=await page.locator('#cad-selection').evaluate(e=>({part:e.dataset.part,from:e.dataset.from}));check('Direct 3D post picking',selection.part===post.id&&selection.from==='3d',selection);check('3D/list mapping',await page.locator('#cad-component').inputValue()===post.id);check('3D/SVG mapping',await page.locator(`#cad-drawing [data-part-id="${post.id}"][data-selected="true"]`).count()===3);
 await page.locator('#cad-tab-drawing').click();const ids=await page.locator('#cad-component option').evaluateAll(es=>es.map(e=>e.value).filter(Boolean));const second=ids.find(id=>id!==post.id);const target=page.locator(`#cad-drawing [data-view="front"] [data-part-id="${second}"]`);await target.scrollIntoViewIfNeeded();await target.tap({force:true});const touchSelection=await page.locator('#cad-selection').evaluate(e=>({part:e.dataset.part,from:e.dataset.from}));check('Touch SVG/list mapping',touchSelection.part===second&&await page.locator('#cad-component').inputValue()===second,touchSelection);
 check('SVG allows native page/drawing scrolling',await page.locator('#cad-drawing').evaluate(e=>getComputedStyle(e).touchAction==='pan-x pan-y'));const scroll=await page.locator('#cad-drawing').evaluate(e=>{const before=e.scrollLeft;e.scrollLeft=e.scrollWidth;return {before,after:e.scrollLeft,width:e.clientWidth,content:e.scrollWidth}});check('Mobile drawing horizontal scroll',scroll.after>scroll.before,scroll);
 await page.screenshot({path:out+'/drawing-touch.png',fullPage:false});
 // Fail the new revision, never route the currently displayed B0 response.
 await page.route('**/parts/cad/B1/assembly.glb',route=>route.abort());await page.locator('#cad-revision').selectOption('B1');await page.waitForFunction(()=>document.querySelector('#cad-status').textContent.includes('停止'));
 const stale=await page.locator('#parts-detail').innerText();const fail=await page.evaluate(()=>window.__terrainDiagnostics().parts);check('Failed revision removes old geometry',!fail.visible&&fail.loaded===null);check('Failed revision clears stale placement detail',!stale.includes('"revision": "B0"'),{detail:stale.slice(0,180)});await page.screenshot({path:out+'/failed-revision.png',fullPage:false});
 await page.unroute('**/parts/cad/B1/assembly.glb');await page.locator('#cad-retry').click();await page.waitForFunction(()=>window.__terrainDiagnostics().parts.loaded==='B1');check('Retry after missing GLB',await page.evaluate(()=>window.__terrainDiagnostics().parts.visible));
}catch(e){report.errors.push(e.message);console.error(e.message)}finally{fs.writeFileSync(out+'/results.json',JSON.stringify(report,null,2)+'\n');await browser.close()}
if(report.errors.length||report.checks.some(c=>c.result==='FAIL'))process.exitCode=1;
