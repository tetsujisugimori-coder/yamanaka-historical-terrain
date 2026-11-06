import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mutateInitialCamera,initialCameraResultsAccepted} from '../scripts/initial-camera-mutation.mjs';
import {createIntentController} from '../src/intent.js';

const actual=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
const legacy='function beginCameraIntent(){if(currentModel)return beginIntent();intents.adjustCamera();}';
const replacement='function beginCameraIntent(){return beginIntent();}';
const formatted=`function beginCameraIntent () {
 if (currentModel) {
  const intent = intents.begin();
  if (!state.ready) restoreCurrentPresentation();
  return intent;
 }
 /* Preserve initial completion, including its error. */
 intents.adjustCamera();
}`;

function exercise(fn,{currentModel=null,ready=false}={}){
 const intents=createIntentController(),initial=intents.begin(),calls=[];
 const restore=()=>calls.push('restore');
 const begin=()=>{calls.push('begin');const token=intents.begin();restore();return token;};
 const camera=new Function('currentModel','state','intents','restoreCurrentPresentation','beginIntent',`${fn};return beginCameraIntent;`)(currentModel,{ready},intents,restore,begin);
 return{initial,calls,result:camera()};
}

for(const [name,source] of [['actual src/main.js',actual],['legacy fixture',legacy],['formatted fixture',formatted]]){
 test(`${name}: replace exactly the camera function and leave surrounding source intact`,()=>{
  const result=mutateInitialCamera(source),start=source.indexOf(result.originalFunction);
  assert.equal(result.mutatedFunction,replacement);
  assert.equal(result.source,source.slice(0,start)+replacement+source.slice(start+result.originalFunction.length));
  assert.notEqual(result.source,source);
  assert.throws(()=>mutateInitialCamera(result.source),/unmutated initial adjustCamera/);
 });
 for(const outcome of ['success','404'])test(`${name}: mutation really cancels initial ${outcome} completion`,async()=>{
  const mutation=mutateInitialCamera(source);
  for(const [fn,mutated] of [[mutation.originalFunction,false],[mutation.mutatedFunction,true]]){
   const intents=createIntentController(),initial=intents.begin();let release,renderState='loading',model=null;
   const gate=new Promise(resolve=>release=resolve);
   const completion=(async()=>{await gate;try{if(outcome==='404')throw Error('404');if(initial.isCurrent()){model={};renderState='ready';}}catch{if(initial.isCurrent())renderState='error';}})();
   const camera=new Function('currentModel','state','intents','restoreCurrentPresentation','beginIntent',`${fn};return beginCameraIntent;`)(null,{ready:false},intents,()=>{},()=>intents.begin());
   camera();
   assert.equal(initial.isCurrent(),!mutated,'mutation must invalidate the real initial ownership token');
   assert.equal(initial.canMoveCamera(),false,'camera input must still supersede the default camera effect');
   release();await completion;
   assert.equal(renderState,mutated?'loading':outcome==='success'?'ready':'error');
   assert.equal(model!==null,!mutated&&outcome==='success');
  }
 });
}

test('actual source retains distinct ready/pending loaded-model behavior before mutation',()=>{
 const {originalFunction,mutatedFunction}=mutateInitialCamera(actual);
 assert.deepEqual(exercise(originalFunction).calls,[]);
 assert.deepEqual(exercise(originalFunction,{currentModel:{},ready:true}).calls,[]);
 assert.deepEqual(exercise(originalFunction,{currentModel:{},ready:false}).calls,['restore']);
 assert.deepEqual(exercise(mutatedFunction).calls,['begin','restore']);
});

test('comments and strings do not count as extra camera functions',()=>{
 const decoys=`// ${legacy}\n/* ${legacy} */\nconst text=${JSON.stringify(legacy)};\n`;
 assert.equal(mutateInitialCamera(decoys+legacy).source,decoys+replacement);
});

for(const [name,source,reason] of [
 ['missing function','function other(){}',/exactly one.*found 0/],
 ['comment-only function',`/* ${legacy} */`,/exactly one.*found 0/],
 ['string-only function',`const text=${JSON.stringify(legacy)};`,/exactly one.*found 0/],
 ['ambiguous functions',`${legacy}\nfunction outer(){${legacy}}`,/exactly one.*found 2/],
 ['already mutated',replacement,/unmutated/],
 ['missing initial adjustment',legacy.replace('intents.adjustCamera();',''),/unmutated/],
 ['comment-only adjustment',legacy.replace('intents.adjustCamera();','/* intents.adjustCamera(); */'),/unmutated/],
 ['string-only adjustment',legacy.replace('intents.adjustCamera();',"'intents.adjustCamera();';"),/unmutated/],
 ['unreachable adjustment',legacy.replace('intents.adjustCamera();','return beginIntent();intents.adjustCamera();'),/unmutated/],
 ['conditional adjustment',legacy.replace('intents.adjustCamera();','if(false)intents.adjustCamera();'),/unmutated/],
 ['wrong model guard',legacy.replace('if(currentModel)','if(!currentModel)'),/unmutated/],
 ['alternate branch',legacy.replace('intents.adjustCamera();','else return beginIntent();intents.adjustCamera();'),/unmutated/],
 ['wrong receiver',legacy.replace('intents.adjustCamera','other.adjustCamera'),/unmutated/],
 ['wrong method',legacy.replace('intents.adjustCamera()','intents.begin()'),/unmutated/],
 ['unexpected arguments',legacy.replace('intents.adjustCamera()','intents.adjustCamera(true)'),/unmutated/],
 ['optional adjustment',legacy.replace('intents.adjustCamera()','intents.adjustCamera?.()'),/unmutated/],
 ['missing loaded return',legacy.replace('return beginIntent();','beginIntent();'),/unmutated/],
 ['unexpected parameter',legacy.replace('beginCameraIntent()','beginCameraIntent(value)'),/unmutated/],
 ['async function',`async ${legacy}`,/unmutated/],
 ['generator function',legacy.replace('function ','function* '),/unmutated/],
 ['named function expression',`const camera=${legacy};`,/unmutated/]
])test(`reject ${name}`,()=>assert.throws(()=>mutateInitialCamera(source),reason));

test('reject malformed JavaScript rather than mutating a partial match',()=>{
 assert.throws(()=>mutateInitialCamera(legacy.slice(0,-1)));
});

const mutationResults=()=>Array.from({length:72},(_,index)=>({
 outcome:index%2?'404':'success',status:'FAIL',mutationApplied:true,pageerrors:[],
 actual:{activeViews:0,inputs:[{type:'pointerdown',trusted:true}],d:{state:{ready:false},modelBounds:null},renderState:'loading'}
}));

test('accept exactly 72 completed initial-discard failures across success and 404 outcomes',()=>{
 assert.equal(initialCameraResultsAccepted('mutation',mutationResults()),true);
});

for(const [name,change] of [
 ['timeout before completion snapshot',row=>{delete row.actual;row.reason='page.waitForFunction: Timeout 30000ms exceeded';}],
 ['missing snapshot',row=>delete row.actual],
 ['null snapshot',row=>row.actual=null],
 ['unrelated pageerror',row=>row.pageerrors.push('ReferenceError: unrelated failure')],
 ['missing pageerror record',row=>delete row.pageerrors],
 ['successful row',row=>row.status='PASS'],
 ['unfinished row',row=>row.status='RUNNING'],
 ['mutation not applied',row=>row.mutationApplied=false],
 ['missing mutation record',row=>delete row.mutationApplied],
 ['unfinished view',row=>row.actual.activeViews=1],
 ['missing view counter',row=>delete row.actual.activeViews],
 ['malformed view counter',row=>row.actual.activeViews='0'],
 ['no input',row=>row.actual.inputs=[]],
 ['missing input record',row=>delete row.actual.inputs],
 ['untrusted input',row=>row.actual.inputs.push({trusted:false})],
 ['nonboolean trusted flag',row=>row.actual.inputs[0].trusted=1],
 ['missing trusted flag',row=>delete row.actual.inputs[0].trusted],
 ['missing input entry',row=>row.actual.inputs=new Array(1)],
 ['missing diagnostics',row=>delete row.actual.d],
 ['missing ready flag',row=>delete row.actual.d.state.ready],
 ['model ready',row=>row.actual.d.state.ready=true],
 ['loaded model bounds',row=>row.actual.d.modelBounds=[0,0,0,1,1,1]],
 ['missing model bounds',row=>delete row.actual.d.modelBounds],
 ['successful render state',row=>row.actual.renderState='ready'],
 ['other error render state',row=>row.actual.renderState='error'],
 ['missing render state',row=>delete row.actual.renderState]
])test(`reject entire mutation run with one ${name}`,()=>{
 const rows=mutationResults();change(rows[35]);
 assert.equal(initialCameraResultsAccepted('mutation',rows),false);
});

test('reject missing, extra, empty and sparse mutation results',()=>{
 const rows=mutationResults();
 for(const invalid of [undefined,null,[],rows.slice(1),rows.concat(rows[0]),new Array(72)])assert.equal(initialCameraResultsAccepted('mutation',invalid),false);
 delete rows[35];assert.equal(initialCameraResultsAccepted('mutation',rows),false);
});

test('fixed acceptance still requires exactly 72 PASS rows',()=>{
 const rows=Array.from({length:72},()=>({status:'PASS'}));
 assert.equal(initialCameraResultsAccepted('fixed',rows),true);
 assert.equal(initialCameraResultsAccepted('fixed',rows.slice(1)),false);
 assert.equal(initialCameraResultsAccepted('fixed',rows.concat(rows[0])),false);
 rows[35].status='FAIL';assert.equal(initialCameraResultsAccepted('fixed',rows),false);
});

test('legacy and defect acceptance retain their existing eight-case contracts',()=>{
 assert.equal(initialCameraResultsAccepted('legacy',Array.from({length:8},()=>({status:'PASS'}))),true);
 assert.equal(initialCameraResultsAccepted('defect',Array.from({length:8},()=>({status:'FAIL'}))),true);
 assert.equal(initialCameraResultsAccepted('legacy',Array.from({length:8},()=>({status:'FAIL'}))),false);
 assert.equal(initialCameraResultsAccepted('defect',Array.from({length:8},()=>({status:'PASS'}))),false);
 assert.equal(initialCameraResultsAccepted('unknown',mutationResults()),false);
});
