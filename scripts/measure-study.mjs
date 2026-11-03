import {readGlb,meshData,measureStudy,assertStudyRange} from '../tests/glb-surface.mjs';
import {readFile,writeFile} from 'node:fs/promises';
const baseline=process.argv.includes('--baseline'),meta=JSON.parse(await readFile('public/data/study.json','utf8'));
const result=measureStudy(meshData(readGlb('public/data/castle.glb'),'A_castle_current'),meshData(readGlb('public/data/moat-study.glb'),'moat_study'),meta.bounds);
try{assertStudyRange(result);result.status='PASS';}catch(e){result.status='FAIL';result.reason=e.message;process.exitCode=1;}
await writeFile(`evidence/study-triangle-${baseline?'red':'results'}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
