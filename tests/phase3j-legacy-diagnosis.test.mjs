import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const runner=fs.readFileSync(new URL('../scripts/phase3c-performance-diagnosis.mjs',import.meta.url),'utf8');
const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const transform=runner.slice(runner.indexOf('  const renderLine='),runner.indexOf("  body=body.replace('function syncLandscape"));
function instrument(body){const box={body};vm.runInNewContext(transform,box);return box.body;}
test('legacy diagnosis detects and instruments current measured render without changing body',()=>{
 const line=main.split('\n').find(l=>/^ function render\(/.test(l));
 assert.ok(line);assert.equal(line.startsWith(' function render(){'),false);
 const box={performance:{now:()=>1},__perf:{renderCount:0,renderMs:0},calls:0,performanceLog:{measure:(_,fn)=>fn()}};
 vm.runInNewContext(instrument(line)+'\nfunction renderImpl(){calls++;return 7;}\nresult=render();',box);
 assert.equal(box.calls,1);assert.equal(box.__perf.renderCount,1);assert.equal(box.result,7);
});
test('legacy diagnosis continues supporting original zero-argument render',()=>{
 const box={performance:{now:()=>1},__perf:{renderCount:0,renderMs:0},calls:0};
 vm.runInNewContext(instrument(' function render(){calls++;return 9;}')+'\nresult=render();',box);
 assert.equal(box.calls,1);assert.equal(box.__perf.renderCount,1);assert.equal(box.result,9);
});
test('legacy diagnosis missing anchor still fails closed',()=>{assert.throws(()=>instrument('function unrelated(){}'),/anchor missing/);});
