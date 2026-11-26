// View-only aid for the existing C reconstruction of the west gate.
// From the west, looking east, the north (+N) leaf is on the visitor's left.
// gate.door.1.* in scripts/phase3b-build-blender.py is a C hypothesis.
// This does not change the gate, the terrain, collision geometry, or walking.
export const WEST_GATE_LEFT_LEAF=Object.freeze({
 elementId:'wb-gate',stationId:'ic-station-westgate',category:'C',
 boardStartEast:-190.6,north:-33.85,angleRad:.20,
 boardSpacing:.29,boardCount:6,bottomOffset:.05,boardHeight:2.85,
 gateSupportEast:-191,gateSupportNorth:-35
});

export const WEST_GATE_RIGHT_LEAF=Object.freeze({
 ...WEST_GATE_LEFT_LEAF,north:-36.15,angleRad:-.20
});
const LEAVES=Object.freeze({left:WEST_GATE_LEFT_LEAF,right:WEST_GATE_RIGHT_LEAF});
const SIDES=Object.freeze({left:{label:'左',index:1,postNorth:-32.9},right:{label:'右',index:0,postNorth:-37.1}});
export function doorPartNodeNames(side,part){
 if(!Object.hasOwn(SIDES,side)||!Object.hasOwn(WEST_GATE_DOOR_DETAILS,part))throw Error('指定された観察部位が不正です');
 const {index}=SIDES[side];
 const stem='wb-gate.gate.';
 const boards=Array.from({length:6},(_,k)=>stem+'door.'+index+'.'+k);
 const rails=[stem+'door.rail.'+index+'.2.15',stem+'door.rail.'+index+'.0.45'];
 return part==='leaf'?[...boards,...rails]:part==='board'?boards:part==='upperRail'?[rails[0]]:part==='lowerRail'?[rails[1]]:[stem+'post.'+index];
}
export function westGateComparison(groundHeight){
 if(!Number.isFinite(groundHeight))throw Error('模型支持高を確認できません');
 const position=side=>{
  const leaf=LEAVES[side],{postNorth}=SIDES[side];
  return {
   boardCenter:[leaf.boardStartEast+2.5*.29*Math.sin(leaf.angleRad),leaf.north],
   railCenter:[-190.7,leaf.north],postCenter:[-191,postNorth],
   yawRadians:leaf.angleRad
  };
 };
 return {left:position('left'),right:position('right'),groundHeight};
}

export function leftDoorWorldTarget(groundHeight,verticalScale=1){
 if(!Number.isFinite(groundHeight)||!Number.isFinite(verticalScale)||verticalScale<=0)throw Error('左扉の模型支持高を確認できません');
 const leaf=WEST_GATE_LEFT_LEAF;
 const east=leaf.boardStartEast+(leaf.boardCount-1)/2*leaf.boardSpacing*Math.sin(leaf.angleRad);
 const middleOffset=leaf.bottomOffset+leaf.boardHeight/2;
 return [east,(groundHeight+middleOffset)*verticalScale,-leaf.north];
}

// View-only sightlines derived from C-model recipe, not selectable geometry.
export const WEST_GATE_DOOR_DETAILS=Object.freeze({
 leaf:Object.freeze({label:'左門扉全体',fov:40}),
 board:Object.freeze({label:'板材',fov:24}),
 upperRail:Object.freeze({label:'上の横桟',fov:22}),
 lowerRail:Object.freeze({label:'下の横桟',fov:22}),
 postSide:Object.freeze({label:'門柱側の取り合い',fov:24})
});
export function leftDoorDetailWorldTarget(groundHeight,verticalScale=1,part='leaf'){
 return doorDetailWorldTarget('left',groundHeight,verticalScale,part);
}
export function doorDetailWorldTarget(side,groundHeight,verticalScale=1,part='leaf'){
 if(!Object.hasOwn(SIDES,side)||!Object.hasOwn(WEST_GATE_DOOR_DETAILS,part))throw Error('指定された観察部位が不正です');
 if(!Number.isFinite(groundHeight)||!Number.isFinite(verticalScale)||verticalScale<=0)throw Error('門扉の模型支持高を確認できません');
 const leaf=LEAVES[side];
 const board=k=>({
  east:leaf.boardStartEast+k*leaf.boardSpacing*Math.sin(leaf.angleRad),
  north:leaf.north+(k-(leaf.boardCount-1)/2)*leaf.boardSpacing*Math.cos(leaf.angleRad)
 });
 let east,north,height;
 if(part==='leaf'){
  east=leaf.boardStartEast+(leaf.boardCount-1)/2*leaf.boardSpacing*Math.sin(leaf.angleRad);
  north=leaf.north;height=leaf.bottomOffset+leaf.boardHeight/2;
 }else if(part==='board'){
  ({east,north}=board(2));height=leaf.bottomOffset+leaf.boardHeight/2;
 }else if(part==='upperRail'||part==='lowerRail'){
  // gate.door.rail.1.2.15 and gate.door.rail.1.0.45
  east=-190.7;north=leaf.north;height=part==='upperRail'?2.15:.45;
 }else{
  // Halfway between end board and gate.post.1 (-191,-32.9).
  // No hinge, actual contact point or joinery is asserted.
  const edge=board(side==='left'?leaf.boardCount-1:0);
  east=(edge.east-191)/2;north=(edge.north+SIDES[side].postNorth)/2;
  height=leaf.bottomOffset+leaf.boardHeight/2;
 }
 return [east,(groundHeight+height)*verticalScale,-north];
}

// Preserve the original pose once across every component switch.
// Never move the observer or modify the C geometry.
export function createWestGateDoorInspector({camera,controls,render,canInspect,target,highlight=()=>{},compare=()=>null}){
 const section=document.createElement('section');section.id='west-gate-door-inspection';section.hidden=true;
 section.setAttribute('aria-label','西木戸口の門扉を観察');
 const heading=document.createElement('h4');heading.textContent='西木戸口・門扉の観察';
 const note=document.createElement('p');note.textContent='西から東を向いて左は北、右は南です。金色の枠は既存C模型で選んだ部材を示します。立ち位置と目線高は変えません。';
 const actions=document.createElement('div');actions.className='segmented';
 const focus=document.createElement('button');focus.id='west-gate-door-focus';focus.type='button';focus.textContent='左扉を詳しく見る';
 const back=document.createElement('button');back.id='west-gate-door-back';back.type='button';back.textContent='元の視点・向きに戻る';
 actions.append(focus,back);
 const sides=document.createElement('div');sides.className='segmented';
 sides.setAttribute('role','group');sides.setAttribute('aria-label','門扉の左右切替え');
 const sideButtons=new Map();
 for(const [name,{label}] of Object.entries(SIDES)){
  const button=document.createElement('button');button.type='button';button.id='west-gate-side-'+name;
  button.textContent=label+'門扉';sides.append(button);sideButtons.set(name,button);
 }
 const comparison=document.createElement('section');comparison.id='west-gate-door-comparison';comparison.hidden=true;
 const compareButton=document.createElement('button');compareButton.type='button';compareButton.id='west-gate-door-compare';
 compareButton.textContent='左右の構造を比較';compareButton.setAttribute('aria-controls',comparison.id);
 const comparisonResult=document.createElement('div');comparison.append(comparisonResult);
 actions.append(compareButton);
 const details=document.createElement('div');details.className='segmented';details.setAttribute('role','group');details.setAttribute('aria-label','門扉の注視部位');
 const detailButtons=new Map();
 for(const [part,spec] of Object.entries(WEST_GATE_DOOR_DETAILS)){
  if(part==='leaf')continue;
  const button=document.createElement('button');button.id='west-gate-detail-'+part;button.type='button';button.textContent=spec.label;
  button.setAttribute('aria-pressed','false');details.append(button);detailButtons.set(part,button);
 }
 const idleStatus='西木戸口を選択すると観察できます。';
 const readyStatus='左扉全体または観察部位を選ぶと注視できます。';
 const status=document.createElement('p');status.id='west-gate-door-status';status.setAttribute('role','status');status.textContent=idleStatus;
 section.append(heading,note,sides,actions,details,comparison,status);
 document.querySelector('#inner-observation').append(section);
 let saved=null,part=null,side='left',comparisonOpen=false;
 function clear(){
  if(saved)highlight(null,null);
  saved=null;part=null;side='left';comparisonOpen=false;comparisonResult.textContent='';
  status.textContent=idleStatus;
 }
 function updateComparison(){
  comparison.hidden=!comparisonOpen;compareButton.setAttribute('aria-expanded',String(comparisonOpen));
 }
 function drawComparison(data){
  const title=document.createElement('h5');title.textContent='左右の構造（C模型・メートル）';
  const note=document.createElement('p');
  note.textContent='共通：各扉は長方形の縦板6枚（各0.13 × 0.27 × 2.85 m）、横桟2本（各0.17 × 1.85 × 0.15 m）、各側に門柱1本（0.38 × 0.38 × 3.80 m）。数値は制作寸法で史実の実測値ではありません。';
  const list=document.createElement('dl');
  const en=a=>a.map(v=>v.toFixed(3)).join(' / ');
  for(const [side,{label}] of Object.entries(SIDES)){
   const x=data[side];
   const term=document.createElement('dt');term.textContent=label+'門扉';
   const description=document.createElement('dd');
   description.textContent='板群中心 E / N '+en(x.boardCenter)+'、横桟 E / N '+en(x.railCenter)+'、門柱 E / N '+en(x.postCenter)+'。制作角 '+(x.yawRadians*180/Math.PI).toFixed(2)+'°。'+(x.postGround?'模型の柱下端−表示地表 '+x.postGround.gap.toFixed(3)+' m（負＝模型が地表より低い）。':'柱下端と表示地表の差はUNKNOWN。');
   list.append(term,description);
  }
  const support=document.createElement('p');
  support.textContent='相違：北／南で位置と制作角の符号が異なり、板群のE座標も異なります。模型の支持基準は両側共通の E−191 / N−35、標高 '+data.groundHeight.toFixed(3)+' m。制作式では板下端は基準＋0.05 m、柱下端は−0.20 m。各柱の実際の接地・接合は未確認です。';
  const evidence=document.createElement('p');
  evidence.textContent='史料・発掘：個々の部材寸法や開き方を直接確認した根拠は未確認（UNKNOWN）。復元推定：C模型の位置と構成。模型上の仮定：寸法・角度・支持基準。展示演出：注視・強調枠・表面仕上げ。史実の左右対称性、蝶番、接合、開閉方向はUNKNOWN。';
  comparisonResult.textContent='';comparisonResult.append(title,note,list,support,evidence);
 }
 function sync(){
  const visible=Boolean(canInspect());
  section.hidden=!visible;
  if(!visible)clear();
  else if(status.textContent===idleStatus)status.textContent=readyStatus;
  focus.textContent=SIDES[side].label+'扉を詳しく見る';
  focus.disabled=!visible||Boolean(saved)&&part==='leaf';
  for(const [name,button] of sideButtons){
   button.disabled=!visible;button.setAttribute('aria-pressed',String(name===side));
  }
  compareButton.disabled=!visible;updateComparison();
  back.disabled=!visible||!saved;
  for(const [name,button] of detailButtons){
   button.disabled=!visible;
   button.setAttribute('aria-pressed',String(Boolean(saved)&&name===part));
  }
  return visible;
 }
 function cancel(){clear();sync();}
 function inspect(nextPart,nextSide=side){
  if(!canInspect()||!Object.hasOwn(WEST_GATE_DOOR_DETAILS,nextPart))return;
  if(nextPart==='leaf'&&saved&&part==='leaf'&&nextSide===side)return;
  let point;
  try{
   point=target(nextPart,nextSide);
   if(!Array.isArray(point)||point.length!==3||!point.every(Number.isFinite))throw Error('門扉の指示点が不正です');
   highlight(nextSide,nextPart);
  }catch(error){status.textContent='観察不可：'+(error instanceof Error?error.message:'座標を取得できません');return;}
  if(!saved)saved={position:camera.position.toArray(),look:controls.target.toArray(),fov:camera.fov};
  side=nextSide;part=nextPart;
  controls.target.fromArray(point);camera.fov=WEST_GATE_DOOR_DETAILS[nextPart].fov;
  camera.updateProjectionMatrix();camera.lookAt(controls.target);
  status.textContent=(nextPart==='leaf'?SIDES[side].label+'門扉全体':SIDES[side].label+'扉・'+WEST_GATE_DOOR_DETAILS[nextPart].label)+'をC模型の制作式から注視中。史実の接合構造は未確定です。「元の視点・向きに戻る」で開始前に復帰します。';
  sync();render();
 }
 focus.onclick=()=>inspect('leaf');
 for(const [name,button] of sideButtons)button.onclick=()=>inspect('leaf',name);
 compareButton.onclick=()=>{
  if(!canInspect())return;
  if(!comparisonOpen){
   try{const data=compare();if(!data)throw Error('模型比較値が未取得です');drawComparison(data);}
   catch(error){status.textContent='比較不可：'+(error instanceof Error?error.message:'模型比較値を取得できません');return;}
  }
  comparisonOpen=!comparisonOpen;updateComparison();
 };
 for(const [name,button] of detailButtons)button.onclick=()=>inspect(name);
 back.onclick=()=>{
  if(!canInspect()||!saved)return;
  const previous=saved;saved=null;part=null;highlight(null,null);
  camera.position.fromArray(previous.position);controls.target.fromArray(previous.look);
  camera.fov=previous.fov;camera.updateProjectionMatrix();camera.lookAt(controls.target);
  status.textContent='門扉観察を終了し、直前の位置・向き・画角へ戻しました。';
  sync();render();
 };
 sync();
 return {sync,cancel,diagnostics:()=>({available:!section.hidden,focused:Boolean(saved),part,side,comparisonOpen,category:'C',stationId:WEST_GATE_LEFT_LEAF.stationId})};
}
