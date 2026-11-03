import {spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createHash} from 'node:crypto';
import {assessNativeCheck} from './native-check-result.mjs';
const baseline=process.argv.includes('--baseline');await mkdir('.cache',{recursive:true});
const batch=process.env.QGIS_PYTHON_BAT??'C:/Program Files/QGIS 3.44.10/bin/python-qgis-ltr.bat';
const script=path.resolve('scripts/verify-projects.py'),workerFile=path.resolve('.cache/qgis-worker-'+randomUUID()+'.json');
const command=`""${batch}" "${script}""`;
const child=spawnSync(process.env.ComSpec??'cmd.exe',['/d','/s','/c',command],{windowsVerbatimArguments:true,encoding:'utf8',env:{...process.env,PYTHONIOENCODING:'utf-8',QGIS_CHECK_OUTPUT:workerFile},maxBuffer:4*1024*1024});
let details;try{details=JSON.parse(await readFile(baseline?'evidence/qgis-project-check.json':workerFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const result={utc:new Date().toISOString(),workerSha256:createHash('sha256').update(await readFile(script)).digest('hex'),...assessNativeCheck(child,details),stdout:child.stdout??'',stderr:child.stderr??'',scope:'native exit code plus internal checks; no forced-success exit, no retry'};
await writeFile(`evidence/qgis-${baseline?'exit-red':'project-check'}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({status:result.status,exitCode:result.exitCode,exitHex:result.exitHex,workerStatus:details?.workerStatus,reason:result.reason}));if(result.status!=='PASS')process.exitCode=1;
