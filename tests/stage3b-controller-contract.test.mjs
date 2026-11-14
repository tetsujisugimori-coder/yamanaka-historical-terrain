import test from 'node:test';
import assert from 'node:assert/strict';
import {runControllerContract} from '../scripts/stage3b-controller-contract.mjs';
test('isolated production controller source contracts and semantic faults',{timeout:10000},async()=>{const result=await runControllerContract();assert.equal(result.rows.length,25);assert.ok(result.rows.every(r=>r.result==='PASS'));});
