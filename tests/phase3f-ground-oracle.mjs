import {readGlb,meshData} from './glb-surface.mjs';
/** Independent oracle: raw GLB decode + horizontal barycentric point queries.
 * Does not import product intersection, coordinate or interpolation functions.
 * Index every triangle's whole bbox, not merely its centroid.
 */
export function groundOracle(file){const model=readGlb(file),cells=new Map(),step=5;for(const node of model.g.nodes.filter(n=>n.mesh!==undefined&&n.extras?.surface===true)){
 if(node.matrix||node.rotation||node.translation||node.scale)throw Error('Oracle requires baked GLB; transform must be handled explicitly');
 const m=meshData(model,node.name);for(let i=0;i<m.indices.length;i+=3){const t=m.indices.slice(i,i+3).map(j=>m.positions[j]);const xs=t.map(v=>v[0]),zs=t.map(v=>v[2]);for(let x=Math.floor(Math.min(...xs)/step);x<=Math.floor(Math.max(...xs)/step);x++)for(let z=Math.floor(Math.min(...zs)/step);z<=Math.floor(Math.max(...zs)/step);z++){const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(t);}}
 }return(e,n)=>{let highest=null;for(const [a,b,c]of cells.get(Math.floor(e/step)+','+Math.floor(-n/step))??[]){const den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-10)continue;const u=((b[2]-c[2])*(e-c[0])+(c[0]-b[0])*(-n-c[2]))/den,v=((c[2]-a[2])*(e-c[0])+(a[0]-c[0])*(-n-c[2]))/den,w=1-u-v;if(Math.min(u,v,w)>=-1e-8){const h=u*a[1]+v*b[1]+w*c[1];highest=highest===null?h:Math.max(highest,h);}}return highest;};}

// This variant only queries explicitly tagged ground. Decorative buildings are not walk support.
