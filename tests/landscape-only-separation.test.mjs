import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const main=readFileSync('src/main.js','utf8');
function separated(s){assert(!/performanceLog|timedGLB|renderCPU|createPerformanceLog/.test(s));assert(s.includes('loader.loadAsync(assetPath(`data/${file}.glb`))'));const render=s.split('\n').find(l=>l.includes(' function render(){'));const old=execFileSync('git',['show','42ed7bbe:src/main.js'],{encoding:'utf8'}).split('\n').find(l=>l.includes(' function render(){'));assert.equal(render,old);}
test('landscape-only keeps exact synchronous render and original loader without new observer',()=>{separated(main);assert(!existsSync('src/performance.js'));assert(!existsSync('src/measurement.js'));});
for(const token of ['performanceLog','timedGLB','renderCPU'])test('reject leaked '+token,()=>assert.throws(()=>separated(main+'\n'+token)));
test('reject deferred render replacement',()=>assert.throws(()=>separated(main.replace('renderer.render(scene,camera)','requestAnimationFrame(()=>renderer.render(scene,camera))'))));
test('I evidence verifier retains independent negative controls',async()=>{const src=readFileSync('tests/phase3h-evidence.test.mjs','utf8');assert(src.includes('taintedA'));});
