import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {sha256} from './evidence-hash.mjs';
const base='77b015565b79493a05f45c6d959d459546e21526';
const paths=execFileSync('git',['ls-tree','-r','--name-only',base,'production','public/data','ATTRIBUTION.md'],{encoding:'utf8'}).trim().split('\n');
const files=[];
for(const file of paths){const bytes=await readFile(file),original=execFileSync('git',['show',`${base}:${file}`],{maxBuffer:128*1024*1024});files.push({file,bytes:bytes.length,sha256:sha256(bytes),baselineSha256:sha256(original),unchanged:bytes.equals(original)});}
const result={base,utc:new Date().toISOString(),status:files.every(f=>f.unchanged)?'PASS':'FAIL',nativeRegeneration:'NOT_RERUN; QGIS/Blender projects, DEM, source metadata and GLBs preserved byte for byte. New direct observation-point validation is against GLB triangles, not a new native project re-read.',files};
await writeFile('evidence/review-fixes/protection.json',JSON.stringify(result,null,2));console.log(JSON.stringify({status:result.status,files:files.length}));if(result.status!=='PASS')process.exitCode=1;
