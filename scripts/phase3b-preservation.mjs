import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base='6a84b95',allowed=new Set(['index.html','src/main.js','src/landscape.js','src/style.css','public/data/sources.json','README.md','LOG.md','src/reading.js','scripts/fallback-test.mjs','scripts/sections-evidence.mjs']);
const files=execFileSync('git',['ls-tree','-r','--name-only',base],{encoding:'utf8'}).trim().split('\n'),rows=[];
for(const file of files.filter(f=>!allowed.has(f))){const a=await readFile('.cache/baseline/'+file),b=await readFile(file),hash=x=>createHash('sha256').update(x).digest('hex');rows.push({file,baseline:hash(a),current:hash(b),equal:a.equals(b)});}
const oldSources=JSON.parse(await readFile('.cache/baseline/public/data/sources.json','utf8')),sources=JSON.parse(await readFile('public/data/sources.json','utf8'));
const sourcesPreserved=JSON.stringify(sources.slice(0,oldSources.length))===JSON.stringify(oldSources);
const result={status:rows.every(r=>r.equal)&&sourcesPreserved?'PASS':'FAIL',base:execFileSync('git',['rev-parse',base],{encoding:'utf8'}).trim(),scope:'Raw bytes against fresh baseline checkout; all prior tracked files except explicit UI/source/documentation edits. Original source records retained verbatim as data. Binary originals and previous evidence remain unchanged.',excluded:[...allowed],count:rows.length,sourcesPreserved,rows};
await mkdir('evidence/phase3b',{recursive:true});await writeFile('evidence/phase3b/preservation.json',JSON.stringify(result,null,2));console.log(result.status,rows.length,'prior files, source records preserved:',sourcesPreserved);if(result.status!=='PASS')process.exitCode=1;
