import test from 'node:test';import assert from 'node:assert/strict';
import {BufferGeometry,Float32BufferAttribute,Mesh,MeshBasicMaterial} from 'three';
import {readGlb,meshData} from './glb-surface.mjs';
import {oracle,verifyProfile} from './section-oracle.mjs';
import {SECTIONS,intersectSection,profileHeight} from '../src/sections.js';
const mk=(positions,indices)=>{const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions.flat(),3));if(indices)g.setIndex(indices);return new Mesh(g,new MeshBasicMaterial());};
const load=file=>{const g=readGlb(file);return g.g.nodes.filter(n=>n.mesh!==undefined).map(n=>{const m=meshData(g,n.name),o=mk(m.positions,m.indices);o.name=n.name;return o;});};
for(const key of ['A','C']){const file=`public/data/${key==='A'?'castle':'nishinomaru'}.glb`,meshes=load(file),query=oracle(file);
 for(const s of SECTIONS)test(`${key} ${s.id}: every exact face endpoint/interior matches independent raw GLB barycentric oracle within 1mm`,()=>{const p=intersectSection(meshes,s),r=verifyProfile(p,s.start,s.end,query);assert.ok(r.count>0);for(let d=0;d<=p.length;d+=.137){const e=s.start[0]+(s.end[0]-s.start[0])*d/p.length,n=s.start[1]+(s.end[1]-s.start[1])*d/p.length;assert.ok(Math.abs(profileHeight(p,d)-query(e,n))<.001);}assert.equal(p.segments[0].from,0);assert.equal(p.segments.at(-1).to,p.length);for(const [,d]of s.points)assert.notEqual(profileHeight(p,d),null);
  assert.throws(()=>verifyProfile({...p,segments:p.segments.map(a=>({...a,h0:a.h0+.1,h1:a.h1+.1}))},s.start,s.end,query),/mismatch/);
  assert.throws(()=>verifyProfile(p,s.start.map((v,i)=>s.start[1-i]),s.end.map((v,i)=>s.end[1-i]),query),/mismatch|coverage/);
  assert.throws(()=>verifyProfile({...p,segments:p.segments.map(a=>({...a,h0:a.h0*2,h1:a.h1*2}))},s.start,s.end,query),/mismatch/);
 });
}
test('triangle interior, shared diagonal, endpoints, overlap top face, gaps, outside and vertical faces',()=>{const a=mk([[0,10,0],[2,12,0],[2,14,-2],[0,12,-2]],[0,1,2,0,2,3]),s={start:[-1,1],end:[4,1]},p=intersectSection([a],s);assert.equal(profileHeight(p,.5),null);assert.equal(profileHeight(p,1),11);assert.equal(profileHeight(p,2),12);assert.equal(profileHeight(p,3),13);assert.equal(profileHeight(p,4),null);
 const high=a.clone();high.geometry=a.geometry.clone();for(let i=0;i<4;i++)high.geometry.attributes.position.setY(i,high.geometry.attributes.position.getY(i)+5);assert.equal(profileHeight(intersectSection([a,high],s),2),17);
 const right=mk([[3,1,0],[4,1,0],[3,1,-2]]),gap=intersectSection([a,right],s);assert.equal(profileHeight(gap,3.5),null);
 const vertical=mk([[1,0,0],[1,10,0],[1,0,-2]]);assert.equal(intersectSection([vertical],s).segments.length,0);
});
