import {adaptHistoricalRelations} from './historical-guide-contract.js';
import ledger from '../research/stage3b5/ledger.json';
const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
/** Reads canonical records. No spatial inference and no additional model placement. */
export function createHistoricalGuide({selectModel,cancel}){
 const element=node('section');element.id='historical-guide';element.setAttribute('aria-label','歴史区域・史料・模型の対照');
 const heading=node('h2','歴史区域・史料・3D模型の対照');
 const status=node('p','区域資料を読込中');status.setAttribute('role','status');status.id='historical-guide-status';
 const list=node('div');list.id='historical-guide-list';const detail=node('article');detail.id='historical-guide-detail';detail.tabIndex=-1;
 const back=node('button','模型から元の区域情報へ戻る');back.id='historical-guide-back';back.hidden=true;
 element.append(heading,node('p','関連付けは史実の位置確証ではありません。11区域は未配置。Stage 3-B全体HOLD。'),status,list,back,detail);
 let data=null,selected=null,model=null;
 const field=(label,value)=>detail.append(node('h4',label),node('p',value??'UNKNOWN'));
 function show(id,focus=false){
  const r=data?.regions.find(r=>r.id===id);if(!r)return false;cancel?.();selected=id;model=null;back.hidden=true;
  const b5=ledger.regions.find(x=>x.regionId===id);
  detail.replaceChildren(node('h3',`${r.name} · ${r.id} · 未配置`));
  field('史料から直接確認した記述（既存調査の要約。原文転載ではない）',b5?.directStatement??r.summary);
  field('確認した範囲・参照版',b5?.statementBasis??'既存台帳の要約。今回原資料を再閲覧したものではありません。');
  field('研究上の推論・推定手順',b5?.inferenceProcedure??r.method);
  field('推定C',`採用候補0。実区域polygon表示 NOT_TESTED。${b5?.decisionReason??r.uncertainty}`);
  field('現況A','現況DEMの地形表示は1590年の地表・歴史区域境界の確証ではありません。');
  field('未確認・不明・未検証',`${r.uncertainty} 位置精度UNKNOWN、実変換NOT_TESTED、残差null。原成果の現存・所在・利用許可UNKNOWN。`);
  for(const ref of r.sourceRefs){const s=data.sources.find(s=>s.id===ref.id);const p=node('p',`資料ID ${s.id} / ${s.title} / p.${ref.page??'UNKNOWN'} ${ref.figure??''} / 参照URL：`);const a=node('a','資料提供元');a.href=s.url;a.target='_blank';a.rel='noopener';p.append(a);detail.append(p);field('利用条件','原図・写真・本文の転載なし。閲覧URLの公開は分析・変換・派生物・Web再配布の許可を意味しません。個別許可UNKNOWN。');}
  const links=data.regionModelRelations.filter(l=>l.regionId===id);
  detail.append(node('h4','関連する既存3D模型'));
  if(!links.length)detail.append(node('p','関連模型なし（現行台帳の登録0件。不存在の証明ではありません）。他模型との関連未確証。'));
  for(const l of links){const m=data.models.find(m=>m.id===l.modelId);const button=node('button',`${m.name} · ${m.id} · 関連未確証`);button.dataset.guideModel=m.id;button.onclick=()=>{model=m.id;back.hidden=false;selectModel(m.id);status.textContent=`${r.name}から模型${m.id}の説明を選択。3D表示成功を意味しません。`;};detail.append(node('p',`関係種別：${l.type} / 根拠：${l.evidence.join(' / ')} / 地理的一致 ${l.geographicAgreement}`),button);}
  for(const b of list.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.guideRegion===id));
  status.textContent=`${r.name}の根拠・推論を対照中。歴史的位置UNKNOWN。`;
  if(focus)list.querySelector(`[data-guide-region="${id}"]`)?.focus();return true;
 }
 back.onclick=()=>show(selected,true);
 element.addEventListener('keydown',e=>{if(e.key==='Escape'&&selected){e.preventDefault();show(selected,true);}});
 return {element,setData(value){adaptHistoricalRelations(value);data=value;list.replaceChildren();detail.replaceChildren();selected=null;model=null;back.hidden=true;for(const r of data.regions){const b=node('button',`${r.name} · 未配置`);b.dataset.guideRegion=r.id;b.setAttribute('aria-pressed','false');b.onclick=()=>show(r.id);list.append(b);}status.textContent=data.regions.length?`区域${data.regions.length}件 / 模型${data.models.length}件。模型の区域関連は台帳登録以外未確証。`:'区域資料は空です。既存地形を利用できます。';},error(message){data=null;list.replaceChildren();detail.replaceChildren();back.hidden=true;status.textContent=`区域資料の読込失敗：${message}。城域資料の再取得を利用できます。`;},show,diagnostics:()=>({selectedRegionId:selected,selectedModelId:model,regions:data?.regions.length??0})};
}
