import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {get} from 'node:http';
import {spawnSync} from 'node:child_process';
import {mkdirSync,mkdtempSync} from 'node:fs';
import path from 'node:path';
import {diagnosticEntity} from '../scripts/stage3b6c-cache-diagnostic.mjs';

test('B6l total observes normal, timeout, cleanup-fail, missing-ledger and strict equality', {timeout:10000,skip:process.platform!=='linux'},()=>{
 mkdirSync('.work/stage3b6l',{recursive:true});
 const base=mkdtempSync('.work/stage3b6l/record-');
 const result=spawnSync('python3',['scripts/stage3b6l-total-observation.py','--self-test',path.resolve(base,'cases')],{encoding:'utf8',timeout:7000});
 assert.equal(result.status,0,result.stdout+result.stderr);
 assert.equal(JSON.parse(result.stdout).cases,5);
});

test('B6l synthetic 404 with bytes and 304 without body are different controls',()=>{
 const missing=diagnosticEntity('missing',2);
 const first=diagnosticEntity('revalidate',1);
 const revalidated=diagnosticEntity('revalidate',2,{'if-none-match':first.headers.etag});
 assert.equal(missing.status,404);
 assert(missing.body.length>0);
 assert.equal(revalidated.status,304);
 assert.equal(revalidated.body.length,0);
 assert.notEqual(missing.status,revalidated.status);
});

test('B6l truncated HTTP response is not proof of received 96-byte entity', {timeout:6000},async()=>{
 const server=createServer((_req,res)=>{
  res.writeHead(404,{'content-type':'text/plain','content-length':'96'});
  res.write(Buffer.alloc(12));
  res.socket?.destroy();
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let bytes=0,completed=false,interrupted=false;
 try{
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{interrupted=true;resolve();},2000);
   const done=()=>{clearTimeout(timer);resolve();};
   const req=get('http://127.0.0.1:'+server.address().port+'/',res=>{
    res.on('data',chunk=>{bytes+=chunk.length;});
    res.on('end',()=>{completed=true;done();});
    res.on('aborted',()=>{interrupted=true;done();});
    res.on('error',()=>{interrupted=true;done();});
   });
   req.on('error',()=>{interrupted=true;done();});
  });
  assert(interrupted||!completed);
  assert(bytes<96);
 }finally{
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
 }
});
