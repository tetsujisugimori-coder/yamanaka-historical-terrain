/** Historical reading is available independently of renderer capabilities. */
export function createReading({features,sources}){
 if(!Array.isArray(features)||features.length!==4||!Array.isArray(sources)||sources.length!==4)throw new Error('Incomplete reading data');
 const $=s=>document.querySelector(s);
 const categories={A:'現況',B:'史料に基づく復元',C:'推定・案内',D:'演出・模式表現'};
 let selectionHandler;
 function sourceLinks(feature){
  const div=document.createElement('div');div.className='source-inline';
  for(const id of feature.sourceIds){const source=sources.find(s=>s.id===id);if(!source)throw new Error('Unknown source '+id);const a=document.createElement('a');a.href=source.url;a.target='_blank';a.rel='noopener';a.textContent=id==='gsi'?'国土地理院 ↗':id==='plan'?'保存活用計画 ↗':'三島市の解説 ↗';div.append(a,document.createTextNode('　'));}
  return div;
 }
 function select(id,height){
  const f=features.find(f=>f.id===id);if(!f)throw new Error('Unknown facility '+id);
  const tag=document.createElement('span');tag.className='evidence-tag';const code=document.createElement('b');code.textContent=f.category;tag.append(code,document.createTextNode(categories[f.category]));
  const title=document.createElement('h2');title.textContent=f.name;const description=document.createElement('p');description.textContent=f.description;
  const dl=document.createElement('dl');for(const [term,value]of [['現在のDEM標高（概略案内地点）',`${Math.round(height??f.height)} m`],['位置の確実性','概略 / 未測量']]){const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=term;dd.textContent=value;if(term==='位置の確実性')dd.style.cssText='font:11px Arial;padding-top:7px';div.append(dt,dd);dl.append(div);}
  $('#detail').replaceChildren(tag,title,description,dl,sourceLinks(f));$('#chapter-no').textContent=`0${features.indexOf(f)+1} / 04`;
  document.querySelectorAll('#feature-list button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===id)));
  return f;
 }
 $('#source-list').replaceChildren(...sources.map(s=>{const div=document.createElement('section');div.className='source';const a=document.createElement('a');a.href=s.url;a.target='_blank';a.rel='noopener';a.textContent=s.title+' ↗';div.append(a);for(const text of [s.year,s.use,s.terms,s.accuracy]){const p=document.createElement('p');p.textContent=text;div.append(p);}return div;}));
 $('#feature-list').replaceChildren(...features.map((f,index)=>{const b=document.createElement('button');b.textContent=`0${index+1} ${['立地','堀','出丸','道'][index]}`;b.title=f.name;b.setAttribute('aria-label',f.name);b.dataset.id=f.id;b.onclick=()=>selectionHandler?selectionHandler(f.id):select(f.id);return b;}));
 select('castle');document.body.dataset.readingState='ready';$('#reading-status').textContent='施設解説・出典を表示中';
 return{select,setSelectionHandler(handler){selectionHandler=handler;}};
}
