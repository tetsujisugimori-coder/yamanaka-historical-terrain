import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const d=JSON.parse(fs.readFileSync('research/stage3b5/preservation-baseline.json'));
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(d.protectedCount,212);assert.equal(d.models.length,22);
const protectedRows=JSON.parse(fs.readFileSync('research/stage3b/preserved-inputs.json')).files;
assert.equal(protectedRows.length,212);
for(const row of protectedRows)assert.equal(sha(fs.readFileSync(row.path)),row.sha256,row.path);
const overview=JSON.parse(fs.readFileSync('public/data/castle-overview.json'));
assert.deepEqual(overview.models,d.models,'22 model registrations');
const scopes=['public','data','production','research/stage3b','research/stage3b2','research/stage3b3','research/stage3b4'];
const current=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','--',...scopes,...protectedRows.map(r=>r.path)],{encoding:'utf8'}).trim().split('\n').filter(Boolean).filter(p=>!d.newAllowed.includes(p)).sort();
assert.deepEqual(current,d.files.map(r=>r.path).sort(),'protected scope path membership');
for(const row of d.files){const b=fs.readFileSync(row.path);assert.equal(b.length,row.bytes,row.path+' bytes');assert.equal(sha(b),row.sha256,row.path+' hash');const blob=execFileSync('git',['show',`${d.baseHead}:${row.path}`],{maxBuffer:128*1024*1024});assert.equal(sha(blob),row.sha256,row.path+' baseline Git bytes');}
console.log(JSON.stringify({status:'PASS',baseHead:d.baseHead,baseTree:d.baseTree,protectedCount:212,models:22,files:d.files.length,membership:'exact; dedicated new data excluded',bytes:'all SHA256/size matched baseline and Git blob'},null,2));
