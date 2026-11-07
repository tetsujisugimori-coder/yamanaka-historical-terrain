import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFENCE_PAIRS,validateConnectedMetadata} from '../src/phase3d.js';
const valid=()=>({elements:[{id:'dc-test',category:'C',local:[1,2],height:3}]});
test('Phase3D fixed comparison pairs remain distinct',()=>{assert.equal(DEFENCE_PAIRS.length,2);for(const p of DEFENCE_PAIRS){assert.notEqual(p.attacker,p.defender);assert.equal(p.target.length,2);}});
test('Phase3D allows explicit C candidate',()=>assert.equal(validateConnectedMetadata(valid()).elements[0].id,'dc-test'));
test('Phase3D rejects missing, invalid coordinates, false evidence B and duplicate IDs',()=>{for(const mutate of [m=>m.elements=[],m=>m.elements[0].category='B',m=>m.elements[0].local[0]=NaN,m=>m.elements[0].height=Infinity,m=>m.elements.push({...m.elements[0]})]){const m=valid();mutate(m);assert.throws(()=>validateConnectedMetadata(m));}});
