/** Phase 3D model helpers. Analytical visibility is not historic combat evidence. */
export const DEFENCE_PAIRS=[
 {id:'entrance',name:'同じ土塁背後を外・内から',attacker:'ic-koguchi',defender:'ic-koguchi-inside',target:[-75,-35]},
 {id:'bridge',name:'土橋を低視点・見張台から',attacker:'ic-bridge',defender:'ic-lookout',target:[-85,-29]},
];
export function validateConnectedMetadata(meta){
 if(!meta||!Array.isArray(meta.elements)||!meta.elements.length)throw Error('接続候補データが空です');
 const ids=new Set();
 for(const f of meta.elements){
  if(typeof f.id!=='string'||!f.id.startsWith('dc-')||ids.has(f.id)||f.category!=='C'||!Array.isArray(f.local)||f.local.length!==2||!f.local.every(Number.isFinite)||!Number.isFinite(f.height))throw Error('接続候補のID・分類・位置が不正です');
  ids.add(f.id);
 }
 return meta;
}
export function createConnectedPanel(){
 const panel=document.createElement('section');panel.id='connected-defences';panel.className='inner-observation';panel.setAttribute('aria-label','第3期D 防御空間の比較');
 panel.innerHTML='<h3>防御空間をつなげて読む</h3><p>土橋から虎口への接続に、史実未確定の門・柵候補Cを重ねます。地形は変更しません。通路・構法は模型上の仮定で、現地の歩行案内ではありません。</p><button id="connected-load">接続候補を読み込む</button><p id="connected-status" role="status">未読込み。既存8地点はそのまま利用できます。</p><label class="check"><input type="checkbox" id="connected-visible" checked>門・柵の推定候補Cを表示</label><label class="check"><input type="checkbox" id="connected-rays">実形状による視線を表示</label><div id="connected-pairs" class="station-buttons"></div><p id="connected-ray-result" role="status">視線は模型内の一点との交差です。射程・戦闘力・史実の見通しを証明しません。</p>';
 const pairs=panel.querySelector('#connected-pairs');
 for(const pair of DEFENCE_PAIRS){const block=document.createElement('div');const label=document.createElement('p');label.textContent=pair.name;block.append(label);for(const [side,text]of [['attacker','攻め手側の低視点'],['defender','守備側の視点']]){const b=document.createElement('button');b.dataset.defencePair=pair.id;b.dataset.side=side;b.textContent=text;block.append(b);}pairs.append(block);}
 document.querySelector('#landscape-toolbar').append(panel);return panel;
}

