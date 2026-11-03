import {Vector3} from 'three';
/** Perspective scale at the target's horizontal plane, never stretched/clamped.
 * It describes a local reference, not every point at a different scene depth. */
export function groundScale(camera,target,width,height,maxPixels=160){
 camera.updateMatrixWorld();
 const direction=new Vector3().setFromMatrixColumn(camera.matrixWorld,0);direction.y=0;direction.normalize();
 const a=target.clone(),pa=a.clone().project(camera);
 const choices=[2000,1000,500,200,100,50,20,10,5,2,1,.5,.2,.1];
 let result;
 for(const metres of choices){const b=a.clone().addScaledVector(direction,metres),pb=b.clone().project(camera);const pixels=Math.hypot((pb.x-pa.x)*width/2,(pb.y-pa.y)*height/2);if(Number.isFinite(pixels)&&pixels>0&&pixels<=maxPixels){result={metres,pixels,start:a.toArray(),end:b.toArray()};break;}}
 return result??{metres:0,pixels:0,start:a.toArray(),end:a.toArray()};
}
