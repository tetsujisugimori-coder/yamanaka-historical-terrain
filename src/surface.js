import {Box3,Raycaster,Vector3} from 'three';
/** Sample actual displayed triangles. Hidden facility geometry may be supplied
 * explicitly for a named observation point; no DEM/metadata extrapolation.
 */
export function sampleSurfaceHeight(meshes,easting,northing,verticalScale=1){
 if(!Number.isFinite(verticalScale)||verticalScale<=0)throw Error('Invalid vertical scale');
 const bounds=new Box3();
 for(const mesh of meshes){mesh.updateWorldMatrix(true,false);bounds.expandByObject(mesh);}
 if(bounds.isEmpty())throw Error('No surface geometry');
 const ray=new Raycaster(new Vector3(easting,bounds.max.y+1,-northing),new Vector3(0,-1,0));
 const hit=ray.intersectObjects(meshes,false)[0];
 if(!hit||!Number.isFinite(hit.point.y))throw Error('No displayed triangle at observation point');
 return hit.point.y/verticalScale;
}
