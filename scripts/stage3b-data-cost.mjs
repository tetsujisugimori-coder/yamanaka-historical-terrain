import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {validateOverview} from '../src/castle-overview-contract.js';
const text=fs.readFileSync('public/data/castle-overview.json','utf8');
// Fixed ten blocks, 1000 iterations each, alternating order before any timing.
const plan=Array.from({length:10},(_,block)=>({block,order:block%2?['parseValidate','parse']:['parse','parseValidate']}));
const results=[];
for(const {block,order} of plan)for(const condition of order){const start=performance.now();for(let i=0;i<1000;i++){const d=JSON.parse(text);if(condition==='parseValidate')validateOverview(d);}results.push({block,condition,iterations:1000,milliseconds:performance.now()-start});}
fs.writeFileSync('evidence/stage3b/data-cost.json',JSON.stringify({scope:'Node JSON parse/validation CPU only, not browser load/render/input performance',node:process.version,platform:process.platform,bytes:Buffer.byteLength(text),plan,results,browserLoad:'NOT_TESTED',renderImpact:'NOT_TESTED',inputImpact:'NOT_TESTED',limitations:'Same data and process, no baseline scene rendering. No performance improvement claim.'},null,2)+'\n');
