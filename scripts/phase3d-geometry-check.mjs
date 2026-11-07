import {writeFileSync} from 'node:fs';
import {readMeshes,validate,checkImmutable,negativeControls} from '../tests/phase3d-geometry.mjs';
checkImmutable();const meshes=readMeshes('public/data/phase3d.glb'),report={status:'PASS',measurement:validate(meshes),negativeControls:negativeControls(meshes)};
writeFileSync('production/phase3d/geometry-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
