import {Box3,Vector3} from 'three';

export const WALK={eyeHeight:1.7,radius:.28,maxSlope:38,maxStep:.3,substep:.12,speed:1.4};
// Bounds are a simulation permission envelope, never a historic route claim.
export const WALK_ZONES=[[-40,-42,15,30],[-100,-45,-68,50],[-202,-43,-120,26]];
export const GUIDE_IDS=['ic-station-nishinomaru','ic-lookout','ic-bridge','ic-koguchi','ic-koguchi-inside','ic-station-western','ic-station-westgate','ic-station-westmoat'];
const forbidden=new Set(['nm-moat','nm-rampart','nm-context','wb-moat']);
export function inWalkZone(x,z){return WALK_ZONES.some(([w,s,e,n])=>x>=w&&x<=e&&-z>=s&&-z<=n);}
export function createWalkWorld(surfaces,obstacles,{groundCellBounds=[-102,8,-26,24]}={}){
 if(!Array.isArray(groundCellBounds)||groundCellBounds.length!==4||!groundCellBounds.every(Number.isSafeInteger)||groundCellBounds[0]>groundCellBounds[1]||groundCellBounds[2]>groundCellBounds[3])throw Error('Invalid ground cell bounds');
 const [minCellX,maxCellX,minCellZ,maxCellZ]=groundCellBounds;
 const groundCells=new Map();let indexedTriangleCount=0;
 // Freeze displayed world-space triangles for this walking session. Visibility,
 // exaggeration and model changes stop the session before rebuilding this index.
 for(const mesh of surfaces){mesh.updateWorldMatrix(true,false);const p=mesh.geometry.attributes.position,index=mesh.geometry.index;
  for(let i=0;i<(index?.count??p.count);i+=3){const [a,b,c]=[0,1,2].map(k=>new Vector3().fromBufferAttribute(p,index?index.getX(i+k):i+k).applyMatrix4(mesh.matrixWorld));const det=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);if(Math.abs(det)<1e-10)continue;
   const normal=b.clone().sub(a).cross(c.clone().sub(a)).normalize(),tri={a,b,c,det,slope:Math.acos(Math.min(1,Math.abs(normal.y)))*180/Math.PI,id:mesh.userData.elementId??mesh.userData.facilityId,name:mesh.name,face:i/3};
   let inserted=false;
   for(let x=Math.max(minCellX,Math.floor(Math.min(a.x,b.x,c.x)/2));x<=Math.min(maxCellX,Math.floor(Math.max(a.x,b.x,c.x)/2));x++)for(let z=Math.max(minCellZ,Math.floor(Math.min(a.z,b.z,c.z)/2));z<=Math.min(maxCellZ,Math.floor(Math.max(a.z,b.z,c.z)/2));z++){const key=x+','+z;if(!groundCells.has(key))groundCells.set(key,[]);groundCells.get(key).push(tri);inserted=true;}
   if(inserted)indexedTriangleCount++;
  }
 }
 // Imported meshes batch disconnected fence parts. A whole-mesh box would
 // incorrectly fill the empty courtyard. Conservative per-triangle boxes
 // preserve gaps, with a spatial grid for bounded per-step collision cost.
 const boxes=[],cells=new Map();
 for(const mesh of obstacles){mesh.updateWorldMatrix(true,false);const p=mesh.geometry.attributes.position,index=mesh.geometry.index;
  for(let i=0;i<(index?.count??p.count);i+=3){const box=new Box3();for(let k=0;k<3;k++)box.expandByPoint(new Vector3().fromBufferAttribute(p,index?index.getX(i+k):i+k).applyMatrix4(mesh.matrixWorld));const entry={name:mesh.name,box};boxes.push(entry);
   for(let x=Math.floor((box.min.x-WALK.radius)/2);x<=Math.floor((box.max.x+WALK.radius)/2);x++)for(let z=Math.floor((box.min.z-WALK.radius)/2);z<=Math.floor((box.max.z+WALK.radius)/2);z++){const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(entry);}
  }
 }
 function sample(x,z){
  let hit=null;for(const t of groundCells.get(Math.floor(x/2)+','+Math.floor(z/2))??[]){const {a,b,c,det}=t,u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/det,v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/det,w=1-u-v;if(u< -1e-8||v< -1e-8||w< -1e-8)continue;const height=u*a.y+v*b.y+w*c.y;if(!hit||height>hit.height)hit={height,slope:t.slope,id:t.id,name:t.name,face:t.face};}return hit;
 }
 function check(x,z){
  if(!inWalkZone(x,z))return {ok:false,reason:'通行範囲の外'};
  const hit=sample(x,z);if(!hit)return {ok:false,reason:'地表なし'};
  if(forbidden.has(hit.id))return {ok:false,reason:'堀・土塁・未設定地表',hit};
  if(hit.slope>WALK.maxSlope)return {ok:false,reason:'急斜面',hit};
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4,px=x+Math.cos(a)*WALK.radius,pz=z+Math.sin(a)*WALK.radius,h=sample(px,pz);
   if(!inWalkZone(px,pz)||!h||forbidden.has(h.id)||h.slope>WALK.maxSlope||Math.abs(h.height-hit.height)>WALK.radius*Math.tan(WALK.maxSlope*Math.PI/180)+.025)return {ok:false,reason:'足元の端・斜面',hit};
  }
  for(const {box,name} of cells.get(Math.floor(x/2)+','+Math.floor(z/2))??[])if(x+WALK.radius>box.min.x&&x-WALK.radius<box.max.x&&z+WALK.radius>box.min.z&&z-WALK.radius<box.max.z&&hit.height+.12<box.max.y&&hit.height+WALK.eyeHeight>box.min.y)return {ok:false,reason:'構造物 '+name,hit};
  return {ok:true,hit};
 }
 return {sample,check,obstacleCount:boxes.length,groundCellCount:groundCells.size,indexedTriangleCount};
}
export function advanceWalk(position,dx,dz,world){
 if(![...position,dx,dz].every(Number.isFinite))throw Error('Nonfinite walking input');
 const distance=Math.hypot(dx,dz);if(distance>10)throw Error('Unbounded walking step');
 const steps=Math.max(1,Math.ceil(distance/WALK.substep));let next=[...position],blocked=null;
 for(let i=0;i<steps;i++){
  const x=next[0]+dx/steps,z=next[2]+dz/steps,result=world.check(x,z);
  if(!result.ok){blocked=result.reason;break;}
  const rise=Math.abs(result.hit.height-next[1]),step=distance/steps;
  if(rise>WALK.maxStep||rise>step*Math.tan(WALK.maxSlope*Math.PI/180)+.03){blocked='段差・落差';break;}
  next=[x,result.hit.height,z];
 }
 return {position:next,blocked};
}

export function createExplorationPanel(){
 const el=document.createElement('section');el.id='exploration';el.className='inner-observation';el.setAttribute('aria-label','城内を歩く・案内探索');
 el.innerHTML=`<h3>城内を歩き、地形を読む</h3><p>表示中のC模型に沿う自由歩行です。実際の史跡の通行可否・安全性を保証しません。堀・急斜面・土塁・構造物には進入できません。</p><div class="segmented"><button id="walk-start">自由歩行を始める</button><button id="walk-exit" disabled>通常観察へ戻る</button></div><label>移動速度 <select id="walk-speed"><option value="0.7">ゆっくり 0.7m/s</option><option value="1.4" selected>標準 1.4m/s</option></select></label><label>操作方式 <select id="walk-input"><option value="keys">キーボード＋ドラッグ</option><option value="touch">画面ボタン＋スワイプ</option></select></label><p>WASD／方向キーで移動。画像をドラッグ・スワイプして見回す。Q/Eで左右を見る。Escapeで通常観察。入力欄の操作は移動に使いません。</p><div id="exploration-guide" class="segmented station-buttons"></div><p id="exploration-description" role="status">8地点を順に案内。地点移動は瞬時の切替で、地点間を歩いたことにはなりません。</p><p id="walk-status" role="status">歩行は停止中。</p>`;
 document.querySelector('#landscape-toolbar').prepend(el);
 const pad=document.createElement('div');pad.id='walk-pad';pad.hidden=true;pad.setAttribute('aria-label','歩行ボタン');pad.innerHTML='<button data-walk="ArrowUp" aria-label="前へ進む">↑</button><div><button data-walk="ArrowLeft" aria-label="左へ移動">←</button><button data-walk="ArrowDown" aria-label="後ろへ移動">↓</button><button data-walk="ArrowRight" aria-label="右へ移動">→</button></div><button id="walk-stop-overlay">歩行を終了</button><output id="walk-heading" aria-live="off"></output>';
 document.querySelector('#viewport').append(pad);return {panel:el,pad};
}

// Event ownership is local and cleared on focus loss, cancellation, mode change
// and disposal. No pointer lock, synthetic inertia or fixed sleeps.
export function createWalkInput({viewport,canvas,camera,target,render,onExit,status}){
 let world=null,position=null,active=false,raf=0,last=0,look=null,heldPointer=null,frames=[],trace=[],blocked=null;
 const keys=new Set(),abort=new AbortController(),signal=abort.signal,pad=document.querySelector('#walk-pad');
 const listen=(el,name,fn,opts={})=>el.addEventListener(name,fn,{...opts,signal});
 const editable=e=>e.target!==viewport&&e.target!==canvas&&e.target.closest('input,select,textarea,button,dialog');
 const record=(type,extra={})=>{trace.push({type,time:performance.now(),...extra});if(trace.length>500)trace.shift();};
 function clear(){keys.clear();look=null;heldPointer=null;cancelAnimationFrame(raf);raf=0;last=0;}
 function lookBy(dx,dy){const v=target.clone().sub(camera.position),r=Math.max(1,v.length()),yaw=Math.atan2(v.x,-v.z)+dx,pitch=Math.max(-1.2,Math.min(1.2,Math.asin(v.y/r)+dy));target.copy(camera.position).add(new Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)).multiplyScalar(r));camera.lookAt(target);render();}
 function frame(t){raf=0;if(!active||document.hidden||!keys.size)return;
  const ms=last?t-last:16;last=t;frames.push(ms);if(frames.length>600)frames.shift();const dt=Math.min(ms/1000,.05);
  const direction=target.clone().sub(camera.position);direction.y=0;direction.normalize();
  let f=Number(keys.has('w')||keys.has('ArrowUp'))-Number(keys.has('s')||keys.has('ArrowDown')),r=Number(keys.has('d')||keys.has('ArrowRight'))-Number(keys.has('a')||keys.has('ArrowLeft'));
  const length=Math.hypot(f,r)||1;f/=length;r/=length;
  if(keys.has('q')||keys.has('e'))lookBy((Number(keys.has('e'))-Number(keys.has('q')))*dt,0);
  if(f||r){const speed=Number(document.querySelector('#walk-speed').value),move=advanceWalk(position,(direction.x*f-direction.z*r)*speed*dt,(direction.z*f+direction.x*r)*speed*dt,world);blocked=move.blocked;const shift=new Vector3(move.position[0]-position[0],move.position[1]-position[1],move.position[2]-position[2]);position=move.position;camera.position.add(shift);target.add(shift);camera.lookAt(target);record('move',{position:[...position],blocked});}
  document.querySelector('#walk-heading').textContent=`目線1.7m · 方位 ${Math.round((Math.atan2(direction.x,-direction.z)*180/Math.PI+360)%360)}°${blocked?' · '+blocked:''}`;
  render();raf=requestAnimationFrame(frame);
 }
 function startFrame(){if(!raf){last=0;raf=requestAnimationFrame(frame);}}
 listen(viewport,'keydown',e=>{if(!active||editable(e))return;if(e.key==='Escape'){e.preventDefault();onExit();return;}const key=e.key.length===1?e.key.toLowerCase():e.key;if(['w','a','s','d','q','e','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key)){e.preventDefault();e.stopImmediatePropagation();keys.add(key);record('keydown',{key,trusted:e.isTrusted});startFrame();}}, {capture:true});
 listen(window,'keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;keys.delete(k);record('keyup',{key:k,trusted:e.isTrusted});});
 const sizeObserver=new ResizeObserver(()=>{if(viewport.clientWidth===0||viewport.clientHeight===0)clear();});sizeObserver.observe(viewport);
 listen(window,'blur',clear);listen(document,'visibilitychange',clear);listen(viewport,'focusout',()=>{keys.clear();});
 listen(canvas,'pointerdown',e=>{if(!active||look||e.button!==0)return;look={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);record('look-start',{pointerType:e.pointerType,trusted:e.isTrusted});});
 listen(canvas,'pointermove',e=>{if(!active||look?.id!==e.pointerId)return;lookBy(-(e.clientX-look.x)*.004,-(e.clientY-look.y)*.004);look={...look,x:e.clientX,y:e.clientY};});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(canvas,type,e=>{if(look?.id===e.pointerId)look=null;});
 for(const b of pad.querySelectorAll('[data-walk]')){
  listen(b,'pointerdown',e=>{if(!active||heldPointer!==null)return;e.preventDefault();heldPointer=e.pointerId;b.setPointerCapture(e.pointerId);keys.add(b.dataset.walk);record('pad-down',{key:b.dataset.walk,pointerId:e.pointerId,pointerType:e.pointerType,trusted:e.isTrusted});startFrame();});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(b,type,e=>{if(heldPointer!==e.pointerId)return;keys.delete(b.dataset.walk);heldPointer=null;record(type,{key:b.dataset.walk,trusted:e.isTrusted});});
  listen(b,'keydown',e=>{if(active&&[' ','Enter'].includes(e.key)){e.preventDefault();keys.add(b.dataset.walk);startFrame();}});
  listen(b,'keyup',()=>keys.delete(b.dataset.walk));
 }
 return {
  get active(){return active;},
  start(newWorld,ground){clear();world=newWorld;position=[...ground];const check=world.check(position[0],position[2]);if(!check.ok)throw Error(check.reason);active=true;frames=[];trace=[];blocked=null;pad.hidden=false;record('start',{position});status.textContent='自由歩行中：実地表＋1.7m。移動制限は模型上の設定です。';viewport.focus({preventScroll:true});},
  stop(){const was=active;active=false;clear();pad.hidden=true;if(was)record('stop');},
  dispose(){active=false;clear();sizeObserver.disconnect();abort.abort();},
  diagnostics(){return {active,position:position&&[...position],eyeHeight:WALK.eyeHeight,blocked,obstacleCount:world?.obstacleCount??0,support:position?world?.sample(position[0],position[2]):null,frames:[...frames],trace:[...trace]};}
 };
}
