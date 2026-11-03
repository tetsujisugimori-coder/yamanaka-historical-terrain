import {execFileSync,spawnSync} from 'node:child_process';
import {readdir,writeFile,readFile} from 'node:fs/promises';
const tests=(await readdir('tests')).filter(f=>f.endsWith('.test.mjs')).map(f=>'tests/'+f);
for(const [file,args]of [['unit-tests.txt',['--test','--test-reporter=tap',...tests]],['build.txt',['node_modules/vite/bin/vite.js','build']]]){
 const r=spawnSync(process.execPath,args,{encoding:'utf8'});await writeFile('evidence/'+file,r.stdout+r.stderr);if(r.status!==0)throw Error(`${file} exited ${r.status}`);console.log(`${file}: PASS`);
}
// Match repository LF bytes so audit hashes also survive a fresh checkout.
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
for(const path of files)if(/\.(md|json|txt|xml|mjs|js|py|ps1|html|css|ya?ml)$/.test(path)){const text=await readFile(path,'utf8');if(text.includes('\r\n'))await writeFile(path,text.replace(/\r\n/g,'\n'));}
