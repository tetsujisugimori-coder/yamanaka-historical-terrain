import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {assessNativeCheck} from '../scripts/native-check-result.mjs';
test('printed PASS followed by nonzero native termination cannot be accepted',()=>{
 const child=spawnSync(process.execPath,['-e',"console.log('PASS');process.exit(23)"],{encoding:'utf8'});assert.equal(child.stdout.trim(),'PASS');assert.equal(assessNativeCheck(child,{workerStatus:'CHECKS_AND_TEARDOWN_RETURNED'}).status,'FAIL');
});
test('Windows access violation status is retained even if all internal assertions passed',()=>{
 const result=assessNativeCheck({status:-1073741819},{workerStatus:'CHECKS_AND_TEARDOWN_RETURNED'});assert.equal(result.status,'FAIL');assert.equal(result.exitHex,'0xC0000005');assert.equal(result.exitCode,-1073741819);
});
test('native success also requires the worker completion contract',()=>{
 assert.equal(assessNativeCheck({status:0},{status:'PASS'}).status,'FAIL');assert.equal(assessNativeCheck({status:0},{workerStatus:'CHECKS_AND_TEARDOWN_RETURNED'}).status,'PASS');assert.equal(assessNativeCheck({status:null,signal:'SIGSEGV'},{workerStatus:'CHECKS_AND_TEARDOWN_RETURNED'}).status,'FAIL');
});
