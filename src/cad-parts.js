import {Box3,Group,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import pin from '../public/parts/cad/pin.json' with {type:'json'};
import {validateManifest,validateMeshes,validateRevisionPair,verifyHash,sanitizeDrawing} from '../public/parts/cad/upstream-contract.mjs';
export {sanitizeDrawing};
export const CAD_REVISIONS=Object.freeze(['B0','B1','B2']);
const COMMIT='1cc50d1a6d1af8164cada51124cb02279dbe316c';
const assert=(condition,message)=>{if(!condition)throw Error(message)};
const decode=b=>new TextDecoder().decode(b);
export function validateCadPin(p=pin){
 assert(p.schemaVersion===1&&p.id==='PAL-ASSEMBLY'&&p.commit===COMMIT,'CAD pin ID/commit mismatch');
 assert(p.units==='metres'&&p.axes==='east,up,south'&&p.category==='D'&&p.eligibility==='reference_only','CAD units/axes/classification mismatch');
 assert(Object.keys(p.revisions).join(',')===CAD_REVISIONS.join(','),'CAD revision set mismatch');
 for(const r of CAD_REVISIONS)assert(p.revisions[r].id===p.id&&p.revisions[r].revision===r,'CAD revision ID mismatch');
 return p;
}
async function bytes(base,file,fetcher){
 assert(file&&/^parts\/cad\/[A-Za-z0-9_./-]+$/.test(file.path)&&!file.path.includes('..'),'Unsafe CAD asset path');
 const r=await fetcher(base+file.path);assert(r.ok,'CAD asset missing: '+file.path);
 const b=await r.arrayBuffer();await verifyHash(b,file.sha256);return b;
}
export function validateResearch(definition,research,snapshot){
 assert(research.commit===COMMIT&&Array.isArray(research.records)&&Array.isArray(snapshot.records),'Research cache malformed');
 assert(new Set(research.records.map(r=>r.path)).size===research.records.length,'Duplicate research record');
 for(const ref of definition.parts.flatMap(p=>p.research_refs)){
  const r=research.records.find(r=>r.path===ref.path),s=snapshot.records.find(r=>r.path===ref.path);
  assert(r&&s&&r.id===ref.id&&r.record.id===ref.id&&r.sha256===s.sha256,'Research reference missing or mismatched: '+ref.id);
  assert(JSON.stringify(r.record)===JSON.stringify(s.data),'Research snapshot contents mismatch: '+ref.id);
  if(ref.id.startsWith('DEC-'))assert(r.record.status==='held'&&r.record.cad?.eligibility==='reference_only','Held research decision changed');
 }
 return true;
}
export async function loadCadMetadata(base,revision,fetcher=fetch){
 validateCadPin();assert(CAD_REVISIONS.includes(revision),'Unknown CAD revision');
 const entry=pin.revisions[revision],files=entry.files;
 const definition=validateManifest(JSON.parse(decode(await bytes(base,files['link-manifest.json'],fetcher))),revision);
 assert(definition.assembly_id===pin.id,'Assembly ID mismatch');
 let child=definition;
 while(child.previous_revision){
  const r=child.previous_revision,prev=validateManifest(JSON.parse(decode(await bytes(base,pin.revisions[r].files['link-manifest.json'],fetcher))),r);
  validateRevisionPair(child,prev);child=prev;
 }
 const [researchBytes,snapshotBytes,svg,...native]=await Promise.all([
  bytes(base,pin.research,fetcher),bytes(base,pin.researchSnapshot,fetcher),bytes(base,files['drawing.svg'],fetcher),
  ...['front','side','top'].map(v=>bytes(base,files['native-'+v+'.svg'],fetcher))]);
 await verifyHash(snapshotBytes,definition.research_snapshot_sha256);
 await verifyHash(svg,definition.files.svg.sha256);
 for(const [i,v]of ['front','side','top'].entries())await verifyHash(native[i],definition.native_svg_exports[v].sha256);
 const research=JSON.parse(decode(researchBytes)),snapshot=JSON.parse(decode(snapshotBytes));
 validateResearch(definition,research,snapshot);
 return {revision,manifest:{...pin,...entry},definition,parts:definition.parts,dimensions:definition.dimensions,
  research:research.records.filter(r=>entry.researchPaths.includes(r.path)),
  drawings:{svg:decode(svg),native:Object.fromEntries(['front','side','top'].map((v,i)=>[v,decode(native[i])]))},
  source:{commit:pin.commit,repository:pin.repository,url:pin.repository+'/tree/'+pin.commit,
   viewerUrl:pin.repository+'/blob/'+pin.commit+'/site/stage2c/index.html'},
 };
}
export async function loadCadPart(base,revision,fetcher=fetch){
 const asset=await loadCadMetadata(base,revision,fetcher),b=await bytes(base,pin.revisions[revision].files['assembly.glb'],fetcher);
 await verifyHash(b,asset.definition.files.glb.sha256);
 const gltf=await new GLTFLoader().parseAsync(b,'');const meshes=[];
 try{
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(o=>{if(o.isMesh){const b=new Box3().setFromObject(o);meshes.push({name:o.name,revision:o.userData.assembly_revision,basis:o.userData.basis,eligibility:o.userData.cad_eligibility,bounds_m:[b.min.x,-b.max.z,b.min.y,b.max.x,-b.min.z,b.max.y]});}});
  validateMeshes(asset.definition,meshes);
  const bounds=new Box3().setFromObject(gltf.scene),centerX=(bounds.min.x+bounds.max.x)/2;
  // glTF is already east/up/south. Translate only, never rotate axes or rescale.
  gltf.scene.position.x=-centerX;
  const group=new Group();group.name='cad-palisade-'+revision;group.add(gltf.scene);
  gltf.scene.traverse(o=>{if(o.isMesh){o.userData={...o.userData,elementId:'library-palisade',partId:o.name,evidenceCategory:'D'};o.material=o.material.clone();}});
  return {...asset,group,centerX,bounds:bounds.clone(),dimensions_m:bounds.getSize(new Vector3()).toArray()};
 }catch(error){disposeCadPart(gltf.scene);throw error}
}
export function placeCadPart(model,placement,sample){
 const {east,north,yawDegrees,scale=1,embedDepth=0,groundOffset=0}=placement;
 assert([east,north,yawDegrees,scale,embedDepth,groundOffset].every(Number.isFinite)&&Math.abs(east)<=1000&&Math.abs(north)<=1000&&Math.abs(yawDegrees)<=360&&scale===1&&embedDepth===0&&Math.abs(groundOffset)<=1,'CAD placement invalid; real dimensions require scale=1');
 assert(!placement.category||placement.category==='C','CAD placement must remain hypothesis C');
 const anchor=sample(east,-north);assert(anchor&&Number.isFinite(anchor.height)&&Number.isInteger(anchor.face),'CAD anchor has no triangle support');
 const ground=anchor.height+groundOffset,a=yawDegrees*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 const posts=model.parts.filter(p=>p.id.includes('_Post_')).map(p=>{
  const b=p.bounds_m,localX=(b[0]+b[3])/2-model.centerX,localZ=-(b[1]+b[4])/2;
  const x=east+c*localX+s*localZ,z=-north-s*localX+c*localZ,hit=sample(x,z);
  assert(hit&&Number.isFinite(hit.height)&&Number.isInteger(hit.face),'CAD post missing real triangle support: '+p.id);
  const base=ground+b[2],clearance=base-hit.height;
  const corners=[b[0],b[3]].flatMap(px=>[b[1],b[4]].map(pn=>{
   const lx=px-model.centerX,lz=-pn,cx=east+c*lx+s*lz,cz=-north-s*lx+c*lz,h=sample(cx,cz);
   assert(h&&Number.isFinite(h.height)&&Number.isInteger(h.face),'CAD post corner missing triangle support: '+p.id);
   return {x:cx,z:cz,ground:h.height,clearance:base-h.height,face:h.face};
  }));
  const clearances=[clearance,...corners.map(p=>p.clearance)];
  return {id:p.id,x,z,base,ground:hit.height,clearance,float:Math.max(0,...clearances),burial:Math.max(0,...clearances.map(v=>-v)),face:hit.face,slope:hit.slope??null,corners};
 });
 model.group.scale.set(1,1,1);model.group.rotation.set(0,a,0);model.group.position.set(east,ground,-north);model.group.updateMatrixWorld(true);
 model.group.userData={...model.group.userData,placementId:placement.placementId||'yamanaka-stage3a-test',revision:model.revision,partId:'PAL-ASSEMBLY',placementCategory:'C',componentCategory:'D',posts};
 return {group:model.group,posts,placement:{...placement,scale:1,category:'C',groundReferenceHeight:anchor.height,baseHeight:ground,anchorFace:anchor.face}};
}
export function disposeCadPart(group){
 group?.traverse(o=>{o.geometry?.dispose();for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])m.dispose()});group?.removeFromParent();group?.clear();
}
