import {chromium,webkit,expect} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root=process.env.TEST_URL??'http://127.0.0.1:4317';
const out=process.env.WEST_GATE_EVIDENCE??'evidence/west-gate-left-door/ci';
await mkdir(out,{recursive:true});
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const tree=execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim();
const paths=['src/main.js','src/west-gate-door-inspection.js','src/phase3c.js','scripts/phase3b-build-blender.py','scripts/west-gate-door-browser.mjs','tests/west-gate-door-components.test.mjs','docs/west-gate-left-door-components.md'];
const hashes=Object.fromEntries(await Promise.all(paths.map(async path=>[path,createHash('sha256').update(await readFile(path)).digest('hex')])));
const report={scope:'Actual Playwright Chromium/WebKit page interaction. No iPhone Safari or physical touch/VoiceOver claim.',head,tree,hashes,startedAt:new Date().toISOString(),rows:[]};
const save=()=>writeFile(out+'/results.json',JSON.stringify({...report,updatedAt:new Date().toISOString()},null,2));
await save();
const snap=p=>p.evaluate(()=>window.__terrainDiagnostics());
const ready=p=>p.waitForFunction(()=>window.__terrainDiagnostics?.().state.ready===true);
function samePose(actual,expected,label){
 expect(actual.camera,label+' camera position').toEqual(expected.camera);
 expect(actual.target,label+' look target').toEqual(expected.target);
 expect(actual.cameraFov,label+' FOV').toBe(expected.cameraFov);
}
for(const engine of process.env.WEST_GATE_ENGINE?[process.env.WEST_GATE_ENGINE]:['chromium','webkit']){
 let browser;
 try{browser=await(engine==='webkit'?webkit:chromium).launch();}
 catch(error){report.rows.push({engine,status:'NOT_TESTED',reason:'browser startup: '+error.message});await save();continue;}
 for(const width of process.env.WEST_GATE_WIDTH?[Number(process.env.WEST_GATE_WIDTH)]:[375,390,765,1280]){
  for(const motion of ['no-preference','reduce']){
   const key=engine+'-'+width+'-'+motion;
   const row={key,engine,browserVersion:browser.version(),width,motion,status:'PENDING',checks:[],startedAt:new Date().toISOString()};
   const context=await browser.newContext({viewport:{width,height:960},reducedMotion:motion});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   page.setDefaultTimeout(60000);
   try{
    await page.goto(root);await ready(page);
    await page.locator('#landscape-enter').click();await ready(page);
    await page.locator('[data-exploration-station="ic-station-westgate"]').click();
    await page.waitForFunction(()=>window.__terrainDiagnostics().state.station==='ic-station-westgate'&&window.__terrainDiagnostics().state.ready);
    const panel=page.locator('#west-gate-door-inspection'),focus=page.locator('#west-gate-door-focus'),back=page.locator('#west-gate-door-back');
    await expect(panel).toBeVisible();await expect(focus).toBeEnabled();await expect(back).toBeDisabled();
    const initial=await snap(page);
    expect(initial.phase3c.pose.clearance).toBeCloseTo(1.7,5);
    expect(initial.phase3b.visible).toBe(true);
    row.checks.push('real C model, supported fixed eye +1.7m, initial focus enabled');
    await focus.click();await expect(back).toBeEnabled();await expect(focus).toBeDisabled();
    const near=await snap(page);
    expect(near.camera).toEqual(initial.camera);
    expect(near.cameraFov).toBe(40);
    expect(near.target).not.toEqual(initial.target);
    expect(near.phase3c.pose.clearance).toBeCloseTo(1.7,5);
    row.checks.push('delivered focus click changes direction/FOV without moving eye');
    if([390,1280].includes(width)&&motion==='no-preference'){
     const image=out+'/'+key+'-near.png';
     await page.locator('#viewport').screenshot({path:image});
     row.nearImageSha256=createHash('sha256').update(await readFile(image)).digest('hex');
    }
    let mostRecent=near;
    for(const [part,fov] of [['board',24],['upperRail',22],['lowerRail',22],['postSide',24]]){
     const button=page.locator('#west-gate-detail-'+part);
     await expect(button).toBeEnabled();await button.click();
     await expect(button).toHaveAttribute('aria-pressed','true');
     const detail=await snap(page);
     expect(detail.camera).toEqual(initial.camera);
     expect(detail.cameraFov).toBe(fov);
     expect(detail.target).not.toEqual(mostRecent.target);
     expect(detail.phase3c.pose.clearance).toBeCloseTo(1.7,5);
     mostRecent=detail;
    }
    row.checks.push('four visible C component buttons change only direction and FOV with correct pressed state');
    await expect(back).toBeEnabled();
    await page.locator('#viewport').focus();await page.keyboard.press('ArrowRight');
    const moved=await snap(page);
    expect(moved.camera).toEqual(initial.camera);
    expect(moved.target).not.toEqual(mostRecent.target);
    await back.click();const restored=await snap(page);
    samePose(restored,initial,'after keyboard look around and back click');
    await expect(back).toBeDisabled();await expect(focus).toBeEnabled();
    row.checks.push('trusted keyboard look followed by exact position/target/FOV restoration');
    await focus.click();await back.click();samePose(await snap(page),initial,'second cycle');
    row.checks.push('second focus/back cycle restores exact initial pose');
    await page.locator('#west-gate-detail-board').click();await expect(back).toBeEnabled();
    await back.click();samePose(await snap(page),initial,'direct component entry followed by restore');
    row.checks.push('direct detail entry without preliminary whole-leaf focus restores initial pose');
    await focus.click();
    await page.locator('[data-landscape-mode="a"]').click();await ready(page);
    await expect(panel).toBeHidden();await expect(back).toBeDisabled();
    row.checks.push('A/current mode invalidates saved C camera and hides controls');
    await page.locator('[data-landscape-mode="cd"]').click();await ready(page);
    await expect(back).toBeDisabled();
    await page.locator('[data-exploration-station="ic-station-westmoat"]').click();
    await page.waitForFunction(()=>window.__terrainDiagnostics().state.station==='ic-station-westmoat');
    await expect(panel).toBeHidden();
    row.checks.push('new station invalidates stale back control');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    expect(errors).toEqual([]);
    row.checks.push('no viewport overflow or uncaught page error');
    row.status='PASS';
   }catch(error){
    row.status='FAIL';row.reason=String(error.stack??error);
    row.diagnostics=await snap(page).catch(()=>null);
    row.pageErrors=errors;
    await page.screenshot({path:out+'/'+key+'-failure.png',fullPage:true}).catch(()=>{});
   }finally{
    row.completedAt=new Date().toISOString();report.rows.push(row);await save();console.log(key,row.status,row.reason?.slice(0,240)??'');await context.close();
   }
  }
 }
 await browser.close();
}
report.finishedAt=new Date().toISOString();
report.complete=report.rows.length===16&&report.rows.every(r=>r.status==='PASS'&&r.checks.length===9);
await save();
if(!report.complete)process.exitCode=1;
