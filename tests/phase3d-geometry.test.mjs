import test from 'node:test';
import {readMeshes,validate,checkImmutable,negativeControls} from './phase3d-geometry.mjs';
test('Phase3D actual GLB contact, clear route, connectivity and C ledger',()=>{checkImmutable();validate(readMeshes('public/data/phase3d.glb'));});
test('Phase3D rejects floating/buried posts, blocked route, low lintel and false B',()=>negativeControls(readMeshes('public/data/phase3d.glb')));
