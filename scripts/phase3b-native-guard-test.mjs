// Completion-contract negative control. No Blender/QGIS binary is invoked.
// cmd receives unsupported positional arguments, exits 0, and writes no worker.
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import path from 'node:path';
const source=await readFile('scripts/phase3b-native.mjs','utf8');
const stamp=new Date().toISOString().replaceAll(':','-');
const results=[];
for(const mutation of [false,true]){
 const dir=path.resolve(`.cache/native-completion-${stamp}-${mutation?'stale-mutant':'fixed'}`);
 await mkdir(path.join(dir,'evidence/phase3b/native'),{recursive:true});
 await writeFile(path.join(dir,'evidence/phase3b/native/blender-build.json'),JSON.stringify({status:'PASS',fixture:'old worker, never produced by current child'}));
 const removal="try{await rename(workerPath,`evidence/phase3b/native/prior-${kind}-${stamp}.json`);}catch(error){if(error.code!=='ENOENT')throw error;}";
 assert(source.includes(removal));
 await writeFile(path.join(dir,'runner.mjs'),mutation?source.replace(removal,'// Mutant leaves stale PASS worker in place'):source);
 const result=spawnSync(process.execPath,['runner.mjs','blender'],{cwd:dir,encoding:'utf8',env:{...process.env,BLENDER_EXE:process.env.ComSpec}});
 const report=JSON.parse(await readFile(path.join(dir,'evidence/phase3b/native/process-blender.json'),'utf8'));
 const files=await readdir(path.join(dir,'evidence/phase3b/native'));
 results.push({mutation,runnerExitCode:result.status,childExitCode:report.exitCode,status:report.status,workerPresent:report.worker!==undefined,priorWorkerRetained:files.some(f=>f.startsWith('prior-'))});
}
assert.equal(results[0].childExitCode,0);assert.equal(results[0].status,'FAIL');assert.equal(results[0].workerPresent,false);assert.equal(results[0].priorWorkerRetained,true);
assert.equal(results[1].childExitCode,0);assert.equal(results[1].status,'PASS');assert.equal(results[1].workerPresent,true);
await writeFile('evidence/phase3b/native/completion-contract.json',JSON.stringify({status:'PASS',scope:'self-test: zero-exit child without fresh worker; stale-worker mutant demonstrates detection',results},null,2));
console.log(JSON.stringify(results));
