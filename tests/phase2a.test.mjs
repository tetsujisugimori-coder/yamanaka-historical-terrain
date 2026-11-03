import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readGlb,meshData,triangleSurface} from './glb-surface.mjs';
const read=n=>JSON.parse(readFileSync(new URL(`../public/data/${n}.json`,import.meta.url)));
const base=meshData(readGlb(new URL('../public/data/castle.glb',import.meta.url)),'A_castle_current');
const model=readGlb(new URL('../public/data/nishinomaru.glb',import.meta.url));
const meta=read('nishinomaru'),layout=read('nishinomaru-layout');
const surfaces=meta.facilities.map(f=>meshData(model,f.id));
const height=triangleSurface(base.positions,base.indices);
function areaAndBoundary(mesh){
 let area=0,boundary=0,maxSeam=0;
 for(let i=0;i<mesh.indices.length;i+=3){const [a,b,c]=mesh.indices.slice(i,i+3).map(j=>mesh.positions[j]);area+=Math.abs((b[0]-a[0])*(c[2]-a[2])-(c[0]-a[0])*(b[2]-a[2]))/2;}
 for(const [e,h,z]of mesh.positions){const n=-z,b=meta.bounds;if(e===b[0]||e===b[2]||n===b[1]||n===b[3]){boundary++;maxSeam=Math.max(maxSeam,Math.abs(h-height(e,z)));}}
 return {area,boundary,maxSeam};
}
test('phase2a stable IDs, sources, confidence and model objects form a closed relation',()=>{
 assert.deepEqual(meta.categoryCounts,{B:0,C:5});assert.equal(meta.facilities.length,5);assert.equal(new Set(meta.facilities.map(f=>f.id)).size,5);
 const sources=read('sources');assert.equal(new Set(sources.map(s=>s.id)).size,sources.length);
 for(const f of meta.facilities){const ob=meshData(model,f.id);assert.equal(ob.node.extras.facilityId,f.id);assert.equal(ob.node.extras.evidenceCategory,f.category);assert.equal(f.category,'C');assert.equal(ob.node.extras.metresPerUnit,1);assert.equal(ob.node.extras.originE,meta.origin[0]);assert.equal(ob.node.extras.originN,meta.origin[1]);assert.match(f.accuracy,/UNKNOWN/);assert.ok(f.sourceIds.every(id=>sources.some(s=>s.id===id)));assert.ok(f.articles);}
 assert.equal(layout.controlPoints,0);assert.match(layout.georeferenceResidual,/UNKNOWN/);
});
test('phase2a actual exported C faces cover one full patch and meet immutable A boundary',()=>{
 const measured=surfaces.map(areaAndBoundary);assert.equal(measured.reduce((s,m)=>s+m.area,0),110*105);assert.ok(measured.reduce((s,m)=>s+m.boundary,0)>1000);assert.ok(Math.max(...measured.map(m=>m.maxSeam))<.001);
 const shell=meshData(model,'nm-context'),[w,s,e,n]=meta.bounds;
 for(let i=0;i<shell.indices.length;i+=3){const pts=shell.indices.slice(i,i+3).map(j=>shell.positions[j]);const x=pts.reduce((s,p)=>s+p[0],0)/3,y=-pts.reduce((s,p)=>s+p[2],0)/3;assert.ok(!(x>w&&x<e&&y>s&&y<n),'context must not cover C moat');}
});
test('phase2a all split surface edges agree in height and coordinate orientation',()=>{
 const map=new Map();let duplicates=0;
 for(const mesh of surfaces)for(const [x,h,z]of mesh.positions){assert.ok(Number.isFinite(h)&&h>500&&h<600);assert.ok(x>=-80&&x<=30&&-z>=-50&&-z<=55);const key=x+','+z;if(map.has(key)){assert.ok(Math.abs(h-map.get(key))<.001);duplicates++;}map.set(key,h);}
 assert.equal(map.size,441*421);assert.ok(duplicates>500);
});
test('phase2a distinguish moat depth, bank crest, flat bailey and rising passage using exported faces',()=>{
 const sample=(id,e,n)=>{const m=surfaces.find(m=>m.node.extras.facilityId===id);return triangleSurface(m.positions,m.indices)(e,-n);};
 const crest=sample('nm-moat',-59,-4),bottom=sample('nm-moat',-55.5,-.5);assert.ok(crest-bottom>1.7&&crest-bottom<1.9);
 const bank=sample('nm-rampart',-36,0),bailey=sample('nm-bailey',-20,0);assert.ok(bank-bailey>2.4&&bank-bailey<2.6);
 assert.ok(sample('nm-passage',5,-18)-sample('nm-passage',5,-34)>1.5);
 assert.ok(Math.abs(sample('nm-bailey',-20,0)-sample('nm-bailey',0,0))<.001);
});
test('negative controls detect a raised seam, missing facility and reassigned evidence ID',()=>{
 const boundary=surfaces.find(m=>m.positions.some(([e,,z])=>e===-80||-z===55));const bad=structuredClone(boundary);bad.positions=bad.positions.map(([e,h,z])=>[e,h+1,z]);assert.ok(areaAndBoundary(bad).maxSeam>.9);
 assert.throws(()=>meshData(model,'nm-does-not-exist'),/not found/);
 const wrong=structuredClone(meta.facilities[0]);wrong.modelObject='nm-moat';assert.notEqual(meshData(model,wrong.modelObject).node.extras.facilityId,wrong.id);
 assert.ok(surfaces.slice(1).map(areaAndBoundary).reduce((s,m)=>s+m.area,0)<110*105,'omitted component cannot cover full area');
});
test('QGIS C cross sections and exported Blender vertices share actual heights',()=>{
 const profiles=JSON.parse(readFileSync(new URL('../production/phase2a/profiles.json',import.meta.url)));
 const vertices=new Map();for(const mesh of surfaces)for(const [e,h,z]of mesh.positions)vertices.set(`${e},${-z}`,h);
 assert.equal(profiles.length,222);
 for(const p of profiles){assert.ok(vertices.has(`${p.localE},${p.localN}`));assert.ok(Math.abs(vertices.get(`${p.localE},${p.localN}`)-p.C)<.001);assert.ok(Math.abs(height(p.localE,-p.localN)-p.A_webTriangle)<.001);}
});
