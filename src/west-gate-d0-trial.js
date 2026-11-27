import * as THREE from 'three';
import {D0,expectedParts,trialPlacement,verifyD0Bytes} from './west-gate-d0-contract.js';
const near=(actual,expected)=>actual.every((x,i)=>Number.isFinite(x)&&Math.abs(x-expected[i])<.00001);
export function buildD0Outline(gltf){
 const root=gltf.scene;root.updateMatrixWorld(true);
 const meshes=[];root.traverse(o=>{if(o.isMesh)meshes.push(o);});
 if(meshes.length!==expectedParts.length)throw Error('D0部材数不一致');
 const group=new THREE.Group();
 try{
  for(const part of expectedParts){
   const matches=meshes.filter(m=>m.name===part.id);
   if(matches.length!==1)throw Error('D0部材ID不一致');
   const mesh=matches[0],box=new THREE.Box3().setFromObject(mesh);
   if(mesh.userData.basis!=='D'||mesh.userData.assembly_revision!=='D0'||mesh.userData.cad_eligibility!=='reference_only'||!near(box.min.toArray(),part.min)||!near(box.max.toArray(),part.max))throw Error('D0の来歴・外形不一致: '+part.id);
   const geo=new THREE.EdgesGeometry(mesh.geometry);geo.applyMatrix4(mesh.matrixWorld);
   const line=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0x38e8ff,depthTest:false,depthWrite:false,transparent:true,opacity:.9}));
   line.name=part.id;line.renderOrder=21;group.add(line);
  }
  return group;
 }catch(error){disposeOutline(group);throw error;}
}
function disposeOutline(group){for(const o of [...group.children]){o.removeFromParent();o.geometry.dispose();o.material.dispose();}}
function disposeSource(root){
 const geometries=new Set(),materials=new Set();
 root.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});
 for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
}
export function createWestGateD0Trial({scene,loader,render,url,mount,context}){
 const section=document.createElement('section');section.id='west-gate-d0-trial';section.hidden=true;
 const title=document.createElement('h5');title.textContent='共通部品 D0（試験配置）';
 const note=document.createElement('p');note.textContent='水色の輪郭＝城郭パーツ D0 左門扉（板6・横桟2）。既存C模型はそのまま。D0は板を同一平面に配置、すき間20 mm・横桟面接触を仮定。史実・接地・固定・強度はUNKNOWN。';
 const button=document.createElement('button');button.type='button';button.id='west-gate-d0-toggle';button.textContent='D0を重ねて比較';button.setAttribute('aria-pressed','false');
 const status=document.createElement('p');status.id='west-gate-d0-status';status.setAttribute('role','status');status.textContent='未表示（参考設計）';
 const link=document.createElement('a');link.href='https://github.com/'+D0.repository+'/blob/'+D0.commit+'/docs/stage4b/west-gate-left.md';link.textContent='固定版の制作根拠 D0 / '+D0.commit.slice(0,8);link.target='_blank';link.rel='noopener noreferrer';
 section.append(title,note,button,status,link);mount.append(section);
 const outer=new THREE.Group();outer.visible=false;scene.add(outer);
 let generation=0,phase='idle',outline=null,disposed=false,placement=null;
 const current=()=>{try{return disposed?null:context();}catch{return null;}};
 function update(){
  button.setAttribute('aria-pressed',String(phase==='visible'||phase==='loading'));
  button.textContent=phase==='visible'||phase==='loading'?'D0比較を終了':'D0を重ねて比較';
 }
 function cancel(){
  generation++;phase='idle';placement=null;outer.visible=false;
  if(outline){outer.remove(outline);disposeOutline(outline);outline=null;}
  status.textContent='未表示（参考設計）';update();
 }
 function sync(){
  const ctx=current();section.hidden=!ctx;button.disabled=!ctx;
  if(!ctx){if(phase!=='idle')cancel();return;}
  if(phase==='visible'){
   try{placement=trialPlacement(ctx);outer.scale.set(1,placement.scale,1);outline.position.fromArray(placement.position);outline.rotation.y=placement.yaw;}
   catch{cancel();}
  }
 }
 button.onclick=async()=>{
  const ctx=current();if(!ctx)return;
  if(phase==='visible'||phase==='loading'){cancel();render();return;}
  const token=++generation;phase='loading';status.textContent='固定D0を検証中';update();
  let pending=null;
  try{
   const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);
   const bytes=await verifyD0Bytes(await response.arrayBuffer());
   if(token!==generation||!current())return;
   const gltf=await loader.parseAsync(bytes,'');
   try{pending=buildD0Outline(gltf);}finally{disposeSource(gltf.scene);}
   if(token!==generation||!current())return;
   placement=trialPlacement(current());outline=pending;pending=null;outer.add(outline);outer.visible=true;phase='visible';
   status.textContent='D0試験表示中（史実・接地・接合はUNKNOWN）';update();sync();render();
  }catch(error){
   if(token===generation&&!disposed){cancel();phase='error';status.textContent='取得不可：'+error.message;update();render();}
  }finally{if(pending)disposeOutline(pending);}
 };
 return {sync,cancel,dispose:()=>{disposed=true;cancel();section.hidden=true;outer.removeFromParent();},diagnostics:()=>({phase,visible:outer.visible,partIds:outline?.children.map(o=>o.name)??[],placement,id:D0.id,revision:D0.revision,sha256:D0.sha256})};
}
