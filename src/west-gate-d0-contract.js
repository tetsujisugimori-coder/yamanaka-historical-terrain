// Reference-only import of the accepted castle-3d-parts D0 assembly.
export const D0=Object.freeze({
 id:'YAM-WEST-LEFT-LEAF',revision:'D0',basis:'D',eligibility:'reference_only',
 repository:'tetsujisugimori-coder/castle-3d-parts',commit:'090e86ec7e88f49546a246a91d576f4aa4612ba1',
 source:'cad/stage4b/west-gate-left/west-gate-left-leaf.glb',sha256:'3eced51663e41b05656ab5508769b130265fbd8ce2380ebcd9326cfc68da253d',bytes:4356,
 boardCenter:Object.freeze([.86,0,-.065]),bottomOffset:.05
});
export const expectedParts=Object.freeze([
 ...Array.from({length:6},(_,i)=>Object.freeze({id:'B0'+(i+1),min:Object.freeze([i*.29,0,-.13]),max:Object.freeze([i*.29+.27,2.85,0])})),
 ...[.4,2.1].map((y,i)=>Object.freeze({id:'R0'+(i+1),min:Object.freeze([-.065,y,-.3]),max:Object.freeze([1.785,y+.15,-.13])}))
]);
// glTF +X width -> (+sin(angle) E, +cos(angle) N).
// glTF -Z back -> west, consistent with the C rail side, but not a joinery claim.
// Apply vertical exaggeration only after the rigid unscaled placement.
export function trialPlacement(context){
 const {east,north,angle,ground,scale}=context??{};
 if(![east,north,angle,ground,scale].every(Number.isFinite)||scale<=0)throw Error('試験配置の座標・支持基準が不正です');
 const yaw=Math.PI/2-angle;
 const [x,,z]=D0.boardCenter,c=Math.cos(yaw),s=Math.sin(yaw);
 return {position:[east-(c*x+s*z),ground+D0.bottomOffset,-north-(-s*x+c*z)],yaw,scale};
}
export function trialPoint(point,placement){
 const [x,y,z]=point,[a,b,c]=placement.position,t=placement.yaw;
 return [a+Math.cos(t)*x+Math.sin(t)*z,(b+y)*placement.scale,c-Math.sin(t)*x+Math.cos(t)*z];
}
export async function verifyD0Bytes(bytes,subtle=globalThis.crypto?.subtle){
 if(!(bytes instanceof ArrayBuffer)||bytes.byteLength!==D0.bytes||!subtle)throw Error('D0のサイズまたはSHA-256検証環境が不正です');
 const hash=Array.from(new Uint8Array(await subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
 if(hash!==D0.sha256)throw Error('D0のSHA-256が固定版と一致しません');
 return bytes;
}
