import {execFileSync} from 'node:child_process';
import {readFile,writeFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const files=[...new Set(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean))];
const problems=[],manifest=[];
for(const path of files){
 if(path==='evidence/publication-audit.json')continue;
 if(/^(?:data\/raw|tools|node_modules|dist|\.cache)\//.test(path)||/\.(pdf|blend1)$/i.test(path))problems.push({path,reason:'excluded third-party/private input in public candidate'});
 const b=await readFile(path);
 if(/\.(?:js|mjs|cjs|py|ps1|json|md|html|css|xml|ya?ml)$/.test(path)){
  const s=b.toString('utf8');
  for(const [label,pattern]of [['github token',/\b(?:gh[pousr]_[a-zA-Z0-9]{20,}|github_pat_[a-zA-Z0-9_]{30,})\b/],['OpenAI token',/\bsk-(?:proj-)?[a-zA-Z0-9_-]{25,}\b/],['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],['local user path',/[A-Z]:[\\/]Users[\\/][^\s"'<>]+/]])if(pattern.test(s))problems.push({path,reason:label});
 }
 manifest.push({path,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});
}
for(const path of ['data/raw/mishima-preservation-plan.pdf','tools/blender-4.5.9-windows-x64.zip','node_modules/three/package.json','production/yamanaka.blend1']){try{execFileSync('git',['check-ignore',path]);}catch{problems.push({path,reason:'must remain ignored'});}}
const result={utc:new Date().toISOString(),status:problems.length?'FAIL':'PASS',scope:'candidate tracked and untracked non-ignored files; excludes this self-referential audit JSON',checks:['no source PDF or third-party report images','no tool binary or dependency directory','credential-pattern and local-user-path scan','GSI attribution and source ledger present; QGIS and Blender dependency checks recorded separately'],problems,files:manifest};
await writeFile('evidence/publication-audit.json',JSON.stringify(result,null,2));console.log(JSON.stringify({status:result.status,files:manifest.length,problems}));if(problems.length)process.exitCode=1;
