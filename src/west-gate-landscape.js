import {Box3,Vector3} from 'three';
import {landscapeModel} from './landscape.js';

// This is observation metadata for the phase3b asset only. The existing
// landscape renderer/picker still receives the unchanged batches.
export function westGateLandscapeModel(gltf,westernBounds){
 const westGateParts=new Map(),vertex=new Vector3();
 gltf.scene.updateMatrixWorld(true);
 gltf.scene.traverse(mesh=>{
  // GLTFLoader preserves the authored ID here rather than in Object3D.name.
  const {name,elementId,evidenceCategory,groundHeight}=mesh.userData;
  if(!mesh.isMesh||elementId!=='wb-gate'||evidenceCategory!=='C'||
   typeof name!=='string'||!/^wb-gate\.gate\.(door|post)\./.test(name))return;
  if(westGateParts.has(name)){westGateParts.set(name,null);return;}
  const position=mesh.geometry.getAttribute('position'),bounds=new Box3();
  for(let i=0;i<(position?.count??0);i++){
   vertex.fromBufferAttribute(position,i).applyMatrix4(mesh.matrixWorld);
   // Match the baked Float32 coordinates of the existing landscape batches.
   vertex.set(Math.fround(vertex.x),Math.fround(vertex.y),Math.fround(vertex.z));
   if(![vertex.x,vertex.y,vertex.z].every(Number.isFinite)){westGateParts.set(name,null);return;}
   bounds.expandByPoint(vertex);
  }
  westGateParts.set(name,bounds.isEmpty()?null:{name,bounds,groundHeight});
 });
 const group=landscapeModel(gltf,westernBounds);
 if(westGateParts.size)group.userData.westGateParts=westGateParts;
 return group;
}
