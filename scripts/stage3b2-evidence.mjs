// Read-only evidence gate. This phase deliberately cannot authorize placement.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
export function inspect(ledger,sources){
 const fail=m=>{throw Error(m)};
 if(ledger.baseline!=='6d580aeb61a3b6b8f2d64b3c8f1ab45272c7b087')fail('baseline mismatch');
 if(ledger.vertical!=='GSI published orthometric height, m; no ellipsoid conversion; measurement epoch/individual datum revision UNKNOWN')fail('vertical mismatch');
 if(ledger.webAxes!=='x=E-E0, y=H, z=-(N-N0)')fail('axes mismatch');
 if(ledger.crs!=='EPSG:6676')fail('CRS mismatch');
 if(JSON.stringify(ledger.origin)!==JSON.stringify([44862.121277226666,-93478.07235405142,0]))fail('origin mismatch');
 const ids=['nishinomaru','nishi-yagura'];
 if(JSON.stringify(ledger.regions.map(x=>x.id).sort())!==JSON.stringify(ids.sort()))fail('scope mismatch');
 if(ledger.controlPoints.length!==4)fail('control set mismatch');
 const expectedSources=['gsi-dem','mishima-repair','mishima-works','plan-2023','report-1983','wood-1995'];
 if(new Set(sources.map(s=>s.id)).size!==sources.length)fail('duplicate source');
 if(JSON.stringify(sources.map(s=>s.id).sort())!==JSON.stringify(expectedSources))fail('source missing or extra');
 const refs=new Map(sources.map(s=>[s.id,s]));if(refs.size!==sources.length)fail('duplicate source');
 const controls=new Map(ledger.controlPoints.map(c=>[c.id,c]));if(controls.size!==ledger.controlPoints.length)fail('duplicate control');
 for(const r of ledger.regions){
  if(JSON.stringify([...r.sourceIds].sort())!==JSON.stringify(['mishima-repair','mishima-works','plan-2023']))fail('source missing');
  if(JSON.stringify([...r.controlPointIds].sort())!==JSON.stringify([r.id+'-candidate-1',r.id+'-candidate-2']))fail('control provenance');
  for(const id of r.sourceIds){const s=refs.get(id);if(!s?.url||!s?.inspection||!s?.locator)fail('source missing');}
  if(r.status!=='unplaced'||r.geometry!==null||r.transform!==null||ledger.placementAllowed!==false)fail('unproven placement');
  for(const key of ['fitRmseMetres','checkRmseMetres','maxResidualMetres','acceptanceToleranceMetres'])if(r[key]!==null)fail('invented residual/tolerance');
  if(r.acceptedFitCount!==0||r.independentCheckCount!==0)fail('unsupported accepted control');
  if(!r.reason||r.distortion!=='UNKNOWN')fail('unsupported certainty');
  for(const id of r.controlPointIds){const c=controls.get(id);if(!c||c.regionId!==r.id||!refs.has(c.sourceId)||!c.locator||!c.reason)fail('control provenance');}
 }
 for(const c of controls.values())if(!ids.includes(c.regionId)||c.accepted!==false||c.role!=='rejected'||c.sourceCoordinates!==null||c.currentCoordinates!==null)fail('unsupported control identity');
 return {status:'PASS',meaning:'ledger consistency / unproven placement rejected; not historical location acceptance',regions:2,placed:0,acceptedControls:0,transformation:'NOT_TESTED',residuals:null};
}
export function inspectArtifacts(ledger,gis,differences,models){
 const fail=m=>{throw Error(m)};
 if(gis.type!=='FeatureCollection'||gis.features.length!==2)fail('GIS scope');
 const ids=ledger.regions.map(r=>r.id).sort();
 if(JSON.stringify(gis.features.map(f=>f.id).sort())!==JSON.stringify(ids))fail('GIS identity');
 for(const f of gis.features){const r=ledger.regions.find(r=>r.id===f.id);if(f.geometry!==null||f.properties.status!==r.status||f.properties.name!==r.name)fail('GIS unplaced contract');}
 if(models.length!==22||differences.length!==22||new Set(differences.map(d=>d.modelId)).size!==22)fail('model set');
 for(const d of differences){const m=models.find(m=>m.id===d.modelId);if(!m||d.sourceAsset!==m.sourceAsset||d.sha256!==m.sha256||d.historicalDistanceMetres!==null||d.direction!==null||d.status!=='UNKNOWN'||!d.reason)fail('model difference provenance');}
 return {gis:2,models:22,status:'PASS'};
}
const read=p=>JSON.parse(readFileSync(p));
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const ledger=read('research/stage3b2/ledger.json');
 console.log(JSON.stringify({...inspect(ledger,read('research/stage3b2/sources.json')),artifacts:inspectArtifacts(ledger,read('research/stage3b2/unplaced.geojson'),read('research/stage3b2/model-differences.json'),read('public/data/castle-overview.json').models)},null,2));
}
