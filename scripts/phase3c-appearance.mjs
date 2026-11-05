import {chromium,webkit} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const out=process.env.APPEARANCE_OUT??'evidence/phase3c/appearance',urls={before:'http://127.0.0.1:4319',after:'http://127.0.0.1:4317'},rows=[];
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
   for(const station of ['wb-earth','wb-wood','wb-moat']){
    await p.locator(`[data-station="${station}"]`).click();await p.waitForFunction(s=>window.__terrainDiagnostics().state.station===s,station);
    await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const file=`${engine}-${width}-${station}-${version}.png`;
    await p.locator('#viewport canvas').screenshot({path:`${out}/${file}`});
    const d=await p.evaluate(()=>window.__terrainDiagnostics());row.images.push({file,camera:d.camera,target:d.target,canvas:d.canvas});
   }
   row.status='PASS';
  }catch(e){row.status='FAIL';row.reason=e.message;}
  rows.push(row);await p.close();await writeFile(`${out}/results.json`,JSON.stringify({scope:'Same machine/browser/viewport/station/quality before PR12-merged main vs Phase3C. Images are appearance comparisons, not zero-pixel expectations or historic accuracy.',hashes:Object.fromEntries(await Promise.all(['src/phase3b.js','src/main.js'].map(async f=>[f,createHash('sha256').update(await readFile(f)).digest('hex')]))),rows},null,2));
 }
 await browser.close();
}
if(rows.some(r=>r.status==='FAIL'))process.exitCode=1;
console.log(rows.map(r=>[r.engine,r.width,r.version,r.status,r.reason]));
