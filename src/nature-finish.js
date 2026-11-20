import * as THREE from 'three';
import {westGateEdgeWeight,westGateEdgeColor,westGateRelief} from './west-gate-finish.js';
// Project-original D display recipe. No species, location or 1590 vegetation claim.
export const NATURE={version:'phase3i-d-v1',category:'D',license:'project-original procedural recipe; no third-party image',shrubs:[[-27,24],[-24,26],[-21,27],[-101,-18],[-104,-17],[-106,-20]],maxSlope:18};
// Parse the palette once; per-vertex evaluation never reparses CSS/sRGB colours.
const PALETTE={soil:new THREE.Color('#9e6042'),grass:new THREE.Color('#73804b'),dry:new THREE.Color('#93905b'),track:new THREE.Color('#b39770')};
export function surfaceTint(id,e,n,slope,target=new THREE.Color()){
 const steep=THREE.MathUtils.smoothstep(slope,18,42);
 const patch=(Math.sin(e*.31+n*.17)*Math.sin(e*.11-n*.23)+1)/2;
 const fine=(Math.sin(e*1.71+n*.93)*Math.sin(e*.87-n*1.31)+1)/2;
 const path=id.includes('passage')||id.includes('.path')||id.includes('gate');
 const earth=id.includes('.earth');
 const wear=path ? .78+.16*Math.sin(n*.21+e*.13)**2 : 0;
 target.copy(PALETTE.grass).lerp(PALETTE.dry,.12+patch*.24);
 target.lerp(PALETTE.soil,earth?.8:Math.min(.92,steep*.85+patch*.09));
 if(path)target.lerp(PALETTE.track,wear);
 return target.multiplyScalar(.92+.09*patch+.035*fine);
}
export function createNatureFinish(westernBounds){
 const states=new Map(),materials=new Set();
 function restore(){for(const [mesh,s]of states){if(mesh.geometry.attributes.color===s.colors){if(s.baseColors)mesh.geometry.setAttribute('color',s.baseColors);else mesh.geometry.deleteAttribute('color');}if(mesh.material===s.material)mesh.material=s.baseMaterial;}}
 function apply(mesh,westVisible=false){
  const {facilityId,elementId,surface}=mesh.userData,context=facilityId==='nm-context';
  if(!mesh.isMesh||!(surface||facilityId)||(context&&!westVisible))return;
  const west=surface&&['wb-gate','wb-moat','wb-bailey'].includes(elementId);
  const continuity=Boolean(westernBounds&&westVisible&&(context||west));
  if(context&&!continuity)return;
  const g=mesh.geometry,p=g.attributes.position,norm=g.attributes.normal;
  const baseColors=g.attributes.color;
  if(!p||!norm||(context&&(!baseColors||baseColors.count!==p.count)))return;
  let s=states.get(mesh);
  if(!s||s.position!==p||s.baseMaterial!==mesh.material||s.baseColors!==baseColors||s.continuity!==continuity){
   const colors=new Float32Array(p.count*3),id=mesh.name.includes('.surface.')?mesh.name:(facilityId??elementId??'');
   const tint=new THREE.Color(),edge=new THREE.Color();
   for(let i=0;i<p.count;i++){
    const e=p.getX(i),n=-p.getZ(i),ny=norm.getY(i);
    if(context)tint.setRGB(baseColors.getX(i),baseColors.getY(i),baseColors.getZ(i));
    else{
     surfaceTint(id,e,n,Math.acos(Math.min(1,Math.abs(ny)))*180/Math.PI,tint);
     if(west&&continuity)tint.multiplyScalar(westGateRelief(elementId,e,n,ny,norm.getZ(i)));
    }
    if(continuity){
     const weight=westGateEdgeWeight(e,n,westernBounds);
     if(weight)tint.lerp(westGateEdgeColor(e,n,edge),weight);
    }
    colors[i*3]=tint.r;colors[i*3+1]=tint.g;colors[i*3+2]=tint.b;
   }
   if(s){materials.delete(s.material);s.material.dispose();}
   const material=mesh.material.clone();material.vertexColors=true;
   // Preserve the existing context finish outside the collar (its base is white).
   if(!context){material.roughness=.98;material.color.set('#ffffff');}
   s={position:p,baseColors,colors:new THREE.BufferAttribute(colors,3),baseMaterial:mesh.material,material,continuity};states.set(mesh,s);materials.add(material);
  }
  g.setAttribute('color',s.colors);mesh.material=s.material;
 }
 return {restore,apply,dispose(){restore();for(const m of materials)m.dispose();states.clear();materials.clear();}};
}
export function shrubSupports(sample,exaggeration=1){
 return NATURE.shrubs.flatMap(([east,north])=>{const h=sample(east,-north);return h&&Number.isFinite(h.height)&&Number.isFinite(h.slope)&&h.slope<=NATURE.maxSlope?[{east,north,ground:h.height,exaggeration}]:[];});
}
export function makeShrubs(points){
 const geometry=new THREE.IcosahedronGeometry(.38,1),material=new THREE.MeshStandardMaterial({color:'#52643c',roughness:1});
 const mesh=new THREE.InstancedMesh(geometry,material,points.length);const matrix=new THREE.Matrix4();
 points.forEach((p,i)=>{matrix.compose(new THREE.Vector3(p.east,p.ground+.22,-p.north),new THREE.Quaternion(),new THREE.Vector3(1.05+(i%3)*.16,.48+(i%4)*.09,.82+(i%2)*.18));mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,new THREE.Color().setRGB(.28+(i%3)*.025,.36+(i%2)*.035,.15+(i%4)*.012));});
 mesh.userData={evidenceCategory:'D',materialRole:'leaf',recipe:NATURE.version};mesh.name='I varied sparse low shrubs D';mesh.instanceMatrix.needsUpdate=true;return mesh;
}
