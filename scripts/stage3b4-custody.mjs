// Metadata acceptance only: not an authentication of sources or a legal opinion.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const fail = m => { throw Error(m); };
const text = v => typeof v === 'string' && v.trim() && v !== 'UNKNOWN';
const states = ['UNKNOWN','CANDIDATE','CONFIRMED'];
export const FIELDS = ['existence','survival','location','viewing','acquisition'];
export const ACTIONS = ['A_LOCATION','B_VIEW','C_COPY_DOWNLOAD','D_ANALYZE_TRANSFORM','E_DERIVE','F_WEB_REDISTRIBUTE'];
const arr = (v,l) => {if(!Array.isArray(v))fail(`${l}: array required`);return v;};
const map = (v,l) => {const m=new Map();for(const r of arr(v,l)){if(!r||!text(r.id)||m.has(r.id))fail(`${l}: duplicate/missing ID`);m.set(r.id,r);}return m;};
const exact = (o,keys,l) => {if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).sort().join()!==[...keys].sort().join())fail(`${l}: schema keys`);};
const date = v => typeof v==='string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
export function validateCustody(d) {
  exact(d,['schemaVersion','kind','stage','placementAllowed','projects','sources','evidence','materials'],'ledger');
  if(d.schemaVersion!==1||!['REAL_RESEARCH','SYNTHETIC'].includes(d.kind)||d.stage!=='HOLD'||d.placementAllowed!==false)fail('scope: forbidden promotion');
  const projects=map(d.projects,'projects'),sources=map(d.sources,'sources'),evidence=map(d.evidence,'evidence'),materials=map(d.materials,'materials');
  if(projects.size!==2||!projects.has('survey-1972')||!projects.has('survey-2012'))fail('projects: fixed survey scope');
  for(const s of sources.values()) {
    exact(s,['id','url','title','locator','inspected','checkedAt','kind'],'source');
    if(!text(s.title)||!text(s.locator)||!date(s.checkedAt)||!['TEXT','CATALOGUE','FIGURE','NOT_OBTAINED'].includes(s.inspected)||!['PROJECT_RECORD','ITEM_RECORD','RIGHTS','GENERAL_POLICY','SYNTHETIC'].includes(s.kind))fail('source: incomplete metadata');
    if(!/^https:\/\//.test(s.url)&&!(d.kind==='SYNTHETIC'&&s.url.startsWith('fixture:')))fail('source: invalid URL');
    if(d.kind==='REAL_RESEARCH'&&s.kind==='SYNTHETIC')fail('source: synthetic cannot support real research');
  }
  for(const e of evidence.values()) {
    exact(e,['id','sourceId','subjectId','claim','basis','scope','observedAt'],'evidence');
    const s=sources.get(e.sourceId);
    if(!s||s.inspected==='NOT_OBTAINED'||!text(e.basis)||!date(e.observedAt)||!text(e.scope))fail('evidence: invalid or uninspected source');
    if(!projects.has(e.subjectId)&&!materials.has(e.subjectId))fail('evidence: unknown subject');
    if(!['PROJECT_EXECUTED',...FIELDS,...ACTIONS,'COPY_OF'].includes(e.claim))fail('evidence: unknown claim');
  }
  const refs=(ids,subject,claim,allowed)=>{
    arr(ids,'evidenceIds');if(new Set(ids).size!==ids.length)fail('evidenceIds: duplicate');
    for(const id of ids){const e=evidence.get(id);if(!e||e.subjectId!==subject||e.claim!==claim)fail('evidence: subject/claim mismatch');if(allowed&&!allowed.includes(sources.get(e.sourceId).kind))fail('evidence: wrong source type');}
  };
  for(const p of projects.values()){
    exact(p,['id','year','description','status','evidenceIds'],'project');
    if(!text(p.description)||p.year!==(p.id==='survey-1972'?1972:2012)||p.status!=='RECORDED')fail('project: invalid');
    refs(p.evidenceIds,p.id,'PROJECT_EXECUTED',['PROJECT_RECORD','SYNTHETIC']);if(!p.evidenceIds.length)fail('project: unsupported');
  }
  if(!materials.size)fail('materials: empty');
  const identities=new Set();
  for(const m of materials.values()){
    exact(m,['id','projectId','recordKind','searchDescription','formalName','materialNumber','institution','department','creator','year','scale','crs','verticalDatum','form','viewingPlace','viewingMethod','nextStep','unknowns','facts','rights','copyOf','copyEvidenceIds'],'material');
    if(!projects.has(m.projectId)||!['SEARCH_TARGET','ITEM'].includes(m.recordKind)||!text(m.searchDescription)||!text(m.nextStep)||!arr(m.unknowns,'unknowns').length)fail('material: incomplete');
    for(const k of ['formalName','materialNumber','institution','department','creator','year','scale','crs','verticalDatum','form','viewingPlace','viewingMethod'])if(m[k]!==null&&!text(m[k]))fail(`material: invalid ${k}`);
    if(m.form!==null&&!['original','copy','digital'].includes(m.form))fail('form: unknown type');
    if(m.copyOf!==null&&m.form!=='copy')fail('copy: relationship requires copy form');
    if(m.form==='copy'&&m.copyOf===null)fail('copy: original relationship required');
    for(const e of evidence.values())if(e.subjectId===m.id&&e.claim!=='COPY_OF'&&e.scope!==m.materialNumber)fail('identity: evidence scope does not match material number');
    exact(m.facts,FIELDS,'facts');exact(m.rights,ACTIONS,'rights');
    for(const field of FIELDS){const f=m.facts[field];exact(f,['status','evidenceIds'],field);if(!states.includes(f.status))fail('fact: invalid status');refs(f.evidenceIds,m.id,field,['ITEM_RECORD','SYNTHETIC']);if(f.status==='CONFIRMED'&&(!f.evidenceIds.length||m.recordKind!=='ITEM'||!text(m.formalName)||!text(m.materialNumber)))fail('fact: unsupported CONFIRMED');}
    if(m.recordKind==='SEARCH_TARGET'&&FIELDS.some(k=>m.facts[k].status==='CONFIRMED'))fail('search target is not an item');
    if(m.facts.location.status==='CONFIRMED'&&(!text(m.institution)||!text(m.viewingPlace)))fail('location: holder/place missing');
    for(const a of ACTIONS){const r=m.rights[a];exact(r,['status','evidenceIds','restrictions','checkedAt'],a);if(!['UNKNOWN','PERMITTED','RESTRICTED'].includes(r.status)||!text(r.restrictions)||!date(r.checkedAt))fail('rights: invalid');refs(r.evidenceIds,m.id,a,['RIGHTS','SYNTHETIC']);if(r.status!=='UNKNOWN'&&!r.evidenceIds.length)fail('rights: unsupported permission/restriction');if(r.status==='PERMITTED'&&(m.facts.existence.status!=='CONFIRMED'||m.recordKind!=='ITEM'))fail('rights: unidentified item');}
    if(m.recordKind==='ITEM'&&FIELDS.some(k=>k!=='existence'&&m.facts[k].status==='CONFIRMED')&&m.facts.existence.status!=='CONFIRMED')fail('facts: dependent CONFIRMED requires CONFIRMED existence');
    if(m.formalName&&m.materialNumber&&m.institution){const key=JSON.stringify([m.institution,m.materialNumber,m.form]);if(identities.has(key))fail('identity: duplicated material');identities.add(key);}
    refs(m.copyEvidenceIds,m.id,'COPY_OF',['ITEM_RECORD','SYNTHETIC']);
    if(m.copyOf!==null){const original=materials.get(m.copyOf);if(!original||m.copyOf===m.id||original.copyOf!==null||!m.copyEvidenceIds.length||m.recordKind!=='ITEM')fail('copy: missing/ambiguous original');if(original.recordKind!=='ITEM'||original.facts.existence.status!=='CONFIRMED')fail('copy: original must be confirmed ITEM');for(const id of m.copyEvidenceIds)if(evidence.get(id).scope!==m.copyOf)fail('copy: mismatched original');}
    else if(m.copyEvidenceIds.length)fail('copy: orphan evidence');
  }
  return {technical:'PASS',kind:d.kind,projects:projects.size,materials:materials.size,confirmedMaterials:[...materials.values()].filter(m=>m.facts.existence.status==='CONFIRMED').length,stage:'HOLD',placementAllowed:false,transformStatus:'NOT_TESTED',historicalPosition:'UNKNOWN'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(validateCustody(JSON.parse(fs.readFileSync(process.argv[2]||'research/stage3b4/ledger.json','utf8'))),null,2));
