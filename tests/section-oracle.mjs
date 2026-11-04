import {readGlb,meshData} from './glb-surface.mjs';
/** Independent oracle: raw GLB decode + horizontal barycentric point queries.
 * Does not import product intersection, coordinate or interpolation functions.
 * Index every triangle's whole bbox, not merely its centroid.
 */
export function oracle(file){const model=readGlb(file),cells=new Map(),step=5;for(const node of model.g.nodes.filter(n=>n.mesh!==undefined)){
 if(node.matrix||node.rotation||node.translation||node.scale)throw Error('Oracle requires baked GLB; transform must be handled explicitly');
 const m=meshData(model,node.name);for(let i=0;i<m.indices.length;i+=3){const t=m.indices.slice(i,i+3).map(j=>m.positions[j]);const xs=t.map(v=>v[0]),zs=t.map(v=>v[2]);for(let x=Math.floor(Math.min(...xs)/step);x<=Math.floor(Math.max(...xs)/step);x++)for(let z=Math.floor(Math.min(...zs)/step);z<=Math.floor(Math.max(...zs)/step);z++){const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(t);}}
 }return(e,n)=>{let highest=null;for(const [a,b,c]of cells.get(Math.floor(e/step)+','+Math.floor(-n/step))??[]){const den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-10)continue;const u=((b[2]-c[2])*(e-c[0])+(c[0]-b[0])*(-n-c[2]))/den,v=((c[2]-a[2])*(e-c[0])+(a[0]-c[0])*(-n-c[2]))/den,w=1-u-v;if(Math.min(u,v,w)>=-1e-8){const h=u*a[1]+v*b[1]+w*c[1];highest=highest===null?h:Math.max(highest,h);}}return highest;};}
export const TOLERANCE=.001; // 1 mm numeric agreement, not survey accuracy.
export function verifyProfile(profile,start,end,query){let maxError=0,count=0;const length=Math.hypot(end[0]-start[0],end[1]-start[1]);if(Math.abs(profile.length-length)>1e-8)throw Error('Horizontal distance mismatch');
 for(const p of profile.segments)for(const d of [p.from,(p.from+p.to)/2,p.to]){const e=start[0]+(end[0]-start[0])*d/length,n=start[1]+(end[1]-start[1])*d/length,expected=query(e,n),actual=p.h0+(p.h1-p.h0)*(d-p.from)/(p.to-p.from);if(expected===null)throw Error('Fabricated coverage');const error=Math.abs(expected-actual);if(error>TOLERANCE)throw Error('Surface height mismatch '+error);maxError=Math.max(maxError,error);count++;}return{count,maxError};}
