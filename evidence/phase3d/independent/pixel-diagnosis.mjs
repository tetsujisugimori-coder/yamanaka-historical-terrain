import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const out='evidence/phase3d/independent/pixel-diagnosis';mkdirSync(out,{recursive:true});const rows=[];
for(const [engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch();
 for(const variant of ['current','baseline','integer-viewport-control']){
  const p=await browser.newPage({viewport:{width:375,height:960},reducedMotion:'reduce'});p.setDefaultTimeout(60000);const row={engine,variant};
  try{
   await p.route('**/src/main.js*',async r=>{const response=await r.fetch();let body=await response.text();body=body.replace('new THREE.WebGLRenderer({antialias:true,alpha:false})','new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true})');
    if(variant==='integer-viewport-control'){const from='renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;',to='renderer.setSize(Math.floor(r.width),Math.floor(r.height),false);camera.aspect=Math.floor(r.width)/Math.floor(r.height);';assert.equal(body.split(from).length,2);body=body.replace(from,to);}
    const probe=String.raw`window.__frame=()=>{const gl=renderer.getContext(),r=viewport.getBoundingClientRect();return {camera:camera.position.toArray(),target:controls.target.toArray(),quaternion:camera.quaternion.toArray(),projection:camera.projectionMatrix.toArray(),rect:{width:r.width,height:r.height},size:renderer.getSize(new THREE.Vector2()).toArray(),drawingBuffer:[gl.drawingBufferWidth,gl.drawingBufferHeight],glViewport:Array.from(gl.getParameter(gl.VIEWPORT)),light:light.position.toArray().concat(light.target.position.toArray(),light.intensity,ambient.intensity),png:renderer.domElement.toDataURL('image/png')};};`;
    body=body.replace('window.__terrainDiagnostics=',probe+'window.__terrainDiagnostics=');await r.fulfill({response,body});
   });
   const ready=()=>p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready),mode=async m=>{await p.locator(`[data-landscape-mode=${m}]`).click();await ready();};
   const capture=async name=>{await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const s=await p.evaluate(()=>window.__frame());const png=Buffer.from(s.png.split(',')[1],'base64');delete s.png;s.sha256=createHash('sha256').update(png).digest('hex');writeFileSync(`${out}/${engine}-${variant}-${name}.png`,png);return s;};
   await p.goto(variant==='baseline'?'http://127.0.0.1:4395':'http://127.0.0.1:4396');await ready();await p.locator('#landscape-enter').click();await ready();await mode('a');await p.locator(variant==='baseline'?'#inner-load':'#connected-load').click();await p.waitForFunction(b=>b?window.__terrainDiagnostics().phase3c.loaded:window.__terrainDiagnostics().phase3d.loaded,variant==='baseline');
   row.before=await capture('before');await mode('cd');await p.locator('#quality').selectOption('high');await mode('a');row.after=await capture('after');row.equal=row.before.sha256===row.after.sha256;row.status='MEASURED';
  }catch(e){row.status='ERROR';row.reason=e.stack;}
  rows.push(row);writeFileSync(out+'/results.json',JSON.stringify({testOnlyOptions:{preserveDrawingBuffer:true,integerViewport:'Only control variant floors renderer size and projection dimensions.'},rows},null,2));console.log(engine,variant,row.status,row.equal,row.before?.glViewport,row.after?.glViewport,row.reason??'');await p.close();
 }
 await browser.close();
}
