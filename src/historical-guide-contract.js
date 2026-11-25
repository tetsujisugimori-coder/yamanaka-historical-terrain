/** Relationship validation does not certify historical position. */
export function validateHistoricalGuide(data, overview) {
 const fail=m=>{throw Error(m);};
 if(data?.schemaVersion!==1||!Array.isArray(data.relations))fail('schema relations');
 const regions=new Map(overview.regions.map(r=>[r.id,r]));
 const models=new Set(overview.models.map(m=>m.id));
 const sources=new Set(overview.sources.map(s=>s.id));
 for(const r of overview.regions){if(r.certainty!=='unplaced'||r.geometry!==null||r.center!=null)fail('unplaced geometry');for(const s of r.sourceRefs??[])if(!sources.has(s.id??s))fail('source reference');}
 const ids=new Set();
 const text=v=>typeof v==='string'&&v.trim().length>0;
 for(const r of data.relations){
  if(!text(r.id)||ids.has(r.id))fail('duplicate identity');ids.add(r.id);
  if(!regions.has(r.regionId))fail('unknown region');if(!models.has(r.modelId))fail('unknown model');
  if(!sources.has(r.sourceRef?.id)||!text(r.sourceRef?.locator))fail('source reference');
  if(!text(r.relationEvidence))fail('missing evidence');
  if(r.relationType!=='thematic')fail('relation type');
  if(r.verificationStatus!=='UNVERIFIED')fail('verification status promotion');
  if(!Array.isArray(r.limitations)||!r.limitations.length||!r.limitations.every(text))fail('evidence limitations');
  if('geometry'in r||'center'in r||'coordinates'in r)fail('relationship geometry forbidden');
 }
 return data;
}

export function adaptHistoricalRelations(overview) {
 const pairs=new Set();
 const relations=overview.regionModelRelations.map(r=>{
  const id=`${r.regionId}/${r.modelId}`;
  if(pairs.has(id))throw Error('duplicate relationship pair');pairs.add(id);
  if(r.type!=='software-audit-association'||r.geographicAgreement!=='UNKNOWN')throw Error('verification status promotion');
  if(!Array.isArray(r.evidence)||!r.evidence.length||r.evidence.some(e=>typeof e!=='string'||!e.trim()))throw Error('missing relation evidence');
  return {id,regionId:r.regionId,modelId:r.modelId,sourceRef:{id:overview.regions.find(x=>x.id===r.regionId)?.sourceRefs[0]?.id,locator:'既存regionModelRelations（ソフトウェア照合用）'},relationType:'thematic',relationEvidence:r.evidence.join(' / '),verificationStatus:'UNVERIFIED',limitations:['地理的一致UNKNOWN。史実位置を証明しない。']};
 });
 return validateHistoricalGuide({schemaVersion:1,relations},overview);
}
