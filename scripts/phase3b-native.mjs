import {spawnSync} from 'node:child_process';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const kind=process.argv[2];
if(!['blender','blender-check','gis'].includes(kind))throw Error('Specify blender, blender-check or gis');
await mkdir('evidence/phase3b/native',{recursive:true});
const stamp=new Date().toISOString().replaceAll(':','-');
const workerPath=`evidence/phase3b/native/${kind==='blender-check'?'blender-check':kind==='gis'?'gis-build':'blender-build'}.json`;
// An earlier worker PASS must never satisfy a new invocation. Retain it as an
// attempt record and require the child to create a fresh completion contract.
try{await rename(workerPath,`evidence/phase3b/native/prior-${kind}-${stamp}.json`);}catch(error){if(error.code!=='ENOENT')throw error;}
const sanitize=text=>{
 if(text===undefined)return text;
 for(const [prefix,label] of [[process.cwd(),'[workspace]'],[process.env.BLENDER_EXE?path.dirname(process.env.BLENDER_EXE):null,'[existing Blender]']]){
  if(prefix)for(const variant of [prefix,prefix.replaceAll('\\','/'),prefix.replaceAll('\\','\\\\')])text=text.replaceAll(variant,label);
 }
 return text;
};
const script=kind==='gis'?'scripts/phase3b-build-gis.py':kind==='blender'?'scripts/phase3b-build-blender.py':'scripts/phase3b-verify-blender.py';
const env={...process.env,PYTHONIOENCODING:'utf-8'};
const options={encoding:'utf8',maxBuffer:10e6,env};
const result=kind==='gis'?spawnSync(process.env.ComSpec??'cmd.exe',['/d','/s','/c',`""${process.env.QGIS_PYTHON_BAT??'C:/Program Files/QGIS 3.44.10/bin/python-qgis-ltr.bat'}" "${path.resolve(script)}""`],{...options,windowsVerbatimArguments:true}):spawnSync(process.env.BLENDER_EXE,['--background',`production/yamanaka-${kind==='blender'?'1590':'phase3b'}.blend`,'--python-exit-code','1','--python',script],options);
let worker;try{worker=JSON.parse(sanitize(await readFile(workerPath,'utf8')));}catch{}
const hashes={};
for(const f of [script,'scripts/phase3b-recipe.py','production/phase3b/recipe.json',kind==='gis'?'production/yamanaka-phase3b.qgz':'production/yamanaka-phase3b.blend',...(kind==='gis'?[]:['public/data/phase3b.glb'])]){
 try{hashes[f]=createHash('sha256').update(await readFile(f)).digest('hex');}catch{}
}
const status=result.status===0&&worker?.status==='PASS'?'PASS':'FAIL';
await writeFile(`evidence/phase3b/native/process-${kind}.json`,JSON.stringify({status,exitCode:result.status,signal:result.signal,error:sanitize(result.error?.message),worker,hashes,utc:new Date().toISOString(),stdout:sanitize(result.stdout),stderr:sanitize(result.stderr)},null,2));
console.log(kind,status,result.status);if(status!=='PASS')process.exitCode=1;
