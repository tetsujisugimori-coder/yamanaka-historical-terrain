import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Box3,Vector3} from 'three';
import {loadCadPart,loadCadMetadata,placeCadPart,validateCadPin,validateResearch,disposeCadPart} from '../src/cad-parts.js';
const root=new URL('../public/',import.meta.url);
const fetcher=async path=>{try{const b=await readFile(new URL(path.replace(/^\//,''),root));return new Response(b)}catch{return new Response('',{status:404})}};
const pinned=JSON.parse(await readFile(new URL('parts/cad/pin.json',root)));
test('pin rejects unknown ID, revision, units, axes and commit',()=>{
 for(const [key,value]of [['id','other'],['commit','0'.repeat(40)],['units','mm'],['axes','east,north,up'],['category','A']])assert.throws(()=>validateCadPin({...pinned,[key]:value}));
 const p=structuredClone(pinned);p.revisions.B2.id='other';assert.throws(()=>validateCadPin(p));
});
for(const revision of ['B0','B1','B2']){
 test(revision+' original GLB geometry, research, drawing and rigid support',async()=>{
  const m=await loadCadPart('/',revision,fetcher);
  assert.equal(m.parts.length,14);assert.equal(m.group.children[0].children.length,14);
  assert.ok(Math.abs(m.dimensions_m[0]-(revision==='B2'?11.15:10.95))<1e-4);
  assert.ok(Math.abs(m.dimensions_m[1]-(revision==='B0'?2.2:2.4))<1e-4);
  assert.equal(m.research.length,27);
  for(const p of m.parts)for(const id of Object.values(p.svg_ids))assert.ok(m.drawings.svg.includes('id="'+id+'"'));
  const sample=(x,z)=>({height:30+x*.01+z*.02,face:4,slope:1});
  const config={east:-20,north:0,yawDegrees:90,scale:1,embedDepth:0,category:'C'};
  const before=new Box3().setFromObject(m.group).getSize(new Vector3());
  const result=placeCadPart(m,config,sample);
  assert.equal(result.posts.length,10);assert.equal(result.group.scale.y,1);
  assert.equal(result.group.position.x,-20);assert.equal(result.group.position.y,29.8);
  assert.ok(result.posts.some(p=>Math.abs(p.clearance)>0));
  const size=new Box3().setFromObject(m.group).getSize(new Vector3());assert.ok(Math.abs(size.y-before.y)<1e-4);assert.ok(Math.abs(size.z-before.x)<1e-4);
  placeCadPart(m,config,(x,z)=>({...sample(x,z),height:sample(x,z).height*2}));
  assert.ok(Math.abs(new Box3().setFromObject(m.group).getSize(new Vector3()).y-before.y)<1e-4);
  for(const change of [{scale:2},{embedDepth:.1},{category:'A'},{east:NaN}])assert.throws(()=>placeCadPart(m,{...config,...change},sample));
  assert.throws(()=>placeCadPart(m,config,()=>null));
  disposeCadPart(m.group);
 });
}
test('metadata remains readable without constructing WebGL',async()=>{
 const m=await loadCadMetadata('/','B2',fetcher);assert.ok(!m.group);assert.ok(m.drawings.native.front.includes('<svg'));assert.equal(m.definition.basis,'D');
 const research={commit:pinned.commit,records:structuredClone(m.research)};
 const snapshot=JSON.parse(await readFile(new URL('parts/cad/research-snapshot-cache.json',root)));
 research.records.pop();assert.throws(()=>validateResearch(m.definition,research,snapshot));
});
test('missing, corrupted and substituted assets fail closed; retry succeeds',async()=>{
 const paths=['B0/assembly.glb','B0/link-manifest.json','B0/drawing.svg','B0/native-front.svg','research-cache.json','research-snapshot-cache.json'];
 for(const path of paths){
  const missing=async p=>p.endsWith(path)?new Response('',{status:404}):fetcher(p);
  await assert.rejects(()=>loadCadPart('/','B0',missing),/missing/);
  const corrupt=async p=>p.endsWith(path)?new Response('corrupt'):fetcher(p);
  await assert.rejects(()=>loadCadPart('/','B0',corrupt),/SHA256/);
 }
 await assert.rejects(()=>loadCadPart('/','B9',fetcher),/Unknown/);
 const m=await loadCadPart('/','B0',fetcher);disposeCadPart(m.group);
});
test('every shipped derived file matches pin; runtime validators preserve provenance',async()=>{
 const {createHash}=await import('node:crypto');
 const files=[pinned.contract,pinned.research,pinned.researchSnapshot,...Object.values(pinned.revisions).flatMap(r=>Object.values(r.files))];
 for(const file of files){
  const b=await readFile(new URL(file.path,root));
  assert.equal(createHash('sha256').update(b).digest('hex'),file.sha256,file.path);
  assert.ok(!/\.(FCStd|step|blend)$/i.test(file.path));
 }
});
test('geometry validator rejects node identity, dimension, count and classification faults',async()=>{
 const {validateMeshes}=await import('../public/parts/cad/upstream-contract.mjs');
 const m=await loadCadMetadata('/','B2',fetcher);
 const meshes=m.parts.map(p=>({name:p.glb_node,revision:'B2',basis:'D',eligibility:'reference_only',bounds_m:p.bounds_m}));
 assert.equal(validateMeshes(m.definition,meshes),true);
 for(const patch of [{name:'wrong'},{revision:'B0'},{basis:'A'},{eligibility:'accepted'},{bounds_m:[0,0,0,1,1,1]}]){
  const bad=structuredClone(meshes);Object.assign(bad[0],patch);assert.throws(()=>validateMeshes(m.definition,bad));
 }
 assert.throws(()=>validateMeshes(m.definition,meshes.slice(1)));
});
test('offline build verifier rejects altered pin even with recomputed asset hashes',async()=>{
 const {mkdtemp,cp,writeFile,rm}=await import('node:fs/promises');
 const {tmpdir}=await import('node:os');
 const {join}=await import('node:path');
 const {fileURLToPath}=await import('node:url');
 const {spawnSync}=await import('node:child_process');
 const {createHash}=await import('node:crypto');
 const dir=await mkdtemp(join(tmpdir(),'cad-verify-'));
 const script=fileURLToPath(new URL('../scripts/stage3a-import.mjs',import.meta.url));
 const verify=()=>spawnSync(process.execPath,[script,'--verify',dir],{encoding:'utf8'});
 try{
  await cp(new URL('parts',root),join(dir,'parts'),{recursive:true});
  assert.equal(verify().status,0);
  const definitionPath=join(dir,'parts/cad/B0/link-manifest.json');
  const original=await readFile(definitionPath);
  const bad=JSON.parse(original);bad.dimensions[0].value_m=22;
  const bytes=Buffer.from(JSON.stringify(bad));await writeFile(definitionPath,bytes);
  assert.notEqual(verify().status,0,'dimension tamper must block build');
  const alteredPin=structuredClone(pinned);
  alteredPin.revisions.B0.files['link-manifest.json'].sha256=createHash('sha256').update(bytes).digest('hex');
  await writeFile(join(dir,'parts/cad/pin.json'),JSON.stringify(alteredPin,null,2)+'\n');
  const rejected=verify();assert.notEqual(rejected.status,0);assert.match(rejected.stderr,/Unapproved CAD pin/);
  await writeFile(join(dir,'parts/cad/pin.json'),await readFile(new URL('parts/cad/pin.json',root)));
  await writeFile(definitionPath,original);
  await rm(join(dir,'parts/cad/B0/assembly.glb'));
  assert.notEqual(verify().status,0,'missing GLB must block build');
 }finally{await rm(dir,{recursive:true,force:true})}
});
