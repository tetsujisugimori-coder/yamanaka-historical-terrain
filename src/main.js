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
import {landscapeModel,landscapeColor} from './landscape.js';
import {contextOutsidePatch,createSurfaceFinish} from './phase3b.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const assetPath=path=>`${import.meta.env.BASE_URL}${path}`;
const state={view:'regional',mode:'terrain',selected:'castle',exaggeration:1,route:false,features:true,ready:false,landscape:false,drama:true,station:null};
let landscapeMeta,westernMeta;
const sourceDialog=$('#sources'); $('#sources-open').onclick=()=>sourceDialog.showModal();$('#sources-close').onclick=()=>sourceDialog.close();
sourceDialog.addEventListener('close',()=>$('#sources-open').focus());
const viewport=$('#viewport'),viewportLabel=viewport.getAttribute('aria-label');
const mapHelp=$('.map-help'),mapHelpDefault=mapHelp.innerHTML;
const fixedViewHelp='定点観察：1本指・ドラッグ・矢印キーで見回す。<br>足場は固定。移動・ズームはできません。「俯瞰へ」で通常操作に戻ります。';
let renderer,reading,sectionExhibit,renderFailed=false,teardownTerrain=()=>{};
function syncNavigationControls(enabled=state.ready&&!renderFailed){
 const fixed=Boolean(state.station);for(const b of $$('#zoom-in, #zoom-out'))b.disabled=!enabled||fixed;
 mapHelp.innerHTML=fixed?fixedViewHelp:mapHelpDefault;
 viewport.setAttribute('aria-label',!enabled?'3D地形の状態':fixed?'山中城3D定点観察。1本指・ドラッグ・矢印キーで見回す。移動・ズームはできません。通常操作は俯瞰へ。':viewportLabel);
}
function setRenderControls(enabled){
 $$('.controls fieldset, #reconstruction-controls fieldset').forEach(el=>{el.disabled=!enabled;});$$('.map-tools button, #focus-feature, #landscape-enter, #landscape-toolbar button').forEach(el=>{el.disabled=!enabled;});
 viewport.tabIndex=enabled?0:-1;viewport.setAttribute('role',enabled?'application':'region');syncNavigationControls(enabled);
}
function showError(message,error,kind='error'){
 renderFailed=true;state.ready=false;sectionExhibit?.fail();setRenderControls(false);reading?.setSelectionHandler(null);teardownTerrain();document.body.dataset.renderState=kind;
 $('#loading')?.remove();$('#app-status').textContent=message;viewport.querySelector('.error')?.remove();const block=document.createElement('div');block.className='error';block.setAttribute('role','status');const p=document.createElement('p');p.textContent=message;block.append(p);viewport.append(block);console.error(error);
}
async function json(url){const r=await fetch(url);if(!r.ok)throw new Error(`${r.status} ${url}`);return r.json();}
setRenderControls(false);
async function bootstrap(){
 let features,sources;
 try{const [original,sourceData,reconstruction,landscape,western]=await Promise.all(['data/features.json','data/sources.json','data/nishinomaru.json','data/landscape.json','data/phase3b.json'].map(path=>json(assetPath(path))));landscapeMeta=landscape;westernMeta=western;features=[...original,...reconstruction.facilities.map(f=>({...f,...landscape.surfaceCaptions[f.id]})),...landscape.elements,...western.elements];sources=sourceData;reading=createReading({features,sources});
 $('#western-stations').replaceChildren(...western.stations.map(s=>{const b=document.createElement('button');b.dataset.station=s.id;b.textContent=s.name;return b;}));}
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
 const camera=new THREE.PerspectiveCamera(38,1,.15,30000);
 renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.setClearColor('#e2e9de');renderer.outputColorSpace=THREE.SRGBColorSpace;viewport.append(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.minDistance=12;controls.maxDistance=20000;controls.maxPolarAngle=Math.PI*.48;controls.screenSpacePanning=false;
 const light=new THREE.DirectionalLight('#fff5d9',2.0);light.position.set(-1500,3000,-1500);const ambient=new THREE.HemisphereLight('#edf3df','#47644a',2.1);scene.add(light,ambient,light.target);
 renderer.shadowMap.type=THREE.PCFSoftShadowMap;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-130,right:130,top:100,bottom:-100,near:1,far:650});light.shadow.camera.updateProjectionMatrix();light.shadow.normalBias=.12;light.shadow.bias=-.00015;
 const terrainGroup=new THREE.Group();scene.add(terrainGroup);const sceneryGroup=new THREE.Group();scene.add(sceneryGroup);let sceneryUnavailable=false;const markerGroup=new THREE.Group();scene.add(markerGroup);const routeGroup=new THREE.Group();scene.add(routeGroup);
 const westernGroup=new THREE.Group();scene.add(westernGroup);let westernUnavailable=false;const finish=createSurfaceFinish(),contextGeometry=new WeakMap();
 function syncWestern(active){
  const visible=active&&!westernUnavailable&&comparison==='restored'&&$('#category-c').checked;
  westernGroup.visible=visible;westernGroup.scale.y=state.exaggeration;
  westernGroup.traverse(o=>{if(o.isMesh)o.visible=o.userData.elementId!=='wb-building'||$('#western-building').checked;});
  const warning=$('#western-asset-status');warning.hidden=!active||!westernUnavailable;warning.textContent=warning.hidden?'':'西方3区域の追加GLBを読み込めませんでした。既存地形・西ノ丸景観と解説を利用できます。表示切替で再取得します。';
  if(currentModel)currentModel.traverse(o=>{if(!o.isMesh||o.userData.facilityId!=='nm-context')return;if(!contextGeometry.has(o)){const cut=contextOutsidePatch(o.geometry,westernMeta.bounds);contextGeometry.set(o,{base:o.geometry.index,cut:cut.index});}const pair=contextGeometry.get(o);o.geometry.setIndex(visible?pair.cut:pair.base);});
  const enabled=active&&state.drama&&$('#surface-finish').checked,quality=$('#quality').value,shadows=enabled&&quality!=='light'&&(quality==='high'||viewport.clientWidth>=700);
  $('#surface-finish').disabled=!active||!state.drama;
  renderer.shadowMap.enabled=shadows;light.castShadow=shadows;
  light.position.set(...(enabled?[-250,850,150]:[-1500,3000,-1500]));light.target.position.set(...(enabled?[-120,550,0]:[0,0,0]));light.intensity=enabled?2.6:2;ambient.intensity=enabled?1.35:2.1;
  for(const group of [terrainGroup,sceneryGroup,westernGroup])group.traverse(o=>finish.apply(o,enabled));
  scene.background=new THREE.Color(enabled?'#cfdee1':'#e2e9de');scene.fog=enabled?new THREE.Fog('#cfdee1',220,1300):null;
 }
 const loader=new GLTFLoader(),models=new Map(),grids={regional,castle};let currentModel,routeLine;const intents=createIntentController();
 let comparison='restored';const hiddenFacilities=new Set();
 const modelFeatures=features.filter(f=>f.reconstruction&&!f.landscape);
 function setBaseExtent(){const view=state.view;$('#extent').textContent=view==='regional'?'広域 · 4 × 4 km':view==='study'?'断面教材 · 仮定配置 C':view==='reconstruction'?`西ノ丸候補 · ${comparison==='current'?'現況 A':'復元 C'} / 位置UNKNOWN`:'城域 · 1 × 1.1 km';}
 function syncLandscape(){
  const active=state.landscape&&state.view==='reconstruction';sceneryGroup.visible=active&&!sceneryUnavailable&&comparison==='restored'&&$('#category-c').checked;
  const assetWarning=$('#landscape-asset-status');assetWarning.hidden=!active||!sceneryUnavailable;assetWarning.textContent=assetWarning.hidden?'':'追加景観GLBを読み込めませんでした。現況A・既存C地形と解説は引き続き利用できます。木柵・門・植生・旗・人物の追加モデルは表示されません。表示切替で再取得を試みます。';
  sceneryGroup.scale.y=state.exaggeration;sceneryGroup.traverse(o=>{if(o.isMesh)o.visible=o.userData.evidenceCategory!=='D'||state.drama;});
  $('#landscape-toolbar').hidden=!active;document.body.dataset.landscape=String(active);
  if(active)$('#extent').textContent=comparison==='current'?'現況 A（1590年地表ではない）':sceneryUnavailable?'1590 C地形のみ（追加景観の読込失敗）':state.drama?'1590 C推定＋D創作（史実未確定）':'1590 C推定（史実未確定）';
  else setBaseExtent();
  syncWestern(active);sceneryGroup.traverse(o=>{if(o.isMesh&&o.userData.westernOverlap)o.visible=o.visible&&!westernGroup.visible;});
  $$('[data-landscape-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.landscapeMode===(comparison==='current'?'a':state.drama?'cd':'c'))));
  const f=features.find(f=>f.id===state.selected);$('#landscape-selection-status').textContent=f?.landscape?(comparison==='current'?'選択中の景観要素に現況Aの対応物はありません。解説を保持しています。':f.category==='D'&&!state.drama?'選択中のD要素は非表示です。創作の解説を保持しています。':f.id==='wb-building'&&!$('#western-building').checked?'選択中の建物候補は非表示です。推定の解説を保持しています。':'選択中：'+f.category+' '+f.name):'';
 }
 function leaveStation(){state.station=null;controls.enabled=true;syncNavigationControls();$('#station-status').textContent='低視点は定点観察。左右ドラッグ・矢印キーで周囲を見る。観察地点は史実の通行経路ではありません。';}
 function applyLayers(){if(state.view!=='reconstruction'){syncLandscape();return;}currentModel.children.forEach(ob=>{ob.visible=!(comparison==='restored'&&ob.userData.facilityId&&ob.userData.facilityId!=='nm-context'&&(!$('#category-c').checked||hiddenFacilities.has(ob.userData.facilityId)));});syncLandscape();}
 $('#facility-layers').replaceChildren(...modelFeatures.map(f=>{const label=document.createElement('label');label.className='check';const input=document.createElement('input');input.type='checkbox';input.checked=true;input.dataset.facility=f.id;input.onchange=()=>{if(input.checked)hiddenFacilities.delete(f.id);else hiddenFacilities.add(f.id);applyLayers();sectionExhibit?.sync();render();};label.append(input,document.createTextNode(`C ${f.shortLabel}`));return label;}));
 $('#category-c').onchange=()=>{applyLayers();sectionExhibit?.sync();render();};
 function restoreCurrentPresentation(){
  if(!currentModel||renderFailed)return;
  state.ready=true;$('#reconstruction-controls').hidden=state.view!=='reconstruction';syncLandscape();reportReady();sectionExhibit?.sync();
 }
 function beginIntent(){const intent=intents.begin();restoreCurrentPresentation();return intent;}
 function beginCameraIntent(){if(currentModel)return beginIntent();intents.adjustCamera();}
 async function runAction(action,message='表示操作に失敗しました。施設一覧から解説と出典は利用できます。'){
  const intent=beginIntent();try{return await action(intent);}catch(error){if(intent.isCurrent()&&!renderFailed)showError(message,error);return false;}
 }
 function displayedHeight(f){
  if(f.id.startsWith('wb-')&&westernGroup.children.length&&westernGroup.visible)return sampleSurfaceHeight(westernGroup.children.flatMap(g=>g.children).filter(o=>o.userData.surface),...f.local,state.exaggeration);
  const meshes=state.view==='reconstruction'&&comparison==='restored'&&f.reconstruction&&!f.landscape?currentModel.children.filter(o=>o.userData.facilityId===f.id):currentModel.children;
  return sampleSurfaceHeight(meshes,...f.local,state.exaggeration);
 }
 $$('[data-compare]').forEach(b=>b.onclick=()=>runAction(intent=>setView('reconstruction',{reset:false,variant:b.dataset.compare,intent})));
 $$('[data-eye]').forEach(b=>b.onclick=()=>runAction(async intent=>{leaveStation();const f=features.find(x=>x.id===b.dataset.eye);if(!await setView('reconstruction',{reset:false,intent,selected:f.id})||!intent.canMoveCamera())return;const [e,n]=f.local,h=displayedHeight(f)*state.exaggeration;controls.target.set(e,h+1.6,-n);camera.position.set(e-12,h+7,-n+22);controls.update();render();}));
 const labels=new Map(),markers=[];
 const palette=[new THREE.Color('#466449'),new THREE.Color('#899d67'),new THREE.Color('#b3b580'),new THREE.Color('#d9d2a5')];
 function altitudeColor(h){const t=THREE.MathUtils.clamp((h-200)/620,0,1)*(palette.length-1),i=Math.min(Math.floor(t),palette.length-2);return palette[i].clone().lerp(palette[i+1],t-i);}
 function paint(){if(!currentModel)return;const paintKey=[state.view,state.mode,state.landscape,comparison].join(':');currentModel.traverse(ob=>{if(!ob.isMesh||ob.userData.paintKey===paintKey)return;const pos=ob.geometry.attributes.position,norm=ob.geometry.attributes.normal;const colors=new Float32Array(pos.count*3);for(let i=0;i<pos.count;i++){
   const h=pos.getY(i),slope=Math.acos(Math.min(1,Math.abs(norm.getY(i))))*180/Math.PI;
   let color=state.mode==='slope'?new THREE.Color('#c4cba0').lerp(new THREE.Color('#9b3b23'),Math.min(1,slope/60)):altitudeColor(h);
   if(ob.userData.evidenceCategory==='C'&&ob.name.includes('moat_study'))color=new THREE.Color('#af7652');
   if(state.view==='reconstruction'&&ob.userData.facilityId&&ob.userData.facilityId!=='nm-context')color=new THREE.Color({'nm-bailey':'#9ca46f','nm-moat':'#aa6b46','nm-rampart':'#b69a64','nm-passage':'#c7b289','nm-transition':'#78906c'}[ob.userData.facilityId]);
   if(state.landscape&&state.view==='reconstruction'&&comparison==='restored')color=landscapeColor(ob.userData.facilityId,pos.getX(i),h,pos.getZ(i),slope);
   if(state.mode==='contour'&&((h%50+50)%50)<2&&!(state.view==='reconstruction'&&ob.userData.facilityId))color.multiplyScalar(.45);
   colors.set([color.r,color.g,color.b],i*3);
  }ob.geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));ob.material.vertexColors=true;ob.material.needsUpdate=true;ob.userData.paintKey=paintKey;});
  const g=state.view==='regional'?regional:castle;
  $('#legend').innerHTML=state.mode==='slope'?'<span class="ramp" style="background:linear-gradient(90deg,#c4cba0,#9b3b23)"></span><span>0°</span><span>実地形の傾斜</span><span>60°以上</span>':`<span class="ramp"></span><span>低い</span><span>${Math.round(g.min)}–${Math.round(g.max)} m</span><span>高い${state.mode==='contour'?' / 50m帯':''}</span>`;
  if(['study','reconstruction'].includes(state.view)){const note=document.createElement('span');note.className='legend-exclusion';note.textContent=state.landscape?'C 地表・門・木柵・植生は推定。D 旗・人物は創作。標高色ではありません / B形状0':state.view==='study'?'茶色のC教材は標高・傾斜・等高帯の凡例対象外（固定色）':'復元Cは施設別固定色。標高・傾斜・等高帯の凡例対象外 / B形状0';$('#legend').append(note);}

 }
 async function getModel(view,variant){
  const file=view==='reconstruction'?(variant==='current'?'castle':'nishinomaru'):view==='study'?'moat-study':view;
  if(models.has(file))return models.get(file);
  const pending=loader.loadAsync(assetPath(`data/${file}.glb`)).then(gltf=>{if(['landscape','phase3b'].includes(file))return landscapeModel(gltf,westernMeta.bounds);gltf.scene.updateMatrixWorld(true);const group=new THREE.Group();gltf.scene.traverse(ob=>{if(!ob.isMesh)return;const geo=ob.geometry.clone();geo.applyMatrix4(ob.matrixWorld);geo.computeVertexNormals();const mat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,metalness:0,side:THREE.DoubleSide});const mesh=new THREE.Mesh(geo,mat);mesh.name=ob.name;mesh.userData={...ob.userData};group.add(mesh);});return group;});
  models.set(file,pending);try{return await pending;}catch(error){if(models.get(file)===pending)models.delete(file);throw error;}
 }
 sectionExhibit=createSectionExhibit({getModel,scene,render,context:()=>({ready:state.ready,view:state.view,comparison,exaggeration:state.exaggeration,failed:renderFailed,visible:currentModel?.children.filter(o=>o.visible).map(o=>o.userData.facilityId??o.name)??[]}),open:s=>runAction(async intent=>{leaveStation();if(!await setView('reconstruction',{reset:false,intent}))return;if(!intent.canMoveCamera())return;const e=(s.start[0]+s.end[0])/2,n=(s.start[1]+s.end[1])/2,h=sampleSurfaceHeight(currentModel.children,e,n,state.exaggeration)*state.exaggeration;controls.target.set(e,h,-n);camera.position.set(e-28,h+42,-n+45);controls.update();render();})});
 function render(){if(renderFailed||document.hidden)return;const r=viewport.getBoundingClientRect();if(r.width===0||r.height===0)return;renderer.render(scene,camera);updateLabels();updateScale();}
 function resize(){const r=viewport.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();render();}
 const ro=new ResizeObserver(resize);ro.observe(viewport);controls.addEventListener('change',render);controls.addEventListener('start',()=>beginCameraIntent());const onVisibility=()=>{if(!document.hidden)render();};document.addEventListener('visibilitychange',onVisibility);teardownTerrain=()=>{sectionExhibit?.dispose();controls.dispose();ro.disconnect();document.removeEventListener('visibilitychange',onVisibility);renderer.dispose();};
 function fitTerrain(g){
  const direction=camera.position.clone().sub(controls.target).normalize();let distance=camera.position.distanceTo(controls.target);
  for(let i=0;i<15;i++){camera.position.copy(controls.target).addScaledVector(direction,distance);camera.lookAt(controls.target);camera.updateMatrixWorld();let fits=true;for(const x of [g.bounds[0],g.bounds[2]])for(const n of [g.bounds[1],g.bounds[3]])for(const h of [g.min,g.max]){const p=new THREE.Vector3(x,h*state.exaggeration,-n).project(camera);if(Math.abs(p.x)>.86||Math.abs(p.y)>.76||p.z>1)fits=false;}if(fits)break;distance*=1.12;}
 }
 function focusPreset(view=state.view){
  leaveStation();
  const v=state.exaggeration;
  if(view==='regional'){controls.target.set(0,480*v,0);camera.position.set(-2750,2500+480*v,2900);fitTerrain(regional);}
  else if(view==='reconstruction'){const f=features.find(f=>f.id==='nm-bailey'),h=(currentModel?displayedHeight(f):f.height)*v;controls.target.set(-20,h,0);camera.position.set(-115,h+95,115);}
  else if(view==='study'){const [e,n]=studyMeta.center,h=sampleHeight(castle,e,n)*v;controls.target.set(e,h,-n);camera.position.set(e-26,h+23,-n+30);}
  else{controls.target.set(150,500*v,100);camera.position.set(-760,1300+500*v,1100);fitTerrain(castle);}
  controls.update();render();
 }
 function select(id){state.selected=id;const f=features.find(f=>f.id===id);const h=f.reconstruction?f.height:sampleHeight(state.view==='regional'?regional:castle,...f.local);reading.select(id,h);syncLandscape();for(const [key,label]of labels)label.classList.toggle('active',key===id);$('#elevation').textContent=`${f.name} · 約${Math.round(h)} m`;render();}
 function chooseFeature(id){return runAction(async intent=>{const f=features.find(f=>f.id===id);select(id);if(f.landscape){await setView('reconstruction',{intent,reset:!state.landscape,selected:id,landscape:true});return;}if(f.reconstruction&&state.view!=='reconstruction')await setView('reconstruction',{intent,selected:id});else if(!currentModel)await setView('regional',{intent,selected:id});});}
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
 async function setView(view,{reset=true,variant=comparison,intent=beginIntent(),selected,landscape=state.landscape,drama=state.drama}={}){
  state.ready=false;$('#reconstruction-controls').hidden=view!=='reconstruction';sectionExhibit?.sync();$('#app-status').textContent='地形を切り替えています…';let model,scenery;
  // Seed a usable pose before initial input; late data may attach without refocusing.
  if(!currentModel&&reset){resize();focusPreset(view);}
  let sceneryFailure=false,western=null,westernFailure=false;
  try{
   const sceneryRequest=landscape&&view==='reconstruction'
    ?getModel('landscape').then(group=>({group,failed:false}),()=>({group:null,failed:true}))
    :Promise.resolve({group:null,failed:false});
   const westernRequest=landscape&&view==='reconstruction'?getModel('phase3b').then(group=>({group,failed:false}),()=>({group:null,failed:true})):Promise.resolve({group:null,failed:false});
   const [base,optionalScenery,optionalWestern]=await Promise.all([getModel(view,variant),sceneryRequest,westernRequest]);
   model=base;scenery=optionalScenery.group;sceneryFailure=optionalScenery.failed;western=optionalWestern.group;westernFailure=optionalWestern.failed;
  }catch(error){if(!intent.isCurrent()||renderFailed)return false;throw error;}
  if(!intent.isCurrent()||renderFailed)return false;
  terrainGroup.clear();currentModel=model;terrainGroup.add(model);state.view=view;comparison=variant;state.landscape=landscape&&view==='reconstruction';state.drama=drama;sceneryUnavailable=sceneryFailure;sceneryGroup.clear();if(scenery)sceneryGroup.add(scenery);westernUnavailable=westernFailure;westernGroup.clear();if(western)westernGroup.add(western);if(reset)leaveStation();
  if(selected!==undefined)state.selected=selected;else if(view==='study')state.selected='west';else if(view==='reconstruction'&&!state.selected.startsWith('nm-')&&!features.find(f=>f.id===state.selected)?.landscape)state.selected='nm-bailey';
  terrainGroup.scale.y=state.exaggeration;paint();applyLayers();placeMarkers();makeRoute();$$('[data-compare]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.compare===comparison)));$('#reconstruction-controls').hidden=view!=='reconstruction';$$('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));$('#study-note').hidden=view!=='study';$('#extent').textContent=view==='regional'?'広域 · 4 × 4 km':view==='study'?'断面教材 · 推定配置 C':view==='reconstruction'?`西ノ丸候補 · ${comparison==='current'?'現況 A':'復元 C'} / 位置UNKNOWN`:'城域 · 1 × 1.1 km';
  select(state.selected);if(reset&&intent.canMoveCamera())focusPreset(view);$('#loading')?.remove();state.ready=true;setRenderControls(true);$('#route-toggle').disabled=view!=='regional';reportReady();sectionExhibit?.sync();render();return true;
 }
 $$('[data-view]').forEach(b=>b.onclick=()=>runAction(intent=>setView(b.dataset.view,{intent})));
 $$('[data-mode]').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;$$('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));paint();render();});
 $('#exaggeration').onchange=()=>{intents.adjustCamera();state.exaggeration=$('#exaggeration').checked?2:1;terrainGroup.scale.y=state.exaggeration;syncLandscape();sectionExhibit?.sync();$('#height-mode').textContent=`標高倍率 ${state.exaggeration}×${state.exaggeration===2?'（誇張）':''}`;placeMarkers();makeRoute();focusPreset();};
 $('#features-toggle').onchange=()=>{state.features=$('#features-toggle').checked;placeMarkers();render();};$('#route-toggle').onchange=()=>{state.route=$('#route-toggle').checked;makeRoute();render();};
 $('#focus-feature').onclick=()=>runAction(async intent=>{leaveStation();const f=features.find(f=>f.id===state.selected);if(f.id==='route'){if(!await setView('regional',{intent}))return;state.route=true;$('#route-toggle').checked=true;makeRoute();render();return;}if(!await setView(f.reconstruction?'reconstruction':'castle',{reset:false,intent})||!intent.canMoveCamera())return;const [e,n]=f.local,h=displayedHeight(f)*state.exaggeration;controls.target.set(e,h,-n);camera.position.set(e-(f.reconstruction?35:230),h+(f.reconstruction?30:230),-n+(f.reconstruction?45:280));controls.update();render();});
 function zoom(f){if(state.station)return;beginCameraIntent();camera.position.sub(controls.target).multiplyScalar(f).add(controls.target);controls.update();render();}
 $('#zoom-in').onclick=()=>zoom(.8);$('#zoom-out').onclick=()=>zoom(1.25);$('#north').onclick=()=>{beginCameraIntent();leaveStation();const t=controls.target,d=camera.position.distanceTo(t);camera.position.set(t.x,t.y+d*.99,t.z+d*.1);controls.update();render();};
 $('#reset').onclick=()=>runAction(async intent=>{sectionExhibit?.reset();leaveStation();state.landscape=false;state.drama=true;$('#western-building').checked=true;$('#surface-finish').checked=true;$('#quality').value='balanced';state.exaggeration=1;state.mode='terrain';state.route=false;state.features=true;$('#exaggeration').checked=false;$('#route-toggle').checked=false;$('#features-toggle').checked=true;$('#height-mode').textContent='標高倍率 1×';$$('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode==='terrain')));state.selected='castle';hiddenFacilities.clear();$('#category-c').checked=true;$$('[data-facility]').forEach(el=>el.checked=true);if(currentModel){terrainGroup.scale.y=1;paint();applyLayers();placeMarkers();makeRoute();select('castle');focusPreset();}await setView('regional',{intent,variant:'restored'});});
 viewport.addEventListener('keydown',e=>{if(['+','=','-'].includes(e.key)){e.preventDefault();zoom(e.key==='-'?1.2:.83);}if(e.key.startsWith('Arrow')){e.preventDefault();beginCameraIntent();if(state.station){lookAround(e.key==='ArrowLeft'?-.12:e.key==='ArrowRight'?.12:0,e.key==='ArrowUp'?.08:e.key==='ArrowDown'?-.08:0);return;}const offset=camera.position.clone().sub(controls.target),s=new THREE.Spherical().setFromVector3(offset);if(e.key==='ArrowLeft')s.theta-=.12;if(e.key==='ArrowRight')s.theta+=.12;if(e.key==='ArrowUp')s.phi=Math.max(.06,s.phi-.12);if(e.key==='ArrowDown')s.phi=Math.min(Math.PI*.48,s.phi+.12);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));controls.update();render();}});
 let pointerStart;
 renderer.domElement.addEventListener('pointerdown',e=>{pointerStart=[e.clientX,e.clientY];});
 renderer.domElement.addEventListener('pointerup',e=>{if(!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>8)return;pointerStart=null;if(!currentModel)return;const rect=renderer.domElement.getBoundingClientRect(),p=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(p,camera);if(markerGroup.visible){const hits=ray.intersectObjects(markers);if(hits[0]){chooseFeature(hits[0].object.userData.featureId);return;}}const sceneryHits=ray.intersectObjects([sceneryGroup,westernGroup].filter(g=>g.visible).flatMap(g=>g.children.flatMap(c=>c.children)).filter(o=>o.visible),true);const hits=ray.intersectObjects(currentModel.children.filter(o=>o.visible),true);if(sceneryHits[0]&&(!hits[0]||sceneryHits[0].distance<hits[0].distance)){chooseFeature(sceneryHits[0].object.userData.elementId);return;}if(hits[0]?.object.userData.facilityId&&hits[0].object.userData.facilityId!=='nm-context'){chooseFeature(hits[0].object.userData.facilityId);return;}if(hits[0]){$('#elevation').textContent=`地表標高 約${Math.round(hits[0].point.y/state.exaggeration)} m${state.view==='study'?'（教材含む）':''}`;}});
 renderer.domElement.addEventListener('pointercancel',()=>{pointerStart=null;});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();showError('3Dの描画接続が失われました。施設一覧から解説と出典は利用できます。3Dを再開する場合はページを再読込してください。',new Error('WebGL context lost'));});
 // Read-only diagnostics for reproducible QA. Tests exercise UI, not these setters.
 window.__terrainDiagnostics=()=>({state:{...state},landscape:{visible:sceneryGroup.visible,scale:sceneryGroup.scale.y,objects:sceneryGroup.children.flatMap(g=>g.children).filter(o=>sceneryGroup.visible&&o.visible).map(o=>({id:o.userData.elementId,category:o.userData.evidenceCategory})),stations:landscapeMeta.stations},phase3b:{visible:westernGroup.visible,unavailable:westernUnavailable,objects:westernGroup.children.flatMap(g=>g.children).filter(o=>westernGroup.visible&&o.visible).map(o=>({id:o.userData.elementId,category:o.userData.evidenceCategory,surface:Boolean(o.userData.surface)})),quality:$('#quality').value,finish:$('#surface-finish').checked,building:$('#western-building').checked,bounds:westernMeta.bounds,shadows:renderer.shadowMap.enabled},section:sectionExhibit?.diagnostics(),camera:camera.position.toArray(),target:controls.target.toArray(),scale:currentScale,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,modelBounds:currentModel?new THREE.Box3().setFromObject(currentModel).min.toArray().concat(new THREE.Box3().setFromObject(currentModel).max.toArray()):null,canvas:renderer.getSize(new THREE.Vector2()).toArray(),studyBounds:studyMeta.bounds,facilityScreen:modelFeatures.map(f=>({id:f.id,ndc:new THREE.Vector3(f.local[0],f.height*state.exaggeration,-f.local[1]).project(camera).toArray()})),reconstruction:{comparison,visible:currentModel?.children.filter(o=>o.visible).map(o=>o.userData.facilityId??o.name),hidden:[...hiddenFacilities]},markerScreen:markers.map(m=>({id:m.userData.featureId,ndc:m.position.clone().project(camera).toArray()}))});

 async function enterLandscape({variant='restored',drama=state.drama,reset=false}={}){return runAction(intent=>setView('reconstruction',{intent,reset,variant,landscape:true,drama}));}
 $('#landscape-enter').onclick=async()=>{if(await enterLandscape({reset:true,drama:true}))viewport.scrollIntoView({block:'center',behavior:'instant'});};
 $$('[data-landscape-mode]').forEach(b=>b.onclick=()=>enterLandscape({variant:b.dataset.landscapeMode==='a'?'current':'restored',drama:b.dataset.landscapeMode==='c'?false:b.dataset.landscapeMode==='cd'?true:state.drama}));
 $('#landscape-overview').onclick=()=>{beginCameraIntent();focusPreset('reconstruction');};
 for(const selector of ['#western-building','#surface-finish','#quality'])$(selector).onchange=()=>{syncLandscape();render();};
 $$('[data-western-overview]').forEach(b=>b.onclick=()=>runAction(async intent=>{
  if(!await setView('reconstruction',{intent,reset:false,landscape:true})||!intent.canMoveCamera())return;
  leaveStation();const f=features.find(f=>f.id===b.dataset.westernOverview),[e,n]=f.local,h=f.height*state.exaggeration;
  select(f.id);controls.target.set(e,h-1,-n);camera.position.set(e-38,h+38,-n+48);controls.update();render();
 }));
 function lookAround(yaw,pitch){const v=controls.target.clone().sub(camera.position),sp=new THREE.Spherical().setFromVector3(v);sp.theta+=yaw;sp.phi=THREE.MathUtils.clamp(sp.phi+pitch,.25,Math.PI-.25);controls.target.copy(camera.position).add(new THREE.Vector3().setFromSpherical(sp));camera.lookAt(controls.target);render();}
 $$('[data-station]').forEach(b=>b.onclick=()=>runAction(async intent=>{
  if(!await setView('reconstruction',{intent,reset:false,landscape:true}))return;
  const [a,c]=await Promise.all([getModel('reconstruction','current'),getModel('reconstruction','restored')]);if(!intent.canMoveCamera())return;
  const p=[...landscapeMeta.stations,...westernMeta.stations].find(x=>x.id===b.dataset.station),[e,n]=p.eye;
  const heights=[a,c].flatMap(m=>{try{return [sampleSurfaceHeight(m.children,e,n,m===currentModel?state.exaggeration:1)];}catch{return [];}});
  if(westernMeta.stations.includes(p)&&westernGroup.children.length&&!westernUnavailable)heights.push(sampleSurfaceHeight(westernGroup.children.flatMap(g=>g.children).filter(o=>o.userData.surface),e,n,state.exaggeration));
  const y=Math.max(...heights)*state.exaggeration+1.7;state.station=p.id;controls.enabled=false;syncNavigationControls();
  camera.position.set(e,y,-n);controls.target.set(p.look[0],y-p.lookDown,-p.look[1]);camera.lookAt(controls.target);
  $('#station-status').textContent=p.name+'：固定観察、足場はA/Cの高い方＋1.7m。左右ドラッグ・矢印で周囲を見る。自由歩行なし。史実の経路ではありません。';render();
 }));
 let lookPointer;
 renderer.domElement.addEventListener('pointerdown',e=>{if(state.station)lookPointer=[e.clientX,e.clientY];});
 renderer.domElement.addEventListener('pointermove',e=>{if(!state.station||!lookPointer)return;const [x,y]=lookPointer;lookPointer=[e.clientX,e.clientY];lookAround(-(e.clientX-x)*.005,-(e.clientY-y)*.005);});
 for(const event of ['pointerup','pointercancel','pointerleave'])renderer.domElement.addEventListener(event,()=>lookPointer=null);
 await setView('regional');resize();
}
