// B3 metadata/eligibility checks, not a historical identity or georeferencing proof.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export const CONTRACT = Object.freeze({
  baseline: '7ef4bd6a77ea0447ee0862af5b3677ac34389367',
  method: 'AFFINE_2D_RESEARCH_CANDIDATE', minFit: 3, minCheck: 2,
  // Dimensionless conditioning guards, not positional accuracy tolerances.
  minTriangleAreaRatio: 0.01, minCheckSeparationRatio: 0.25,
});
const NAMES = {'nishinomaru':'西ノ丸','nishi-yagura':'西櫓'};
const VERTICAL = 'GSI published orthometric height, m; no ellipsoid conversion; measurement epoch/individual datum revision UNKNOWN';
const fail = message => { throw Error(message); };
const text = v => typeof v === 'string' && v.trim().length > 0;
const finite = v => typeof v === 'number' && Number.isFinite(v);
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const unique = (items,label) => {
  if (!Array.isArray(items)) fail(`${label}: array required`);
  const out = new Map();
  for (const item of items) {
    if (!item || !text(item.id) || out.has(item.id)) fail(`${label}: duplicate or missing ID`);
    out.set(item.id,item);
  }
  return out;
};
const refs = (ids,map,label) => {
  if (!Array.isArray(ids) || new Set(ids).size !== ids.length || ids.some(id=>!map.has(id))) fail(`${label}: missing/duplicate reference`);
};
function coordinates(c,sources,label,kind) {
  if(c === null) return;
  if(!c || !Array.isArray(c.values) || c.values.length!==2 || !c.values.every(finite)) fail(`${label}: finite XY required`);
  if(!text(c.crs) || c.crs==='UNKNOWN' || !['m','mm'].includes(c.unit) || !['E,N','X,Y'].includes(c.axisOrder)) fail(`${label}: CRS/unit/axes unknown`);
  if(!text(c.method) || !text(c.locator) || !sources.has(c.sourceId)) fail(`${label}: coordinate provenance missing`);
  if(!['TEXT','FIGURE'].includes(sources.get(c.sourceId).inspection)) fail(`${label}: coordinates from uninspected source`);
  const u=c.uncertainty;
  if(!u || !finite(u.value) || u.value<0 || (kind==='REAL_RESEARCH' && u.value===0) || u.unit!==c.unit || !text(u.basis) || u.basis==='UNKNOWN') fail(`${label}: quantified uncertainty missing`);
}
function conditioned(points,side) {
  if(points.length<3) return false;
  const boxes=points.map(p=>({xy:p[side].values,u:p[side].uncertainty.value}));
  const xs=boxes.map(b=>b.xy[0]),ys=boxes.map(b=>b.xy[1]);
  const scale2=(Math.max(...xs)-Math.min(...xs))**2+(Math.max(...ys)-Math.min(...ys))**2;
  if(!finite(scale2) || scale2<=0) return false;
  for(let i=0;i<boxes.length;i++) for(let j=i+1;j<boxes.length;j++) for(let k=j+1;k<boxes.length;k++) {
    const [a,b,c]=[boxes[i],boxes[j],boxes[k]], x=b.xy[0]-a.xy[0],y=b.xy[1]-a.xy[1],v=c.xy[0]-a.xy[0],w=c.xy[1]-a.xy[1];
    const ub=a.u+b.u,uc=a.u+c.u;
    // Bound coordinate-box perturbations in the determinant. This is an
    // engineering conditioning screen, not an outward-rounded proof library.
    const error=(Math.abs(x)+Math.abs(y))*uc+(Math.abs(v)+Math.abs(w))*ub+2*ub*uc;
    const lower=Math.abs(x*w-y*v)-error;
    if(finite(lower) && lower>scale2*CONTRACT.minTriangleAreaRatio) return true;
  }
  return false;
}
function checksDistributed(fit,check,side) {
  if(check.length<2 || fit.length<3) return false;
  const xs=fit.map(p=>p[side].values[0]),ys=fit.map(p=>p[side].values[1]);
  const width=Math.max(...xs)-Math.min(...xs),height=Math.max(...ys)-Math.min(...ys),scale=Math.hypot(width,height);
  if(!finite(scale)||scale===0) return false;
  // Require every check within fit-envelope; this is not convex-hull coverage.
  if(check.some(p=>{const {values:[x,y],uncertainty:{value:u}}=p[side];return x-u<Math.min(...xs)||x+u>Math.max(...xs)||y-u<Math.min(...ys)||y+u>Math.max(...ys);})) return false;
  let max=0;
  for(let i=0;i<check.length;i++)for(let j=i+1;j<check.length;j++) {
    const a=check[i][side],b=check[j][side];
    max=Math.max(max,Math.hypot(a.values[0]-b.values[0],a.values[1]-b.values[1])-Math.SQRT2*(a.uncertainty.value+b.uncertainty.value));
  }
  return finite(max) && max>scale*CONTRACT.minCheckSeparationRatio;
}

export function inspect(ledger,sources) {
  if(!ledger || ledger.schemaVersion!==1 || ledger.baseline!==CONTRACT.baseline) fail('schema/baseline mismatch');
  if(!['REAL_RESEARCH','SYNTHETIC_FIXTURE'].includes(ledger.dataKind)) fail('data kind required');
  if(ledger.crs!=='EPSG:6676'||ledger.unit!=='m'||ledger.axisOrder!=='E,N') fail('target CRS/unit/axes mismatch');
  if(!same(ledger.origin,[44862.121277226666,-93478.07235405142,0])||ledger.vertical!==VERTICAL||ledger.webAxes!=='x=E-E0, y=H, z=-(N-N0)') fail('origin/vertical/web axes mismatch');
  if(ledger.placementAllowed!==false) fail('placement promotion forbidden');
  const sourceMap=unique(sources,'source');
  if(sourceMap.size===0) fail('source set empty');
  for(const s of sources) {
    for(const key of ['url','locator','provenanceGroup','accessState','accessedAt']) if(!text(s[key]))fail(`source ${s.id}: ${key} missing`);
    if(!/^https?:\/\//.test(s.url)||!Number.isFinite(Date.parse(s.accessedAt)))fail('source URL/date invalid');
    for(const key of ['title','publisher','year','type','rights']) if(!(key in s)||!(s[key]===null||text(s[key])||(key==='year'&&Number.isInteger(s[key])&&s[key]>0)))fail(`source ${s.id}: ${key} missing/invalid`);
    if(!['CATALOGUE','TEXT','FIGURE','NOT_OBTAINED'].includes(s.inspection))fail('source inspection invalid');
  }
  const regions=unique(ledger.regions,'region'),candidates=unique(ledger.candidates,'candidate');
  if(!same([...regions.keys()].sort(),Object.keys(NAMES).sort()))fail('region scope mismatch');
  const used=new Set();
  for(const p of candidates.values()) {
    if(!regions.has(p.regionId)||!text(p.name)||!sourceMap.has(p.sourceId)||!text(p.locator))fail('candidate region/source/name missing');
    for(const key of ['currentEvidence','alterationEvidence','identityEvidence','reason','independenceGroup'])if(!text(p[key]))fail(`candidate ${p.id}: ${key} missing`);
    if(!['UNKNOWN','VERIFIED'].includes(p.identity)||!['HELD','REJECTED','ACCEPTED'].includes(p.decision)||!['NONE','FIT','CHECK'].includes(p.role))fail('candidate decision/identity/role invalid');
    // Every recorded evidence reference must resolve, including rejected/held candidates.
    refs(p.evidenceSourceIds,sourceMap,'identity evidence');
    coordinates(p.sourceCoordinates,sourceMap,'source coordinates',ledger.dataKind);
    coordinates(p.currentCoordinates,sourceMap,'current coordinates',ledger.dataKind);
    if(p.currentCoordinates!==null && (p.currentCoordinates.crs!=='EPSG:6676'||p.currentCoordinates.unit!=='m'||p.currentCoordinates.axisOrder!=='E,N'))fail('current coordinate target mismatch');
    if(p.decision!=='ACCEPTED') {if(p.role!=='NONE')fail('unaccepted point in computation');}
    else {
      if(p.identity!=='VERIFIED'||p.identityEvidence==='UNKNOWN'||p.alterationEvidence==='UNKNOWN'||p.currentEvidence==='UNKNOWN'||p.sourceCoordinates===null||p.currentCoordinates===null||p.independenceGroup==='UNKNOWN')fail('accepted point lacks evidence');
      if(p.role==='NONE')fail('accepted point role absent');
      if(!['TEXT','FIGURE'].includes(sourceMap.get(p.sourceId).inspection))fail('accepted catalogue-only point');
      // Distinct drawings copied from one original do not supply independent evidence.
      if(p.evidenceSourceIds.some(id=>sourceMap.get(id).provenanceGroup==='UNKNOWN') || new Set(p.evidenceSourceIds.map(id=>sourceMap.get(id).provenanceGroup)).size<2)fail('independent source lineage missing');
      if(p.evidenceSourceIds.some(id=>!['TEXT','FIGURE'].includes(sourceMap.get(id).inspection)))fail('identity evidence not inspected');
      if(!p.evidenceSourceIds.includes(p.sourceId)||!p.evidenceSourceIds.includes(p.sourceCoordinates.sourceId)||!p.evidenceSourceIds.includes(p.currentCoordinates.sourceId))fail('coordinate identity provenance mismatch');
    }
  }
  const results=[];
  for(const r of regions.values()) {
    if(r.name!==NAMES[r.id])fail('region name/ID mismatch');
    if(r.status!=='unplaced'||r.geometry!==null||r.transformStatus!=='NOT_TESTED'||r.transform!==null||r.historyCertainty!=='UNKNOWN')fail('unproven placement/transform/history promotion');
    for(const key of ['fitRmseMetres','checkRmseMetres','maxResidualMetres'])if(r[key]!==null)fail('invented residual');
    if(!text(r.reason))fail('region reason missing');
    refs(r.sourceIds,sourceMap,'region sources');if(r.sourceIds.length===0)fail('region sources empty');
    refs(r.candidateIds,candidates,'region candidates');
    for(const id of r.candidateIds){const p=candidates.get(id);if(p.regionId!==r.id||used.has(id)||!r.sourceIds.includes(p.sourceId))fail('candidate region/provenance mismatch');used.add(id);}
    refs(r.fitPointIds,candidates,'fit');refs(r.checkPointIds,candidates,'check');
    if(r.fitPointIds.some(id=>r.checkPointIds.includes(id)))fail('fit/check overlap');
    const fit=r.fitPointIds.map(id=>candidates.get(id)),check=r.checkPointIds.map(id=>candidates.get(id));
    for(const [pts,role] of [[fit,'FIT'],[check,'CHECK']])for(const p of pts)if(!r.candidateIds.includes(p.id)||p.regionId!==r.id||p.decision!=='ACCEPTED'||p.role!==role)fail('unaccepted/wrong-role point in computation');
    const claimed=[...fit,...check];
    if(new Set(claimed.map(p=>p.independenceGroup)).size!==claimed.length)fail('duplicate physical-point independence group');
    for(const id of r.candidateIds){const p=candidates.get(id);if(p.decision==='ACCEPTED'&&!claimed.includes(p))fail('accepted point omitted from role set');}
    for(const side of ['sourceCoordinates','currentCoordinates'])if(claimed.length && new Set(claimed.map(p=>JSON.stringify([p[side].crs,p[side].unit,p[side].axisOrder]))).size!==1)fail('mixed coordinate frames');
    for(const side of ['sourceCoordinates','currentCoordinates']) if(new Set(claimed.map(p=>JSON.stringify(p[side].values))).size!==claimed.length)fail('duplicate coordinate point despite independent IDs');
    const blockers=[];
    const consultedIds=new Set(claimed.flatMap(p=>p.evidenceSourceIds));
    if(consultedIds.size===0 || [...consultedIds].some(id=>{const s=sourceMap.get(id);return s.permittedResearchUse!==true || !text(s.researchUseEvidence) || s.researchUseEvidence==='UNKNOWN';}))blockers.push('RESEARCH_USE_NOT_CONFIRMED');
    if(fit.length<CONTRACT.minFit)blockers.push('INSUFFICIENT_FIT_POINTS');
    if(check.length<CONTRACT.minCheck)blockers.push('INSUFFICIENT_INDEPENDENT_CHECK_POINTS');
    if(!conditioned(fit,'sourceCoordinates')||!conditioned(fit,'currentCoordinates'))blockers.push('FIT_GEOMETRY_OR_UNCERTAINTY_INSUFFICIENT');
    if(!checksDistributed(fit,check,'sourceCoordinates')||!checksDistributed(fit,check,'currentCoordinates'))blockers.push('CHECK_DISTRIBUTION_INSUFFICIENT');
    if(!text(r.distributionReview)||r.distributionReview==='UNKNOWN')blockers.push('DISTRIBUTION_REVIEW_MISSING');
    if(!text(r.distortionReview)||r.distortionReview==='UNKNOWN')blockers.push('AFFINE_DISTORTION_REVIEW_MISSING');
    if(!r.accuracyPlan || !finite(r.accuracyPlan.maxCheckResidualMetres)||r.accuracyPlan.maxCheckResidualMetres<=0||!text(r.accuracyPlan.basis)||r.accuracyPlan.basis==='UNKNOWN')blockers.push('ACCURACY_PLAN_MISSING');
    results.push({id:r.id,acceptedFit:fit.length,independentCheck:check.length,candidateSet:blockers.length?'INSUFFICIENT':'PRECONDITIONS_RECORDED',blockers,transformation:'NOT_TESTED',residuals:null,placementAllowed:false,historicalLocation:'UNKNOWN'});
  }
  if(used.size!==candidates.size)fail('orphan candidate');
  return {technicalStatus:'PASS',dataKind:ledger.dataKind,meaning:'metadata consistency only; identity evidence requires independent human review',method:CONTRACT.method,transformationExecutionAllowed:false,regions:results};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const read=p=>JSON.parse(readFileSync(p,'utf8'));
  console.log(JSON.stringify(inspect(read('research/stage3b3/ledger.json'),read('research/stage3b3/sources.json')),null,2));
}
