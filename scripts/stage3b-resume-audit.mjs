// Validate a complete resumed run and identify preserved local artifacts.
// This does not certify historical accuracy or replace independent review.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const [browserDir,output]=process.argv.slice(2);
if(!browserDir||!output)throw Error('Usage: node scripts/stage3b-resume-audit.mjs BROWSER_DIR NEW_REPORT');
if(fs.existsSync(output))throw Error('Refusing to overwrite existing evidence');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const hash=file=>sha(fs.readFileSync(file));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const data=JSON.parse(fs.readFileSync(path.join(browserDir,'results.json'),'utf8'));
const expected=[];
for(const engine of ['chromium','webkit']){
 for(const width of [375,390,765,1280])for(const motion of ['no-preference','reduce'])expected.push(`${engine}-${width}-${motion}`);
 for(const fault of ['missing','bad-coordinate'])expected.push(`${engine}-${fault}`);
}
const errors=[];
const checkedHash=file=>{try{return hash(file);}catch(error){errors.push(`Unreadable artifact: ${file}: ${error.code??error.message}`);return null;}};
const overview=JSON.parse(fs.readFileSync('public/data/castle-overview.json','utf8'));
const requiredSources=['src/castle-overview.js','src/castle-overview-contract.js','src/main.js','src/style.css','public/data/castle-overview.json','scripts/stage3b-overview-browser.mjs'];
const requiredChecks=['keyboard open','A only, no detail assets, unplaced disclosed, sign visible','source and relative-position reading','independent layer controls','detail transition hides modern signs','prior detail view restored as ordinary observation','return and close restores focus'];
if(JSON.stringify(Object.keys(data.sourceHashes??{}).sort())!==JSON.stringify([...requiredSources].sort()))errors.push('Missing source identity');
if(!data.buildHashes?.['dist/index.html']||!data.buildHashes?.['dist/data/castle-overview.json']||!Object.keys(data.buildHashes??{}).some(f=>f.startsWith('dist/assets/')&&f.endsWith('.js')))errors.push('Missing build identity');
if(data.rows.length!==expected.length||new Set(data.rows.map(r=>r.key)).size!==expected.length)errors.push('Incomplete or duplicate matrix');
for(const key of expected){const row=data.rows.find(r=>r.key===key);if(row?.status!=='PASS')errors.push(`Not PASS: ${key}`);}
if(data.head!==data.endHead||data.head!==git('rev-parse','HEAD')||data.tree!==git('rev-parse','HEAD^{tree}')||data.inputsChanged)errors.push('Run identity/source changed');
for(const [file,digest] of Object.entries(data.sourceHashes??{}))if(checkedHash(file)!==digest||data.hashes?.[file]!==digest)errors.push(`Source mismatch: ${file}`);
for(const [file,digest] of Object.entries(data.buildHashes??{}))if(checkedHash(file)!==digest)errors.push(`Build mismatch: ${file}`);
for(const key of expected.filter(k=>!k.endsWith('-missing')&&!k.endsWith('-bad-coordinate'))){
 const row=data.rows.find(r=>r.key===key);
 if(requiredChecks.some(check=>!row?.checks?.includes(check))||!Array.isArray(row?.pageErrors)||row.pageErrors.length)errors.push(`Incomplete checks: ${key}`);
 const diag=row?.diagnostics?.castleOverview;
 if(!diag?.loaded||diag.active!==false||diag.visible!==false||diag.regions!==overview.regions.length||diag.unplaced!==overview.regions.filter(r=>!r.geometry).length)errors.push(`Incomplete diagnostics: ${key}`);
 for(const suffix of ['.zip','-overview.png']){const file=path.join(browserDir,key+suffix);if(!fs.existsSync(file)||fs.statSync(file).size===0)errors.push(`Missing artifact: ${file}`);}
}
const protectedData=JSON.parse(fs.readFileSync('research/stage3b/preserved-inputs.json','utf8'));
for(const f of protectedData.files)if(checkedHash(f.path)!==f.sha256)errors.push(`Protected input changed: ${f.path}`);
const artifacts=[];
for(const dir of [browserDir,'evidence/stage3b/resume-20261113-browser','evidence/stage3b/resume-20261113-webkit-recheck','evidence/stage3b/resume-20261113-oracle','evidence/stage3b/resume-20261113-validation']){
 if(!fs.existsSync(dir))continue;
 for(const name of fs.readdirSync(dir).sort()){
  const file=path.join(dir,name);if(!fs.statSync(file).isFile())continue;
  const bytes=fs.readFileSync(file);
  // Existing attributes store text as LF. Preserve raw local evidence and
  // separately identify the canonical bytes that Git will publish.
  const repositoryBytes=/\.(json|txt)$/.test(file)?Buffer.from(bytes.toString('utf8').replaceAll('\r\n','\n')):bytes;
  artifacts.push({path:file.replaceAll('\\','/'),bytes:bytes.length,sha256:sha(bytes),repositoryBytes:repositoryBytes.length,repositorySha256:sha(repositoryBytes)});
 }
}
const report={at:new Date().toISOString(),status:errors.length?'FAIL':'PASS',errors,entry:{head:'d6898549b620cff0610228d646fc73d7acd5f055',tree:'696a96e6d6204b82f8dd33ff845c7ecea357699e'},testedHead:data.head,testedTree:data.tree,branch:git('branch','--show-current'),upstream:{main:git('rev-parse','refs/remotes/stage3b-review/main'),pr38:git('rev-parse','refs/remotes/stage3b-review/pr38'),pr40:git('rev-parse','refs/remotes/stage3b-review/pr40'),mainMergeBase:git('merge-base','HEAD','refs/remotes/stage3b-review/main'),pr40MergeBase:git('merge-base','HEAD','refs/remotes/stage3b-review/pr40'),shallow:git('rev-parse','--is-shallow-repository')},matrix:16,faults:4,protectedFiles:protectedData.files.length,scripts:Object.fromEntries(['scripts/stage3b-independent-oracle.py','scripts/stage3b-resume-audit.mjs'].map(f=>[f,hash(f)])),artifacts,limits:'Computational and automated desktop checks only; historic registration, physical devices, native reread and runtime-envelope completeness remain unverified. ZIP traces are preserved locally; this report does not imply remote archival.'};
const isFault=row=>row.key.endsWith('-missing')||row.key.endsWith('-bad-coordinate');
const counts=(fault,required)=>({required,observed:data.rows.filter(r=>isFault(r)===fault).length,pass:data.rows.filter(r=>isFault(r)===fault&&r.status==='PASS').length,fail:data.rows.filter(r=>isFault(r)===fault&&r.status==='FAIL').length});
report.matrix=counts(false,16);report.faults=counts(true,4);
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{encoding:'utf8',flag:'wx'});
console.log(JSON.stringify({status:report.status,errors,artifacts:artifacts.length}));
if(errors.length)process.exitCode=1;
