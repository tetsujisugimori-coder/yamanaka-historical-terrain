import {sampleSurfaceHeight} from './surface.js';

/** A comparison pose is valid only above a real, visible supporting triangle.
 * Never manufacture a high shared floor by taking max(A,C). */
export function supportedPose(station, meshes, scale=1, preservedY=null){
 const ground=sampleSurfaceHeight(meshes,...station.eye,scale)*scale;
 const y=preservedY??ground+1.7;
 if(!Number.isFinite(y)||Math.abs(y-ground-1.7)>.25)throw Error('同じ視点の足場がこの地表と一致しません。地点を選び直すと表示中の地表に接地します。');
 // Scale only the terrain-relative height difference. Eye height and the
 // observation target's physical offset above its surface remain unscaled.
 const hasTarget=station.lookTargetHeight!==undefined||station.lookHeightOffset!==undefined;
 if(hasTarget&&![station.lookTargetHeight,station.lookHeightOffset,station.groundHeight].every(Number.isFinite))throw Error('観察方向の標高データが不正です');
 const targetY=hasTarget?y-1.7+(station.lookTargetHeight-station.lookHeightOffset-station.groundHeight)*scale+station.lookHeightOffset:y-(station.lookDown??0);
 return {eye:[station.eye[0],y,-station.eye[1]],target:[station.look[0],targetY,-station.look[1]],ground,clearance:y-ground};
}
export function validateInnerMetadata(meta){
 if(!Array.isArray(meta.elements)||!Array.isArray(meta.stations)||!meta.stations.length)throw Error('城内観察データの形式が不正です');
 if(!Array.isArray(meta.bounds)||meta.bounds.length!==4||!meta.bounds.every(Number.isFinite)||meta.bounds[0]>=meta.bounds[2]||meta.bounds[1]>=meta.bounds[3])throw Error('城内領域の境界が不正です');
 const ids=new Set();for(const f of meta.elements){if(!f.id?.startsWith('ic-')||ids.has(f.id)||f.category!=='C')throw Error('城内施設のID・根拠分類が不正です');ids.add(f.id);}
 const stations=new Set(),known=new Set([...ids,'nm-bailey','wb-bailey','wb-gate','wb-moat']);
 for(const p of meta.stations){if(stations.has(p.id)||!known.has(p.elementId)||p.category!=='C')throw Error('観察地点の施設ID・根拠分類が不正です');stations.add(p.id);if(!p.id||![...(p.eye??[]),...(p.look??[])].every(Number.isFinite)||p.eye?.length!==2||p.look?.length!==2)throw Error('城内観察地点の座標が不正です');}
 return meta;
}
export function createInnerPanel(){
 const panel=document.createElement('section');panel.id='inner-observation';panel.className='inner-observation';panel.setAttribute('aria-label','第3期C 城内の誘導観察');
 panel.innerHTML='<h3>城内を読む · 誘導式の低視点観察</h3><p>地点を選んで静止観察。地点間の歩行は再現しません。土塁や堀を横切る移動アニメーションはありません。</p><button id="inner-load">城内観察を読み込む</button><p id="inner-asset-status" role="status">追加モデルは必要なときだけ読み込みます。施設の配置・具体形状はC推定です。</p><div id="inner-stations" class="segmented station-buttons"></div><div class="segmented"><button id="inner-previous" disabled>前の地点</button><button id="inner-next" disabled>次の地点</button></div><div class="western-options"><label class="check" hidden><input id="inner-building" type="checkbox" checked>C 見張台の建物候補</label><label class="check" hidden><input id="inner-fence" type="checkbox" checked>C 木柵候補</label></div><p id="inner-location" role="status">現在地：未選択</p><p id="inner-direction"></p><p id="inner-comparison" role="status"></p>';
 document.querySelector('#landscape-toolbar').append(panel);return panel;
}
