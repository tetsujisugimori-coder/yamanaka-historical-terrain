/** The selection/description alone is insufficient: require actual geometry and every ancestor. */
export function inspectDetailVisibility(diagnostics,featureId){
 const meshes=diagnostics.modelMeshes?.filter(m=>m.featureId===featureId)??[];
 const errors=[];
 if(!meshes.length)errors.push('No matching actual mesh');
 for(const m of meshes){
  if(!(Number.isInteger(m.positionCount)&&m.positionCount>0))errors.push(`${m.name}: missing POSITION geometry`);
  if(!m.visible||!m.effectiveVisible)errors.push(`${m.name}: mesh hidden`);
  if(!Array.isArray(m.ancestors)||!m.ancestors.length||m.ancestors.some(a=>a.visible!==true))errors.push(`${m.name}: hidden/missing ancestor chain`);
  if(!Array.isArray(m.worldBounds)||m.worldBounds.length!==6||m.worldBounds.some(v=>!Number.isFinite(v)))errors.push(`${m.name}: invalid world bounds`);
 }
 return {featureId,meshes,errors,valid:errors.length===0};
}
