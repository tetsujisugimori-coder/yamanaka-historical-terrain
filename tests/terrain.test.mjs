import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PerspectiveCamera,Vector3} from 'three';
import {ORIGIN,toWeb,fromWeb,sampleHeight} from '../src/coordinates.js';
import {groundScale} from '../src/scale.js';
import {meshData,triangleSurface,measureStudy,assertStudyRange} from './glb-surface.mjs';
const data=name=>JSON.parse(readFileSync(new URL(`../public/data/${name}.json`,import.meta.url)));
function glb(name){const b=readFileSync(new URL(`../public/data/${name}.glb`,import.meta.url));assert.equal(b.toString('ascii',0,4),'glTF');assert.equal(b.readUInt32LE(4),2);assert.equal(b.readUInt32LE(8),b.length);const len=b.readUInt32LE(12),g=JSON.parse(b.toString('utf8',20,20+len)),bin=b.subarray(28+len);return{g,bin};}
function positions(model,mesh){const primitive=model.g.meshes[mesh].primitives[0],a=model.g.accessors[primitive.attributes.POSITION],v=model.g.bufferViews[a.bufferView];assert.equal(a.componentType,5126);assert.equal(a.type,'VEC3');return Array.from({length:a.count},(_,i)=>[0,1,2].map(k=>model.bin.readFloatLE((v.byteOffset??0)+(a.byteOffset??0)+i*(v.byteStride??12)+k*4)));}
for(const name of ['regional','castle'])test(`${name}: all Blender-exported positions match GIS heights and metric axes`,()=>{
 const grid=data(name),model=glb(name),nodes=model.g.nodes.filter(n=>n.mesh!==undefined);assert.equal(nodes.length,1);assert.equal(nodes[0].extras.evidenceCategory,'A');assert.equal(nodes[0].extras.metresPerUnit,1);assert.ok(!nodes[0].matrix&&!nodes[0].rotation&&!nodes[0].scale,'axes baked into glTF vertices');
 const p=positions(model,nodes[0].mesh);assert.equal(p.length,grid.rows*grid.cols);const expected=new Map();for(let r=0;r<grid.rows;r++)for(let c=0;c<grid.cols;c++)expected.set(`${grid.bounds[0]+c*grid.step},${-(grid.bounds[3]-r*grid.step)}`,grid.heights[r][c]);let maxError=0;
 for(const [e,h,s]of p){const expectedH=expected.get(`${e},${s}`);assert.notEqual(expectedH,undefined,'horizontal coordinate on GIS grid');maxError=Math.max(maxError,Math.abs(h-expectedH));}assert.ok(maxError<.001,`maximum height error ${maxError}`);
});
test('projected/local conversion preserves cardinal orientation and 1 metre scale',()=>{
 const e=ORIGIN.easting,n=ORIGIN.northing;assert.deepEqual(toWeb(e+10,n+20,580),[10,580,-20]);assert.deepEqual(fromWeb(10,580,-20),[e+10,n+20,580]);assert.ok(toWeb(e,n,0).every(v=>v===0));
});
test('bilinear terrain sampler interpolates independent known plane',()=>{
 const grid={bounds:[0,0,10,10],step:10,cols:2,rows:2,heights:[[30,40],[10,20]]};assert.equal(sampleHeight(grid,5,5),25);assert.equal(sampleHeight(grid,2,8),28);
});
test('every observation anchor remains inside castle and regional measured bounds',()=>{
 for(const f of data('features'))for(const name of ['regional','castle']){const g=data(name),[e,n]=f.local;assert.ok(e>=g.bounds[0]&&e<=g.bounds[2]&&n>=g.bounds[1]&&n<=g.bounds[3]);assert.ok(Number.isFinite(sampleHeight(g,e,n)));}
});
test('inferred study cuts the terrain, meets the boundary and has no A category',()=>{
 const model=glb('moat-study'),meta=data('study');const nodes=model.g.nodes.filter(n=>n.mesh!==undefined);assert.equal(nodes.length,2);assert.ok(nodes.every(n=>n.extras.evidenceCategory==='C'));const patch=nodes.find(n=>n.name.includes('moat_study'));assert.ok(patch.extras.unknowns.includes('UNKNOWN'));
 const measured=measureStudy(meshData(glb('castle'),'A_castle_current'),meshData(model,'moat_study'),meta.bounds);assertStudyRange(measured);assert.ok(Math.abs(measured.maxBelow-1.8)<.001);
 const terrain=nodes.find(n=>n.name.includes('cutout')),mesh=model.g.meshes[terrain.mesh].primitives[0],pa=positions(model,terrain.mesh),ia=model.g.accessors[mesh.indices],iv=model.g.bufferViews[ia.bufferView];const bytes=ia.componentType===5125?4:2;for(let i=0;i<ia.count;i+=3){const points=[0,1,2].map(k=>{const offset=(iv.byteOffset??0)+(ia.byteOffset??0)+(i+k)*bytes;return pa[bytes===4?model.bin.readUInt32LE(offset):model.bin.readUInt16LE(offset)];});const e=points.reduce((s,p)=>s+p[0],0)/3,n=-points.reduce((s,p)=>s+p[2],0)/3;assert.ok(!(e>meta.bounds[0]&&e<meta.bounds[2]&&n>meta.bounds[1]&&n<meta.bounds[3]),'no uncut surface covers the study');}
});
test('triangle-surface negative control rejects a bilinear raised patch and an excessive cut',()=>{
 const positions=[[0,0,0],[5,0,0],[0,0,5],[5,4,5]],indices=[0,2,1,1,2,3],surface=triangleSurface(positions,indices);
 assert.equal(surface(2.5,2.5),0,'actual exported diagonal has zero height; bilinear would give 1m');
 const raised=measureStudy({positions,indices},{positions:[[2.5,1,2.5]]},[-10,-10,10,10]);assert.throws(()=>assertStudyRange(raised),/does not cut/);
 const deep=measureStudy({positions,indices},{positions:[[2.5,-2,2.5]]},[-10,-10,10,10]);assert.throws(()=>assertStudyRange(deep),/does not cut/);
});
test('perspective scale preserves actual projected length through narrow/wide, rotation and zoom',()=>{
 for(const [w,h]of [[337,385],[1013,528]])for(const angle of [0,.4,1.5,3])for(const distance of [45,1500,9000]){const camera=new PerspectiveCamera(38,w/h,1,30000),target=new Vector3(0,550,0);camera.position.set(Math.sin(angle)*distance,550+distance*.7,Math.cos(angle)*distance);camera.lookAt(target);camera.updateMatrixWorld();const s=groundScale(camera,target,w,h,Math.min(160,w*.4));const a=new Vector3(...s.start),b=new Vector3(...s.end);assert.ok(Math.abs(a.distanceTo(b)-s.metres)<1e-8);const p=a.project(camera),q=b.project(camera),actual=Math.hypot((q.x-p.x)*w/2,(q.y-p.y)*h/2);assert.ok(Math.abs(actual-s.pixels)<1e-8);assert.ok(s.pixels>0&&s.pixels<=Math.min(160,w*.4));}
});
test('GIS metadata reports fallback and no missing heights without implying measurement precision',()=>{
 const evidence=JSON.parse(readFileSync(new URL('../evidence/gis-build.json',import.meta.url)));assert.equal(evidence.fallback10BCells,31);assert.equal(evidence.noDataPixels['castle-dem-1m.tif'],0);assert.equal(evidence.noDataPixels['regional-dem-20m.tif'],0);assert.ok(evidence.roundTrips.every(p=>p.roundTripMetres<.001));assert.match(evidence.accuracy,/not measurement accuracy/);
});
