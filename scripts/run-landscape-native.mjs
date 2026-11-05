import {spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const kind=process.argv[2];if(!['gis','blender','blender-check'].includes(kind))throw Error('kind required');
await mkdir('evidence/landscape',{recursive:true});
const name=kind==='gis'?'gis-build':kind==='blender'?'blender-build':'blender-check',report=`evidence/landscape/${name}.json`;
await rm(report,{force:true});const script=`scripts/${kind==='blender-check'?'verify':'build'}-landscape-${kind==='gis'?'gis':'blender'}.py`;
const options={encoding:'utf8',maxBuffer:8e6,env:{...process.env,PYTHONIOENCODING:'utf-8'}};
const result=kind==='gis'?spawnSync(process.env.ComSpec??'cmd.exe',['/d','/s','/c',`""${process.env.QGIS_PYTHON_BAT??'C:/Program Files/QGIS 3.44.10/bin/python-qgis-ltr.bat'}" "${path.resolve(script)}""`],{...options,windowsVerbatimArguments:true}):spawnSync(process.env.BLENDER_EXE,['--background',`production/yamanaka-${kind==='blender'?'phase2a':'1590'}.blend`,'--python-exit-code','1','--python',script],options);
let worker;try{worker=JSON.parse(await readFile(report,'utf8'));}catch{}
const hashes={};for(const f of [script,'production/landscape/recipe.json','production/yamanaka-phase2a.blend','production/yamanaka-phase2a.qgz',...(kind==='gis'?['production/yamanaka-1590.qgz']:['production/yamanaka-1590.blend','public/data/landscape.glb'])])hashes[f]=createHash('sha256').update(await readFile(f)).digest('hex');
const status=result.status===0&&worker?.status==='PASS'?'PASS':'FAIL';
await writeFile(`evidence/landscape/native-${kind}.json`,JSON.stringify({status,exitCode:result.status,signal:result.signal,error:result.error?.message,worker,hashes,utc:new Date().toISOString(),stdout:(result.stdout??'').replaceAll(process.cwd(),'[workspace]').replace(/C:[^\r\n]*?blender-4\.5\.9-windows-x64/g,'[Blender]'),stderr:result.stderr},null,2));
console.log(kind,status,result.status);if(status!=='PASS')process.exitCode=1;
