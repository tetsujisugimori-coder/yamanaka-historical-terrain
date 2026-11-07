import {DataTexture,RGBAFormat,RepeatWrapping,NoColorSpace} from 'three';
// D only: reproducible micro-relief, not a change to C elevations or timber size.
export function detailPixels(kind,size=128){
 const bytes=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let n=Math.imul(x+17,374761393)^Math.imul(y+31,668265263);n=Math.imul(n^(n>>>13),1274126177);const grain=((n^(n>>>16))>>>0)/4294967295;
  const v=kind==='wood'?128+35*Math.sin(x*.42+Math.sin(y*.05)*.7)+20*(grain-.5):128+65*(grain-.5)+17*Math.sin(x*.23+y*.31);
  const i=(y*size+x)*4;bytes[i]=bytes[i+1]=bytes[i+2]=Math.round(v);bytes[i+3]=255;
 }
 return bytes;
}
export function createCloseDetail(){
 const textures=new Map(),cache=new WeakMap(),owned=new Set();
 const texture=kind=>{if(textures.has(kind))return textures.get(kind);const t=new DataTexture(detailPixels(kind),128,128,RGBAFormat);t.wrapS=t.wrapT=RepeatWrapping;t.colorSpace=NoColorSpace;t.repeat.set(kind==='wood'?3:70,kind==='wood'?2:70);t.needsUpdate=true;textures.set(kind,t);return t;};
 function apply(mesh,enabled){
  if(!mesh.isMesh)return;
  const previous=cache.get(mesh);
  // Called after base finish selection, so a stale D material can never win over A.
  if(!enabled){if(previous&&mesh.material===previous.detail)mesh.material=previous.base;return;}
  const role=mesh.userData.materialRole??(mesh.userData.surface||mesh.userData.facilityId?'earth':'wood');
  if(['cloth','leaf','skin'].includes(role))return;
  if(previous&&(mesh.material===previous.base||mesh.material===previous.detail)){mesh.material=previous.detail;return;}
  const base=mesh.material,detail=base.clone(),kind=['wood','endgrain','roof'].includes(role)?'wood':'soil';
  detail.bumpMap=texture(kind);detail.bumpScale=kind==='wood'?.008:.016;detail.roughnessMap=texture(kind);detail.roughness=.96;
  cache.set(mesh,{base,detail});owned.add(detail);mesh.material=detail;
 }
 return {apply,dispose(){for(const m of owned)m.dispose();for(const t of textures.values())t.dispose();}};
}
