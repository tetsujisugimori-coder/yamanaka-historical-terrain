import * as THREE from 'three';
import {ORIGIN,sampleHeight} from './coordinates.js';
import {validateInferredRegions} from './inferred-regions-contract.js';

const node=(tag,text)=>{const value=document.createElement(tag);if(text!==undefined)value.textContent=text;return value;};
const WARNING='推定C：歴史的位置は確定していません。位置精度は不明です。破線の表示範囲・線幅は位置精度を保証しません。';
/** Separate, opt-in inferred overlay. The validator dependency is injectable only for isolated tests. */
export function createInferredRegions({load,validate=validateInferredRegions,onRegion=()=>false}){
 const element=node('section');element.id='inferred-regions';element.setAttribute('aria-label','推定C区域の別レイヤー');
 const heading=node('h3','推定C区域（確定区域とは別レイヤー）');
 const label=node('label'),toggle=node('input');toggle.id='inferred-regions-toggle';toggle.type='checkbox';toggle.checked=false;label.append(toggle,document.createTextNode('推定C区域を表示（既定OFF・歴史的位置未確定）'));
 const warning=node('p',WARNING);warning.id='inferred-regions-warning';warning.className='accuracy-note';
 const legend=node('p','凡例：推定Cは紫の破線輪郭と「推定C」の区域一覧で区別します。塗り範囲・誤差半径は付与しません。表示は城域全体を開いている間だけです。');legend.id='inferred-regions-legend';
 const displayNote=node('p','高さは現況地形Aを参照し、ちらつきを避ける表示専用の +4m を加算します。歴史的標高・位置精度の値ではありません。実資料の変換はNOT_TESTED、残差は未取得です。');
 const status=node('p');status.id='inferred-regions-status';status.setAttribute('role','status');
 const retry=node('button','推定資料を再取得');retry.id='inferred-regions-retry';retry.disabled=true;
 const reset=node('button','推定レイヤーを初期化');reset.id='inferred-regions-reset';
 const list=node('ul');list.id='inferred-regions-list';
 const detail=node('article');detail.id='inferred-regions-detail';detail.setAttribute('aria-live','polite');
 element.append(heading,label,warning,legend,displayNote,status,retry,reset,list,detail);
 const group=new THREE.Group();group.name='inferred-C-regions';group.visible=false;
 let binding=null,data=null,state='idle',error=null,active=false,disposed=false,sequence=0,selectedRegionId=null;
 const operations=[];
 function clearShapes(){for(const child of [...group.children]){group.remove(child);child.geometry.dispose();child.material.dispose();}}
 function updateStatus(){
  const text={idle:'未取得。表示をオンにすると候補採否資料を読み込みます。',loading:'推定資料を読込中。既存の地形・模型は引き続き利用できます。',empty:'候補なし：採用条件を満たす推定区域は0件です。全区域の未配置理由を下の一覧で確認できます。',ready:`推定C候補 ${data?.regions.filter(r=>r.status==='ACCEPTED_C').length??0} 件。歴史的位置は未確定です。`,invalid:'不正な推定データのため表示しません。既存の地形・模型は利用できます。',error:'推定資料の読込失敗。候補なしとは異なります。既存の地形・模型は利用できます。'};
  const message=`${text[state]}${error?` 理由：${error}`:''}${toggle.checked?(active?' 城域表示中。':' 城域を開くと描画します。'):' 推定レイヤーはOFFです。'}`;
  if(status.textContent!==message)status.textContent=message;
  element.dataset.state=state;retry.disabled=!toggle.checked||state==='loading'||disposed;
 }
 function showRegion(item){
  selectedRegionId=item.regionId;for(const button of list.querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.inferredRegion===item.regionId));
  detail.replaceChildren(node('h4',`${item.name} · ${item.status==='ACCEPTED_C'?'推定C候補':'未配置'}`),node('p',WARNING),node('p',`区域ID：${item.regionId} / 候補ID：${item.candidateId}`),node('p',`資料側の記述（確認範囲は次項）：${item.directStatement}`),node('p',`確認範囲：${item.statementBasis}`),node('p',`実装担当による推論・手順：${item.inferenceProcedure}`),node('p',`採否理由：${item.decisionReason}`),node('p',`矛盾・不足：${item.limitations.join(' / ')}`),node('p',`座標参照系：${data.crs}、単位：${data.unit}、軸：${data.axisOrder}。位置精度：不明（数値なし）。変換：${item.transformStatus}、残差：未取得。`));
  if(item.geometryBasis)detail.append(node('p',`形状作成法：${item.geometryBasis.method} / 手順：${item.geometryBasis.steps.join(' → ')} / 座標の根拠：${item.geometryBasis.coordinateSourceRef}`));
  for(const ref of item.sourceRefs){const source=data.sources.find(s=>s.id===ref.id);const p=node('p',`${source.title} / 該当箇所：${ref.locator} `);const link=node('a','根拠資料を開く');link.href=source.url;link.target='_blank';link.rel='noopener';p.append(link);detail.append(p);}
  const related=node('button','既存の区域資料・関連模型を確認');related.onclick=()=>{if(!onRegion(item.regionId))detail.append(node('p','既存の区域資料はまだ利用できません。城域資料の状態を確認してください。'));};detail.append(related);
 }
 function populate(){list.replaceChildren();detail.replaceChildren();selectedRegionId=null;for(const item of data.regions){const li=node('li'),button=node('button',`${item.name} · ${item.status==='ACCEPTED_C'?'推定C候補':'未配置'}`);button.dataset.inferredRegion=item.regionId;button.setAttribute('aria-pressed','false');button.onclick=()=>showRegion(item);li.append(button);list.append(li);}}
 function build(){
  clearShapes();if(!binding||!data)return;
  const pending=[];
  try{for(const item of data.regions.filter(r=>r.status==='ACCEPTED_C'))for(const ring of item.geometry.coordinates){
   const points=[];const point=p=>{const e=p[0]-ORIGIN.easting,n=p[1]-ORIGIN.northing,g=binding.grid;if(e<g.bounds[0]||e>g.bounds[2]||n<g.bounds[1]||n>g.bounds[3])throw Error('推定輪郭が現況地形の範囲外');const h=sampleHeight(g,e,n);if(!Number.isFinite(h))throw Error('推定輪郭の地表高さが欠測');return new THREE.Vector3(e,h+data.displayOffsetMetres,-n);};
   for(let i=0;i<ring.length-1;i++){const a=ring[i],b=ring[i+1],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/5));for(let j=0;j<steps;j++)points.push(point([a[0]+(b[0]-a[0])*j/steps,a[1]+(b[1]-a[1])*j/steps]));}points.push(point(ring.at(-1)));
   const geometry=new THREE.BufferGeometry().setFromPoints(points),material=new THREE.LineDashedMaterial({color:0x7b3790,dashSize:7,gapSize:5,transparent:true,opacity:.85});const line=new THREE.Line(geometry,material);line.computeLineDistances();line.name=`推定C · ${item.name}`;line.userData.candidateId=item.candidateId;pending.push(line);
  }}catch(e){for(const line of pending){line.geometry.dispose();line.material.dispose();}throw e;}
  for(const line of pending)group.add(line);
 }
 function sync(value=active){active=Boolean(value);group.visible=!disposed&&active&&toggle.checked&&state==='ready';updateStatus();}
 async function reload(){
  if(disposed||!toggle.checked)return;const ticket=++sequence,operation={sequence:ticket,status:'pending',terminal:false};operations.push(operation);if(operations.length>32)operations.shift();
  data=null;error=null;state='loading';selectedRegionId=null;list.replaceChildren();detail.replaceChildren();clearShapes();sync();binding?.render?.();let validating=false;
  try{const value=await Promise.resolve().then(load);if(disposed||ticket!==sequence||!toggle.checked){operation.status='stale-discarded';return;}validating=true;validate(value);data=value;build();populate();state=data.regions.some(r=>r.status==='ACCEPTED_C')?'ready':'empty';operation.status=state;}
  catch(e){if(disposed||ticket!==sequence||!toggle.checked){operation.status='stale-discarded';return;}clearShapes();data=null;state=validating||e instanceof SyntaxError?'invalid':'error';error=String(e.message??e);operation.status=state;}
  finally{operation.terminal=true;if(!disposed&&ticket===sequence){sync();binding?.render?.();}}
 }
 toggle.onchange=()=>{if(disposed)return;if(!toggle.checked){sequence++;if(state==='loading'){state='idle';error=null;}sync();binding?.render?.();}else if(data){sync();binding?.render?.();}else void reload();};
 retry.onclick=()=>void reload();
 reset.onclick=()=>{sequence++;toggle.checked=false;data=null;state='idle';error=null;selectedRegionId=null;clearShapes();list.replaceChildren();detail.replaceChildren();sync();binding?.render?.();toggle.focus();};
 updateStatus();
 return {element,attach(value){binding=value;value.scene.add(group);try{build();}catch(e){clearShapes();data=null;state='invalid';error=String(e.message??e);}sync();},sync,reload,diagnostics:()=>({state,error,requestedVisible:toggle.checked,active,accepted:data?.regions.filter(r=>r.status==='ACCEPTED_C').length??0,unplaced:data?.regions.filter(r=>r.status==='UNPLACED').length??0,objects:group.children.length,visibleObjects:group.visible?group.children.length:0,selectedRegionId,loadSequence:sequence,operations:operations.map(o=>({...o})),renderObjects:group.children.map(o=>({candidateId:o.userData.candidateId,vertices:o.geometry.attributes.position.count,dashed:o.material.isLineDashedMaterial===true,visible:group.visible,points:Array.from(o.geometry.attributes.position.array)}))}),dispose(){if(disposed)return;disposed=true;sequence++;clearShapes();group.parent?.remove(group);group.visible=false;toggle.disabled=true;retry.disabled=true;reset.disabled=true;}};
}
