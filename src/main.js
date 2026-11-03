import './style.css';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {sampleHeight} from './coordinates.js';
import {groundScale} from './scale.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={view:'regional',mode:'terrain',selected:'castle',exaggeration:1,route:false,features:true,ready:false};
const categories={A:'現況',B:'史料に基づく復元',C:'推定・案内',D:'演出・模式表現'};
const sourceDialog=$('#sources'); $('#sources-open').onclick=()=>sourceDialog.showModal();$('#sources-close').onclick=()=>sourceDialog.close();
sourceDialog.addEventListener('close',()=>$('#sources-open').focus());
const viewport=$('#viewport'); let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});}catch(e){showError('この環境ではWebGLを開始できません。解説と資料は引き続き読めます。',e);}
function showError(message,error){state.ready=false;$('#loading')?.remove();$('#app-status').textContent=message;const block=document.createElement('div');block.className='error';const p=document.createElement('p');p.textContent=message;block.append(p);viewport.append(block);console.error(error);}
async function json(url){const r=await fetch(url);if(!r.ok)throw new Error(`${r.status} ${url}`);return r.json();}
if(renderer) initialize().catch(e=>showError('地形データを読み込めませんでした。接続と配布ファイルを確認してください。',e));
async function initialize(){
 const [features,sources,regional,castle,studyMeta]=await Promise.all(['/data/features.json','/data/sources.json','/data/regional.json','/data/castle.json','/data/study.json'].map(json));
 $('#source-list').replaceChildren(...sources.map(s=>{const div=document.createElement('section');div.className='source';const a=document.createElement('a');a.href=s.url;a.target='_blank';a.rel='noopener';a.textContent=s.title+' ↗';div.append(a);for(const text of [s.year,s.use,s.terms,s.accuracy]){const p=document.createElement('p');p.textContent=text;div.append(p);}return div;}));
 const scene=new THREE.Scene();scene.background=new THREE.Color('#e2e9de');
 const camera=new THREE.PerspectiveCamera(38,1,1,30000);
 renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.setClearColor('#e2e9de');renderer.outputColorSpace=THREE.SRGBColorSpace;viewport.append(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.minDistance=12;controls.maxDistance=20000;controls.maxPolarAngle=Math.PI*.48;controls.screenSpacePanning=false;
 const light=new THREE.DirectionalLight('#fff5d9',2.0);light.position.set(-1500,3000,-1500);scene.add(light,new THREE.HemisphereLight('#edf3df','#47644a',2.1));
 const terrainGroup=new THREE.Group();scene.add(terrainGroup);const markerGroup=new THREE.Group();scene.add(markerGroup);const routeGroup=new THREE.Group();scene.add(routeGroup);
 const loader=new GLTFLoader(),models=new Map(),grids={regional,castle};let currentModel,request=0,routeLine;
 const labels=new Map(),markers=[];
 const palette=[new THREE.Color('#466449'),new THREE.Color('#899d67'),new THREE.Color('#b3b580'),new THREE.Color('#d9d2a5')];
 function altitudeColor(h){const t=THREE.MathUtils.clamp((h-200)/620,0,1)*(palette.length-1),i=Math.min(Math.floor(t),palette.length-2);return palette[i].clone().lerp(palette[i+1],t-i);}
 function paint(){if(!currentModel)return;currentModel.traverse(ob=>{if(!ob.isMesh)return;const pos=ob.geometry.attributes.position,norm=ob.geometry.attributes.normal;const colors=new Float32Array(pos.count*3);for(let i=0;i<pos.count;i++){
   const h=pos.getY(i),slope=Math.acos(Math.min(1,Math.abs(norm.getY(i))))*180/Math.PI;
   let color=state.mode==='slope'?new THREE.Color('#c4cba0').lerp(new THREE.Color('#9b3b23'),Math.min(1,slope/60)):altitudeColor(h);
   if(ob.userData.evidenceCategory==='C'&&ob.name.includes('moat_study'))color=new THREE.Color('#af7652');
   if(state.mode==='contour'&&((h%50+50)%50)<2)color.multiplyScalar(.45);
   colors.set([color.r,color.g,color.b],i*3);
  }ob.geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));ob.material.vertexColors=true;ob.material.needsUpdate=true;});
  const g=state.view==='regional'?regional:castle;
  $('#legend').innerHTML=state.mode==='slope'?'<span class="ramp" style="background:linear-gradient(90deg,#c4cba0,#9b3b23)"></span><span>0°</span><span>実地形の傾斜</span><span>60°以上</span>':`<span class="ramp"></span><span>低い</span><span>${Math.round(g.min)}–${Math.round(g.max)} m</span><span>高い${state.mode==='contour'?' / 50m帯':''}</span>`;
 }
 async function getModel(view){const file=view==='study'?'moat-study':view;if(models.has(file))return models.get(file);const gltf=await loader.loadAsync(`/data/${file}.glb`);gltf.scene.updateMatrixWorld(true);const group=new THREE.Group();gltf.scene.traverse(ob=>{if(!ob.isMesh)return;const geo=ob.geometry.clone();geo.applyMatrix4(ob.matrixWorld);geo.computeVertexNormals();const mat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,metalness:0,side:THREE.DoubleSide});const mesh=new THREE.Mesh(geo,mat);mesh.name=ob.name;mesh.userData={...ob.userData};group.add(mesh);});models.set(file,group);return group;}
 function render(){if(document.hidden)return;const r=viewport.getBoundingClientRect();if(r.width===0||r.height===0)return;renderer.render(scene,camera);updateLabels();updateScale();}
 function resize(){const r=viewport.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();render();}
 const ro=new ResizeObserver(resize);ro.observe(viewport);controls.addEventListener('change',render);document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
 function fitTerrain(g){
  const direction=camera.position.clone().sub(controls.target).normalize();let distance=camera.position.distanceTo(controls.target);
  for(let i=0;i<15;i++){camera.position.copy(controls.target).addScaledVector(direction,distance);camera.lookAt(controls.target);camera.updateMatrixWorld();let fits=true;for(const x of [g.bounds[0],g.bounds[2]])for(const n of [g.bounds[1],g.bounds[3]])for(const h of [g.min,g.max]){const p=new THREE.Vector3(x,h*state.exaggeration,-n).project(camera);if(Math.abs(p.x)>.86||Math.abs(p.y)>.76||p.z>1)fits=false;}if(fits)break;distance*=1.12;}
 }
 function focusPreset(view=state.view){
  const v=state.exaggeration;
  if(view==='regional'){controls.target.set(0,480*v,0);camera.position.set(-2750,2500+480*v,2900);fitTerrain(regional);}
  else if(view==='study'){const [e,n]=studyMeta.center,h=sampleHeight(castle,e,n)*v;controls.target.set(e,h,-n);camera.position.set(e-26,h+23,-n+30);}
  else{controls.target.set(150,500*v,100);camera.position.set(-760,1300+500*v,1100);fitTerrain(castle);}
  controls.update();render();
 }
 function sourceLinks(f){const div=document.createElement('div');div.className='source-inline';for(const id of f.sourceIds){const s=sources.find(s=>s.id===id);if(s){const a=document.createElement('a');a.href=s.url;a.target='_blank';a.rel='noopener';a.textContent=id==='gsi'?'国土地理院 ↗':id==='plan'?'保存活用計画 ↗':'三島市の解説 ↗';div.append(a,document.createTextNode('　'));}}return div;}
 function select(id){state.selected=id;const f=features.find(f=>f.id===id);const h=sampleHeight(state.view==='regional'?regional:castle,...f.local);$('#detail').innerHTML=`<span class="evidence-tag"><b>${f.category}</b>${categories[f.category]}</span><h2>${f.name}</h2><p>${f.description}</p><dl><div><dt>現在のDEM標高（案内地点）</dt><dd>${Math.round(h)} <small>m</small></dd></div><div><dt>位置の確実性</dt><dd style="font:11px Arial;padding-top:7px">概略 / 未測量</dd></div></dl>`;$('#detail').append(sourceLinks(f));$('#chapter-no').textContent=`0${features.indexOf(f)+1} / 04`;$$('#feature-list button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===id)));for(const [key,label]of labels){label.classList.toggle('active',key===id);}$('#elevation').textContent=`${f.name} · 約${Math.round(h)} m`;render();}
 features.forEach((f,index)=>{
  const b=document.createElement('button');b.textContent=`0${index+1} ${['立地','堀','出丸','道'][index]}`;b.title=f.name;b.setAttribute('aria-label',f.name);b.setAttribute('aria-pressed',String(index===0));b.dataset.id=f.id;b.onclick=()=>select(f.id);$('#feature-list').append(b);
  const marker=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshBasicMaterial({color:f.category==='D'?'#a56335':'#2e5741',depthTest:false}));marker.userData.featureId=f.id;marker.renderOrder=10;markerGroup.add(marker);markers.push(marker);
  const label=document.createElement('span');label.className='point-label';label.textContent=f.name;$('#point-labels').append(label);labels.set(f.id,label);
 });
 function placeMarkers(){const g=state.view==='regional'?regional:castle;for(const m of markers){const f=features.find(f=>f.id===m.userData.featureId);m.position.set(f.local[0],sampleHeight(g,...f.local)*state.exaggeration+(state.view==='regional'?25:state.view==='study'?2:12),-f.local[1]);}markerGroup.visible=state.features&&state.view!=='study';$('#point-labels').classList.toggle('hidden',!markerGroup.visible);}
 function updateLabels(){if(!markerGroup.visible)return;const r=viewport.getBoundingClientRect();const placed=[];const ordered=[...markers].sort((a,b)=>Number(b.userData.featureId===state.selected)-Number(a.userData.featureId===state.selected));for(const m of ordered){const index=features.findIndex(f=>f.id===m.userData.featureId),f=features[index],label=labels.get(f.id),selected=f.id===state.selected;label.textContent=selected?f.name:`0${index+1}`;const v=m.position.clone().project(camera);let visible=v.z>=-1&&v.z<=1&&Math.abs(v.x)<.86&&Math.abs(v.y)<.7;const x=(v.x*.5+.5)*r.width,y=(-v.y*.5+.5)*r.height-12;const w=selected?Math.min(180,f.name.length*11+16):26;const box={x:x-w/2,y:y-22,w,h:22};if(placed.some(p=>box.x<p.x+p.w+3&&box.x+box.w+3>p.x&&box.y<p.y+p.h+3&&box.y+box.h+3>p.y))visible=false;label.hidden=!visible;if(visible){label.style.left=`${x}px`;label.style.top=`${y+viewport.offsetTop}px`;placed.push(box);}const size=THREE.MathUtils.clamp(m.position.distanceTo(camera.position)*.006,1,35);m.scale.setScalar(size);}}
 let currentScale;
 function updateScale(){const r=viewport.getBoundingClientRect();currentScale=groundScale(camera,controls.target,r.width,r.height,Math.min(160,r.width*.4));$('#scale').textContent=`中心水平 ${currentScale.metres} m`;$('#scale').style.borderTop='1px solid #597456';$('#scale').style.width=`${currentScale.pixels}px`;$('#scale').style.whiteSpace='nowrap';}
 function makeRoute(){if(routeLine){routeGroup.remove(routeLine);routeLine.geometry.dispose();routeLine.material.dispose();}const pts=[];for(let i=0;i<=60;i++){const t=i/60,e=-1400+2800*t,n=-1400+2700*t;pts.push(new THREE.Vector3(e,sampleHeight(regional,e,n)*state.exaggeration+10,-n));}const geo=new THREE.BufferGeometry().setFromPoints(pts);routeLine=new THREE.Line(geo,new THREE.LineDashedMaterial({color:'#9c572d',dashSize:28,gapSize:20,depthTest:false}));routeLine.computeLineDistances();routeLine.renderOrder=9;routeGroup.add(routeLine);routeGroup.visible=state.route&&state.view==='regional';}
 async function setView(view,{reset=true}={}){const token=++request;state.ready=false;$('#app-status').textContent='地形を切り替えています…';const model=await getModel(view);if(token!==request)return;terrainGroup.clear();currentModel=model;terrainGroup.add(model);state.view=view;if(view==='study')state.selected='west';terrainGroup.scale.y=state.exaggeration;paint();placeMarkers();makeRoute();$$('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));$('#study-note').hidden=view!=='study';$('#extent').textContent=view==='regional'?'広域 · 4 × 4 km':view==='study'?'断面教材 · 推定配置 C':'城域 · 1 × 1.1 km';$('#route-toggle').disabled=view!=='regional';select(state.selected);if(reset)focusPreset(view);$('#loading')?.remove();state.ready=true;$('#app-status').textContent=`表示準備完了 · ${view==='regional'?'国土地理院 DEM5A + 欠測部DEM10B / Web20m':view==='castle'?'国土地理院 DEM1A / Web5m':'資料を参考にした推定教材 / 平面位置UNKNOWN'} · 連続アニメーションなし`;render();}
 $$('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view).catch(e=>showError('地形の切替に失敗しました。',e)));
 $$('[data-mode]').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;$$('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));paint();render();});
 $('#exaggeration').onchange=()=>{state.exaggeration=$('#exaggeration').checked?2:1;terrainGroup.scale.y=state.exaggeration;$('#height-mode').textContent=`標高倍率 ${state.exaggeration}×${state.exaggeration===2?'（誇張）':''}`;placeMarkers();makeRoute();focusPreset();};
 $('#features-toggle').onchange=()=>{state.features=$('#features-toggle').checked;placeMarkers();render();};$('#route-toggle').onchange=()=>{state.route=$('#route-toggle').checked;makeRoute();render();};
 $('#focus-feature').onclick=async()=>{const f=features.find(f=>f.id===state.selected);if(f.id==='route'){await setView('regional');state.route=true;$('#route-toggle').checked=true;makeRoute();render();return;}await setView('castle',{reset:false});const [e,n]=f.local,h=sampleHeight(castle,e,n)*state.exaggeration;controls.target.set(e,h,-n);camera.position.set(e-230,h+230,-n+280);controls.update();render();};
 function zoom(f){camera.position.sub(controls.target).multiplyScalar(f).add(controls.target);controls.update();render();}
 $('#zoom-in').onclick=()=>zoom(.8);$('#zoom-out').onclick=()=>zoom(1.25);$('#north').onclick=()=>{const t=controls.target,d=camera.position.distanceTo(t);camera.position.set(t.x,t.y+d*.99,t.z+d*.1);controls.update();render();};
 $('#reset').onclick=async()=>{state.exaggeration=1;state.mode='terrain';state.route=false;state.features=true;$('#exaggeration').checked=false;$('#route-toggle').checked=false;$('#features-toggle').checked=true;$('#height-mode').textContent='標高倍率 1×';$$('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode==='terrain')));state.selected='castle';await setView('regional');};
 viewport.addEventListener('keydown',e=>{if(['+','=','-'].includes(e.key)){e.preventDefault();zoom(e.key==='-'?1.2:.83);}if(e.key.startsWith('Arrow')){e.preventDefault();const offset=camera.position.clone().sub(controls.target),s=new THREE.Spherical().setFromVector3(offset);if(e.key==='ArrowLeft')s.theta-=.12;if(e.key==='ArrowRight')s.theta+=.12;if(e.key==='ArrowUp')s.phi=Math.max(.06,s.phi-.12);if(e.key==='ArrowDown')s.phi=Math.min(Math.PI*.48,s.phi+.12);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));controls.update();render();}});
 let pointerStart;
 renderer.domElement.addEventListener('pointerdown',e=>{pointerStart=[e.clientX,e.clientY];});
 renderer.domElement.addEventListener('pointerup',e=>{if(!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>8)return;pointerStart=null;const rect=renderer.domElement.getBoundingClientRect(),p=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(p,camera);if(markerGroup.visible){const hits=ray.intersectObjects(markers);if(hits[0]){select(hits[0].object.userData.featureId);return;}}const hits=ray.intersectObjects(currentModel.children,true);if(hits[0]){$('#elevation').textContent=`地表標高 約${Math.round(hits[0].point.y/state.exaggeration)} m${state.view==='study'?'（教材含む）':''}`;}});
 renderer.domElement.addEventListener('pointercancel',()=>{pointerStart=null;});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#app-status').textContent='描画接続が失われました。ページを再読込してください。';state.ready=false;});
 // Read-only diagnostics for reproducible QA. Tests exercise UI, not these setters.
 window.__terrainDiagnostics=()=>({state:{...state},camera:camera.position.toArray(),target:controls.target.toArray(),scale:currentScale,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,modelBounds:currentModel?new THREE.Box3().setFromObject(currentModel).min.toArray().concat(new THREE.Box3().setFromObject(currentModel).max.toArray()):null,canvas:renderer.getSize(new THREE.Vector2()).toArray(),studyBounds:studyMeta.bounds,markerScreen:markers.map(m=>({id:m.userData.featureId,ndc:m.position.clone().project(camera).toArray()}))});
 await setView('regional');resize();
}
