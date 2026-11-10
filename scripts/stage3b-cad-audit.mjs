/** Asset-local audit only: never substitute these bounds for runtime ground placement. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {modelBounds} from './stage3b-overview-generate.mjs';
import {ORIGIN} from '../src/coordinates.js';
const pin=JSON.parse(fs.readFileSync('public/parts/cad/pin.json'));
if(pin.units!=='metres'||pin.axes!=='east,up,south'||pin.category!=='D')throw Error('CAD coordinate contract');
const records=[];
for(const revision of ['B0','B1','B2']){
 const file=pin.revisions[revision].files['assembly.glb'];const bytes=fs.readFileSync('public/'+file.path);const hash=crypto.createHash('sha256').update(bytes).digest('hex');if(hash!==file.sha256)throw Error('CAD hash mismatch');const meshes=modelBounds(bytes);
 const min=[0,1,2].map(k=>Math.min(...meshes.map(m=>m.min[k]))),max=[0,1,2].map(k=>Math.max(...meshes.map(m=>m.max[k])));
 records.push({revision,asset:file.path,sha256:hash,upstreamCommit:pin.commit,category:'D',localBounds:{min,max},meshCount:meshes.length,vertices:meshes.reduce((n,m)=>n+m.vertices,0),placementCategory:'C',historicalPosition:'UNKNOWN',runtimeHeight:'NOT_TESTED',runtimeEnvelope:'NOT_TESTED'});
}
const report={schemaVersion:1,method:'Decode actual GLB vertices and hierarchy, verify pinned hash. No supporting-surface or user-yaw assumption.',records,defaultAnchor:{source:'src/main.js syncParts placement',localEast:-20,localNorth:0,epsg6676:[ORIGIN.easting-20,ORIGIN.northing],interpretation:'Configured default anchor only, not surveyed historical position. Runtime rotation 0/45/90 and ground support are separate.'},limitations:['Runtime scene placement and support heights not remeasured','Approximate 89mm prior support residual is prior Stage3A evidence, not a new measurement','Runtime vegetation and legacy palisade remain outside this asset audit']};
fs.writeFileSync('evidence/stage3b/cad-local-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(records.map(({revision,meshCount,vertices})=>({revision,meshCount,vertices}))));
