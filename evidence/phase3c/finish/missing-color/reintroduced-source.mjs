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

// Project-original, deterministic, seamless multiscale textures. A broad
// irregular field replaces the old 128px sine-grid repetition. No photos.
function texture(kind){
 const size=512,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
 const ctx=canvas.getContext('2d'),data=ctx.createImageData(size,size);
 const hash=(x,y)=>{let k=Math.imul(x+19,374761393)^Math.imul(y+71,668265263);k=Math.imul(k^(k>>>13),1274126177);return((k^(k>>>16))>>>0)/4294967295;};
 const smooth=t=>t*t*(3-2*t);
 const noise=(x,y,period)=>{x=(x%period+period)%period;y=(y%period+period)%period;const ix=Math.floor(x),iy=Math.floor(y),u=smooth(x-ix),v=smooth(y-iy);const a=hash(ix,iy),b=hash((ix+1)%period,iy),c=hash(ix,(iy+1)%period),d=hash((ix+1)%period,(iy+1)%period);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size,broad=noise(u*4,v*4,4),patch=noise(u*16,v*16,16),grain=noise(u*128,v*128,128);
  let value;
  if(kind==='wood'){
   const warp=5*Math.sin(v*Math.PI*2)+2*Math.sin(v*Math.PI*6),rings=Math.sin(u*Math.PI*76+warp+2*noise(u*8,v*8,8));
   const fibre=noise(u*128,v*8,128),pores=hash(x,y)>.986?20:0;
   value=184+17*rings+17*(fibre-.5)+14*(broad-.5)-pores;
  }else value=203+34*(broad-.5)+22*(patch-.5)+17*(grain-.5)+10*(hash(x,y)-.5);
  const i=(y*size+x)*4;data.data[i]=data.data[i+1]=data.data[i+2]=value;data.data[i+3]=255;
 }
 ctx.putImageData(data,0,0);const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.NoColorSpace;t.anisotropy=2;return t;
}

// Meshes can share imported geometry. Each gets a stable private attribute
// container before D ever writes a UV reference. Read-only source position,
// normal and index buffers remain shared; setAttribute/setIndex changes only
// this container. This also preserves the display-only context cutout flow.
function ownedGeometry(source){
 const g=new THREE.BufferGeometry();g.name=source.name;
 for(const [name,attribute]of Object.entries(source.attributes))g.setAttribute(name,attribute);
 g.setIndex(source.index);g.groups=source.groups.map(group=>({...group}));g.setDrawRange(source.drawRange.start,source.drawRange.count);
 g.boundingBox=source.boundingBox?.clone()??null;g.boundingSphere=source.boundingSphere?.clone()??null;
 g.userData={...source.userData,displayOwned:true};return g;
}

export function createSurfaceFinish(){
 const soil=texture('soil'),wood=texture('wood'),saved=new WeakMap();
 function apply(mesh,enabled){
  if(!mesh.isMesh)return;
  if(!saved.has(mesh)){
   const original=mesh.material,sourceGeometry=mesh.geometry;
   const base=mesh.userData.appearanceEvidence?original.clone():original;
   if(mesh.userData.appearanceEvidence){base.vertexColors=false;base.needsUpdate=true;}
   mesh.geometry=ownedGeometry(sourceGeometry);
   saved.set(mesh,{base,finish:null,sourceGeometry,castShadow:mesh.castShadow,receiveShadow:mesh.receiveShadow,uv:sourceGeometry.attributes.uv,finishUv:null});
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
   // Evidence labels describe provenance, not a supplied GPU color attribute.
   // The new neutral patch has no COLOR_0; enabling USE_COLOR would make it black.
   if(mesh.userData.appearanceEvidence)mat.vertexColors=true;
   if(!['cloth','leaf','skin'].includes(role)){
    mat.bumpMap=role==='wood'?wood:soil;mat.bumpScale=role==='wood'?.022:.065;mat.map=role==='wood'?wood:soil;
    mat.roughnessMap=role==='wood'?wood:soil;mat.roughness=.95;mat.metalness=0;
   }
   pair.finish=mat;
  }
  if(!pair.finishUv){
   const p=g.attributes.position,uv=new Float32Array(p.count*2),isWood=role==='wood'||role==='endgrain'||role==='roof';
   for(let i=0;i<p.count;i++){
    // Soil uses an oblique 70m field, not short square tiles. Timber retains
    // its authored per-board UVs where available; its fine pattern is new.
    if(isWood&&pair.uv){uv[i*2]=pair.uv.getX(i);uv[i*2+1]=pair.uv.getY(i);}
    else{uv[i*2]=isWood?p.getX(i)*.7:(p.getX(i)*.91+p.getZ(i)*.41)/70;uv[i*2+1]=isWood?p.getY(i)*.22:(p.getZ(i)*.91-p.getX(i)*.41)/70;}
   }
   pair.finishUv=new THREE.BufferAttribute(uv,2);
  }
  g.setAttribute('uv',pair.finishUv);
  if(!mesh.userData.appearanceEvidence)pair.finish.vertexColors=pair.base.vertexColors;
  mesh.material=pair.finish;mesh.receiveShadow=true;mesh.castShadow=!mesh.userData.surface&&!mesh.userData.facilityId;
 }
 return{apply};
}
