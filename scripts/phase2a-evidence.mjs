import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base='d19d90332532ac6bae1eec3c6eee1a8b0548e09e';
const files=execFileSync('git',['ls-tree','-r','--name-only',base,'production/gis','production/yamanaka.qgz','production/yamanaka.blend','public/data/castle.glb','public/data/castle.json','public/data/regional.glb','public/data/regional.json','public/data/moat-study.glb','public/data/study.json','public/data/features.json'],{encoding:'utf8'}).trim().split('\n');
const preservation=[];
for(const file of files){const before=execFileSync('git',['rev-parse',`${base}:${file}`],{encoding:'utf8'}).trim(),after=execFileSync('git',['hash-object',file],{encoding:'utf8'}).trim();preservation.push({file,baseBlob:before,currentBlob:after,unchanged:before===after,sha256:createHash('sha256').update(await readFile(file)).digest('hex')});}
const artifacts={};for(const file of ['production/yamanaka-phase2a.qgz','production/yamanaka-phase2a.blend','production/phase2a/facilities.gpkg','production/phase2a/inferred-surface-50cm.tif','production/phase2a/profiles.json','public/data/nishinomaru.glb','public/data/nishinomaru.json']){const b=await readFile(file);artifacts[file]={bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')};}
const sources=[{url:'https://www.city.mishima.shizuoka.jp/uploaded/attachment/4805.pdf',file:process.env.PLAN_PDF??'../.cache/plan.pdf',redistributed:false,readScope:'printed pp51,53-58,63-67; PDF pp59,61-66,71-75; visual review PDF pp73-74',traced:false}];
for(const source of sources){source.sha256=createHash('sha256').update(await readFile(source.file)).digest('hex');delete source.file;}
const result={utc:new Date().toISOString(),base,status:preservation.every(r=>r.unchanged)?'PASS':'FAIL',scope:'implementation preservation audit, independent historical verification NOT_VERIFIED',preservation,artifacts,sources};
await writeFile('evidence/phase2a/preservation.json',JSON.stringify(result,null,2));console.log(JSON.stringify({status:result.status,protectedFiles:files.length}));if(result.status!=='PASS')process.exitCode=1;
