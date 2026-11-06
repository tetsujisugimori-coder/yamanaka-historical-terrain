import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(process.env.CAMERA_SOURCE??new URL('../src/main.js',import.meta.url),'utf8');
const camera=source.split('\n').find(l=>l.startsWith(' function beginCameraIntent()'));
function exercise(currentModel,ready){const calls=[];const intents={begin(){calls.push('begin');return 'token';},adjustCamera(){calls.push('adjust');}};const restore=()=>calls.push('restore');const begin=()=>{const token=intents.begin();restore();return token;};const fn=new Function('currentModel','state','intents','restoreCurrentPresentation','beginIntent',camera+';return beginCameraIntent;')(currentModel,{ready},intents,restore,begin);return{result:fn(),calls};}
test('ready camera input invalidates stale views without presentation resync or render',()=>{assert.deepEqual(exercise({},true),{result:'token',calls:['begin']});});
test('camera input during pending view restores current model, while initial load preserves completion',()=>{assert.deepEqual(exercise({},false),{result:'token',calls:['begin','restore']});assert.deepEqual(exercise(null,false),{result:undefined,calls:['adjust']});});
test('orbital arrow controls rely on one OrbitControls change render, not a duplicate explicit draw',()=>{const line=source.split('\n').find(l=>l.startsWith(" viewport.addEventListener('keydown'"));assert.ok(line.includes('controls.update();'));assert.ok(!line.includes('controls.update();render();'));});
