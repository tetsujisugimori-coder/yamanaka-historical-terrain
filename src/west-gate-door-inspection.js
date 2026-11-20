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

// Keep camera ownership in the existing fixed observation. Only look direction
// and field-of-view change. Restore exactly the previous pose when requested.
export function createWestGateDoorInspector({camera,controls,render,canInspect,target}){
 const section=document.createElement('section');section.id='west-gate-door-inspection';section.hidden=true;
 section.setAttribute('aria-label','西木戸口の左門扉を観察');
 const heading=document.createElement('h4');heading.textContent='西木戸口・左の門扉';
 const note=document.createElement('p');note.textContent='門の西側から東を向いて左側（北側）の扉を観察。門柱・扉の構造、寸法・開き方はC推定であり、史実の確定形状ではありません。視点の位置・目線高は変えません。';
 const actions=document.createElement('div');actions.className='segmented';
 const focus=document.createElement('button');focus.id='west-gate-door-focus';focus.type='button';focus.textContent='左扉を詳しく見る';
 const back=document.createElement('button');back.id='west-gate-door-back';back.type='button';back.textContent='元の視点・向きに戻る';
 actions.append(focus,back);
 const status=document.createElement('p');status.id='west-gate-door-status';status.setAttribute('role','status');status.textContent='西木戸口を選択すると観察できます。';
 section.append(heading,note,actions,status);
 document.querySelector('#inner-observation').append(section);
 let saved=null;
 function sync(){
  const visible=canInspect();
  section.hidden=!visible;
  if(!visible)saved=null;
  focus.disabled=!visible||Boolean(saved);
  back.disabled=!visible||!saved;
  return visible;
 }
 function cancel(){saved=null;status.textContent='西木戸口を選択すると観察できます。';sync();}
 focus.onclick=()=>{
  if(!canInspect()||saved)return;
  let point;
  try{
   point=target();
   if(!Array.isArray(point)||point.length!==3||!point.every(Number.isFinite))throw Error('左扉の指示点が不正です');
  }catch(error){status.textContent='観察不可：'+error.message;return;}
  saved={position:camera.position.toArray(),look:controls.target.toArray(),fov:camera.fov};
  controls.target.fromArray(point);camera.fov=40;camera.updateProjectionMatrix();camera.lookAt(controls.target);
  status.textContent='左扉のC模型を拡大観察中。ドラッグ・矢印キーで見回せます。「元の視点・向きに戻る」で開始前に復帰します。';
  sync();render();
 };
 back.onclick=()=>{
  if(!canInspect()||!saved)return;
  const previous=saved;saved=null;
  camera.position.fromArray(previous.position);controls.target.fromArray(previous.look);
  camera.fov=previous.fov;camera.updateProjectionMatrix();camera.lookAt(controls.target);
  status.textContent='左扉観察を終了し、直前の位置・向き・画角へ戻しました。';
  sync();render();
 };
 sync();
 return {sync,cancel,diagnostics:()=>({available:!section.hidden,focused:Boolean(saved),category:'C',stationId:WEST_GATE_LEFT_LEAF.stationId})};
}
