import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {canonicalSha256} from './evidence-hash.mjs';
const commits={legacy:'77b015565b79493a05f45c6d959d459546e21526',defect:'bf5c4b66cd74f572b49a2015be571a8105f1f7e1'};
const unit=await readFile('evidence/review-fixes/unit-tests.txt','utf8');assert.match(unit,/pass\s+21/);assert.match(unit,/fail\s+0/);assert.match(unit,/skipped\s+0/);
const reports={};
for(const label of ['legacy','defect','fixed','mutation']){
 const report=reports[label]=JSON.parse(await readFile(`evidence/initial-camera/${label}.json`,'utf8'));
 assert.equal(report.results.length,['legacy','defect'].includes(label)?8:72);
 for(const [file,hash]of Object.entries(report.sourceHashes)){
  const bytes=commits[label]?execFileSync('git',['show',`${commits[label]}:${file}`],{maxBuffer:128*1024*1024}):await readFile(file);
  assert.equal(canonicalSha256(file,bytes),hash,`${label} stale receipt ${file}`);
 }
 for(const row of report.results){
  assert.equal(row.status,['defect','mutation'].includes(label)?'FAIL':'PASS');
  assert.deepEqual(row.pageerrors,[]);assert.ok(row.actual.inputs.length);assert.ok(row.actual.inputs.every(x=>x.trusted));
  if(['defect','mutation'].includes(label)){
   assert.equal(row.actual.d.state.ready,false);assert.equal(row.actual.d.modelBounds,null);assert.equal(row.actual.renderState,'loading');
  }
 }
}
const identity=r=>JSON.stringify([r.engine,r.input,r.outcome,r.width,r.motion]);
const fixed=new Map(reports.fixed.results.map(r=>[identity(r),r]));
const comparisons=reports.defect.results.map(r=>{
 const g=fixed.get(identity(r)),old=reports.legacy.results.find(x=>identity(x)===identity(r));
 assert.ok(g&&old);assert.equal(g.status,'PASS');
 return{engine:r.engine,input:r.input,outcome:r.outcome,legacy:old.status,defect:r.status,fixed:g.status,legacyRender:old.actual.renderState,defectRender:r.actual.renderState,fixedRender:g.actual.renderState};
});
const summary={overall:'PARTIAL',selfVerification:'PASS',independentReview:'NOT_VERIFIED; parent arranges separate reviewer',mergeRecommendation:'NO until independent review',commits,comparisons,fixedCases:72,mutationExpectedFailures:72,unit:{pass:21,fail:0,skip:0},scope:'Windows; real regional.glb; explicit response gate; trusted drag/wheel plus keyboard/tap; Chromium/WebKit; 375/390/765/1280; usual/reduced motion. Camera pose is preserved, not disabled.',unknowns:['Historical QGIS crash and old browser timeout causes remain UNKNOWN','Physical Safari/VoiceOver/field and 25MB real-device load remain NOT_TESTED','Native projects not regenerated or reopened in this repair']};
await writeFile('evidence/initial-camera/summary.json',JSON.stringify(summary,null,2));console.log(JSON.stringify({status:'PASS',comparisons:8,fixed:72,mutation:72}));
