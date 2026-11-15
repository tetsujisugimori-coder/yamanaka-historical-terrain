import {ORIGIN} from './coordinates.js';
export const INFERRED_REGION_NAMES=Object.freeze({honmaru:'本丸',ninomaru:'二ノ丸',kitanomaru:'北ノ丸',nishinomaru:'西ノ丸','motonishi-yagura':'元西櫓','nishi-yagura':'西櫓',sannomaru:'三ノ丸',daizaki:'岱崎出丸','minami-yagura':'南櫓',raoshiba:'ラオシバ',nishikido:'西木戸'});
const text=v=>typeof v==='string'&&v.trim().length>0;
const insist=(ok,why)=>{if(!ok)throw Error(`Inferred regions: ${why}`);};
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const between=(a,b,c)=>Math.min(a[0],b[0])<=c[0]&&c[0]<=Math.max(a[0],b[0])&&Math.min(a[1],b[1])<=c[1]&&c[1]<=Math.max(a[1],b[1]);
function intersects(a,b,c,d){const p=cross(a,b,c),q=cross(a,b,d),r=cross(c,d,a),s=cross(c,d,b);return(p*q<0&&r*s<0)||(p===0&&between(a,b,c))||(q===0&&between(a,b,d))||(r===0&&between(c,d,a))||(s===0&&between(c,d,b));}
export function validateInferredPolygon(g){
 insist(g?.type==='Polygon'&&Array.isArray(g.coordinates)&&g.coordinates.length===1,'single Polygon ring required');
 const ring=g.coordinates[0];insist(Array.isArray(ring)&&ring.length>=4&&ring.length<=513,'polygon point count');
 for(const p of ring)insist(Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&Math.abs(p[0]-ORIGIN.easting)<=10000&&Math.abs(p[1]-ORIGIN.northing)<=10000,'invalid coordinate');
 insist(same(ring[0],ring.at(-1)),'polygon not closed');const points=ring.slice(0,-1);insist(new Set(points.map(p=>JSON.stringify(p))).size===points.length,'duplicate polygon point');
 let area=0;for(let i=1;i<ring.length-1;i++)area+=cross(ring[0],ring[i],ring[i+1]);insist(Math.abs(area)>1e-6,'degenerate polygon');
 for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){if(j===i+1||(i===0&&j===points.length-1))continue;insist(!intersects(ring[i],ring[i+1],ring[j],ring[j+1]),'self intersecting polygon');}
 // Adjacent collinear reversal can overlap even though edges share an endpoint.
 for(let i=0;i<points.length;i++){const a=points[(i+points.length-1)%points.length],b=points[i],c=points[(i+1)%points.length];insist(!(cross(a,b,c)===0&&((a[0]-b[0])*(c[0]-b[0])+(a[1]-b[1])*(c[1]-b[1])>0)),'overlapping adjacent edges');}
 return g;
}
/** Structural acceptance is not historical authentication or a permission grant. */
export function validateInferredRegions(d,{allowSynthetic=false}={}){
 insist(d?.schemaVersion===1,'schema');insist(d.dataKind==='REAL_RESEARCH'||allowSynthetic&&d.dataKind==='SYNTHETIC','synthetic/data kind prohibited');
 insist(d.crs==='EPSG:6676'&&d.unit==='m'&&d.axisOrder==='E,N','coordinate contract');
 insist(d.defaultVisible===false&&d.displayOffsetMetres===4&&text(d.displayOffsetMeaning)&&d.stage3B==='HOLD','display or stage contract');
 insist(Array.isArray(d.sources)&&d.sources.length>0,'sources missing');const sourceIds=new Set();
 for(const s of d.sources){insist(text(s.id)&&!sourceIds.has(s.id),'source identity');sourceIds.add(s.id);let u;try{u=new URL(s.url);}catch{throw Error('Inferred regions: source URL');}insist(u.protocol==='https:'&&text(s.title)&&text(s.recordPath)&&/^[a-f0-9]{64}$/.test(s.recordSha256),'source provenance');}
 insist(Array.isArray(d.regions)&&d.regions.length===Object.keys(INFERRED_REGION_NAMES).length,'region set');const ids=new Set(),candidates=new Set();
 for(const r of d.regions){
  insist(Object.hasOwn(INFERRED_REGION_NAMES,r.regionId)&&r.name===INFERRED_REGION_NAMES[r.regionId]&&!ids.has(r.regionId),'region identity');ids.add(r.regionId);
  insist(text(r.candidateId)&&!candidates.has(r.candidateId),'candidate identity');candidates.add(r.candidateId);
  insist(r.evidenceCategory==='C'&&r.historicalPosition==='UNKNOWN','historical promotion');
  insist(r.precision?.status==='UNKNOWN'&&r.precision.metres===null&&r.transformStatus==='NOT_TESTED'&&r.residualMetres===null,'precision or transformation claim');
  insist(Array.isArray(r.sourceRefs)&&r.sourceRefs.length>0&&r.sourceRefs.every(ref=>sourceIds.has(ref.id)&&text(ref.locator)),'source reference');
  insist(['directStatement','statementBasis','inferenceProcedure','decisionReason'].every(k=>text(r[k]))&&Array.isArray(r.limitations)&&r.limitations.length>0&&r.limitations.every(text),'reasoning missing');
  insist(['UNPLACED','ACCEPTED_C'].includes(r.status),'candidate status');
  if(r.status==='UNPLACED')insist(r.geometry===null&&r.geometryBasis===null,'unplaced geometry');
  else{
   validateInferredPolygon(r.geometry);const b=r.geometryBasis;
   insist(b&&text(b.method)&&Array.isArray(b.steps)&&b.steps.length>0&&b.steps.every(text)&&sourceIds.has(b.coordinateSourceRef)&&r.sourceRefs.some(ref=>ref.id===b.coordinateSourceRef),'geometry procedure');
  }
 }
 return d;
}
