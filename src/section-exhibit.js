import * as THREE from 'three';
import {SECTIONS,intersectSection,sectionCoordinate,profileHeight} from './sections.js';
const fmt=h=>h===null?'欠損':h.toFixed(1);
export function createSectionExhibit({getModel,context,scene,render,open}){
 const root=document.querySelector('#section-exhibit');
 root.innerHTML=`<p class="eyebrow">FIXED SECTIONS / MODEL MEASUREMENTS</p><h2>堀の低さ、土塁の立上がりを比べる。</h2>
 <label for="section-choice">固定断面</label> <select id="section-choice"><option value="">断面を選択</option>${SECTIONS.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select>
 <button id="section-locate" disabled>3Dで断面を見る</button><p id="section-status" role="status">2断面から選ぶと、AとCの同じ水平位置を比較できます。</p>
 <div id="section-result" hidden><p id="section-location"></p><p id="section-visibility"></p>
 <p class="section-key"><span class="key-a">━━ A 現況モデル</span><span class="key-c">┄┄ C 推定モデル</span></p>
 <svg id="section-graph" role="img" aria-labelledby="section-graph-title section-graph-desc"></svg><p id="section-aspect"></p>
 <p>代表点をタップ、またはTabとEnterで選択。3Dの○が対応位置です。Sは始点、Eは終点。</p>
 <div id="section-points"></div><p id="section-value" role="status"></p><dl id="section-dimensions"></dl>
 <details><summary>根拠・仮定と測り方</summary><p>資料記載：三島市郷土資料館「山中城跡の障子堀」第453号の発掘断面の一例は、畝上部約0.35m・深さ1.8m・法面約58度。全域の寸法ではありません。<a href="https://www.city.mishima.shizuoka.jp/site/kyoudoshiryoukan/36489.html" target="_blank" rel="noopener">出典</a></p>
 <p>現況A：国土地理院DEM由来のWeb5m三角形面。現地の細かい堀形や1590年の面を示すものではありません。推定C：phase2a-v1の制作仮定（堀周期7m、最大切下げ1.8m、土塁立上がり2.5m・基底幅8m・天端幅2m）。基底の傾斜により、測定点間の比高と設計パラメータは一致するとは限りません。</p>
 <p>下の値は今回の表示モデルから測定した値です。地理座標はEPSG:6676、単位m。ローカル東・北原点は E=44862.121277、N=-93478.072354。高さはモデルの基準高（原点高0）。個別の標高基準補正状況が未確認のため絶対標高と断定しません。小数1桁は表示丸めで、測量精度ではありません。</p>
 <p>実GLB三角形面と垂直断面平面の交線を表示。平滑化なし。重なる地表面は最上面、鉛直面・面外・欠損は高さ未定義で接続しません。3Dで非表示の施設もグラフでは全モデルを比較し、その状態を明記します。寸法の整合は歴史的復元の正確さを証明しません。断面だけでは実際の視界は判断できません。</p></details></div>`;
 const $=s=>root.querySelector(s),group=new THREE.Group();scene.add(group);
 let revision=0,selected=null,data=null,point=0,status='idle';const cache=new Map();
 const dispose=()=>{for(const ob of [...group.children]){ob.geometry?.dispose();if(ob.material?.map)ob.material.map.dispose();ob.material?.dispose();group.remove(ob);}};
 function label(text,position){const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;const c=canvas.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,64,64);c.fillStyle='#182f2a';c.font='bold 46px sans-serif';c.textAlign='center';c.fillText(text,32,49);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false}));sprite.position.copy(position);sprite.position.y+=2;sprite.scale.set(2.5,2.5,1);group.add(sprite);}
 function updateOverlay(){dispose();const c=context();if(!data||!c.ready||c.view!=='reconstruction'||c.failed)return;
  const profile=c.comparison==='current'?data.A:data.C;
  const visible=p=>c.comparison==='current'||c.visible.includes(p.surface);
  const vertices=[];for(const p of profile.segments.filter(visible))for(const [d,h]of [[p.from,p.h0],[p.to,p.h1]]){const [e,n]=sectionCoordinate(selected,d);vertices.push(e,h*c.exaggeration,-n);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));const line=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:'#192f29',depthTest:false}));line.renderOrder=12;group.add(line);
  for(const [d,text]of [[0,'S'],[profile.length,'E'],[selected.points[point][1],'○']]){const h=profileHeight(profile,d),p=profile.segments.find(p=>d>=p.from-1e-8&&d<=p.to+1e-8&&visible(p));if(h===null||!p)continue;const [e,n]=sectionCoordinate(selected,d),pos=new THREE.Vector3(e,h*c.exaggeration,-n);const m=new THREE.Mesh(new THREE.SphereGeometry(text==='○'?.65:.4,12,8),new THREE.MeshBasicMaterial({color:text==='○'?'#fff19b':'#223f36',depthTest:false}));m.position.copy(pos);m.userData={distance:d,realHeight:h,kind:text};m.renderOrder=13;group.add(m);if(text!=='○')label(text,pos);}
 }
 function graph(){if(!data)return;const svg=$('#section-graph'),w=Math.max(280,Math.min(900,svg.clientWidth||640)),h=300,left=56,right=20,top=32,bottom=45,pw=w-left-right,ph=h-top-bottom;
  const values=[...data.A.segments,...data.C.segments].flatMap(p=>[p.h0,p.h1]);if(!values.length){svg.replaceChildren();return;}const lo=Math.floor(Math.min(...values))-1,hi=Math.ceil(Math.max(...values))+1;
  const x=d=>left+d/data.A.length*pw,y=v=>top+(hi-v)/(hi-lo)*ph;
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`);let content=`<title id="section-graph-title">${selected.name}：A実線・C破線</title><desc id="section-graph-desc">横軸は始点Sからの水平距離m、縦軸はモデル基準高m。主要数値は下のボタンと文章に表示。</desc><text x="${left}" y="17">モデル基準高 m（実寸）</text>`;
  for(let i=0;i<=4;i++){const d=data.A.length*i/4,v=lo+(hi-lo)*i/4;content+=`<path class="section-grid" d="M${left},${y(v)}H${w-right}"/><text x="${left-7}" y="${y(v)+4}" text-anchor="end">${Number(v.toFixed(1))}</text><text x="${x(d)}" y="${h-25}" text-anchor="middle">${Number(d.toFixed(1))}</text>`;}
  for(const key of ['A','C']){let previous;const path=data[key].segments.map(p=>{const connected=previous&&Math.abs(previous.to-p.from)<1e-8&&Math.abs(previous.h1-p.h0)<1e-8;previous=p;return `${connected?'L':'M'}${x(p.from)},${y(p.h0)}L${x(p.to)},${y(p.h1)}`;}).join('');content+=`<path class="curve-${key}" d="${path}"/>`;}
  const d=selected.points[point][1];content+=`<path class="section-selected" d="M${x(d)},${top}V${top+ph}"/>`;for(const key of ['A','C'])for(const [i,[,distance]]of selected.points.entries()){const v=profileHeight(data[key],distance);if(v!==null)content+=`<g data-section-point="${i}"><circle cx="${x(distance)}" cy="${y(v)}" r="22" fill="transparent" pointer-events="all"/><circle class="dot-${key}" cx="${x(distance)}" cy="${y(v)}" r="${i===point?6:4}"/></g>`;}
  content+=`<text x="${left}" y="${h-6}">S → E 水平距離 m</text>`;svg.innerHTML=content;
  $('#section-aspect').textContent=`グラフの縦倍率 ${(ph/(hi-lo)/(pw/data.A.length)).toFixed(1)}倍（縦横の1mを比較）。3Dの標高誇張とは独立。`;
 }
 function details(){if(!data)return;$('#section-points').replaceChildren(...selected.points.map(([name,d],i)=>{const b=document.createElement('button');b.textContent=`${name} / Sから${d.toFixed(1)}m / A ${fmt(profileHeight(data.A,d))}m / C ${fmt(profileHeight(data.C,d))}m`;b.setAttribute('aria-pressed',String(i===point));b.onclick=()=>{point=i;details();updateOverlay();render();$('#section-points').children[i].focus();};return b;}));
  const [name,d]=selected.points[point],[e,n]=sectionCoordinate(selected,d);$('#section-value').textContent=`選択：${name}。東 ${e.toFixed(1)}m・北 ${n.toFixed(1)}m（ローカル）、水平距離 ${d.toFixed(1)}m、A ${fmt(profileHeight(data.A,d))}m、C ${fmt(profileHeight(data.C,d))}m。`;
  const dl=$('#section-dimensions');dl.replaceChildren();for(const [label,i,j]of selected.measurements){const dt=document.createElement('dt'),dd=document.createElement('dd'),di=selected.points[i][1],dj=selected.points[j][1];dt.textContent=`${label}（水平距離 ${Math.abs(di-dj).toFixed(1)}m）`;dd.textContent=['A','C'].map(key=>{const a=profileHeight(data[key],di),b=profileHeight(data[key],dj);return`${key} 比高 ${a===null||b===null?'欠損':(a-b).toFixed(1)+'m'}`;}).join(' / ');dl.append(dt,dd);}graph();
 }
 function sync(){const c=context();$('#section-locate').disabled=!data||c.failed;updateOverlay();if(data){$('#section-visibility').textContent=c.failed?'3D取得失敗：対応点は表示できません。グラフは取得済みのA/Cモデルの比較です。':!c.ready?'3D切替中：対応線・点を非表示にしています。':c.view!=='reconstruction'?'3Dは別の観察範囲です。「3Dで断面を見る」で対応位置へ移動できます。':`3Dは${c.comparison==='current'?'A現況':'C推定'}。もう一方の曲線も比較用に表示しています。非表示施設上の3D線・点は表示しません。`;graph();}render();}
 async function choose(id){const token=++revision;selected=SECTIONS.find(s=>s.id===id)??null;data=null;point=0;dispose();$('#section-result').hidden=true;$('#section-locate').disabled=true;render();if(!selected){status='idle';$('#section-status').textContent='断面を選択してください。';return;}status='loading';$('#section-status').textContent='A/Cの表示モデルから断面を取得中…';const s=selected;
  try{if(!cache.has(id)){const pending=Promise.all([getModel('reconstruction','current'),getModel('reconstruction','restored')]).then(([a,c])=>({A:intersectSection(a.children,s),C:intersectSection(c.children,s)}));cache.set(id,pending);pending.catch(()=>{if(cache.get(id)===pending)cache.delete(id);});}const result=await cache.get(id);if(token!==revision)return;data=result;status='ready';$('#section-status').textContent='A/Cの実三角形面を取得済み。数値は実寸、3Dの誇張で変わりません。';$('#section-result').hidden=false;$('#section-location').textContent=`${s.name}：S (${s.start.join(', ')}) → E (${s.end.join(', ')})m、${s.direction}、水平 ${result.A.length.toFixed(1)}m。${s.reason}`;details();sync();}
  catch(e){if(token!==revision)return;status='error';$('#section-status').textContent=`断面の取得に失敗しました。A/Cが揃わないため結果は表示しません。選び直すと再試行できます。`;console.error('Section model load failed',e);}
 }
 $('#section-graph').onclick=e=>{const hit=e.target.closest('[data-section-point]');if(hit){point=Number(hit.dataset.sectionPoint);details();updateOverlay();render();}};
 $('#section-choice').onchange=e=>choose(e.target.value);$('#section-locate').onclick=()=>open(selected);
 const ro=new ResizeObserver(()=>graph());ro.observe($('#section-graph'));
 return{sync,reset(){revision++;selected=null;data=null;status='idle';$('#section-choice').value='';$('#section-result').hidden=true;$('#section-status').textContent='断面を選択してください。';dispose();},fail(){sync();},diagnostics:()=>({id:selected?.id,status,point,data,context:context(),markers:group.children.filter(m=>m.isMesh).map(m=>({position:m.position.toArray(),...m.userData})),line:group.children.find(m=>m.isLineSegments)?.geometry.attributes.position.array?Array.from(group.children.find(m=>m.isLineSegments).geometry.attributes.position.array):[]}),dispose(){ro.disconnect();dispose();}};
}
