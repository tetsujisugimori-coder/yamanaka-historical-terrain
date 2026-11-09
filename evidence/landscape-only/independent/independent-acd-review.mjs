import {chromium,webkit,expect} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const out='../yamanaka-landscape-review-evidence/86871fa';await mkdir(out,{recursive:true});const rows=[];
for(const engine of ['chromium','webkit'])for(const width of [390,1280]){
 const b=await ({chromium,webkit}[engine]).launch();const p=await b.newPage({viewport:{width,height:960}});p.setDefaultTimeout(90000);const errors=[];p.on('pageerror',e=>errors.push(e.message));const row={engine,width};
 try{
  await p.goto('http://127.0.0.1:4531');await p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready);
  await p.locator('#landscape-enter').click();await p.waitForFunction(()=>window.__terrainDiagnostics().state.ready);
  for(let round=0;round<3;round++){
   for(const mode of ['cd','a','c']){
    await p.locator(`[data-landscape-mode=${mode}]`).click();await p.waitForFunction(()=>window.__terrainDiagnostics().state.ready);
    const d=await p.evaluate(()=>window.__terrainDiagnostics());expect(d.phase3iModel.version).toBe('phase3i-v1');
    if(mode!=='cd'){expect(d.nature.visible).toBe(false);expect(d.nature.supports).toEqual([]);expect(d.phase3b.shadows).toBe(false);}
    if(mode==='a'){expect(d.phase3c.objects).toEqual([]);expect(d.phase3d.objects).toEqual([]);}
   }
  }
  await p.locator('#exaggeration').check();const d=await p.evaluate(()=>window.__terrainDiagnostics());expect(d.state.exaggeration).toBe(2);
  await p.locator('#exaggeration').uncheck();await p.locator('#viewport').screenshot({path:`${out}/${engine}-${width}.png`});row.pngSha256=createHash('sha256').update(await readFile(`${out}/${engine}-${width}.png`)).digest('hex');expect(errors).toEqual([]);row.status='PASS';
 }catch(e){row.status='FAIL';row.reason=e.message;}
 rows.push(row);await b.close();await writeFile(`${out}/browser.json`,JSON.stringify({head:'86871faac10a07b56552aa76aa846e6f228ae83b',rows},null,2));console.log(row);
}
if(rows.some(x=>x.status!=='PASS'))process.exitCode=1;
