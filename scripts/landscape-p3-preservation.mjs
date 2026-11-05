import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base='fbdeac1646d7e51a345b96c9e2830052a22f88df',allowed=new Set(['src/main.js','docs/landscape-1590.md','evidence/landscape/README.md','LOG.md','.github/workflows/validate.yml']);
await mkdir('evidence/landscape/p3-fixed-controls',{recursive:true});
const files=execFileSync('git',['ls-tree','-r','--name-only',base],{encoding:'utf8'}).trim().split('\n').filter(f=>!allowed.has(f)),rows=[],hash=b=>createHash('sha256').update(b).digest('hex');
for(const file of files){const expected=execFileSync('git',['show',`${base}:${file}`],{maxBuffer:100*1024*1024}),actual=await readFile(file),rawUnchanged=actual.equals(expected),eolOnly=!rawUnchanged&&Buffer.from(actual.toString('utf8').replaceAll('\r\n','\n')).equals(expected);rows.push({file,expected:hash(expected),actual:hash(actual),rawUnchanged,eolOnly,unchanged:rawUnchanged||eolOnly});}
const result={base,utc:new Date().toISOString(),scope:'All prior tracked files except five explicit UI/documentation/CI edits. Raw hashes retained. Only CRLF-to-LF differences matching .gitattributes accepted; binary bytes unchanged.',excluded:[...allowed].sort(),status:rows.every(r=>r.unchanged)?'PASS':'FAIL',files:rows.length,rawUnchanged:rows.filter(r=>r.rawUnchanged).length,eolOnly:rows.filter(r=>r.eolOnly).length,rows};
await writeFile('evidence/landscape/p3-fixed-controls/preservation.json',JSON.stringify(result,null,2));console.log(result.status,result.files,result.rawUnchanged,result.eolOnly);if(result.status!=='PASS')process.exitCode=1;
