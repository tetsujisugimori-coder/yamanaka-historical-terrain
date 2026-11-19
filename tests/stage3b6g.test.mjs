import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {mkdirSync,mkdtempSync,writeFileSync,renameSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {createResponseObserver} from '../scripts/stage3b6-response-observer.mjs';
import {attachTerminalNotifications} from '../scripts/stage3b6g-notifications.mjs';

test('B6g finite process controls including detached descendants and first failure', {timeout:20000,skip:process.platform!=='linux'},()=>{
 mkdirSync('.work/stage3b6g',{recursive:true});const base=mkdtempSync('.work/stage3b6g/test-');
 const started=Date.now();
 const result=spawnSync('python3',['tests/stage3b6g-supervisor.py',path.resolve(base,'results')],{encoding:'utf8',timeout:18000});
 for(const [name,body] of [['outer-node-stdout.log',result.stdout??''],['outer-node-stderr.log',result.stderr??''],['outer-node-result.json',JSON.stringify({startedAt:started,endedAt:Date.now(),exitCode:result.status,signal:result.signal,errorCode:result.error?.code??null,status:result.status===0?'COMPLETED':'FAIL',descendantAudit:result.error?'UNKNOWN':'SEE_PYTHON_OUTER_RECORDS'})]]){const file=path.join(base,name);writeFileSync(file+'.pending',body);renameSync(file+'.pending',file);}
 assert.equal(result.status,0,result.stdout+result.stderr);
});
test('B6g terminal notifications use same Request identity and sanitize failure',()=>{
 const page=new EventEmitter(),events=[],observer=createResponseObserver({contextId:'test',pageId:'page',onRecord:()=>{}});
 const target='http://127.0.0.1/asset.js',request={url:()=>target,failure:()=>({errorText:'net::ERR_ABORTED secret-token'})};
 const tracker=attachTerminalNotifications(page,observer,{target,phase:()=>2,events});
 page.emit('request',request);page.emit('response',{request:()=>request,status:()=>404});
 tracker.bind(request,{requestId:observer.requestId(request),responseId:'response-2',status:404});
 page.emit('requestfailed',request);page.emit('close');
 assert.deepEqual(tracker.summary(observer.requestId(request)),{requestfinished:'NOT_RECORDED',requestfailed:'RECORDED',recordFailure:false});
 assert.equal(events.find(e=>e.event==='requestfailed').responseId,'response-2');
 assert.equal(events.find(e=>e.event==='requestfailed').failure.category,'ABORT_OR_CANCEL');
 assert(!JSON.stringify(events).includes('secret-token'));
 assert.equal(events.at(-1).event,'Page.Close');
});
test('B6g distinct request objects with equal URLs are not coalesced; absent notification not success',()=>{
 const page=new EventEmitter(),events=[],observer=createResponseObserver({contextId:'t',pageId:'p',onRecord:()=>{}});
 const a={url:()=> 'http://127.0.0.1/a'},b={url:a.url};const tracker=attachTerminalNotifications(page,observer,{target:a.url(),phase:()=>1,events});
 page.emit('request',a);page.emit('request',b);page.emit('requestfinished',a);
 assert.notEqual(observer.requestId(a),observer.requestId(b));
 assert.equal(tracker.summary(observer.requestId(b)).requestfinished,'NOT_RECORDED');
});
test('B6g recorded notification failure blocks, absence alone stays NOT_RECORDED',async()=>{
 const {validateTerminalEvidence}=await import('../scripts/stage3b6g-notifications.mjs');
 const row={responses:[{requestId:'q',responseId:'s',diagnosticPhase:1}],terminalEvents:['request','response'].map(event=>({event,scope:'TARGET',requestId:'q',responseId:'s',phase:1}))};
 assert.equal(validateTerminalEvidence(row).status,'OBSERVED');
 row.terminalEvents.push({event:'requestfailed',failure:{status:'RECORD_FAILED'}});
 assert.equal(validateTerminalEvidence(row).status,'FAIL');
});
