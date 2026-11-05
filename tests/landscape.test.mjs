import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readGlb,meshData} from './glb-surface.mjs';
import {oracle} from './section-oracle.mjs';
const recipe=JSON.parse(readFileSync('production/landscape/recipe.json')),ledger=JSON.parse(readFileSync('public/data/landscape.json')),model=readGlb('public/data/landscape.glb');
const q=oracle('public/data/nishinomaru.glb'),sources=new Set(JSON.parse(readFileSync('public/data/sources.json')).map(s=>s.id));
test('every exported scenery part maps to C/D ledger, exact metric recipe and original material',()=>{
 assert.equal(model.g.nodes.length,recipe.parts.length);assert.equal(ledger.elements.length,5);assert.equal(recipe.origin[0],44862.121277226666);
 for(const e of ledger.elements){assert.ok(['C','D'].includes(e.category));for(const key of ['role','assumptions','unknown','direction','editor'])assert.ok(e[key]);e.sourceIds.forEach(s=>assert.ok(sources.has(s)));}
 for(const node of model.g.nodes){const p=recipe.parts[node.extras.recipePart],e=ledger.elements.find(e=>e.id===p.element);assert.equal(node.extras.elementId,e.id);assert.equal(node.extras.evidenceCategory,e.category);assert.equal(node.extras.metresPerUnit,1);assert.equal(node.extras.horizontalCRS,'EPSG:6676');assert.ok(Math.abs(node.extras.groundHeight-q(...p.at.slice(0,2)))<.001);
  const m=meshData(model,node.name);assert.ok(!node.rotation&&!node.matrix&&!node.children,'test must explicitly handle new transforms');
  const points=m.positions.map(v=>v.map((x,k)=>x*(node.scale?.[k]??1)+(node.translation?.[k]??0))),xs=points.map(p=>p[0]),zs=points.map(p=>p[2]);
  if(node.translation){assert.ok(Math.abs(node.translation[0]-p.at[0])<.001);assert.ok(Math.abs(node.translation[2]+p.at[1])<.001);}else{assert.ok(Math.abs((Math.max(...xs)+Math.min(...xs))/2-p.at[0])<.001);assert.ok(Math.abs((Math.max(...zs)+Math.min(...zs))/2+p.at[1])<.2);}
  const expectedBase=node.extras.groundHeight+p.at[2];assert.ok(Math.abs(Math.min(...points.map(p=>p[1]))-expectedBase)<.001,'part base uses exact existing C GLB surface');
 }
 assert.equal(model.g.images,undefined);assert.equal(model.g.textures,undefined);
});
test('fixed observation points exist on both raw A/C triangles and keep metric origin; surfaces unchanged',()=>{
 const a=oracle('public/data/castle.glb');assert.equal(ledger.stations.length,4);for(const s of ledger.stations){assert.ok(Number.isFinite(a(...s.eye)));assert.ok(Number.isFinite(q(...s.eye)));assert.ok(s.lookDown>=0);}
 assert.deepEqual(ledger.surfaceCaptions,recipe.surfaceCaptions);for(const id of ['nm-bailey','nm-moat','nm-rampart','nm-passage','nm-transition'])assert.ok(ledger.surfaceCaptions[id].assumptions);
});
