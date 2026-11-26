import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Bake exported transforms and batch by stable element ID + material. The .blend
// keeps every post, tree and person editable; the browser needs few draw calls.
export function landscapeModel(gltf,westernBounds){
 const buckets=new Map();gltf.scene.updateMatrixWorld(true);
 gltf.scene.traverse(o=>{if(!o.isMesh)return;const id=o.userData.elementId,category=o.userData.evidenceCategory;
  if(!id||!['C','D'].includes(category))throw Error('Scenery missing ledger binding');
  const geo=o.geometry.clone();geo.applyMatrix4(o.matrixWorld);
  geo.computeBoundingBox();const center=geo.boundingBox.getCenter(new THREE.Vector3());
  const overlap=id==='sc-vegetation'&&westernBounds&&center.x>westernBounds[0]-4&&center.x<westernBounds[2]+4&&-center.z>westernBounds[1]-4&&-center.z<westernBounds[3]+4;
  const key=id+':'+o.material.uuid+':'+Boolean(overlap);
  const materialRole=o.userData.materialRole??({'sc-vegetation':'leaf','sc-flags':'cloth','sc-people':'skin'}[id]??'wood');
  if(!buckets.has(key))buckets.set(key,{geometries:[],material:o.material.clone(),data:{...o.userData,materialRole,westernOverlap:Boolean(overlap)}});
  buckets.get(key).geometries.push(geo);
 });
 const group=new THREE.Group();
 for(const b of buckets.values()){const geometry=mergeGeometries(b.geometries);if(!geometry)throw Error('Scenery batching failed');b.geometries.forEach(g=>g.dispose());b.material.side=THREE.DoubleSide;const m=new THREE.Mesh(geometry,b.material);m.userData=b.data;m.name=b.data.elementId;group.add(m);}
 return group;
}

// Vertex colors only: never change the position/index arrays used by sections.
const landscapePalette=Object.fromEntries(['#9e8059','#78814c','#ac9670','#a99672','#8b925b','#9a8559','#7d8950','#687f55'].map(hex=>[hex,new THREE.Color(hex)]));
export function landscapeColor(id,e,h,s,slope){
 const noise=(Math.sin(e*.23+s*.17)*Math.sin(e*.073-s*.267)+Math.sin(e*.61-s*.39)*.25)*.045;
 let color;
 if(id==='nm-moat')color=landscapePalette[slope>24?'#9e8059':'#78814c'].clone();
 else if(id==='nm-passage')color=landscapePalette['#ac9670'].clone();
 else if(id==='nm-bailey'){const track=Math.abs(e+12+Math.sin(s*.09)*3)<3; color=landscapePalette[track?'#a99672':'#8b925b'].clone();}
 else if(id==='nm-rampart')color=landscapePalette[slope>30?'#9a8559':'#7d8950'].clone();
 else color=landscapePalette['#687f55'].clone();
 return color.multiplyScalar(1+noise);
}
