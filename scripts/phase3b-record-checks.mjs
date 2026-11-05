import {spawnSync,execFileSync} from 'node:child_process';
import {readdirSync,writeFileSync} from 'node:fs';
const rows=[];
for(const [name,args]of [['unit',['--test',...readdirSync('tests').filter(f=>f.endsWith('.test.mjs')).map(f=>'tests/'+f)]],['build',['node_modules/vite/bin/vite.js','build']]]){
 const r=spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:8e6});
 writeFileSync(`evidence/phase3b/${name}-final.txt`,r.stdout+r.stderr,'utf8');
 rows.push({name,exit:r.status,signal:r.signal,status:r.status===0?'PASS':'FAIL'});
}
writeFileSync('evidence/phase3b/checks.json',JSON.stringify({scope:'Implementation self-verification; unit and build output captured as UTF-8 without shell re-encoding.',head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),utc:new Date().toISOString(),rows},null,2));
console.log(rows);if(rows.some(r=>r.status!=='PASS'))process.exitCode=1;
