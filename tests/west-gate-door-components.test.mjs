import * as THREE from 'three';
import {westGateLandscapeModel} from '../src/west-gate-landscape.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WEST_GATE_DOOR_DETAILS,doorDetailWorldTarget,doorPartNodeNames,westGateComparison,leftDoorWorldTarget,leftDoorDetailWorldTarget,createWestGateDoorInspector} from '../src/west-gate-door-inspection.js';
test('distinct C detail targets and backwards-compatible whole leaf',()=>{
 const g=548.38,names=Object.keys(WEST_GATE_DOOR_DETAILS);
 assert.deepEqual(names,['leaf','board','upperRail','lowerRail','postSide']);
 assert.deepEqual(leftDoorDetailWorldTarget(g,1,'leaf'),leftDoorWorldTarget(g));
 const points=names.map(n=>leftDoorDetailWorldTarget(g,1,n));
 assert.equal(new Set(points.map(p=>p.join(','))).size,5);
 assert(points.every(p=>p.length===3&&p.every(Number.isFinite)));
 assert(Math.abs(points[2][1]-(g+2.15))<1e-9);
 assert(Math.abs(points[3][1]-(g+.45))<1e-9);
 assert(points[4][2]<points[0][2]);
 for(const n of names){
  const a=leftDoorDetailWorldTarget(g,1,n),b=leftDoorDetailWorldTarget(g,2,n);
  assert.equal(a[0],b[0]);assert.equal(a[2],b[2]);assert.equal(b[1],a[1]*2);
 }
 for(const n of ['__proto__','constructor','nope'])assert.throws(()=>leftDoorDetailWorldTarget(g,1,n),/不正/);
 for(const v of [NaN,Infinity,-Infinity])assert.throws(()=>leftDoorDetailWorldTarget(v,1,'board'),/支持高/);
 for(const v of [0,-1,NaN,Infinity])assert.throws(()=>leftDoorDetailWorldTarget(g,v,'postSide'),/支持高/);
});
test('view anchors agree with authored boards, upper and lower rail, and post',()=>{
 const source=readFileSync(new URL('../scripts/phase3b-build-blender.py',import.meta.url),'utf8');
 assert.match(source,/for j,n in enumerate\(\[-37\.1,-32\.9\]\)/);
 assert.match(source,/f'gate\.post\.\{j\}',-191,n/);
 assert.match(source,/for k in range\(6\):box\('wb-gate',f'gate\.door\.\{j\}\.\{k\}'/);
 assert.match(source,/for z in \[\.45,2\.15\]:box\('wb-gate',f'gate\.door\.rail\.\{j\}\.\{z\}'/);
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(main,/target:\(part,side\)=>\{/);
 assert.match(main,/leftDoorDetailWorldTarget\(ground,state\.exaggeration,part\)/);
});
function fixture(){
 const m=new Map(),old=globalThis.document;
 class El{
  constructor(){this.hidden=false;this.attrs={};this.children=[];}
  set id(v){this._id=v;m.set(v,this);}get id(){return this._id;}setAttribute(k,v){this.attrs[k]=v;}
  append(...v){this.children.push(...v);}
 }
 globalThis.document={createElement:()=>new El(),querySelector:()=>new El()};
 return {el:id=>m.get(id),restore:()=>globalThis.document=old};
}
class V{
 constructor(v){this.v=[...v];}toArray(){return [...this.v];}fromArray(v){this.v=[...v];}
}
test('switching among details restores the one original camera pose',()=>{
 const d=fixture();
 try{
  let allowed=true,renders=0;
  const camera={position:new V([1,2,3]),fov:60,updateProjectionMatrix(){},lookAt(){}};
  const controls={target:new V([4,5,6])};
  const i=createWestGateDoorInspector({camera,controls,render:()=>renders++,canInspect:()=>allowed,target:n=>leftDoorDetailWorldTarget(548.38,1,n)});
  for(const name of ['board','upperRail','lowerRail','postSide']){
   d.el('west-gate-detail-'+name).onclick();
   assert.equal(i.diagnostics().part,name);
   assert.equal(d.el('west-gate-detail-'+name).attrs['aria-pressed'],'true');
   assert.deepEqual(camera.position.toArray(),[1,2,3]);
  }
  d.el('west-gate-door-back').onclick();
  assert.deepEqual(controls.target.toArray(),[4,5,6]);
  assert.deepEqual(camera.position.toArray(),[1,2,3]);
  assert.equal(camera.fov,60);assert.equal(i.diagnostics().focused,false);
  d.el('west-gate-door-focus').onclick();
  assert.equal(camera.fov,40);assert.equal(i.diagnostics().part,'leaf');
  allowed=false;i.sync();
  assert.equal(i.diagnostics().focused,false);
  assert(d.el('west-gate-door-back').disabled);
  assert(d.el('west-gate-detail-board').disabled);
  assert.equal(renders,6);
 }finally{d.restore();}
});
test('invalid target leaves saved pose and view unchanged',()=>{
 const d=fixture();
 try{
  let broken=true,renders=0;
  const camera={position:new V([1,2,3]),fov:60,updateProjectionMatrix(){},lookAt(){}};
  const controls={target:new V([4,5,6])};
  const i=createWestGateDoorInspector({camera,controls,render:()=>renders++,canInspect:()=>true,target:n=>n==='postSide'&&broken?[NaN,0,0]:leftDoorDetailWorldTarget(548.38,1,n)});
  d.el('west-gate-detail-postSide').onclick();
  assert.equal(i.diagnostics().focused,false);assert.deepEqual(controls.target.toArray(),[4,5,6]);
  d.el('west-gate-detail-board').onclick();const previous=controls.target.toArray();
  d.el('west-gate-detail-postSide').onclick();
  assert.deepEqual(controls.target.toArray(),previous);
  assert.equal(i.diagnostics().part,'board');
  broken=false;d.el('west-gate-detail-postSide').onclick();
  assert.equal(i.diagnostics().part,'postSide');
  i.cancel();assert.equal(i.diagnostics().focused,false);assert.equal(renders,2);
 }finally{d.restore();}
});

test('C to A to C clears stale door guidance and permits a fresh observation',()=>{
 const d=fixture();
 try{
  let allowed=true,renders=0;
  const camera={position:new V([1,2,3]),fov:60,updateProjectionMatrix(){},lookAt(){}};
  const controls={target:new V([4,5,6])};
  const inspector=createWestGateDoorInspector({camera,controls,render:()=>renders++,canInspect:()=>allowed,target:n=>leftDoorDetailWorldTarget(548.38,1,n)});
  const status=d.el('west-gate-door-status');
  assert.equal(status.textContent,'左扉全体または観察部位を選ぶと注視できます。');
  d.el('west-gate-detail-upperRail').onclick();
  assert.match(status.textContent,/上の横桟.*注視中/);
  assert.equal(inspector.diagnostics().focused,true);
  const observedTarget=controls.target.toArray(),observedFov=camera.fov;
  allowed=false;inspector.sync();
  assert.equal(d.el('west-gate-door-inspection').hidden,true);
  assert.equal(inspector.diagnostics().focused,false);
  assert.equal(d.el('west-gate-door-back').disabled,true);
  assert.equal(status.textContent,'西木戸口を選択すると観察できます。');
  assert.deepEqual(camera.position.toArray(),[1,2,3]);
  assert.deepEqual(controls.target.toArray(),observedTarget);
  assert.equal(camera.fov,observedFov);
  allowed=true;inspector.sync();
  assert.equal(d.el('west-gate-door-inspection').hidden,false);
  assert.equal(d.el('west-gate-door-focus').disabled,false);
  assert.equal(d.el('west-gate-door-back').disabled,true);
  assert.equal(status.textContent,'左扉全体または観察部位を選ぶと注視できます。');
  for(const name of ['board','upperRail','lowerRail','postSide']){
   const button=d.el('west-gate-detail-'+name);
   assert.equal(button.disabled,false);
   assert.equal(button.attrs['aria-pressed'],'false');
  }
  assert.equal(renders,1);
  d.el('west-gate-detail-board').onclick();
  assert.equal(inspector.diagnostics().part,'board');
  assert.equal(d.el('west-gate-door-back').disabled,false);
  assert.match(status.textContent,/板材.*注視中/);
 }finally{d.restore();}
});

test('comparison metadata identifies each delivered GLB part and signed orientation',()=>{
 const raw=readFileSync(new URL('../public/data/phase3b.glb',import.meta.url));
 const gltf=JSON.parse(raw.subarray(20,20+raw.readUInt32LE(12)).toString());
 const nodes=new Map(gltf.nodes.map(n=>[n.name,n]));
 const g=548.6599731445312,result=westGateComparison(g);
 const close=(a,b)=>assert(Math.abs(a-b)<0.0001,`${a} must agree with delivered ${b}`);
 for(const [name,j] of [['left',1],['right',0]]){
  const {boardCenter,railCenter,postCenter,yawRadians}=result[name];
  const boards=doorPartNodeNames(name,'board').map(id=>nodes.get(id));
  assert.equal(boards.length,6);
  boards.forEach(n=>assert.equal(n.extras.groundHeight,g));
  close(boardCenter[0],boards.reduce((a,n)=>a+n.translation[0],0)/6);
  close(boardCenter[1],-boards.reduce((a,n)=>a+n.translation[2],0)/6);
  for(const [part,offset] of [['upperRail',2.15],['lowerRail',.45]]){
   const [id]=doorPartNodeNames(name,part),rail=nodes.get(id);
   assert.equal(id,`wb-gate.gate.door.rail.${j}.${offset}`);
   close(railCenter[0],rail.translation[0]);close(railCenter[1],-rail.translation[2]);
   close(yawRadians,2*Math.asin(rail.rotation[1]));
   close(g+offset+.15/2,rail.translation[1]);
  }
  const post=nodes.get(doorPartNodeNames(name,'postSide')[0]);
  close(postCenter[0],post.translation[0]);close(postCenter[1],-post.translation[2]);
  close(g-.2+3.8/2,post.translation[1]);
  close(g+.05+2.85/2,boards[0].translation[1]);
  assert.equal(doorPartNodeNames(name,'leaf').length,8);
 }
 assert(result.left.boardCenter[0]-result.right.boardCenter[0]>.28);
 assert.throws(()=>westGateComparison(NaN));
 assert.throws(()=>doorPartNodeNames('__proto__','board'));
});

test('switching leaves, toggling comparison and failing safely retain the original pose',()=>{
 const d=fixture();
 try{
  let allowed=true,broken=false,active=null;
  const camera={position:new V([1,2,3]),fov:60,updateProjectionMatrix(){},lookAt(){}};
  const controls={target:new V([4,5,6])};
  const inspector=createWestGateDoorInspector({camera,controls,render(){},canInspect:()=>allowed,compare:()=>westGateComparison(548.66),
   highlight:(side,part)=>{if(broken&&side==='left')throw Error('C模型の対象部材が見つかりません');active=side&&[side,part];},
   target:(part,side)=>doorDetailWorldTarget(side,548.66,1,part)});
  d.el('west-gate-side-right').onclick();
  assert.deepEqual(active,['right','leaf']);assert.equal(inspector.diagnostics().side,'right');
  d.el('west-gate-detail-postSide').onclick();
  const right=controls.target.toArray();
  broken=true;d.el('west-gate-side-left').onclick();
  assert.deepEqual(controls.target.toArray(),right);assert.deepEqual(active,['right','postSide']);
  assert.match(d.el('west-gate-door-status').textContent,/観察不可/);
  broken=false;d.el('west-gate-side-left').onclick();
  assert.deepEqual(active,['left','leaf']);
  d.el('west-gate-door-compare').onclick();assert.equal(inspector.diagnostics().comparisonOpen,true);
  d.el('west-gate-door-back').onclick();
  assert.deepEqual(controls.target.toArray(),[4,5,6]);assert.equal(camera.fov,60);
  assert.equal(active,null);
  d.el('west-gate-side-right').onclick();
  allowed=false;inspector.sync();
  assert.equal(active,null);assert.equal(inspector.diagnostics().side,'left');
  assert.equal(inspector.diagnostics().comparisonOpen,false);
 }finally{d.restore();}
});

test('display batching preserves independent authored gate bounds without splitting batches',()=>{
 const scene=new THREE.Group(),material=new THREE.MeshStandardMaterial();
 for(const [index,x] of [[0,-191],[1,-190]]){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(.25,1,1),material);
  // The GLTFLoader's authored ID differs from its sanitized Object3D.name.
  mesh.name='sanitized'+index;
  mesh.userData={name:'wb-gate.gate.door.0.'+index,elementId:'wb-gate',evidenceCategory:'C',groundHeight:548.66};
  mesh.position.set(x,550,36);scene.add(mesh);
 }
 const group=westGateLandscapeModel({scene});
 assert.equal(group.children.length,1);
 assert.equal(group.children[0].name,'wb-gate');
 const a=group.userData.westGateParts.get('wb-gate.gate.door.0.0'),b=group.userData.westGateParts.get('wb-gate.gate.door.0.1');
 assert.equal(a.groundHeight,548.66);
 assert.deepEqual(a.bounds.getCenter(new THREE.Vector3()).toArray(),[-191,550,36]);
 assert.deepEqual(b.bounds.getCenter(new THREE.Vector3()).toArray(),[-190,550,36]);
 const duplicate=scene.children[0].clone();scene.add(duplicate);
 const ambiguous=westGateLandscapeModel({scene}).userData.westGateParts;
 assert.equal(ambiguous.get('wb-gate.gate.door.0.0'),null);
 assert.equal(ambiguous.has('wb-gate.gate.post.0'),false);
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(main,/if\(file==='phase3b'\)return westGateLandscapeModel\(gltf,westernMeta.bounds\)/);
});
