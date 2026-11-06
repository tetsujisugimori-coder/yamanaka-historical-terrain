import * as THREE from 'three';

// Display-only cutout. Source attributes, GLB bytes and section geometry stay intact.
// Patch edges follow the 5m context grid, so no triangle straddles an edge.
export function contextOutsidePatch(geometry,bounds){
 const [west,south,east,north]=bounds,p=geometry.attributes.position;
 const index=geometry.index,keep=[];
 for(let i=0;i<(index?.count??p.count);i+=3){
  const ids=[0,1,2].map(k=>index?index.getX(i+k):i+k);
  const e=ids.reduce((s,j)=>s+p.getX(j),0)/3,n=-ids.reduce((s,j)=>s+p.getZ(j),0)/3;
  if(e>west&&e<east&&n>south&&n<north)continue;
  keep.push(...ids);
 }
 const result=geometry.clone();result.setIndex(keep);return result;
}

// Original deterministic textures, made locally; no photographs or external assets.
function texture(kind){
 const size=128,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
 const ctx=canvas.getContext('2d'),data=ctx.createImageData(size,size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const noise=Math.sin(x*12.9898+y*78.233)*43758.5453%1;
  const value=kind==='wood'?160+35*Math.sin(x*.47+Math.sin(y*.08)*1.7)+12*noise:180+22*noise+18*Math.sin(x*.37)*Math.sin(y*.31);
  const i=(y*size+x)*4;data.data[i]=data.data[i+1]=data.data[i+2]=value;data.data[i+3]=255;
 }
 ctx.putImageData(data,0,0);const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.NoColorSpace;return t;
}

export function createSurfaceFinish(){
 const soil=texture('soil'),wood=texture('wood'),saved=new WeakMap();
 function apply(mesh,enabled){
  if(!mesh.isMesh)return;
  if(!saved.has(mesh)){
   const original=mesh.material;
   // Exported appearance vertex colours are D. The neutral C presentation is
   // a separate material, never a mutation of the imported source material.
   const base=mesh.userData.appearanceEvidence?original.clone():original;
   if(mesh.userData.appearanceEvidence){base.vertexColors=false;base.needsUpdate=true;}
   saved.set(mesh,{base,finish:null,castShadow:mesh.castShadow,receiveShadow:mesh.receiveShadow,uv:mesh.geometry.attributes.uv});
  }
  const pair=saved.get(mesh),g=mesh.geometry;
  if(!enabled){
   mesh.material=pair.base;mesh.castShadow=pair.castShadow;mesh.receiveShadow=pair.receiveShadow;
   if(pair.uv)g.setAttribute('uv',pair.uv);else g.deleteAttribute('uv');
   return;
  }
  const role=mesh.userData.materialRole??(mesh.userData.surface||mesh.userData.facilityId?'earth':'wood');
  if(!pair.finish){
   const mat=pair.base.clone();
   // Only the D material uses the exported appearance colours.
   if(mesh.userData.appearanceEvidence)mat.vertexColors=true;
   if(!['cloth','leaf','skin'].includes(role)){
    mat.bumpMap=role==='wood'?wood:soil;mat.bumpScale=role==='wood'?.035:.12;mat.map=role==='wood'?wood:soil;
    mat.roughnessMap=role==='wood'?wood:soil;mat.roughness=.95;mat.metalness=0;
   }
   pair.finish=mat;
  }
  if(!g.attributes.uv){const p=g.attributes.position,uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){
   uv[i*2]=role==='wood'?p.getX(i)*2:p.getX(i)*.18;uv[i*2+1]=role==='wood'?p.getY(i)*.4:p.getZ(i)*.18;
  }g.setAttribute('uv',new THREE.BufferAttribute(uv,2));}
  if(!mesh.userData.appearanceEvidence)pair.finish.vertexColors=pair.base.vertexColors;
  mesh.material=pair.finish;mesh.receiveShadow=true;mesh.castShadow=!mesh.userData.surface&&!mesh.userData.facilityId;
 }
 return{apply};
}
