import{execFileSync}from'node:child_process';import{writeFileSync,mkdirSync}from'node:fs';import assert from'node:assert/strict';
const base='42ed7bbe1b1f839535ed66c76c75d1ade2ce2cc8';
const rows=execFileSync('git',['ls-tree','-r',base,'public','production','evidence'],{encoding:'utf8',maxBuffer:20e6}).trim().split('\n').map(l=>{const[m,path]=l.split('\t');return{path,blob:m.split(' ')[2]}});
for(const r of rows)assert.equal(execFileSync('git',['hash-object',r.path],{encoding:'utf8'}).trim(),r.blob,'unexpected previous-file change '+r.path);
mkdirSync('evidence/stage3a',{recursive:true});writeFileSync('evidence/stage3a/preservation.json',JSON.stringify({base,status:'PASS',checked:rows.length,rows},null,2));console.log('Preserved previous artifacts:',rows.length);
