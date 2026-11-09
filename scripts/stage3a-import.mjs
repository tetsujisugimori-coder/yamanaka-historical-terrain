// Deterministic derived delivery cache. CAD, STEP, blend and research originals remain upstream.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=resolve(process.argv[2]||'../castle-stage3a-source');
const commit='1cc50d1a6d1af8164cada51124cb02279dbe316c';
const hash=b=>createHash('sha256').update(b).digest('hex');
// Updating this trust root is an explicit, reviewed version change, never an
// automatic consequence of updating a mutable manifest or upstream main.
const APPROVED_PIN_SHA256='d8be38a53edd1bf3bbc6349b184abb26d5b5cb36ed4cd9538f088a5293abb296';
if(process.argv[2]==='--verify'){
 const publicRoot=resolve(process.argv[3]||resolve(root,'public'));
 const pinBytes=readFileSync(resolve(publicRoot,'parts/cad/pin.json'));
 if(hash(pinBytes)!==APPROVED_PIN_SHA256)throw Error('Unapproved CAD pin SHA256');
 const p=JSON.parse(pinBytes);
 if(p.commit!==commit)throw Error('Unapproved CAD source commit');
 const files=[p.contract,p.research,p.researchSnapshot,...Object.values(p.revisions).flatMap(r=>Object.values(r.files))];
 for(const file of files){
  if(!/^parts\/cad\/[A-Za-z0-9_./-]+$/.test(file.path)||file.path.includes('..'))throw Error('Unsafe asset path');
  const b=readFileSync(resolve(publicRoot,file.path));
  if(hash(b)!==file.sha256)throw Error('CAD asset SHA256 mismatch: '+file.path);
 }
 console.log('Verified approved CAD pin and '+files.length+' local assets without upstream/network access');
 process.exit(0);
}
if(execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim()!==commit)throw Error('Source HEAD must equal approved pin '+commit);
const get=p=>execFileSync('git',['show',commit+':'+p],{cwd:source,maxBuffer:32*1024*1024});
const write=(p,b)=>{const dest=resolve(root,'public/parts/cad',p);mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,b)};
const asset=(upstream,path)=>{const b=get(upstream);write(path,b);return {path:'parts/cad/'+path,upstream,sha256:hash(b)}};
const pin={schemaVersion:1,id:'PAL-ASSEMBLY',commit,repository:'https://github.com/tetsujisugimori-coder/castle-3d-parts',units:'metres',axes:'east,up,south',category:'D',eligibility:'reference_only',revisions:{}};
pin.contract=asset('site/stage2c/contract.mjs','upstream-contract.mjs');
pin.researchSnapshot=asset('design/stage2b/research-snapshot.json','research-snapshot-cache.json');
const research=new Map();
for(const revision of ['B0','B1','B2']){
 const dir='cad/stage2c/generated/'+revision+'/';
 const definition=JSON.parse(get(dir+'link-manifest.json'));
 const files={};
 for(const f of ['link-manifest.json','assembly.glb','drawing.svg','native-front.svg','native-side.svg','native-top.svg'])files[f]=asset(dir+f,revision+'/'+f);
 for(const [key,f]of [['glb','assembly.glb'],['svg','drawing.svg']])if(files[f].sha256!==definition.files[key].sha256)throw Error('Source hash mismatch');
 const refs=[...new Map(definition.parts.flatMap(p=>p.research_refs).map(r=>[r.path,r])).values()];
 for(const r of refs)if(!research.has(r.path)){const b=get(r.path);const record=JSON.parse(b);if(record.id!==r.id)throw Error('Research ID mismatch');research.set(r.path,{...r,sha256:hash(b),record,url:pin.repository+'/blob/'+commit+'/'+r.path})}
 pin.revisions[revision]={revision,id:pin.id,files,researchPaths:refs.map(r=>r.path)};
}
const records=Buffer.from(JSON.stringify({commit,records:[...research.values()]},null,2)+'\n');
write('research-cache.json',records);pin.research={path:'parts/cad/research-cache.json',sha256:hash(records),note:'Read-only derived display cache, never an editable research ledger.'};
write('pin.json',JSON.stringify(pin,null,2)+'\n');
console.log('Imported pinned Stage 2-C delivery assets for B0/B1/B2 from '+commit);
