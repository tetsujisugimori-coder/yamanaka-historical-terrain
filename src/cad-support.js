import {DoubleSide,Mesh} from 'three';
import {createWalkWorld} from './exploration.js';
import {triangleSampler} from './library-parts.js';

// Reuse the existing displayed-triangle index, not a simplified terrain or DEM.
// Its fixed walking-grid extent contains the Stage 3-A CAD footprint. Queries
// outside that extent and unsupported rendering semantics use the original ray.
function signature(meshes){
 return meshes.flatMap(m=>{
  m.updateWorldMatrix(true,false);
  const g=m.geometry,p=g?.attributes.position,i=g?.index,materials=Array.isArray(m.material)?m.material:[m.material];
  return [m,m.visible,m.layers.mask,g,p,p?.array,p?.version,p?.data,p?.data?.array,p?.data?.version,p?.count,p?.itemSize,
   i,i?.array,i?.version,i?.count,g?.drawRange.start,g?.drawRange.count,
   ...m.matrixWorld.elements,...materials.flatMap(v=>[v,v?.side]),
   JSON.stringify(g?.groups),m.isSkinnedMesh,m.isInstancedMesh,m.raycast,g?.morphAttributes.position,m.morphTargetInfluences?.join(',')];
 });
}
function indexCompatible(meshes){
 return meshes.every(m=>{
  const g=m.geometry,count=g?.index?.count??g?.attributes.position?.count;
  return m.isMesh&&!m.isSkinnedMesh&&!m.isInstancedMesh&&m.raycast===Mesh.prototype.raycast&&!m.morphTargetInfluences?.length&&!g?.morphAttributes.position?.length
   &&!Array.isArray(m.material)&&m.material?.side===DoubleSide&&(m.layers.mask&1)
   &&g.groups.length===0&&g?.drawRange.start===0&&g.drawRange.count>=count
   &&g.attributes.position.itemSize===3;
 });
}
export function createCadSupportCache(){
 let previous=null,sampler=null,builds=0,hits=0,fallbackQueries=0,mode=null;
 return {
  get(meshes){
   const next=signature(meshes);
   if(previous&&next.length===previous.length&&next.every((v,i)=>v===previous[i])){hits++;return sampler;}
   previous=null;sampler=null;mode=null;
   const ray=triangleSampler(meshes);
   if(!indexCompatible(meshes)){previous=next;builds++;mode='ray-fallback';sampler=(x,z)=>{fallbackQueries++;return ray(x,z)};return sampler;}
   const world=createWalkWorld(meshes,[]);previous=next;builds++;mode='indexed-world-triangles';
   sampler=(x,z)=>{
    if(!Number.isFinite(x)||!Number.isFinite(z))return null;
    if(x< -204||x>=18||z< -52||z>=50){fallbackQueries++;return ray(x,z);}
    return world.sample(x,z);
   };
   return sampler;
  },
  clear(){previous=null;sampler=null;mode=null;},
  diagnostics(){return {builds,hits,fallbackQueries,mode};}
 };
}
