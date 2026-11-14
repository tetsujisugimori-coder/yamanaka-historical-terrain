// Read-only evidence gate. This phase deliberately cannot authorize placement.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
export function inspect(ledger,sources){
 const fail=m=>{throw Error(m)};
 if(ledger.crs!=='EPSG:6676')fail('CRS mismatch');
 if(JSON.stringify(ledger.origin)!==JSON.stringify([44862.121277226666,-93478.07235405142,0]))fail('origin mismatch');
 const ids=['nishinomaru','nishi-yagura'];
 if(JSON.stringify(ledger.regions.map(x=>x.id).sort())!==JSON.stringify(ids.sort()))fail('scope mismatch');
 const refs=new Map(sources.map(s=>[s.id,s]));if(refs.size!==sources.length)fail('duplicate source');
 const controls=new Map(ledger.controlPoints.map(c=>[c.id,c]));if(controls.size!==ledger.controlPoints.length)fail('duplicate control');
 for(const r of ledger.regions){
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
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(inspect(JSON.parse(readFileSync('research/stage3b2/ledger.json')),JSON.parse(readFileSync('research/stage3b2/sources.json'))),null,2));
