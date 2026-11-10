// Fault only the guard under test. The CAD occlusion query has a separate
// visibility filter and must not consume the facility-picking mutation.
export function applyPhase2aFault(source,scenario){
 const contracts={
  'hidden-pick':[
   'const hits=ray.intersectObjects(currentModel.children.filter(o=>o.visible),true);',
   'const hits=ray.intersectObjects(currentModel.children,true);',
  ],
  'superseded-load':['isCurrent:()=>token===revision','isCurrent:()=>true'],
 };
 const contract=contracts[scenario];if(!contract)throw Error('Unknown Phase2A fault');
 const [anchor,replacement]=contract,count=source.split(anchor).length-1;
 if(count!==1)throw Error(`${scenario} guard must occur exactly once; found ${count}`);
 return {code:source.replace(anchor,replacement),anchor,replacement};
}

export function phase2aNegativeAccepted(rows){
 if(rows.length!==4)return false;const seen=new Set();
 for(const r of rows){
  const key=r.engine+'/'+r.scenario;if(seen.has(key)||!['chromium','webkit'].includes(r.engine)||!['hidden-pick','superseded-load'].includes(r.scenario))return false;seen.add(key);
  if(r.status!=='FAIL'||r.mutationApplied!==true||!Array.isArray(r.pageerrors)||r.pageerrors.length)return false;
  const w=r.failureWitness;
  if(r.scenario==='hidden-pick'){
   if(w?.selected!=='nm-moat'||!w.hidden?.includes('nm-moat'))return false;
  }else if(w?.renderState!=='error'||w?.view!=='regional'||!r.injectionHits?.length)return false;
 }
 return true;
}
