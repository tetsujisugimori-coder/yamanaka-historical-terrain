import {chromium,webkit} from '@playwright/test';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
const urls={base:process.env.BASE_TEST_URL??'http://127.0.0.1:4319',phase3b:process.env.TEST_URL??'http://127.0.0.1:4317'},rows=[];
const output=process.env.PERF_OUTPUT??'evidence/phase3b/performance.json',channel=process.env.PERF_CHROMIUM_CHANNEL;
await mkdir(path.dirname(output),{recursive:true});
const imageDir=path.join(path.dirname(output),'performance-images');await mkdir(imageDir,{recursive:true});
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),base=process.env.BASE_HEAD??'6a84b95';
const hashes={};for(const file of ['src/main.js','src/phase3b.js','src/style.css','src/landscape.js','index.html','public/data/phase3b.json','public/data/phase3b.glb','scripts/phase3b-performance.mjs'])hashes[file]=createHash('sha256').update(await readFile(file)).digest('hex');
const bytes={};for(const file of ['nishinomaru.glb','landscape.glb','phase3b.glb'])bytes[file]=(await stat('public/data/'+file)).size;
const engines=[[channel?'chrome':'chromium',chromium],['webkit',webkit]].filter(([name])=>!process.env.PERF_ENGINE||name===process.env.PERF_ENGINE);
const variants=[{version:'base',quality:'baseline'},...['balanced','light','high'].map(quality=>({version:'phase3b',quality}))];
for(const [name,engine]of engines){
 const browser=await engine.launch(name!=='webkit'&&channel?{channel}:{});
 for(const width of [390,1280])for(const {version,quality} of variants)for(let trial=0;trial<Number(process.env.PERF_TRIALS??3);trial++){
  const ctx=await browser.newContext({viewport:{width,height:960},deviceScaleFactor:1}),p=await ctx.newPage();p.setDefaultTimeout(45000);await p.goto(urls[version]);await p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready);
  await p.addStyleTag({content:'.workspace{height:600px!important}.guide{height:600px!important;max-height:600px!important;overflow:auto}.terrain-panel{height:600px!important;min-height:600px!important}'});
  const start=performance.now();await p.locator('#landscape-enter').click();await p.waitForFunction(()=>window.__terrainDiagnostics().state.ready&&window.__terrainDiagnostics().state.view==='reconstruction');if(version==='phase3b')await p.waitForFunction(()=>window.__terrainDiagnostics().phase3b.visible);const readyMs=performance.now()-start;
  let qualitySwitchAndTwoFrameMs=null;if(version==='phase3b'){const switchStart=performance.now();await p.locator('#quality').selectOption(quality);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));qualitySwitchAndTwoFrameMs=performance.now()-switchStart;}
  const initialPose=await p.evaluate(()=>{const d=window.__terrainDiagnostics();return{camera:d.camera,target:d.target,canvas:d.canvas};});
  let screenshot=null;if(trial===0){screenshot=path.join(imageDir,`${name}-${width}-${version}-${quality}.png`);await p.locator('#viewport').screenshot({path:screenshot});}
  const info=await p.evaluate(async()=>{const el=document.querySelector('#viewport'),times=[];for(let i=0;i<8;i++){const t=performance.now();el.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));times.push(performance.now()-t);}return{diagnostics:window.__terrainDiagnostics(),inputAndTwoFrameMs:times,heap:performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize}:null,resources:performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.glb')).map(r=>({file:r.name.split('/').at(-1),durationMs:r.duration,transferSize:r.transferSize,encodedBodySize:r.encodedBodySize}))};});
  rows.push({engine:name,browser:browser.version(),width,version,quality,trial,readyMs,qualitySwitchAndTwoFrameMs,initialPose,screenshot,...info});console.log(name,width,version,quality,trial,Math.round(readyMs));await writeFile(output,JSON.stringify({scope:'Same Windows PC, loopback, new context and identical 600px terrain panel. Ready time uses initial balanced mode; quality switching is timed separately before each input sample. First trial screenshots are saved at identical initial camera before input samples. Synthetic keyboard dispatch + two animation frames; not physical input latency or sustained FPS. Endpoint JS heap excludes GPU/peak/total memory. Automated WebKit is not iPhone Safari hardware.',head,base,hashes,channel:channel??null,utc:new Date().toISOString(),urls,bytes,rows},null,2));await ctx.close();
 }await browser.close();
}
