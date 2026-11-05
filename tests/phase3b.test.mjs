import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readGlb,meshData} from './glb-surface.mjs';
import {oracle} from './section-oracle.mjs';
import {BufferGeometry,Float32BufferAttribute} from 'three';
import {contextOutsidePatch} from '../src/phase3b.js';
import {appendOnlySources} from '../scripts/source-preservation.mjs';

const meta=JSON.parse(readFileSync('public/data/phase3b.json','utf8'));
test('source additions preserve every old record and reject edits, removal and duplicate IDs',()=>{
 const a=JSON.stringify([{id:'old',title:'original',url:'same'}]);
 assert.ok(appendOnlySources(a,JSON.stringify([...JSON.parse(a),{id:'new',url:'same'}])));
 for(const b of [[{id:'old',title:'changed',url:'same'}],[],[{id:'old',title:'original',url:'same'},{id:'old',url:'same'}]])assert.equal(appendOnlySources(a,JSON.stringify(b)),false);
});
test('western model preserves metric topology, has one ground sheet and joins the actual A boundary',()=>{
 const glb=readGlb('public/data/phase3b.glb'),a=oracle('public/data/castle.glb');
 const ids=new Set(meta.elements.map(e=>e.id)),[w,s,e,n]=meta.bounds;
 let area=0,boundary=0,triangles=0;const tiles=new Set();
 for(const node of glb.g.nodes.filter(o=>o.mesh!==undefined)){
  assert.ok(ids.has(node.extras.elementId));assert.equal(node.extras.evidenceCategory,'C');
  assert.equal(node.extras.metresPerUnit,1);assert.equal(node.extras.horizontalCRS,'EPSG:6676');
  if(!node.extras.surface)continue;
  assert.ok(!node.rotation&&!node.matrix&&!node.children);
  const m=meshData(glb,node.name),p=m.positions.map(v=>v.map((x,k)=>x*(node.scale?.[k]??1)+(node.translation?.[k]??0)));
  for(const [x,h,z] of p){const y=-z;assert.ok(x>=w-.001&&x<=e+.001&&y>=s-.001&&y<=n+.001);
   if(Math.abs(x-w)<.001||Math.abs(x-e)<.001||Math.abs(y-s)<.001||Math.abs(y-n)<.001){assert.ok(Math.abs(h-a(x,y))<.001,'boundary agrees with raw A triangles');boundary++;}
  }
  for(let i=0;i<m.indices.length;i+=3){const t=m.indices.slice(i,i+3).map(j=>p[j]);
   const key=t.map(v=>v.map(x=>x.toFixed(5)).join(',')).sort().join('|');assert.ok(!tiles.has(key),'no duplicate ground triangle');tiles.add(key);
   area+=Math.abs((t[1][0]-t[0][0])*(t[2][2]-t[0][2])-(t[2][0]-t[0][0])*(t[1][2]-t[0][2]))/2;triangles++;
  }
 }
 assert.equal(triangles,27500);assert.ok(boundary>400);assert.ok(Math.abs(area-(e-w)*(n-s))<.001,'one full, non-overlapping patch footprint');
 assert.ok(!glb.g.images?.length,'no third-party image assets');
});

test('three regions and detachable upper structure remain C with separate reference and model dimensions',()=>{
 assert.deepEqual(meta.elements.map(e=>e.id).sort(),['wb-bailey','wb-building','wb-gate','wb-moat']);
 const sources=new Set(JSON.parse(readFileSync('public/data/sources.json')).map(s=>s.id));
 for(const f of meta.elements){assert.equal(f.category,'C');for(const key of ['role','description','assumptions','unknown','direction','editor'])assert.ok(f[key]);f.sourceIds.forEach(id=>assert.ok(sources.has(id)));}
 assert.equal(meta.referenceDimensions.cells,10);assert.equal(meta.modelDimensions.cells,7);
 assert.notEqual(meta.modelDimensions.maximumCut,Number(meta.referenceDimensions.depthMetres));
 assert.equal(new Set(meta.stations.map(s=>s.id)).size,5);
});

test('display cutout removes only whole aligned context triangles without altering source vertices',()=>{
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute([0,1,0,5,2,0,0,3,-5,5,4,-5,10,5,0,10,6,-5],3));g.setIndex([0,1,2,1,3,2,1,4,3,4,5,3]);
 const original=Array.from(g.attributes.position.array),index=Array.from(g.index.array),cut=contextOutsidePatch(g,[0,0,5,5]);
 assert.deepEqual(Array.from(cut.index.array),[1,4,3,4,5,3]);assert.deepEqual(Array.from(g.index.array),index);assert.deepEqual(Array.from(g.attributes.position.array),original);assert.deepEqual(Array.from(cut.attributes.position.array),original);
});
