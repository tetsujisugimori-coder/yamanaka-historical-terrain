import * as THREE from 'three';
// Project-original D display recipe. No species, location or 1590 vegetation claim.
export const NATURE={version:'phase3h-d-v1',category:'D',license:'project-original procedural recipe; no third-party image',shrubs:[[-27,24],[-24,26],[-21,27],[-101,-18],[-104,-17],[-106,-20]],maxSlope:18};
export function surfaceTint(id,e,n,slope){
 const soil=new THREE.Color('#9c6748'),grass=new THREE.Color('#73804b'),track=new THREE.Color('#ad9167');
 const worn=id.includes('bridge')||id.includes('passage')||id.includes('gate');
 const steep=THREE.MathUtils.smoothstep(slope,18,42);
 const patch=(Math.sin(e*.31+n*.17)*Math.sin(e*.11-n*.23)+1)/2;
 const color=worn?track:grass.lerp(soil,Math.min(.92,steep*.85+patch*.1));
 return color.multiplyScalar(.94+.10*patch);
}
export function createNatureFinish(){
 const states=new Map(),materials=new Set();
 function restore(){for(const [mesh,s]of states){if(mesh.geometry.attributes.color===s.colors){if(s.baseColors)mesh.geometry.setAttribute('color',s.baseColors);else mesh.geometry.deleteAttribute('color');}if(mesh.material===s.material)mesh.material=s.baseMaterial;}}
 function apply(mesh){
  if(!mesh.isMesh||!(mesh.userData.surface||mesh.userData.facilityId)||mesh.userData.facilityId==='nm-context')return;
  const g=mesh.geometry,p=g.attributes.position,norm=g.attributes.normal;if(!p||!norm)return;
  let s=states.get(mesh);
  if(s&&s.position===p&&s.baseMaterial===mesh.material&&g.attributes.color!==s.colors)s.baseColors=g.attributes.color;
  if(!s||s.position!==p||s.baseMaterial!==mesh.material){
   const colors=new Float32Array(p.count*3),id=mesh.userData.facilityId??mesh.userData.elementId??'';
   for(let i=0;i<p.count;i++){const slope=Math.acos(Math.min(1,Math.abs(norm.getY(i))))*180/Math.PI,c=surfaceTint(id,p.getX(i),-p.getZ(i),slope);colors.set([c.r,c.g,c.b],i*3);}
   if(s){materials.delete(s.material);s.material.dispose();}
   const material=mesh.material.clone();material.vertexColors=true;material.roughness=.98;material.color.set('#ffffff');
   s={position:p,baseColors:g.attributes.color,colors:new THREE.BufferAttribute(colors,3),baseMaterial:mesh.material,material};states.set(mesh,s);materials.add(material);
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
 points.forEach((p,i)=>{matrix.compose(new THREE.Vector3(p.east,p.ground+.22,-p.north),new THREE.Quaternion(),new THREE.Vector3(1.25,.65,1));mesh.setMatrixAt(i,matrix);});
 mesh.userData={evidenceCategory:'D',materialRole:'leaf',recipe:NATURE.version};mesh.name='H sparse low shrubs D';mesh.instanceMatrix.needsUpdate=true;return mesh;
}
