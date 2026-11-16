import test from 'node:test';
import assert from 'node:assert/strict';
import * as diagnostic from '../scripts/stage3b6c-cache-diagnostic.mjs';
import {createHash} from 'node:crypto';
const first='application/x-diagnostic-first',second='application/x-diagnostic-second';
test('Vary chooses different entities and validators from the actual Accept, not phase',()=>{
 const a=diagnostic.diagnosticEntity('vary-change',1,{accept:first});
 const b=diagnostic.diagnosticEntity('vary-change',2,{accept:second,'if-none-match':a.headers.etag});
 assert.equal(b.status,200);assert.equal(b.marker,'second');assert.notEqual(b.headers.etag,a.headers.etag);assert.notDeepEqual(b.body,a.body);
 const reversed=diagnostic.diagnosticEntity('vary-change',1,{accept:second});
 assert.equal(reversed.marker,'second');assert.deepEqual(reversed.body,b.body);
 const repeated=diagnostic.diagnosticEntity('vary-change',2,{accept:second,'if-none-match':b.headers.etag});
 assert.equal(repeated.status,304);assert.equal(repeated.body.length,0);assert.equal(repeated.representation.id,'second');
 assert.equal(repeated.representation.sha256,b.representation.sha256);
});
test('unsupported Accept is refused instead of silently selecting the first variant',()=>{
 const r=diagnostic.diagnosticEntity('vary-change',2,{accept:'unsupported'});assert.equal(r.status,406);assert.equal(r.marker,null);
});
test('diagnostic failure retains safe stage, phase, code and correlation without raw error text',()=>{
 assert.equal(typeof diagnostic.diagnosticFailure,'function');
 const e=Object.assign(Error('secret=https://example.invalid/?token=hidden'),{name:'TimeoutError'});
 const r=diagnostic.diagnosticFailure(e,{operation:'page.goto',phase:2});
 assert.equal(r.operation,'page.goto');assert.equal(r.phase,2);assert.equal(r.errorCode,'BROWSER_TIMEOUT');assert.equal(JSON.stringify(r).includes('hidden'),false);
 const deadline=diagnostic.diagnosticFailure(Object.assign(Error('deadline'),{code:'DIAGNOSTIC_DEADLINE'}),{operation:'capture.settle',phase:2,pending:[{responseId:'r2',requestId:'q2'}]});
 assert.equal(deadline.errorCode,'DIAGNOSTIC_DEADLINE');assert.deepEqual(deadline.pending,[{responseId:'r2',requestId:'q2'}]);
});
const varyRow=()=>({mode:'vary-change',pages:[{marker:'first'},{marker:'second'}],server:[first,second].map((accept,i)=>{
 const entity=diagnostic.diagnosticEntity('vary-change',i+1,{accept});
 return {phase:i+1,path:'/vary-change/asset.js',status:entity.status,requestHeaders:{accept},responseHeaders:entity.headers,representation:entity.representation,bodyBytes:entity.body.length,bodySha256:createHash('sha256').update(entity.body).digest('hex')};
})});
test('Vary accepts only the observed request/server selection/entity/marker chain',()=>{
 assert.equal(diagnostic.evaluateCacheDiagnostic(varyRow()).status,'OBSERVED');
 for(const mutate of [r=>r.server[1].representation.id='first',r=>r.server[1].responseHeaders.etag='"first"',r=>r.server[1].bodySha256='wrong',r=>r.server[1].representation.sha256=r.server[0].representation.sha256,r=>r.pages[1].marker='first',r=>r.server[1].responseHeaders.vary='Origin']){
  const row=varyRow();mutate(row);assert.equal(diagnostic.evaluateCacheDiagnostic(row).status,'FAIL');
 }
});
test('Vary absent selection and wrong actual request remain UNKNOWN',()=>{
 for(const mutate of [r=>delete r.server[1].representation,r=>r.server[1].requestHeaders.accept=first,r=>r.server[1].status=304]){
  const row=varyRow();mutate(row);assert.equal(diagnostic.evaluateCacheDiagnostic(row).status,'UNKNOWN');
 }
});
test('body failure keeps observer-local identifiers and acquisition versus preservation stage',()=>{
 for(const operation of ['response.body','preserve/validate']){
  const error={observation:{responseId:'response-2',requestId:'request-2',body:{operation,errorCode:'BODY_UNAVAILABLE_REDIRECT_MESSAGE'}}};
  const result=diagnostic.diagnosticFailure(error,{operation:'response.capture',phase:2});
  assert.equal(result.responseId,'response-2');assert.equal(result.requestId,'request-2');assert.equal(result.captureOperation,operation);assert.equal(result.errorCode,'BODY_UNAVAILABLE_REDIRECT_MESSAGE');
 }
});
