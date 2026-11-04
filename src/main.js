import './style.css';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {sampleHeight} from './coordinates.js';
import {groundScale} from './scale.js';
import {createReading} from './reading.js';
import {createIntentController} from './intent.js';
import {sampleSurfaceHeight} from './surface.js';
import {createSectionExhibit} from './section-exhibit.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const assetPath=path=>`${import.meta.env.BASE_URL}${path}`;
const state={view:'regional',mode:'terrain',selected:'castle',exaggeration:1,route:false,features:true,ready:false};
const sourceDialog=$('#sources'); $('#sources-open').onclick=()=>sourceDialog.showModal();$('#sources-close').onclick=()=>sourceDialog.close();
sourceDialog.addEventListener('close',()=>$('#sources-open').focus());
const viewport=$('#viewport'),viewportLabel=viewport.getAttribute('aria-label');
let renderer,reading,sectionExhibit,renderFailed=false,teardownTerrain=()=>{};
function setRenderControls(enabled){
 $$('.controls fieldset, #reconstruction-controls fieldset').forEach(el=>{el.disabled=!enabled;});$$('.map-tools button, #focus-feature').forEach(el=>{el.disabled=!enabled;});
 viewport.tabIndex=enabled?0:-1;viewport.setAttribute('role',enabled?'application':'region');viewport.setAttribute('aria-label',enabled?viewportLabel:'3D地形の状態');
}
function showError(message,error,kind='error'){
 renderFailed=true;state.ready=false;sectionExhibit?.fail();setRenderControls(false);reading?.setSelectionHandler(null);teardownTerrain();document.body.dataset.renderState=kind;
 $('#loading')?.remove();$('#app-status').textContent=message;viewport.querySelector('.error')?.remove();const block=document.createElement('div');block.className='error';block.setAttribute('role','status');const p=document.createElement('p');p.textContent=message;block.append(p);viewport.append(block);console.error(error);
}
async function json(url){const r=await fetch(url);if(!r.ok)throw new Error(`${r.status} ${url}`);return r.json();}
setRenderControls(false);
async function bootstrap(){
 let features,sources;
 try{const [original,sourceData,reconstruction]=await Promise.all(['data/features.json','data/sources.json','data/nishinomaru.json'].map(path=>json(assetPath(path))));features=[...original,...reconstruction.facilities];sources=sourceData;reading=createReading({features,sources});}
 catch(e){document.body.dataset.readingState='error';$('#reading-status').textContent='施設解説・出典データを読み込めませんでした。';$('#source-list').textContent='出典データを読み込めませんでした。接続と配布ファイルを確認してください。';showError('解説・出典データの読込みに失敗したため、3Dの初期化を開始できませんでした。',e);return;}
 try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});}
 catch(e){showError('この環境ではWebGLを開始できません。施設一覧から解説と出典は利用できます。',e,'unavailable');return;}
 try{await initialize(features);}
 catch(e){showError('3D地形データの読込みに失敗しました。施設一覧から解説と出典は利用できます。',e);}
}
bootstrap();
async function initialize(features){
 const [regional,castle,studyMeta]=await Promise.all(['data/regional.json','data/castle.json','data/study.json'].map(path=>json(assetPath(path))));
 const scene=new THREE.Scene();scene.background=new THREE.Color('#e2e9de');
 const camera=new THREE.PerspectiveCamera(38,1,1,30000);
 renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.setClearColor('#e2e9de');renderer.outputColorSpace=THREE.SRGBColorSpace;viewport.append(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.minDistance=12;controls.maxDistance=20000;controls.maxPolarAngle=Math.PI*.48;controls.screenSpacePanning=false;
 const light=new THREE.DirectionalLight('#fff5d9',2.0);light.position.set(-1500,3000,-1500);scene.add(light,new THREE.HemisphereLight('#edf3df','#47644a',2.1));
 const terrainGroup=new THREE.Group();scene.add(terrainGroup);const markerGroup=new THREE.Group();scene.add(markerGroup);const routeGroup=new THREE.Group();scene.add(routeGroup);
 const loader=new GLTFLoader(),models=new Map(),grids={regional,castle};let currentModel,routeLine;const intents=createIntentController();
 let comparison='restored';const hiddenFacilities=new Set();
 const modelFeatures=features.filter(f=>f.reconstruction);
 function applyLayers(){if(state.view!=='reconstruction')return;currentModel.children.forEach(ob=>{ob.visible=!(comparison==='restored'&&ob.userData.facilityId&&ob.userData.facilityId!=='nm-context'&&(!$('#category-c').checked||hiddenFacilities.has(ob.userData.facilityId)));});}
 $('#facility-layers').replaceChildren(...modelFeatures.map(f=>{const label=document.createElement('label');label.className='check';const input=document.createElement('input');input.type='checkbox';input.checked=true;input.dataset.facility=f.id;input.onchange=()=>{if(input.checked)hiddenFacilities.delete(f.id);else hiddenFacilities.add(f.id);applyLayers();sectionExhibit?.sync();render();};label.append(input,document.createTextNode(`C ${f.shortLabel}`));return label;}));
 $('#category-c').onchange=()=>{applyLayers();sectionExhibit?.sync();render();};
 function beginIntent(){const intent=intents.begin();if(currentModel&&!renderFailed){state.ready=true;reportReady();}return intent;}
 function beginCameraIntent(){if(currentModel)return beginIntent();intents.adjustCamera();}
 async function runAction(action,message='表示操作に失敗しました。施設一覧から解説と出典は利用できます。'){
  const intent=beginIntent();try{return await action(intent);}catch(error){if(intent.isCurrent()&&!renderFailed)showError(message,error);return false;}
 }
 function displayedHeight(f){
  const meshes=state.view==='reconstruction'&&comparison==='restored'&&f.reconstruction?currentModel.children.filter(o=>o.userData.facilityId===f.id):currentModel.children;
  return sampleSurfaceHeight(meshes,...f.local,state.exaggeration);
 }
 $$('[data-compare]').forEach(b=>b.onclick=()=>runAction(intent=>setView('reconstruction',{reset:false,variant:b.dataset.compare,intent})));
 $$('[data-eye]').forEach(b=>b.onclick=()=>runAction(async intent=>{const f=features.find(x=>x.id===b.dataset.eye);if(!await setView('reconstruction',{reset:false,intent,selected:f.id})||!intent.canMoveCamera())return;const [e,n]=f.local,h=displayedHeight(f)*state.exaggeration;controls.target.set(e,h+1.6,-n);camera.position.set(e-12,h+7,-n+22);controls.update();render();}));
 const labels=new Map(),markers=[];
 const palette=[new THREE.Color('#466449'),new THREE.Color('#899d67'),new THREE.Color('#b3b580'),new THREE.Color('#d9d2a5')];
 function altitudeColor(h){const t=THREE.MathUtils.clamp((h-200)/620,0,1)*(palette.length-1),i=Math.min(Math.floor(t),palette.length-2);return palette[i].clone().lerp(palette[i+1],t-i);}
 function paint(){if(!currentModel)return;currentModel.traverse(ob=>{if(!ob.isMesh)return;const pos=ob.geometry.attributes.position,norm=ob.geometry.attributes.normal;const colors=new Float32Array(pos.count*3);for(let i=0;i<pos.count;i++){
   const h=pos.getY(i),slope=Math.acos(Math.min(1,Math.abs(norm.getY(i))))*180/Math.PI;
   let color=state.mode==='slope'?new THREE.Color('#c4cba0').lerp(new THREE.Color('#9b3b23'),Math.min(1,slope/60)):altitudeColor(h);
   if(ob.userData.evidenceCategory==='C'&&ob.name.includes('moat_study'))color=new THREE.Color('#af7652');
   if(state.view==='reconstruction'&&ob.userData.facilityId&&ob.userData.facilityId!=='nm-context')color=new THREE.Color({'nm-bailey':'#9ca46f','nm-moat':'#aa6b46','nm-rampart':'#b69a64','nm-passage':'#c7b289','nm-transition':'#78906c'}[ob.userData.facilityId]);
   if(state.mode==='contour'&&((h%50+50)%50)<2&&!(state.view==='reconstruction'&&ob.userData.facilityId))color.multiplyScalar(.45);
   colors.set([color.r,color.g,color.b],i*3);
  }ob.geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));ob.material.vertexColors=true;ob.material.needsUpdate=true;});
  const g=state.view==='regional'?regional:castle;
  $('#legend').innerHTML=state.mode==='slope'?'<span class="ramp" style="background:linear-gradient(90deg,#c4cba0,#9b3b23)"></span><span>0°</span><span>実地形の傾斜</span><span>60°以上</span>':`<span class="ramp"></span><span>低い</span><span>${Math.round(g.min)}–${Math.round(g.max)} m</span><span>高い${state.mode==='contour'?' / 50m帯':''}</span>`;
  if(['study','reconstruction'].includes(state.view)){const note=document.createElement('span');note.className='legend-exclusion';note.textContent=state.view==='study'?'茶色のC教材は標高・傾斜・等高帯の凡例対象外（固定色）':'復元Cは施設別固定色。標高・傾斜・等高帯の凡例対象外 / B形状0';$('#legend').append(note);}

 }
 async function getModel(view,variant){
  const file=view==='reconstruction'?(variant==='current'?'castle':'nishinomaru'):view==='study'?'moat-study':view;
  if(models.has(file))return models.get(file);
  const pending=loader.loadAsync(assetPath(`data/${file}.glb`)).then(gltf=>{gltf.scene.updateMatrixWorld(true);const group=new THREE.Group();gltf.scene.traverse(ob=>{if(!ob.isMesh)return;const geo=ob.geometry.clone();geo.applyMatrix4(ob.matrixWorld);geo.computeVertexNormals();const mat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,metalness:0,side:THREE.DoubleSide});const mesh=new THREE.Mesh(geo,mat);mesh.name=ob.name;mesh.userData={...ob.userData};group.add(mesh);});return group;});
  models.set(file,pending);try{return await pending;}catch(error){if(models.get(file)===pending)models.delete(file);throw error;}
 }
 sectionExhibit=createSectionExhibit({getModel,scene,render,context:()=>({ready:state.ready,view:state.view,comparison,exaggeration:state.exaggeration,failed:renderFailed,visible:currentModel?.children.filter(o=>o.visible).map(o=>o.userData.facilityId??o.name)??[]}),open:s=>runAction(async intent=>{if(!await setView('reconstruction',{reset:false,intent}))return;if(!intent.canMoveCamera())return;const e=(s.start[0]+s.end[0])/2,n=(s.start[1]+s.end[1])/2,h=sampleSurfaceHeight(currentModel.children,e,n,state.exaggeration)*state.exaggeration;controls.target.set(e,h,-n);camera.position.set(e-28,h+42,-n+45);controls.update();render();})});
 function render(){if(renderFailed||document.hidden)return;const r=viewport.getBoundingClientRect();if(r.width===0||r.height===0)return;renderer.render(scene,camera);updateLabels();updateScale();}
 function resize(){const r=viewport.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();render();}
 const ro=new ResizeObserver(resize);ro.observe(viewport);controls.addEventListener('change',render);controls.addEventListener('start',()=>beginCameraIntent());const onVisibility=()=>{if(!document.hidden)render();};document.addEventListener('visibilitychange',onVisibility);teardownTerrain=()=>{sectionExhibit?.dispose();controls.dispose();ro.disconnect();document.removeEventListener('visibilitychange',onVisibility);renderer.dispose();};
 function fitTerrain(g){
  const direction=camera.position.clone().sub(controls.target).normalize();let distance=camera.position.distanceTo(controls.target);
  for(let i=0;i<15;i++){camera.position.copy(controls.target).addScaledVector(direction,distance);camera.lookAt(controls.target);camera.updateMatrixWorld();let fits=true;for(const x of [g.bounds[0],g.bounds[2]])for(const n of [g.bounds[1],g.bounds[3]])for(const h of [g.min,g.max]){const p=new THREE.Vector3(x,h*state.exaggeration,-n).project(camera);if(Math.abs(p.x)>.86||Math.abs(p.y)>.76||p.z>1)fits=false;}if(fits)break;distance*=1.12;}
 }
 function focusPreset(view=state.view){
  const v=state.exaggeration;
  if(view==='regional'){controls.target.set(0,480*v,0);camera.position.set(-2750,2500+480*v,2900);fitTerrain(regional);}
  else if(view==='reconstruction'){const f=features.find(f=>f.id==='nm-bailey'),h=(currentModel?displayedHeight(f):f.height)*v;controls.target.set(-20,h,0);camera.position.set(-115,h+95,115);}
  else if(view==='study'){const [e,n]=studyMeta.center,h=sampleHeight(castle,e,n)*v;controls.target.set(e,h,-n);camera.position.set(e-26,h+23,-n+30);}
  else{controls.target.set(150,500*v,100);camera.position.set(-760,1300+500*v,1100);fitTerrain(castle);}
  controls.update();render();
 }
 function select(id){state.selected=id;const f=features.find(f=>f.id===id);const h=f.reconstruction?f.height:sampleHeight(state.view==='regional'?regional:castle,...f.local);reading.select(id,h);for(const [key,label]of labels)label.classList.toggle('active',key===id);$('#elevation').textContent=`${f.name} · 約${Math.round(h)} m`;render();}
 function chooseFeature(id){return runAction(async intent=>{const f=features.find(f=>f.id===id);select(id);if(f.reconstruction&&state.view!=='reconstruction')await setView('reconstruction',{intent,selected:id});else if(!currentModel)await setView('regional',{intent,selected:id});});}
 reading.setSelectionHandler(chooseFeature);
 features.filter(f=>!f.reconstruction).forEach((f,index)=>{
  const marker=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshBasicMaterial({color:f.category==='D'?'#a56335':'#2e5741',depthTest:false}));marker.userData.featureId=f.id;marker.renderOrder=10;markerGroup.add(marker);markers.push(marker);
  const label=document.createElement('span');label.className='point-label';label.textContent=f.name;$('#point-labels').append(label);labels.set(f.id,label);
 });
 function placeMarkers(){const g=state.view==='regional'?regional:castle;for(const m of markers){const f=features.find(f=>f.id===m.userData.featureId);m.position.set(f.local[0],sampleHeight(g,...f.local)*state.exaggeration+(state.view==='regional'?25:state.view==='study'?2:12),-f.local[1]);}markerGroup.visible=state.features&&!['study','reconstruction'].includes(state.view);$('#point-labels').classList.toggle('hidden',!markerGroup.visible);}
 function updateLabels(){if(!markerGroup.visible)return;const r=viewport.getBoundingClientRect();const placed=[];const ordered=[...markers].sort((a,b)=>Number(b.userData.featureId===state.selected)-Number(a.userData.featureId===state.selected));for(const m of ordered){const index=features.findIndex(f=>f.id===m.userData.featureId),f=features[index],label=labels.get(f.id),selected=f.id===state.selected;label.textContent=selected?f.name:`0${index+1}`;const v=m.position.clone().project(camera);let visible=v.z>=-1&&v.z<=1&&Math.abs(v.x)<.86&&Math.abs(v.y)<.7;const x=(v.x*.5+.5)*r.width,y=(-v.y*.5+.5)*r.height-12;const w=selected?Math.min(180,f.name.length*11+16):26;const box={x:x-w/2,y:y-22,w,h:22};if(placed.some(p=>box.x<p.x+p.w+3&&box.x+box.w+3>p.x&&box.y<p.y+p.h+3&&box.y+box.h+3>p.y))visible=false;label.hidden=!visible;if(visible){label.style.left=`${x}px`;label.style.top=`${y+viewport.offsetTop}px`;placed.push(box);}const size=THREE.MathUtils.clamp(m.position.distanceTo(camera.position)*.006,1,35);m.scale.setScalar(size);}}
 let currentScale;
 function updateScale(){const r=viewport.getBoundingClientRect();currentScale=groundScale(camera,controls.target,r.width,r.height,Math.min(160,r.width*.4));$('#scale').textContent=`中心水平 ${currentScale.metres} m`;$('#scale').style.borderTop='1px solid #597456';$('#scale').style.width=`${currentScale.pixels}px`;$('#scale').style.whiteSpace='nowrap';}
 function makeRoute(){if(routeLine){routeGroup.remove(routeLine);routeLine.geometry.dispose();routeLine.material.dispose();}const pts=[];for(let i=0;i<=60;i++){const t=i/60,e=-1400+2800*t,n=-1400+2700*t;pts.push(new THREE.Vector3(e,sampleHeight(regional,e,n)*state.exaggeration+10,-n));}const geo=new THREE.BufferGeometry().setFromPoints(pts);routeLine=new THREE.Line(geo,new THREE.LineDashedMaterial({color:'#9c572d',dashSize:28,gapSize:20,depthTest:false}));routeLine.computeLineDistances();routeLine.renderOrder=9;routeGroup.add(routeLine);routeGroup.visible=state.route&&state.view==='regional';}
 function reportReady(){document.body.dataset.renderState='ready';$('#app-status').textContent=`表示準備完了 · ${state.view==='regional'?'国土地理院 DEM5A + 欠測部DEM10B / Web20m':state.view==='castle'?'国土地理院 DEM1A / Web5m':state.view==='reconstruction'?`西ノ丸候補 ${comparison==='current'?'現況A':'推定C'} / B形状0・位置UNKNOWN`:'資料を参考にした推定教材 / 平面位置UNKNOWN'} · 連続アニメーションなし`;}
 async function setView(view,{reset=true,variant=comparison,intent=beginIntent(),selected}={}){
  state.ready=false;$('#reconstruction-controls').hidden=view!=='reconstruction';sectionExhibit?.sync();$('#app-status').textContent='地形を切り替えています…';let model;
  // Seed a usable pose before initial input; late data may attach without refocusing.
  if(!currentModel&&reset){resize();focusPreset(view);}
  try{model=await getModel(view,variant);}catch(error){if(!intent.isCurrent()||renderFailed)return false;throw error;}
  if(!intent.isCurrent()||renderFailed)return false;
  terrainGroup.clear();currentModel=model;terrainGroup.add(model);state.view=view;comparison=variant;
  if(selected!==undefined)state.selected=selected;else if(view==='study')state.selected='west';else if(view==='reconstruction'&&!state.selected.startsWith('nm-'))state.selected='nm-bailey';
  terrainGroup.scale.y=state.exaggeration;paint();applyLayers();placeMarkers();makeRoute();$$('[data-compare]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.compare===comparison)));$('#reconstruction-controls').hidden=view!=='reconstruction';$$('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));$('#study-note').hidden=view!=='study';$('#extent').textContent=view==='regional'?'広域 · 4 × 4 km':view==='study'?'断面教材 · 推定配置 C':view==='reconstruction'?`西ノ丸候補 · ${comparison==='current'?'現況 A':'復元 C'} / 位置UNKNOWN`:'城域 · 1 × 1.1 km';
  select(state.selected);if(reset&&intent.canMoveCamera())focusPreset(view);$('#loading')?.remove();state.ready=true;setRenderControls(true);$('#route-toggle').disabled=view!=='regional';reportReady();sectionExhibit?.sync();render();return true;
 }
 $$('[data-view]').forEach(b=>b.onclick=()=>runAction(intent=>setView(b.dataset.view,{intent})));
 $$('[data-mode]').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;$$('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));paint();render();});
 $('#exaggeration').onchange=()=>{intents.adjustCamera();state.exaggeration=$('#exaggeration').checked?2:1;terrainGroup.scale.y=state.exaggeration;sectionExhibit?.sync();$('#height-mode').textContent=`標高倍率 ${state.exaggeration}×${state.exaggeration===2?'（誇張）':''}`;placeMarkers();makeRoute();focusPreset();};
 $('#features-toggle').onchange=()=>{state.features=$('#features-toggle').checked;placeMarkers();render();};$('#route-toggle').onchange=()=>{state.route=$('#route-toggle').checked;makeRoute();render();};
 $('#focus-feature').onclick=()=>runAction(async intent=>{const f=features.find(f=>f.id===state.selected);if(f.id==='route'){if(!await setView('regional',{intent}))return;state.route=true;$('#route-toggle').checked=true;makeRoute();render();return;}if(!await setView(f.reconstruction?'reconstruction':'castle',{reset:false,intent})||!intent.canMoveCamera())return;const [e,n]=f.local,h=displayedHeight(f)*state.exaggeration;controls.target.set(e,h,-n);camera.position.set(e-(f.reconstruction?35:230),h+(f.reconstruction?30:230),-n+(f.reconstruction?45:280));controls.update();render();});
 function zoom(f){beginCameraIntent();camera.position.sub(controls.target).multiplyScalar(f).add(controls.target);controls.update();render();}
 $('#zoom-in').onclick=()=>zoom(.8);$('#zoom-out').onclick=()=>zoom(1.25);$('#north').onclick=()=>{beginCameraIntent();const t=controls.target,d=camera.position.distanceTo(t);camera.position.set(t.x,t.y+d*.99,t.z+d*.1);controls.update();render();};
 $('#reset').onclick=()=>runAction(async intent=>{sectionExhibit?.reset();state.exaggeration=1;state.mode='terrain';state.route=false;state.features=true;$('#exaggeration').checked=false;$('#route-toggle').checked=false;$('#features-toggle').checked=true;$('#height-mode').textContent='標高倍率 1×';$$('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode==='terrain')));state.selected='castle';hiddenFacilities.clear();$('#category-c').checked=true;$$('[data-facility]').forEach(el=>el.checked=true);if(currentModel){terrainGroup.scale.y=1;paint();applyLayers();placeMarkers();makeRoute();select('castle');focusPreset();}await setView('regional',{intent,variant:'restored'});});
 viewport.addEventListener('keydown',e=>{if(['+','=','-'].includes(e.key)){e.preventDefault();zoom(e.key==='-'?1.2:.83);}if(e.key.startsWith('Arrow')){e.preventDefault();beginCameraIntent();const offset=camera.position.clone().sub(controls.target),s=new THREE.Spherical().setFromVector3(offset);if(e.key==='ArrowLeft')s.theta-=.12;if(e.key==='ArrowRight')s.theta+=.12;if(e.key==='ArrowUp')s.phi=Math.max(.06,s.phi-.12);if(e.key==='ArrowDown')s.phi=Math.min(Math.PI*.48,s.phi+.12);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));controls.update();render();}});
 let pointerStart;
 renderer.domElement.addEventListener('pointerdown',e=>{pointerStart=[e.clientX,e.clientY];});
 renderer.domElement.addEventListener('pointerup',e=>{if(!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>8)return;pointerStart=null;if(!currentModel)return;const rect=renderer.domElement.getBoundingClientRect(),p=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(p,camera);if(markerGroup.visible){const hits=ray.intersectObjects(markers);if(hits[0]){chooseFeature(hits[0].object.userData.featureId);return;}}const hits=ray.intersectObjects(currentModel.children.filter(o=>o.visible),true);if(hits[0]?.object.userData.facilityId&&hits[0].object.userData.facilityId!=='nm-context'){chooseFeature(hits[0].object.userData.facilityId);return;}if(hits[0]){$('#elevation').textContent=`地表標高 約${Math.round(hits[0].point.y/state.exaggeration)} m${state.view==='study'?'（教材含む）':''}`;}});
 renderer.domElement.addEventListener('pointercancel',()=>{pointerStart=null;});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();showError('3Dの描画接続が失われました。施設一覧から解説と出典は利用できます。3Dを再開する場合はページを再読込してください。',new Error('WebGL context lost'));});
 // Read-only diagnostics for reproducible QA. Tests exercise UI, not these setters.
 window.__terrainDiagnostics=()=>({state:{...state},section:sectionExhibit?.diagnostics(),camera:camera.position.toArray(),target:controls.target.toArray(),scale:currentScale,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,modelBounds:currentModel?new THREE.Box3().setFromObject(currentModel).min.toArray().concat(new THREE.Box3().setFromObject(currentModel).max.toArray()):null,canvas:renderer.getSize(new THREE.Vector2()).toArray(),studyBounds:studyMeta.bounds,facilityScreen:modelFeatures.map(f=>({id:f.id,ndc:new THREE.Vector3(f.local[0],f.height*state.exaggeration,-f.local[1]).project(camera).toArray()})),reconstruction:{comparison,visible:currentModel?.children.filter(o=>o.visible).map(o=>o.userData.facilityId??o.name),hidden:[...hiddenFacilities]},markerScreen:markers.map(m=>({id:m.userData.featureId,ndc:m.position.clone().project(camera).toArray()}))});
 await setView('regional');resize();
}
