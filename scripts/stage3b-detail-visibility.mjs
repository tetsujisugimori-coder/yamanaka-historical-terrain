/** Selection alone is insufficient: actual geometry and every ancestor are checked.
 * Existing docs/phase3b.md (追加地表) excludes old vegetation overlapping western
 * terrain. This is a partial rendering exclusion, not missing geometry or a tree
 * replacement. All non-excluded batches must remain visible; all-hidden fails.
 */
export function inspectDetailVisibility(diagnostics,featureId){
 const meshes=diagnostics.modelMeshes?.filter(m=>m.featureId===featureId)??[];
 const errors=[],excluded=[];let visibleRequiredMeshes=0;
 if(!meshes.length)errors.push('No matching actual mesh');
 for(const m of meshes){
  if(!(Number.isInteger(m.positionCount)&&m.positionCount>0))errors.push(`${m.name}: missing POSITION geometry`);
  if(!Array.isArray(m.ancestors)||!m.ancestors.length||m.ancestors.some(a=>a.visible!==true))errors.push(`${m.name}: hidden/missing ancestor chain`);
  if(!Array.isArray(m.worldBounds)||m.worldBounds.length!==6||m.worldBounds.some(v=>!Number.isFinite(v)))errors.push(`${m.name}: invalid world bounds`);
  const x=m.visibilityExclusion;
  if(x!=null){
   if(featureId!=='sc-vegetation'||x.reason!=='western-terrain-overlap'||x.sourceFlag!==true||x.replacementGroupVisible!==true||!Number.isInteger(x.replacementMeshCount)||x.replacementMeshCount<1||m.visible!==false||m.effectiveVisible!==false){errors.push(`${m.name}: invalid visibility exclusion`);}
   else excluded.push({name:m.name,positionCount:m.positionCount,reason:x.reason,replacement:'western terrain, not an equivalent tree'});
  }else if(!m.visible||!m.effectiveVisible)errors.push(`${m.name}: mesh hidden`);
  else visibleRequiredMeshes++;
 }
 if(visibleRequiredMeshes===0)errors.push('No non-excluded actual visible mesh');
 return {featureId,meshes,excluded,visibleRequiredMeshes,errors,valid:errors.length===0};
}
