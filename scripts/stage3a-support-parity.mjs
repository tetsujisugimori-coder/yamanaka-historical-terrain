import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
const out=process.env.STAGE3A_PARITY_OUT||'evidence/stage3a/support-parity.json';mkdirSync(dirname(out),{recursive:true});
const sourceFiles=['src/cad-support.js','src/cad-parts.js','src/exploration.js','src/library-parts.js','src/main.js','public/data/phase3i.glb','public/data/phase3i-inner.glb'];
const hashes=()=>Object.fromEntries(sourceFiles.map(f=>[f,createHash('sha256').update(readFileSync(f)).digest('hex')]));const initialHashes=hashes();
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1280,height:960}});
page.setDefaultTimeout(90000);
await page.route('**/src/main.js',async route=>{const response=await route.fetch();const text=await response.text();if(!text.includes('window.__terrainDiagnostics='))throw Error('Probe injection anchor absent');await route.fulfill({response,body:text.replace('window.__terrainDiagnostics=','window.__probeSurfaces=stationSurfaces;window.__terrainDiagnostics=')})});
await page.goto(process.env.TEST_URL||'http://127.0.0.1:4391');await page.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready);
await page.locator('#landscape-enter').click();await page.waitForFunction(()=>window.__terrainDiagnostics().state.ready);
await page.locator('#inner-load').click();await page.waitForFunction(()=>window.__terrainDiagnostics().phase3c.loaded);
const report={scope:'Diagnostic-only route injection exposes unchanged live stationSurfaces; no tracked app edits. Timings are browser microbenchmarks, not independent end-to-end improvement evidence.',sourceHashes:initialHashes,facePolicy:'Shared-edge/vertex face IDs may differ. Both describe actual world triangles; each indexed face must contain the query and match ray height/slope within tolerance. No exact face-ID parity claim.',rows:[]};
for(const ex of [1,2]){
 await page.locator('#exaggeration').setChecked(ex===2);
 const result=await page.evaluate(async(ex)=>{
  const {createCadSupportCache}=await import('/src/cad-support.js');
  const {loadCadPart,disposeCadPart}=await import('/src/cad-parts.js');
  const {Vector3}=await import('/node_modules/three/build/three.module.js');
  const {triangleSampler}=await import('/src/library-parts.js');
  const surfaces=window.__probeSurfaces();
  const start=performance.now(),cache=createCadSupportCache(),sample=cache.get(surfaces),indexBuildMs=performance.now()-start;
  const rstart=performance.now(),ray=triangleSampler(surfaces),rayBuildMs=performance.now()-rstart;
  const rows=[];
  for(const revision of ['B0','B1','B2']){
   const asset=await loadCadPart('/',revision),parts=asset.parts.filter(p=>p.id.includes('_Post_')),centerX=asset.centerX;
   for(const yaw of [0,45,90]){
    const a=yaw*Math.PI/180,c=Math.cos(a),s=Math.sin(a),points=[{id:'anchor',x:-20,z:0}];
    for(const p of parts){const b=p.bounds_m,coords=[[(b[0]+b[3])/2,(b[1]+b[4])/2],...([b[0],b[3]].flatMap(x=>[b[1],b[4]].map(n=>[x,n])))];for(let k=0;k<coords.length;k++){const [px,n]=coords[k],lx=px-centerX,lz=-n;points.push({id:p.id+':'+k,x:-20+c*lx+s*lz,z:-s*lx+c*lz})}}
    let t=performance.now();const rs=points.map(p=>ray(p.x,p.z));const rayQueryMs=performance.now()-t;
    t=performance.now();const ws=points.map(p=>sample(p.x,p.z));const indexQueryMs=performance.now()-t;
    const contains=(hit,point)=>{
     if(!hit)return false;
     const mesh=surfaces.find(m=>m.name===hit.name&&(m.userData.elementId??m.userData.facilityId)===hit.id);if(!mesh)return false;
     const pos=mesh.geometry.attributes.position,index=mesh.geometry.index;
     const [a,b,c]=[0,1,2].map(k=>new Vector3().fromBufferAttribute(pos,index?index.getX(hit.face*3+k):hit.face*3+k).applyMatrix4(mesh.matrixWorld));
     const det=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z),u=((b.z-c.z)*(point.x-c.x)+(c.x-b.x)*(point.z-c.z))/det,v=((c.z-a.z)*(point.x-c.x)+(a.x-c.x)*(point.z-c.z))/det,w=1-u-v;
     return Math.min(u,v,w)>=-1e-8&&Math.abs(u*a.y+v*b.y+w*c.y-hit.height)<=1e-8;
    };
    const comparisons=points.map((p,i)=>({point:p,ray:rs[i],indexed:ws[i],indexedFaceContainsQuery:contains(ws[i],p),heightDelta:rs[i]&&ws[i]?Math.abs(rs[i].height-ws[i].height):null,slopeDelta:rs[i]&&ws[i]?Math.abs(rs[i].slope-ws[i].slope):null,faceEqual:rs[i]?.face===ws[i]?.face}));
    rows.push({revision,yaw,ex,pointCount:points.length,rayQueryMs,indexQueryMs,maxHeightDelta:Math.max(...comparisons.map(x=>x.heightDelta??Infinity)),maxSlopeDelta:Math.max(...comparisons.map(x=>x.slopeDelta??Infinity)),faceMismatch:comparisons.filter(x=>!x.faceEqual).length,missing:comparisons.filter(x=>!x.ray||!x.indexed).length,invalidIndexedFaces:comparisons.filter(x=>!x.indexedFaceContainsQuery).length,comparisons});
   }
   disposeCadPart(asset.group);
  }
  return {cache:cache.diagnostics(),ex,indexBuildMs,rayBuildMs,surfaces:surfaces.map(m=>({name:m.name,visible:m.visible,triangles:(m.geometry.index?.count??m.geometry.attributes.position.count)/3,side:m.material.side})),rows};
 },ex);
 report.rows.push(result);writeFileSync(out,JSON.stringify(report,null,2));
 console.log(JSON.stringify({ex,indexBuildMs:result.indexBuildMs,rayBuildMs:result.rayBuildMs,rows:result.rows.map(({comparisons,...r})=>r)}));
}
await browser.close();
report.finalSourceHashes=hashes();report.status=JSON.stringify(report.sourceHashes)===JSON.stringify(report.finalSourceHashes)&&report.rows.length===2&&report.rows.every(x=>x.cache.mode==='indexed-world-triangles'&&x.rows.length===9&&x.rows.every(r=>r.pointCount===51&&r.missing===0&&r.invalidIndexedFaces===0&&r.maxHeightDelta<=1e-8&&r.maxSlopeDelta<=1e-7))?'PASS':'FAIL';writeFileSync(out,JSON.stringify(report,null,2));if(report.status!=='PASS')process.exitCode=1;
