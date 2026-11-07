import {chromium,webkit} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out=process.env.APPEARANCE_OUT??'evidence/phase3d/appearance',urls={before:'http://127.0.0.1:4319',after:'http://127.0.0.1:4317'},rows=[];
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const tree=execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim();
const worktreeStatusAtStart=execFileSync('git',['status','--porcelain=v1'],{encoding:'utf8'}).trim(),startedAt=new Date().toISOString();
const base='988735123024650c8ae44e6a69f73b14b4669fc6'; // Before server baseline.
const hashes={};for(const file of ['src/main.js','src/phase3c.js','src/phase3b.js','src/reading.js','src/style.css','src/landscape.js','index.html','scripts/phase3d-appearance.mjs','src/phase3d.js','public/data/phase3d.glb','public/data/phase3c.json','public/data/phase3f-inner.glb','public/data/phase3b.json','public/data/phase3b.glb','public/data/phase3f.glb','public/data/castle.glb','public/data/regional.glb','public/data/moat-study.glb','public/data/landscape.glb'])hashes[file]=createHash('sha256').update(await readFile(file)).digest('hex');
await mkdir(out,{recursive:true});
for(const [engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch(engine==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}:{});
 for(const width of [390,1280])for(const [version,url]of Object.entries(urls)){
  const p=await browser.newPage({viewport:{width,height:960},reducedMotion:'reduce',deviceScaleFactor:1});p.setDefaultTimeout(45000);
  const row={engine,browser:browser.version(),width,version,images:[]};
  try{
   await p.goto(url);await p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready);
   await p.addStyleTag({content:'.workspace{height:600px!important}.guide{height:600px!important;max-height:600px!important;overflow:auto}.terrain-panel{height:600px!important;min-height:600px!important}'});
   await p.locator('#landscape-enter').click();await p.waitForFunction(()=>window.__terrainDiagnostics().state.ready&&window.__terrainDiagnostics().phase3b.visible);
   await p.locator('#quality').selectOption('balanced');
   await p.locator('#inner-load').click();await p.waitForFunction(()=>window.__terrainDiagnostics().phase3c.loaded);
   if(version==='after'){await p.locator('#connected-load').click();await p.waitForFunction(()=>window.__terrainDiagnostics().phase3d.loaded);}
   for(const station of ['ic-koguchi','ic-lookout']){
    await p.locator(`[data-inner-station="${station}"]`).click();await p.waitForFunction(s=>window.__terrainDiagnostics().state.station===s,station);
    await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const file=`${engine}-${width}-${station}-${version}.png`;
    await p.locator('#viewport canvas').screenshot({path:`${out}/${file}`});
    const d=await p.evaluate(()=>window.__terrainDiagnostics());row.images.push({file,camera:d.camera,target:d.target,canvas:d.canvas});
   }
   row.status='PASS';
  }catch(e){row.status='FAIL';row.reason=e.message;}
  rows.push(row);await p.close();await writeFile(`${out}/results.json`,JSON.stringify({scope:'Same machine/browser/viewport/station/quality before main9887351 vs reconstructed Phase3D. Images are appearance comparisons, not zero-pixel expectations or historic accuracy.',metadataVersion:2,head,tree,base,worktreeStatusAtStart,startedAt,utc:new Date().toISOString(),urls,hashes,rows},null,2));
 }
 await browser.close();
}
if(rows.some(r=>r.status==='FAIL'))process.exitCode=1;
console.log(rows.map(r=>[r.engine,r.width,r.version,r.status,r.reason]));
