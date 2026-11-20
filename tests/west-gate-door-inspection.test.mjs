import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WEST_GATE_LEFT_LEAF,leftDoorWorldTarget} from '../src/west-gate-door-inspection.js';

test('west-facing visitor looks east: authored northern door is the left leaf',()=>{
 const leaf=WEST_GATE_LEFT_LEAF;
 assert.equal(leaf.elementId,'wb-gate');
 assert.equal(leaf.stationId,'ic-station-westgate');
 assert.equal(leaf.category,'C');
 assert(leaf.north>leaf.gateSupportNorth);
 const [x,y,z]=leftDoorWorldTarget(548.38);
 assert(x>leaf.boardStartEast&&x<leaf.gateSupportEast+1);
 assert(Math.abs(y-(548.38+.05+2.85/2))<1e-10);
 assert.equal(z,33.85);
});

test('eye support stays unchanged: exaggeration scales the authored C gate, not the observer',()=>{
 const ground=548.38,one=leftDoorWorldTarget(ground,1),two=leftDoorWorldTarget(ground,2);
 assert.equal(one[0],two[0]);assert.equal(one[2],two[2]);
 assert(Math.abs(two[1]-2*one[1])<1e-8);
 assert.throws(()=>leftDoorWorldTarget(NaN),/支持高/);
 assert.throws(()=>leftDoorWorldTarget(ground,0),/支持高/);
 assert.throws(()=>leftDoorWorldTarget(ground,Infinity),/支持高/);
});

test('C left-leaf target remains tied to the editable Blender model recipe',()=>{
 const blender=readFileSync(new URL('../scripts/phase3b-build-blender.py',import.meta.url),'utf8');
 assert.match(blender,/for j,\(n,angle\) in enumerate\(\[\(-36\.15,-\.20\),\(-33\.85,\.20\)\]\)/);
 assert.match(blender,/f'gate\.door\.\{j\}\.\{k\}'/);
 assert.match(blender,/for k in range\(6\)/);
 assert.match(blender,/\(k\*\.29\)\*math\.sin\(angle\)/);
 assert.match(blender,/\.05,\(\.13,\.27,2\.85\)/);
 const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(source,/state\.station!=='ic-station-westgate'/);
 assert.match(source,/supportedPose\(station,stationSurfaces\(\),state\.exaggeration,camera\.position\.y\)/);
 assert.match(source,/gateInspector\.cancel\(\);state\.station=p\.id/);
});
