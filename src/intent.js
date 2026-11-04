/** Every user selection/view/camera intent invalidates older async effects.
 * A completion may cache data, but may commit UI only while its token is current.
 */
export function createIntentController(){
 let revision=0;
 return{begin(){const token=++revision;return{isCurrent:()=>token===revision};}};
}
