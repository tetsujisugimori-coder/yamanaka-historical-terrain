import{execFileSync}from'node:child_process';import{writeFileSync,mkdirSync}from'node:fs';import assert from'node:assert/strict';
const base='5adb7156acda3968827ff39d5e6f40c4ac837ec5';
const rows=execFileSync('git',['ls-tree','-r',base,'public','production','evidence'],{encoding:'utf8',maxBuffer:20e6}).trim().split('\n').map(l=>{const[m,path]=l.split('\t');return{path,blob:m.split(' ')[2]}});
for(const r of rows)assert.equal(execFileSync('git',['hash-object',r.path],{encoding:'utf8'}).trim(),r.blob,'unexpected previous-file change '+r.path);
mkdirSync('evidence/stage3a',{recursive:true});writeFileSync('evidence/stage3a/preservation.json',JSON.stringify({base,status:'PASS',checked:rows.length,rows},null,2));console.log('Preserved previous artifacts:',rows.length);
