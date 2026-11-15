import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {inspect,CONTRACT} from '../scripts/stage3b3-evidence.mjs';

// Purely synthetic metadata/coordinate controls, never real survey observations.
const source=(id,group)=>({id,url:'https://example.org/'+id,locator:'synthetic fixture only',inspection:'FIGURE',provenanceGroup:group,title:'synthetic',publisher:'fixture',year:null,type:'SYNTHETIC',accessState:'SYNTHETIC',rights:'fixture',permittedResearchUse:true,researchUseEvidence:'synthetic data authored for tests',accessedAt:'2026-11-15T00:00:00Z'});
const sources=[source('old','old-original'),source('current','current-survey')];
const coord=(values,sourceId)=>({values,crs:'EPSG:6676',unit:'m',axisOrder:'E,N',method:'synthetic exact construction plus declared noise',sourceId,locator:'fixture',uncertainty:{value:0.01,unit:'m',basis:'synthetic bound, not historic accuracy'}});
function fixture(eligible=false) {
  const l={schemaVersion:1,baseline:CONTRACT.baseline,dataKind:'SYNTHETIC_FIXTURE',placementAllowed:false,crs:'EPSG:6676',unit:'m',axisOrder:'E,N',origin:[44862.121277226666,-93478.07235405142,0],vertical:'GSI published orthometric height, m; no ellipsoid conversion; measurement epoch/individual datum revision UNKNOWN',webAxes:'x=E-E0, y=H, z=-(N-N0)',regions:[],candidates:[]};
  for(const [id,name]of [['nishinomaru','西ノ丸'],['nishi-yagura','西櫓']]) {
    const r={id,name,sourceIds:['old','current'],candidateIds:[],status:'unplaced',geometry:null,transformStatus:'NOT_TESTED',transform:null,fitPointIds:[],checkPointIds:[],fitRmseMetres:null,checkRmseMetres:null,maxResidualMetres:null,historyCertainty:'UNKNOWN',reason:'synthetic gate control, no real transformation'};
    const positions=eligible?[[0,0],[100,0],[0,100],[20,20],[65,20]]:[[0,0]];
    for(const [i,xy]of positions.entries()) {
      const p={id:id+'-'+i,regionId:id,name:'synthetic point '+i,sourceId:'old',locator:'fixture',currentEvidence:'synthetic current source',alterationEvidence:'synthetic stable point',identity:eligible?'VERIFIED':'UNKNOWN',identityEvidence:'synthetic identity',decision:eligible?'ACCEPTED':'HELD',reason:'synthetic control',role:eligible?(i<3?'FIT':'CHECK'):'NONE',independenceGroup:id+'-physical-'+i,evidenceSourceIds:['old','current'],sourceCoordinates:eligible?coord(xy,'old'):null,currentCoordinates:eligible?coord(xy.map(v=>v+200),'current'):null};
      l.candidates.push(p);r.candidateIds.push(p.id);if(p.role==='FIT')r.fitPointIds.push(p.id);if(p.role==='CHECK')r.checkPointIds.push(p.id);
    }
    if(eligible){r.distributionReview='synthetic triangle/check distribution reviewed';r.distortionReview='synthetic affine geometry; not original drawing';r.accuracyPlan={maxCheckResidualMetres:0.1,basis:'synthetic only'}};
    l.regions.push(r);
  }
  return {l,s:structuredClone(sources)};
}

test('synthetic held baseline is valid but insufficient, no execution/placement authorization',()=>{
  const {l,s}=fixture();const r=inspect(l,s);assert.equal(r.technicalStatus,'PASS');assert.equal(r.dataKind,'SYNTHETIC_FIXTURE');assert.equal(r.transformationExecutionAllowed,false);assert.ok(r.regions.every(x=>x.candidateSet==='INSUFFICIENT'&&x.residuals===null&&x.placementAllowed===false));
});
test('synthetic recorded preconditions still NOT_TESTED and no historical proof',()=>{
  const {l,s}=fixture(true);const r=inspect(l,s);assert.equal(r.transformationExecutionAllowed,false);assert.ok(r.regions.every(x=>x.candidateSet==='PRECONDITIONS_RECORDED'&&x.transformation==='NOT_TESTED'&&x.historicalLocation==='UNKNOWN'));
});
const faults=[
 ['baseline corruption',l=>l.baseline='0'.repeat(40),/baseline/],
 ['unknown data origin',l=>l.dataKind='OBSERVED',/data kind/],
 ['source omission',(_l,s)=>s.pop(),/reference|provenance|source/],
 ['source duplicate',(_l,s)=>s.push(structuredClone(s[0])),/source: duplicate/],
 ['source URL omission',(_l,s)=>delete s[0].url,/url missing/],
 ['source title omission',(_l,s)=>delete s[0].title,/title missing/],
 ['source inspection invented',(_l,s)=>s[0].inspection='VERIFIED',/inspection invalid/],
 ['source date invalid',(_l,s)=>s[0].accessedAt='no date',/date invalid/],
 ['source locator omission',(_l,s)=>delete s[0].locator,/locator missing/],
 ['candidate duplicate',l=>l.candidates.push(structuredClone(l.candidates[0])),/candidate: duplicate/],
 ['candidate source missing',l=>l.candidates[0].sourceId='absent',/candidate region\/source/],
 ['candidate current evidence missing',l=>delete l.candidates[0].currentEvidence,/currentEvidence missing/],
 ['candidate alteration evidence missing',l=>delete l.candidates[0].alterationEvidence,/alterationEvidence missing/],
 ['candidate identity evidence missing',l=>delete l.candidates[0].identityEvidence,/identityEvidence missing/],
 ['region name mismatch',l=>l.regions[0].name='西櫓',/name\/ID/],
 ['region scope expansion',l=>l.regions[0].id='motonishi-yagura',/scope/],
 ['orphan candidate',l=>l.regions[0].candidateIds=[],/orphan/],
 ['wrong-region candidate',l=>l.candidates[0].regionId='nishi-yagura',/candidate region\/provenance/],
 ['missing region sources',l=>l.regions[0].sourceIds=[],/sources empty/],
 ['duplicate candidate ref',l=>l.regions[0].candidateIds.push(l.regions[0].candidateIds[0]),/duplicate reference/],
 ['rejected candidate mixed into fit',l=>{l.candidates[0].decision='REJECTED';l.candidates[0].role='FIT';l.regions[0].fitPointIds=[l.candidates[0].id];},/unaccepted/],
 ['held candidate mixed into fit',l=>l.regions[0].fitPointIds=[l.candidates[0].id],/unaccepted/],
 ['fit/check same point',l=>{l.regions[0].fitPointIds=[l.candidates[0].id];l.regions[0].checkPointIds=[l.candidates[0].id];},/overlap/],
 ['source number without CRS',l=>{l.candidates[0].sourceCoordinates=coord([1,2],'old');l.candidates[0].sourceCoordinates.crs='UNKNOWN';},/CRS\/unit\/axes/],
 ['source number without unit',l=>{l.candidates[0].sourceCoordinates=coord([1,2],'old');l.candidates[0].sourceCoordinates.unit='UNKNOWN';},/CRS\/unit\/axes/],
 ['source number without provenance',l=>{l.candidates[0].sourceCoordinates=coord([1,2],'missing');},/coordinate provenance/],
 ['source number without uncertainty',l=>{l.candidates[0].sourceCoordinates=coord([1,2],'old');l.candidates[0].sourceCoordinates.uncertainty.value=null;},/uncertainty/],
 ['nonfinite source number',l=>{l.candidates[0].sourceCoordinates=coord([Infinity,2],'old');},/finite XY/],
 ['string coordinate',l=>{l.candidates[0].sourceCoordinates=coord(['1',2],'old');},/finite XY/],
 ['axis mismatch',l=>l.axisOrder='N,E',/axes/],
 ['web axis reversal',l=>l.webAxes='x=N,y=H,z=E',/web axes/],
 ['vertical reference substituted',l=>l.vertical='ellipsoidal',/vertical/],
 ['geometry promoted',l=>l.regions[0].geometry={type:'Point',coordinates:[1,2]},/promotion/],
 ['status promoted',l=>l.regions[0].status='placed',/promotion/],
 ['placement enabled',l=>l.placementAllowed=true,/placement promotion/],
 ['invented zero residual',l=>l.regions[0].fitRmseMetres=0,/residual/],
 ['transform success claim',l=>l.regions[0].transformStatus='PASS',/promotion/],
 ['historical certainty promoted',l=>l.regions[0].historyCertainty='PASS',/promotion/],
];
for(const [name,mutate,error]of faults)test('reject '+name,()=>{const {l,s}=fixture();mutate(l,s);assert.throws(()=>inspect(l,s),error);});
for(const [name,mutate,error]of [
 ['catalogue coordinates',(_l,s)=>s[0].inspection='CATALOGUE',/uninspected source/],
 ['unverified identity',l=>l.candidates[0].identity='UNKNOWN',/lacks evidence/],
 ['copy counted as independent evidence',(_l,s)=>s[1].provenanceGroup=s[0].provenanceGroup,/lineage/],
 ['unknown independent provenance',(_l,s)=>s[1].provenanceGroup='UNKNOWN',/lineage/],
 ['duplicate coordinate fit/check with distinct group',l=>l.candidates[3].sourceCoordinates.values=[0,0],/duplicate coordinate/],
 ['duplicate physical point',l=>l.candidates[1].independenceGroup=l.candidates[0].independenceGroup,/physical-point/],
 ['accepted point omitted',l=>l.regions[0].fitPointIds.pop(),/omitted/],
 ['mixed unit',l=>{l.candidates[0].sourceCoordinates.unit='mm';l.candidates[0].sourceCoordinates.uncertainty.unit='mm';},/mixed coordinate/],
 ['current frame mismatch',l=>l.candidates[0].currentCoordinates.crs='EPSG:4326',/target mismatch/],
 ['false role',l=>l.candidates[0].role='CHECK',/wrong-role/],
 ['identity not tied to coordinate source',l=>{l.candidates[0].evidenceSourceIds=['current'];},/lineage|provenance/],
 ['zero uncertainty in real survey',l=>{l.dataKind='REAL_RESEARCH';l.candidates[0].sourceCoordinates.uncertainty.value=0;},/uncertainty/],
])test('reject accepted '+name,()=>{const {l,s}=fixture(true);mutate(l,s);assert.throws(()=>inspect(l,s),error);});
for(const [name,mutate,blocker]of [
 ['collinear fit',l=>{for(const [i,p] of l.candidates.filter(p=>p.role==='FIT').entries())p.sourceCoordinates.values=[i*50,0];},'FIT_GEOMETRY_OR_UNCERTAINTY_INSUFFICIENT'],
 ['near-collinear fit',l=>{l.candidates[2].sourceCoordinates.values=[50,0.01];},'FIT_GEOMETRY_OR_UNCERTAINTY_INSUFFICIENT'],
 ['uncertainty exceeds geometry',l=>{for(const p of l.candidates)p.sourceCoordinates.uncertainty.value=100;},'FIT_GEOMETRY_OR_UNCERTAINTY_INSUFFICIENT'],
 ['too-close checks',l=>l.candidates[4].sourceCoordinates.values=[20.001,20],'CHECK_DISTRIBUTION_INSUFFICIENT'],
 ['finite input arithmetic overflow',l=>l.candidates[2].sourceCoordinates.values=[1e308,1e308],'FIT_GEOMETRY_OR_UNCERTAINTY_INSUFFICIENT'],
 ['check outside fit envelope',l=>l.candidates[4].sourceCoordinates.values=[120,20],'CHECK_DISTRIBUTION_INSUFFICIENT'],
 ['distribution review absent',l=>delete l.regions[0].distributionReview,'DISTRIBUTION_REVIEW_MISSING'],
 ['distortion review absent',l=>delete l.regions[0].distortionReview,'AFFINE_DISTORTION_REVIEW_MISSING'],
 ['accuracy criterion absent',l=>delete l.regions[0].accuracyPlan,'ACCURACY_PLAN_MISSING'],
])test('block calculation preconditions: '+name,()=>{const {l,s}=fixture(true);mutate(l,s);const r=inspect(l,s);assert.equal(r.regions[0].candidateSet,'INSUFFICIENT');assert.ok(r.regions[0].blockers.includes(blocker));assert.equal(r.transformationExecutionAllowed,false);});

test('research-use UNKNOWN blocks even synthetic geometric preconditions',()=>{const {l,s}=fixture(true);delete s[0].permittedResearchUse;const r=inspect(l,s);assert.ok(r.regions.every(x=>x.candidateSet==='INSUFFICIENT'&&x.blockers.includes('RESEARCH_USE_NOT_CONFIRMED')));});

test('committed real ledger is not a synthetic result',()=>{
  assert.ok(existsSync('research/stage3b3/ledger.json'),'research ledger required, do not silently skip');
  const l=JSON.parse(readFileSync('research/stage3b3/ledger.json','utf8')),s=JSON.parse(readFileSync('research/stage3b3/sources.json','utf8'));
  const r=inspect(l,s);assert.equal(r.dataKind,'REAL_RESEARCH');assert.equal(r.transformationExecutionAllowed,false);assert.ok(r.regions.every(x=>x.candidateSet==='INSUFFICIENT'&&x.acceptedFit===0&&x.independentCheck===0));
});

for(const decision of ['HELD','REJECTED']) for(const [kind,value] of [['missing',['nonexistent-source']],['duplicate',['old','old']],['absent',undefined]]) test(`reject ${decision} ${kind} evidence references`,()=>{const {l,s}=fixture();l.candidates[0].decision=decision;l.candidates[0].evidenceSourceIds=value;assert.throws(()=>inspect(l,s),/identity evidence/);});
