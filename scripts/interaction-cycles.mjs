import {chromium,webkit,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const results=[];
for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:900},hasTouch:true,isMobile:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4317');await page.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready);
 const row={engine:name,checks:[],status:'RUNNING'};
 try{
  const box=await page.locator('#viewport').boundingBox(),x=box.x+box.width*.45,y=box.y+box.height*.45;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+30,y+20,{steps:5});await page.locator('canvas').dispatchEvent('pointercancel',{pointerId:1,pointerType:'mouse',clientX:x+30,clientY:y+20});await page.mouse.up();
  const before=await page.evaluate(()=>window.__terrainDiagnostics().camera);await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-35,y+30,{steps:5});await page.mouse.up();expect(await page.evaluate(()=>window.__terrainDiagnostics().camera)).not.toEqual(before);row.checks.push('synthetic pointercancel followed by trusted mouse drag recovers');
  await page.mouse.move(x,y);await page.mouse.down({button:'right'});await page.mouse.move(x+35,y,{steps:5});await page.mouse.up({button:'right'});const target=await page.evaluate(()=>window.__terrainDiagnostics().target);expect(target).not.toEqual([0,480,0]);row.checks.push('trusted right-pointer pan');
  await page.touchscreen.tap(x,y);row.checks.push('trusted touchscreen tap in viewport');
  if(name==='chromium'){
   const cdp=await context.newCDPSession(page);const before=await page.evaluate(()=>window.__terrainDiagnostics().camera);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*7,y:y+i*4,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});expect(await page.evaluate(()=>window.__terrainDiagnostics().camera)).not.toEqual(before);row.checks.push('trusted Chromium touch drag');
   const beforePinch=await page.evaluate(()=>window.__terrainDiagnostics().camera);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-25,y,id:1},{x:x+25,y,id:2}]});for(let i=1;i<=4;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-25-i*5,y,id:1},{x:x+25+i*5,y,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});expect(await page.evaluate(()=>window.__terrainDiagnostics().camera)).not.toEqual(beforePinch);row.checks.push('trusted Chromium two-finger pinch');
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await page.getByRole('button',{name:'初期視点に戻す',exact:true}).click();await page.waitForFunction(()=>window.__terrainDiagnostics().state.ready);row.checks.push('trusted touchCancel and Reset recover');
  }else row.touchDrag='NOT_TESTED: public Playwright WebKit API exposes tap but not continuous trusted touch gesture; physical Safari NOT_TESTED';
  const background=await context.newPage();await background.goto('about:blank');await page.bringToFront();await page.getByRole('button',{name:'北を上にした俯瞰',exact:true}).click();expect(await page.evaluate(()=>window.__terrainDiagnostics().camera.every(Number.isFinite))).toBe(true);await background.close();row.checks.push('page background/foreground cycle and render recovery');
  for(let i=0;i<3;i++){await page.getByRole('button',{name:'障子堀の断面教材',exact:true}).click();await page.waitForFunction(()=>window.__terrainDiagnostics().state.ready&&window.__terrainDiagnostics().state.view==='study');await page.getByRole('button',{name:'周辺の山地',exact:true}).click();await page.waitForFunction(()=>window.__terrainDiagnostics().state.ready&&window.__terrainDiagnostics().state.view==='regional');}
  expect(await page.locator('canvas').count()).toBe(1);expect((await page.evaluate(()=>window.__terrainDiagnostics())).geometries).toBeLessThanOrEqual(9);row.checks.push('3 repeated scene swaps keep one canvas and bounded geometry count');expect(errors).toEqual([]);row.status='PASS';
 }catch(e){row.status='FAIL';row.reason=e.message;}
 results.push(row);console.log(JSON.stringify(row));await browser.close();
}
await writeFile('evidence/interaction-cycles.json',JSON.stringify({scope:'implementation self-verification, not physical mobile Safari; synthetic and trusted events distinguished',results},null,2));if(results.some(r=>r.status!=='PASS'))process.exitCode=1;
