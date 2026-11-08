import test from'node:test';import assert from'node:assert/strict';import{verifyPerformance}from'../scripts/phase3i-performance-report.mjs';
const fixture=()=>({conditions:{trials:3},rows:[1,2,3].flatMap(trial=>['cold','warm'].map(cache=>({trial,cache,status:'PASS',walk:{wallMs:40,requiredMoves:30,diagnostics:{trace:[{type:'keydown',key:'w',trusted:true,time:0},...Array.from({length:30},(_,i)=>({type:'move',position:[i,0,0],time:i+1})),{type:'keyup',key:'w',trusted:true,time:31}]}},frameProxy:{intervalsMs:Array(60).fill(16),elapsedMs:960},errors:[],httpErrors:[],initialReadyMs:1,facilityReadyMs:2,resources:Array.from({length:5},()=>({encodedBodySize:100,transferSize:0}))})))});
test('performance six distinct trials accepted',()=>verifyPerformance(fixture()));
for(const [name,mutate]of Object.entries({missing:r=>r.rows.pop(),duplicate:r=>r.rows[5]=r.rows[0],failure:r=>r.rows[0].status='FAIL',NaN:r=>r.rows[0].facilityReadyMs=NaN,error:r=>r.rows[0].errors.push('error'),http:r=>r.rows[0].httpErrors.push('404'),resource:r=>r.rows[0].resources=[],denominator:r=>r.conditions.trials=2}))test('reject performance '+name,()=>{const f=fixture();mutate(f);assert.throws(()=>verifyPerformance(f));});
import{verifyComparison}from'../scripts/phase3i-performance-report.mjs';
const expected={head:'b'.repeat(40),mainSha256:'c'.repeat(64)};
function pair(){const H={...fixture(),label:'H',head:'42ed7bbe1b1f839535ed66c76c75d1ade2ce2cc8',mainSha256:'66ddee062ecbcd81261d376e91064f00f074c1528dc968c862c02b3dae2c7bb1',runnerSha256:'d'.repeat(64),browser:'test'},I={...fixture(),label:'I',head:expected.head,mainSha256:expected.mainSha256,runnerSha256:'d'.repeat(64),browser:'test'};return[H,I];}
test('comparison identities and expected candidate accepted',()=>verifyComparison(...pair(),expected));
test('same candidate input as both H and I rejected',()=>{const[,I]=pair();assert.throws(()=>verifyComparison(I,I,expected),/baseline label/);});
for(const[name,change]of Object.entries({head:(h,i)=>i.head='a'.repeat(40),source:(h,i)=>i.mainSha256='e'.repeat(64),baseline:h=>h.head='a'.repeat(40),runner:(h,i)=>i.runnerSha256='e'.repeat(64),browser:(h,i)=>i.browser='other',conditions:(h,i)=>i.conditions.extra=true}))test('comparison rejects '+name,()=>{const p=pair();change(...p);assert.throws(()=>verifyComparison(...p,expected));});

for(const[name,change,pattern]of [
 ['zero observed moves',r=>r.walk.diagnostics.trace=r.walk.diagnostics.trace.filter(t=>t.type!=='move'),/observed move denominator/],
 ['infinite walk time',r=>r.walk.wallMs=Infinity,/finite walk sample/],
 ['negative RAF',r=>r.frameProxy.intervalsMs=Array(60).fill(-1),/RAF positive finite/],
 ['missing input trust',r=>r.walk.diagnostics.trace[0].trusted=false,/trusted walk input/],
 ['bad elapsed',r=>r.frameProxy.elapsedMs=1,/RAF elapsed sum/],
 ['reversed event time',r=>r.walk.diagnostics.trace[5].time=-1,/trace time order/]
 ])test('reject precise measured response fault '+name,()=>{const f=fixture();change(f.rows[0]);assert.throws(()=>verifyPerformance(f),pattern);});
