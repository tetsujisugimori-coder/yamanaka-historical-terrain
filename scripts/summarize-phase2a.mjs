import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const reports={};
for(const [name,file,count,expected]of [
 ['newBrowser','evidence/phase2a/browser.json',16,'PASS'],
 ['newFallback','evidence/phase2a/fallback.json',12,'PASS'],
 ['mutationControls','evidence/phase2a/negative-controls.json',4,'FAIL'],
 ['regressionBrowser','evidence/browser-results.json',16,'PASS'],
 ['regressionFallback','evidence/fallback-results.json',10,'PASS'],
 ['interactionCycles','evidence/interaction-cycles.json',2,'PASS']
]){
 const r=await read(file);assert.equal(r.results.length,count,file);assert.ok(r.results.every(x=>x.status===expected),file);
 if(name==='mutationControls')assert.ok(r.results.every(x=>x.mutationApplied));
 for(const [file,sha]of Object.entries(r.sourceHashes??{}))assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),sha,'stale browser receipt '+file);
 reports[name]={file,cases:count,result:expected,interpretation:expected==='FAIL'?'expected detection of deliberate implementation mutation':'all requested checks in these cases passed'};
}
for(const kind of ['gis','blender','gis-check','blender-check']){
 const file=`evidence/phase2a/${kind}.json`,r=await read(file);assert.equal(r.status,'PASS');assert.equal(r.exitCode,0);assert.equal(r.details.workerStatus,'CHECKS_AND_TEARDOWN_RETURNED');
 for(const [file,sha]of Object.entries(r.hashes))assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),sha,'stale native receipt '+file);
 reports[kind]={file,status:r.status,actualExitCode:r.exitCode};
}
const preservation=await read('evidence/phase2a/preservation.json');assert.ok(preservation.preservation.every(x=>x.unchanged));
const unit=await readFile('evidence/phase2a/unit-tests.txt','utf8');assert.match(unit,/pass\s+18/);assert.match(unit,/fail\s+0/);assert.match(unit,/skipped\s+0/);
const result={utc:new Date().toISOString(),overall:'PARTIAL',technicalAcceptance:'PASS',unit:{cases:18,pass:18,fail:0,skip:0},reports,protectedFiles:preservation.preservation.length,newFacilities:{B:0,C:5},independentReview:'NOT_VERIFIED',mergeRecommendation:'NO before independent review',notTested:['physical iPhone Safari','VoiceOver','field survey','physical device memory/thermal load','trusted continuous touch drag in WebKit'],unknowns:['historic placement/dimensions and georeference residual; 0 control points','phase1 QGIS internal crash root cause','phase1 browser timeout root cause','intermediate new GLB requestfailed/25s timeout root cause'],publication:'no deployment, merge or auto-merge performed; Issue #1 remains OPEN'};
await writeFile('evidence/phase2a/summary.json',JSON.stringify(result,null,2));console.log(JSON.stringify({overall:result.overall,technical:result.technicalAcceptance,unit:18,normalBrowser:32,faults:22,cycles:2,expectedMutationFailures:4,protectedFiles:result.protectedFiles}));
