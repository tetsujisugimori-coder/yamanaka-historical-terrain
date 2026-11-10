import {chromium} from '@playwright/test';
import fs from 'node:fs';

const browser=await chromium.launch({headless:true});
const report={physicalSafari:'NOT_TESTED',browser:'Chromium emulated touch, WebGL deliberately unavailable',checks:[]};
const out='evidence/stage3a/ui-interactions';
fs.mkdirSync(out,{recursive:true});
const check=(name,pass,detail={})=>report.checks.push({name,result:pass?'PASS':'FAIL',...detail});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
 await page.addInitScript(()=>{
  const old=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes('webgl')?null:old.call(this,type,...args)};
 });
 const ready=()=>page.waitForFunction(()=>document.querySelector('#cad-component').options.length>1&&document.querySelector('#cad-drawing svg'));
 async function checkView(expected,label){
  await ready();
  const actual=await page.evaluate(()=>({
   selected:document.querySelector('#cad-view').value,
   url:new URL(location.href).searchParams.get('drawingView'),
   visible:[...document.querySelectorAll('#cad-drawing [data-view]')].filter(e=>getComputedStyle(e).display!=='none').map(e=>({view:e.dataset.view,id:e.id})),
   panelVisible:!document.querySelector('#cad-pane-drawing').hidden,
  }));
  check(label,actual.selected===expected&&actual.visible.length===1&&actual.visible[0].view===expected&&actual.visible[0].id==='view-'+expected&&actual.panelVisible,{expected,...actual});
  return actual;
 }
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4391');
 await ready();
 await page.locator('#cad-tab-drawing').click();
 const target=page.locator('#cad-drawing [data-view="front"] [data-part-id="U01_Post_002"]');
 await target.scrollIntoViewIfNeeded();await target.tap();
 const selected=await page.locator('#cad-component').inputValue();
 check('No-WebGL touch SVG selection',selected==='U01_Post_002');
 const before=await page.evaluate(()=>scrollY);
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:200,y:700}]});
 for(let i=1;i<=8;i++){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:200,y:700-i*25}]});
  await page.waitForTimeout(20);
 }
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.waitForTimeout(300);
 const after=await page.evaluate(()=>scrollY);
 check('Touch drag over drawing scrolls page',after>before,{before,after});
 check('Scroll gesture does not select another part',await page.locator('#cad-component').inputValue()===selected);
 await page.screenshot({path:out+'/no-webgl-touch-scroll.png'});
 for(const view of ['front','side','top']){
  await page.locator('#cad-view').selectOption(view);
  const state=await checkView(view,`Exactly one ${view} projection is visible`);
  check(`${view} projection is saved in drawingView URL`,state.url===view);
 }
 await page.reload();
 let state=await checkView('top','Reload restores top projection without overlapping views');
 check('Reload retains drawingView=top',state.url==='top');
 await page.goBack();
 state=await checkView('side','Browser Back restores side projection without overlapping views');
 check('Browser Back restores drawingView=side',state.url==='side');
 await page.goBack();
 state=await checkView('front','Second Browser Back restores front projection');
 check('Second Browser Back restores drawingView=front',state.url==='front');
 await page.goForward();
 state=await checkView('side','Browser Forward restores side projection');
 check('Browser Forward restores drawingView=side',state.url==='side');
}catch(error){report.error=error.message;}
finally{
 fs.writeFileSync(out+'/touch-scroll-results.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
 await browser.close();
}
if(report.error||report.checks.some(c=>c.result==='FAIL'))process.exitCode=1;
