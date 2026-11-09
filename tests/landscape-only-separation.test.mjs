import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
// Preserve the PR36 landscape-only contract against its frozen accepted source.
const main=readFileSync('evidence/metrics-reconnect/landscape-baseline-main.js','utf8');
// Exact main 42ed7bbe1b1f839535ed66c76c75d1ade2ce2cc8 snapshot; usable in shallow CI.
const baseline=readFileSync('evidence/phase3i/baseline-H-main.js','utf8');
assert.equal(createHash('sha256').update(baseline).digest('hex'),'66ddee062ecbcd81261d376e91064f00f074c1528dc968c862c02b3dae2c7bb1');
function separated(s){assert(!/performanceLog|timedGLB|renderCPU|createPerformanceLog/.test(s));assert(s.includes('loader.loadAsync(assetPath(`data/${file}.glb`))'));const render=s.split('\n').find(l=>l.includes(' function render(){'));const old=baseline.split('\n').find(l=>l.includes(' function render(){'));assert.equal(render,old);}
test('landscape-only keeps exact synchronous render and original loader without new observer',()=>{separated(main);assert.equal(createHash('sha256').update(main).digest('hex'),'d426e8749edc1a5e1cdda220fd133fc64ec437ee2a025e6cb9f905ee9356abb9');});
for(const token of ['performanceLog','timedGLB','renderCPU'])test('reject leaked '+token,()=>assert.throws(()=>separated(main+'\n'+token)));
test('reject deferred render replacement',()=>assert.throws(()=>separated(main.replace('renderer.render(scene,camera)','requestAnimationFrame(()=>renderer.render(scene,camera))'))));
test('I evidence verifier retains independent negative controls',async()=>{const src=readFileSync('tests/phase3h-evidence.test.mjs','utf8');assert(src.includes('taintedA'));});
