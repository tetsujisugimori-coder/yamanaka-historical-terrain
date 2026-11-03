import {spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import path from 'node:path';
import {assessNativeCheck} from './native-check-result.mjs';
import {canonicalSha256,sha256,normalization} from './evidence-hash.mjs';
const kind=process.argv[2];
if(!['gis','gis-check','blender','blender-check'].includes(kind))throw Error('Specify gis, gis-check, blender or blender-check');
await mkdir('.cache',{recursive:true});await mkdir('evidence/phase2a',{recursive:true});
const script=path.resolve(`scripts/${{'gis':'build-phase2a-gis.py','gis-check':'verify-phase2a-gis.py','blender':'build-phase2a-blender.py','blender-check':'verify-phase2a-blender.py'}[kind]}`);
const worker=path.resolve(`.cache/phase2a-${randomUUID()}.json`);let child;
const opts={encoding:'utf8',env:{...process.env,PYTHONIOENCODING:'utf-8',PHASE2A_WORKER_OUTPUT:worker},maxBuffer:8*1024*1024};
if(kind.startsWith('gis')){
 const batch=process.env.QGIS_PYTHON_BAT??'C:/Program Files/QGIS 3.44.10/bin/python-qgis-ltr.bat';
 child=spawnSync(process.env.ComSpec??'cmd.exe',['/d','/s','/c',`""${batch}" "${script}""`],{...opts,windowsVerbatimArguments:true});
}else{
 if(!process.env.BLENDER_EXE)throw Error('Set BLENDER_EXE to Blender executable');
 const args=['--background',kind==='blender'?'production/yamanaka.blend':'production/yamanaka-phase2a.blend','--python-exit-code','1','--python',script];
 child=spawnSync(process.env.BLENDER_EXE,args,opts);
}
let details;try{details=JSON.parse(await readFile(worker,'utf8'));}catch{}
const sanitize=s=>s.replaceAll(process.cwd(),'[workspace]').replace(/[A-Z]:[\\/]Users[\\/][^\s"'<>\r\n]+/g,'[local path]');
const hashes={};for(const file of ['scripts/phase2a-shape.py','production/yamanaka.qgz','production/yamanaka.blend','production/gis/castle-dem-1m.tif','public/data/castle.json',...(kind.startsWith('gis')?['production/yamanaka-phase2a.qgz','production/phase2a/facilities.gpkg','production/phase2a/inferred-surface-50cm.tif']:['production/yamanaka-phase2a.blend','public/data/nishinomaru.glb'])]){try{hashes[file]=createHash('sha256').update(await readFile(file)).digest('hex');}catch{}}
const hashesAtExecution={...hashes};for(const file of Object.keys(hashes))hashes[file]=canonicalSha256(file,await readFile(file));
const result={utc:new Date().toISOString(),scriptSha256:canonicalSha256(script,await readFile(script)),scriptSha256AtExecution:sha256(await readFile(script)),hashes,hashesAtExecution,hashNormalization:normalization,...assessNativeCheck(child,details),stdout:sanitize(child.stdout??''),stderr:sanitize(child.stderr??'')};
await writeFile(`evidence/phase2a/${kind}.json`,JSON.stringify(result,null,2));
console.log(JSON.stringify({kind,status:result.status,exitCode:result.exitCode,reason:result.reason}));if(result.status!=='PASS')process.exitCode=1;
