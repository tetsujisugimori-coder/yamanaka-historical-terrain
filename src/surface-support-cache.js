// Only caches derived support queries. Never retains or mutates research geometry.
// Every listed mesh, attribute identity/version, index and world transform must match.
export function createSurfaceSupportCache(){
 let previous=null,value=null;let hits=0,misses=0;
 function signature(meshes,scale){return {scale,rows:meshes.map(m=>{m.updateWorldMatrix(true,false);const g=m.geometry,p=g.attributes.position,n=g.attributes.normal,i=g.index;return [m,m.layers.mask,g,p,p?.version,n,n?.version,i,i?.version,g.drawRange.start,g.drawRange.count,JSON.stringify(g.groups),JSON.stringify((Array.isArray(m.material)?m.material:[m.material]).map(x=>x?.side)),...m.matrixWorld.elements];})};}
 function same(a,b){return a&&a.scale===b.scale&&a.rows.length===b.rows.length&&a.rows.every((row,i)=>row.length===b.rows[i].length&&row.every((x,j)=>Object.is(x,b.rows[i][j])));}
 return {get(meshes,scale,compute){const next=signature(meshes,scale);if(same(previous,next)){hits++;return value.map(p=>({...p}));}misses++;const result=compute();if(!Array.isArray(result))throw Error('Invalid surface support cache result');previous=next;value=result.map(p=>({...p}));return result.map(p=>({...p}));},clear(){previous=null;value=null;},stats(){return {hits,misses,entries:previous?1:0};}};
}
