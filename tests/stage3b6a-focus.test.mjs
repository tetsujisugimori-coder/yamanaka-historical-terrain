import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../src/castle-overview.js',import.meta.url),'utf8');
const start=' async function activate(){',end=' function deactivate(';
assert.equal(source.split(start).length,2);const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(b>a);
const body=source.slice(a,b);
function fixture({focused=true}={}){
 const deferred=[];const context=vm.createContext({deferred});
 vm.runInContext(`
 const doc={body:{tag:'body'}};const other={tag:'other'};let focuses=0;
 const open={ownerDocument:doc,setAttribute(){},focus(){focuses++;doc.activeElement=open;},set disabled(v){this._disabled=v;if(v&&doc.activeElement===open)doc.activeElement=doc.body;},get disabled(){return this._disabled;}};
 doc.activeElement=${focused?'open':'other'};
 let disposed=false,active=false,epoch=0,previous=null,data={regions:[]};
 const back={},close={},controls={},status={};
 const binding={capture(){return {};},open(){return new Promise(resolve=>deferred.push(resolve));},render(){}};
 function sync(){}
 ${body}
 globalThis.api={activate,otherFocus(){doc.activeElement=other;},supersede(){epoch++;},dispose(){disposed=true;epoch++;},result(){return{focuses,focus:doc.activeElement===open?'open':doc.activeElement===doc.body?'body':'other',active,disabled:open.disabled};}};
 `,context);return{...context.api,resolve(value=true){deferred.shift()(value);}};
}
test('B6a focused overview activation restores focus lost by disabling its button',async()=>{const f=fixture(),pending=f.activate();assert.equal(f.result().focus,'body');f.resolve();await pending;assert.equal(f.result().focus,'open');assert.equal(f.result().focuses,1);});
test('B6a programmatic activation does not claim unrelated focus',async()=>{const f=fixture({focused:false}),pending=f.activate();f.resolve();await pending;assert.equal(f.result().focus,'other');assert.equal(f.result().focuses,0);});
test('B6a activation does not steal focus moved during pending acquisition',async()=>{const f=fixture(),pending=f.activate();f.otherFocus();f.resolve();await pending;assert.equal(f.result().focus,'other');assert.equal(f.result().focuses,0);});
test('B6a stale activation cannot restore focus over a newer intent',async()=>{const f=fixture(),pending=f.activate();f.supersede();f.resolve();await pending;assert.equal(f.result().focuses,0);assert.equal(f.result().active,false);});
test('B6a disposed activation cannot restore focus',async()=>{const f=fixture(),pending=f.activate();f.dispose();f.resolve();await pending;assert.equal(f.result().focuses,0);assert.equal(f.result().active,false);});
