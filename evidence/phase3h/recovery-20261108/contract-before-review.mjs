// Preserved draft before the independent comment-decoy review. Not a production module.
import {readFileSync,existsSync} from 'node:fs';
export function activeTerrainContract(source=readFileSync('src/main.js','utf8')) {
 const glbs=[...source.matchAll(/variant==='current'\?'castle':'(phase3[a-z]+)'/g)].map(m=>m[1]);
 const unique=[...new Set(glbs)];
 if(unique.length!==1)throw Error('Active terrain GLB must be uniquely identified');
 const stem=unique[0];
 if(!source.includes(`'data/${stem}.json'`))throw Error('Active metadata and GLB version mismatch');
 for(const ext of ['json','glb'])if(!existsSync(`public/data/${stem}.${ext}`))throw Error('Active terrain asset missing');
 return {stem,glb:`public/data/${stem}.glb`,metadata:`public/data/${stem}.json`,route:`**/data/${stem}.glb`};
}
