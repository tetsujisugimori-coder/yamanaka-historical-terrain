/** Selection/view ownership and camera effects have separate lifetimes.
 * Before any model exists, camera input must not discard its success/error.
 * A newer selection/view still supersedes both kinds of pending effect.
 */
export function createIntentController(){
 let revision=0,cameraRevision=0;
 return{
  begin(){const token=++revision,cameraToken=++cameraRevision;return{isCurrent:()=>token===revision,canMoveCamera:()=>token===revision&&cameraToken===cameraRevision};},
  adjustCamera(){cameraRevision++;}
 };
}
