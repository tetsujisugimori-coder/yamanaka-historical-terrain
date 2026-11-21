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
 if(!Object.hasOwn(WEST_GATE_DOOR_DETAILS,part))throw Error('指定された観察部位が不正です');
 if(!Number.isFinite(groundHeight)||!Number.isFinite(verticalScale)||verticalScale<=0)throw Error('左扉の模型支持高を確認できません');
 const leaf=WEST_GATE_LEFT_LEAF;
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
  const edge=board(leaf.boardCount-1);
  east=(edge.east-191)/2;north=(edge.north-32.9)/2;
  height=leaf.bottomOffset+leaf.boardHeight/2;
 }
 return [east,(groundHeight+height)*verticalScale,-north];
}

// Preserve the original pose once across every component switch.
// Never move the observer or modify the C geometry.
export function createWestGateDoorInspector({camera,controls,render,canInspect,target}){
 const section=document.createElement('section');section.id='west-gate-door-inspection';section.hidden=true;
 section.setAttribute('aria-label','西木戸口の左門扉を観察');
 const heading=document.createElement('h4');heading.textContent='西木戸口・左の門扉';
 const note=document.createElement('p');note.textContent='西から東を向いて左側（北側）。板材・横桟・門柱側はC推定の注視位置です。実際の接合構造を確定する表示ではありません。立ち位置と目線高は変えません。';
 const actions=document.createElement('div');actions.className='segmented';
 const focus=document.createElement('button');focus.id='west-gate-door-focus';focus.type='button';focus.textContent='左扉を詳しく見る';
 const back=document.createElement('button');back.id='west-gate-door-back';back.type='button';back.textContent='元の視点・向きに戻る';
 actions.append(focus,back);
 const details=document.createElement('div');details.className='segmented';details.setAttribute('role','group');details.setAttribute('aria-label','左扉の注視部位');
 const detailButtons=new Map();
 for(const [part,spec] of Object.entries(WEST_GATE_DOOR_DETAILS)){
  if(part==='leaf')continue;
  const button=document.createElement('button');button.id='west-gate-detail-'+part;button.type='button';button.textContent=spec.label;
  button.setAttribute('aria-pressed','false');details.append(button);detailButtons.set(part,button);
 }
 const status=document.createElement('p');status.id='west-gate-door-status';status.setAttribute('role','status');status.textContent='西木戸口を選択すると観察できます。';
 section.append(heading,note,actions,details,status);
 document.querySelector('#inner-observation').append(section);
 let saved=null,part=null;
 function sync(){
  const visible=Boolean(canInspect());
  section.hidden=!visible;
  if(!visible){saved=null;part=null;}
  focus.disabled=!visible||Boolean(saved);
  back.disabled=!visible||!saved;
  for(const [name,button] of detailButtons){
   button.disabled=!visible;
   button.setAttribute('aria-pressed',String(Boolean(saved)&&name===part));
  }
  return visible;
 }
 function cancel(){saved=null;part=null;status.textContent='西木戸口を選択すると観察できます。';sync();}
 function inspect(nextPart){
  if(!canInspect()||!Object.hasOwn(WEST_GATE_DOOR_DETAILS,nextPart))return;
  if(nextPart==='leaf'&&saved)return;
  let point;
  try{
   point=target(nextPart);
   if(!Array.isArray(point)||point.length!==3||!point.every(Number.isFinite))throw Error('左扉の指示点が不正です');
  }catch(error){status.textContent='観察不可：'+(error instanceof Error?error.message:'座標を取得できません');return;}
  if(!saved)saved={position:camera.position.toArray(),look:controls.target.toArray(),fov:camera.fov};
  part=nextPart;
  controls.target.fromArray(point);camera.fov=WEST_GATE_DOOR_DETAILS[nextPart].fov;
  camera.updateProjectionMatrix();camera.lookAt(controls.target);
  status.textContent=WEST_GATE_DOOR_DETAILS[nextPart].label+'をC模型の制作式から注視中。史実の接合構造は未確定です。「元の視点・向きに戻る」で開始前に復帰します。';
  sync();render();
 }
 focus.onclick=()=>inspect('leaf');
 for(const [name,button] of detailButtons)button.onclick=()=>inspect(name);
 back.onclick=()=>{
  if(!canInspect()||!saved)return;
  const previous=saved;saved=null;part=null;
  camera.position.fromArray(previous.position);controls.target.fromArray(previous.look);
  camera.fov=previous.fov;camera.updateProjectionMatrix();camera.lookAt(controls.target);
  status.textContent='左扉観察を終了し、直前の位置・向き・画角へ戻しました。';
  sync();render();
 };
 sync();
 return {sync,cancel,diagnostics:()=>({available:!section.hidden,focused:Boolean(saved),part,category:'C',stationId:WEST_GATE_LEFT_LEAF.stationId})};
}
