import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {validateCustody,FIELDS,ACTIONS} from '../scripts/stage3b4-custody.mjs';
const base=()=>JSON.parse(fs.readFileSync('research/stage3b4/ledger.json','utf8'));
function normal(){const d=base();d.kind='SYNTHETIC';const m=d.materials[0];m.recordKind='ITEM';m.formalName='合成図面（実資料ではない）';m.materialNumber='FIXTURE-01';m.institution='合成所蔵館';m.form='original';m.viewingPlace='合成閲覧室';d.sources.push({id:'fixture',url:'fixture:test',title:'synthetic',locator:'item 01',inspected:'TEXT',checkedAt:'2026-11-15',kind:'SYNTHETIC'});for(const claim of [...FIELDS,...ACTIONS]){const id='fixture-'+claim;d.evidence.push({id,sourceId:'fixture',subjectId:m.id,claim,basis:'合成試験の明示根拠',scope:'FIXTURE-01',observedAt:'2026-11-15'});if(FIELDS.includes(claim))m.facts[claim]={status:'CONFIRMED',evidenceIds:[id]};else m.rights[claim]={status:'PERMITTED',evidenceIds:[id],restrictions:'合成試験のみ',checkedAt:'2026-11-15'};}return d;}
test('real records remain UNKNOWN, not historical validation',()=>{const r=validateCustody(base());assert.equal(r.confirmedMaterials,0);assert.equal(r.stage,'HOLD');assert.equal(r.placementAllowed,false);});
test('synthetic identified item accepted separately',()=>assert.equal(validateCustody(normal()).confirmedMaterials,1));
const faults=[
['foreign material number',d=>d.materials[0].materialNumber='FOREIGN-02',/evidence scope/],
['foreign permission scope',d=>d.evidence.find(e=>e.id==='fixture-F_WEB_REDISTRIBUTE').scope='FOREIGN-02',/evidence scope/],
['copy without original',d=>d.materials[0].form='copy',/original relationship/],
['unknown form',d=>d.materials[0].form='mystery',/unknown type/],
['missing number',d=>d.materials[0].materialNumber=null,/unsupported CONFIRMED|evidence scope/],
['empty evidence',d=>d.materials[0].facts.existence.evidenceIds=[],/unsupported CONFIRMED|evidence scope/],
['project record is not item evidence',d=>d.evidence.find(e=>e.id==='fixture-existence').sourceId=d.sources[0].id,/wrong source type/],
['unknown source',d=>d.evidence[0].sourceId='missing',/invalid or uninspected/],
['wrong subject',d=>d.evidence.find(e=>e.id==='fixture-existence').subjectId=d.materials[1].id,/subject\/claim mismatch/],
['wrong claim',d=>d.evidence.find(e=>e.id==='fixture-existence').claim='survival',/subject\/claim mismatch/],
['unknown permission cannot be promoted without evidence',d=>d.materials[0].rights.D_ANALYZE_TRANSFORM.evidenceIds=[],/unsupported permission/],
['general website policy is not item permission',d=>d.sources.find(s=>s.id==='fixture').kind='GENERAL_POLICY',/wrong source type/],
['unknown existence cannot permit reuse',d=>d.materials[0].facts.existence.status='UNKNOWN',/unidentified item/],
['different permission scope',d=>d.evidence.find(e=>e.id==='fixture-F_WEB_REDISTRIBUTE').claim='B_VIEW',/subject\/claim mismatch/],
['duplicate ID',d=>d.materials.push(structuredClone(d.materials[0])),/duplicate\/missing/],
['duplicate physical identity',d=>{const m=structuredClone(d.materials[0]);m.id='another';for(const x of Object.values(m.facts)){x.status='UNKNOWN';x.evidenceIds=[];}for(const x of Object.values(m.rights)){x.status='UNKNOWN';x.evidenceIds=[];}d.materials.push(m);},/duplicated material/],
['copy relationship unsupported',d=>{d.materials[0].form='copy';d.materials[0].copyOf=d.materials[1].id;},/missing\/ambiguous/],
['uninspected source',d=>d.sources.find(s=>s.id==='fixture').inspected='NOT_OBTAINED',/uninspected/],
['missing date',d=>d.evidence[0].observedAt=null,/uninspected/],
['unknown fact state',d=>d.materials[0].facts.survival.status='YES',/invalid status/],
['search target promotion',d=>d.materials[0].recordKind='SEARCH_TARGET',/unsupported CONFIRMED|evidence scope/],
['empty dataset',d=>d.materials=[],/empty|unknown subject/],
['placement promotion',d=>d.placementAllowed=true,/forbidden promotion/],
['synthetic evidence in real data',d=>d.kind='REAL_RESEARCH',/invalid URL|synthetic/],
['extra numeric coordinates',d=>d.materials[0].coordinates=[1,2],/schema keys/],
['missing holder',d=>d.materials[0].institution=null,/holder\/place/],
['duplicate evidence reference',d=>d.materials[0].facts.existence.evidenceIds.push('fixture-existence'),/duplicate/],
['invalid source URL',d=>d.sources[0].url='javascript:alert(1)',/invalid URL/],
];
for(const [name,mutate,reason] of faults){test('normal control for '+name,()=>assert.doesNotThrow(()=>validateCustody(normal())));test('reject '+name,()=>{const d=normal();mutate(d);assert.throws(()=>validateCustody(d),reason);});}
test('valid copy is distinct and linked, not a second independent original',()=>{const d=normal(),m=d.materials[1];m.recordKind='ITEM';m.form='copy';m.copyOf=d.materials[0].id;m.copyEvidenceIds=['copy'];d.evidence.push({id:'copy',sourceId:'fixture',subjectId:m.id,claim:'COPY_OF',basis:'合成複写の照合',scope:d.materials[0].id,observedAt:'2026-11-15'});assert.doesNotThrow(()=>validateCustody(d));d.evidence.at(-1).scope='other';assert.throws(()=>validateCustody(d),/mismatched original/);});
