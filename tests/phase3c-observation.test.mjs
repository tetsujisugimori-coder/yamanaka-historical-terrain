import test from 'node:test';
import assert from 'node:assert/strict';
import {Mesh,PlaneGeometry,MeshBasicMaterial,DoubleSide} from 'three';
import {supportedPose,validateInnerMetadata} from '../src/phase3c.js';
function ground(y){const mesh=new Mesh(new PlaneGeometry(20,20),new MeshBasicMaterial({side:DoubleSide}));mesh.rotation.x=-Math.PI/2;mesh.position.y=y;return mesh;}
const station={id:'ic-station',elementId:'ic-lookout',category:'C',eye:[0,0],look:[5,0]};
test('fixed observation sits on actual triangle plus human eye; no max A/C fabricated support',()=>{const p=supportedPose(station,[ground(550)]);assert.equal(p.eye[1],551.7);assert.throws(()=>supportedPose(station,[ground(540)],1,p.eye[1]),/足場/);});
test('missing support rejects instead of extrapolating',()=>{assert.throws(()=>supportedPose({...station,eye:[100,100]},[ground(550)]),/triangle/);assert.throws(()=>supportedPose(station,[]),/geometry/);});
test('2x scales floor but not human eye offset',()=>{const mesh=ground(550);mesh.position.y=1100;assert.equal(supportedPose(station,[mesh],2).eye[1],1101.7);});
test('negative controls reject wrong category, ID and nonfinite coordinate',()=>{const good={bounds:[-10,-10,10,10],elements:[{id:'ic-lookout',category:'C'}],stations:[station]};assert.equal(validateInnerMetadata(good),good);for(const f of [{id:'wrong',category:'C'},{id:'ic-lookout',category:'B'}])assert.throws(()=>validateInnerMetadata({...good,elements:[f]}));assert.throws(()=>validateInnerMetadata({...good,stations:[{...station,eye:[NaN,0]}]}));});

test('landscape synchronization orders western state before inner support validation',async()=>{
 const {readFile}=await import('node:fs/promises');const source=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
 const sync=source.slice(source.indexOf(' function syncLandscape(){'),source.indexOf(' function leaveStation(){'));
 assert.match(sync,/syncWestern\(active\);syncInner\(active\);/);
 assert.doesNotMatch(source,/sectionExhibit\?\.sync\(\);syncInner\(state\.landscape/,'setView must not repeat geometry scans to compensate for stale support');
 assert.match(source,/o\.geometry\.setIndex\(innerGroup\.visible\?pair\.cut:pair\.base\)/,'cutout swaps private index references');
});

test('inner C patch requires western support; fault reintroduction loses the safety guard',async()=>{
 const {readFile}=await import('node:fs/promises');const source=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
 const assignment=source.slice(source.indexOf('  innerGroup.visible='),source.indexOf('  innerGroup.scale.y='));
 const required=/!westernUnavailable&&westernGroup\.children\.length>0/;
 assert.match(assignment,required,'missing western GLB must not leave buried overlapping inner surfaces');
 assert.doesNotMatch(assignment.replace('&&!westernUnavailable&&westernGroup.children.length>0',''),required,'negative control must reject previous independent visibility');
 assert.match(source,/接続先の西方地形が読み込めないため非表示/);
});

test('metadata target scales relative model ground while physical eye and target offsets stay fixed',()=>{
 const p={...station,groundHeight:550,lookTargetHeight:545.2,lookHeightOffset:.2,lookDown:99};
 const one=supportedPose(p,[ground(550)]),two=supportedPose(p,[ground(1100)],2);
 assert.equal(one.eye[1],551.7);assert.ok(Math.abs(one.target[1]-545.2)<1e-9);
 assert.equal(two.eye[1],1101.7);assert.ok(Math.abs(two.target[1]-1090.2)<1e-9);
 // A different actually displayed support shifts the relative aim, never the eye off its triangle.
 assert.ok(Math.abs(supportedPose(p,[ground(560)]).target[1]-555.2)<1e-9);
 assert.equal(supportedPose({...station,lookDown:4},[ground(1100)],2).target[1],1097.7);
 assert.throws(()=>supportedPose({...p,groundHeight:undefined},[ground(550)]),/標高データ/);
});
