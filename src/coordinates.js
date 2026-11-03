export const ORIGIN={easting:44862.121277226666,northing:-93478.07235405142,vertical:0,crs:'EPSG:6676'};
export function toWeb(easting,northing,height){return [easting-ORIGIN.easting,height,-(northing-ORIGIN.northing)];}
export function fromWeb(x,y,z){return [x+ORIGIN.easting,-z+ORIGIN.northing,y];}
export function sampleHeight(grid,e,n){
 const c=Math.min(grid.cols-1,Math.max(0,(e-grid.bounds[0])/grid.step));
 const r=Math.min(grid.rows-1,Math.max(0,(grid.bounds[3]-n)/grid.step));
 const c0=Math.floor(c),r0=Math.floor(r),c1=Math.min(c0+1,grid.cols-1),r1=Math.min(r0+1,grid.rows-1),u=c-c0,v=r-r0;
 return (1-v)*((1-u)*grid.heights[r0][c0]+u*grid.heights[r0][c1])+v*((1-u)*grid.heights[r1][c0]+u*grid.heights[r1][c1]);
}
