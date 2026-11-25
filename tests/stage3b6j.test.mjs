import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,mkdtempSync,writeFileSync,readFileSync,existsSync,renameSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
test('B6j evidence-first faults and bounded signal ordering', {timeout:30000,skip:process.platform!=='linux'},()=>{
 mkdirSync('.work/stage3b6g/b6j-controls',{recursive:true});
 const out=mkdtempSync('.work/stage3b6g/b6j-controls/run-');
 const p=spawnSync('python3',['tests/stage3b6j.py',path.resolve(out)],{encoding:'utf8',timeout:25000});
 writeFileSync(path.join(out,'test.stdout'),p.stdout??'');writeFileSync(path.join(out,'test.stderr'),p.stderr??'');
 const ledger=path.join(out,'assertions.json');
 const before=existsSync(ledger)?readFileSync(ledger,'utf8'):null;
 if(before!==null)writeFileSync(path.join(out,'assertions-child-original.json'),before);
 let rows;
 try {
   rows=before===null?[]:JSON.parse(before);
   if(!Array.isArray(rows))throw Error('not array');
 } catch {rows=[];}
 if(rows.length===0)rows=[{case:'__unavailable__',status:'INCOMPLETE',pass:false,firstFailure:'ASSERTIONS_MISSING_OR_CORRUPT'}];
 for(const row of rows){
   if(row.status==='RUNNING'){
     row.status='INCOMPLETE';row.pass=false;
     row.firstFailure='HARNESS_TERMINATED_BEFORE_CASE_VERDICT';
   }
 }
 const pending=ledger+'.pending';
 writeFileSync(pending,JSON.stringify(rows,null,2));renameSync(pending,ledger);
 writeFileSync(path.join(out,'execution.json'),JSON.stringify({
   exit:p.status,signal:p.signal,error:p.error?.code??null,
   assertionCases:rows.length,nonPassCases:rows.filter(r=>r.status!=='PASS').length,
   status:p.status===0&&rows.length===18&&rows.every(r=>r.status==='PASS')?'PASS':'FAIL'
 }));
 const sealed=spawnSync('python3',['scripts/stage3b6h-artifacts.py','seal',path.resolve(out)],{encoding:'utf8',timeout:5000});
 assert.equal(sealed.status,0,'B6J_MANIFEST_SEAL_FAILED '+sealed.stderr);
 assert.equal(p.status,0,p.stdout+p.stderr);
 assert.equal(rows.length,18,'B6J_CONTROL_CASE_SET_INCOMPLETE');
 assert(rows.every(r=>r.status==='PASS'),'B6J_CONTROL_CASES_NOT_ALL_PASS');
});
test('B6j preserves hard bounds and browser collection order',()=>{
 const s=readFileSync('scripts/stage3b6g-supervisor.py','utf8');
 assert.match(s,/45000/);assert.match(s,/180000/);
 assert.match(s,/persist=False/);
 for(const name of ['stage3b6.yml','stage3b-overview.yml']){
  const w=readFileSync('.github/workflows/'+name,'utf8');
  const c=w.indexOf('Collect finite-process evidence');
  const b=Math.max(w.indexOf('Production guide matrix'),w.indexOf('Browser matrix and evidence'));
  assert(c>0&&b>c);assert.match(w.slice(c,b),/if: always\(\)/);
  assert(!/collect[^\n]*\|\|\s*true/.test(w));
  assert(!/continue-on-error: true/.test(w));
  assert.match(w,/include-hidden-files: true/);
 }
});
