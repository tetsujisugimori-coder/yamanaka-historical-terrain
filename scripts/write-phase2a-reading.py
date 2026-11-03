"""Only our original summaries and explicit model hypotheses are distributed."""
import json,importlib.util
from pathlib import Path
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('shape',root/'scripts/phase2a-shape.py');shape=importlib.util.module_from_spec(spec);spec.loader.exec_module(shape)
grid=json.loads((root/'public/data/castle.json').read_text(encoding='utf8'))
sources=json.loads((root/'public/data/sources.json').read_text(encoding='utf8'))
sources=[s for s in sources if s['id']!='mishima-works']
sources.append({'id':'mishima-works','title':'三島市文化財課：山中城跡環境整備事業・発掘調査の成果','url':'https://www.city.mishima.shizuoka.jp/page/1301.html','year':'更新2026-02-05 / 閲覧2026-11-04 JST','use':'曲輪三方のコの字状土塁という一般構成、盛土と芝による保護。西ノ丸固有の寸法・座標の証明には用いない。','terms':'図版・写真・本文転載なし。事実を独自に要約し、独自の仮説形状を制作。転載・トレース許諾は未取得。','accuracy':'通常土塁の約1.8m等は一般説明。本モデルの2.5m高・8m基底幅・2m天端は仮説C。'})
(root/'public/data/sources.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
layout=json.loads((root/'public/data/nishinomaru-layout.json').read_text(encoding='utf8'))
names={'nm-bailey':('曲輪','西ノ丸 曲輪候補','曲輪の平場から、堀と土塁の配置を見渡す。40×45mの平場と南北の緩勾配は制作上の仮定で、西ノ丸全域を測量復元したものではない。'),
'nm-moat':('障子堀','西ノ丸 障子堀候補','細い畝が堀底を区切り、移動を制約する構造を立体で読む。市の発掘解説の一例（畝上約35cm・深さ1.8m・約58度）を関数の参考に使用。20×58mの範囲、7m周期・方向・区画数は仮定。0.25mのWeb格子では丸い畝を簡略化しており、全ての断面が史料値に一致するものではない。'),
'nm-rampart':('土塁','西ノ丸 土塁候補','曲輪の三方を囲む土の防御線をコの字形に仮設計した。基底幅8m・天端幅2m・高さ2.5mは仮定で、山中城固有の実測ではない。法面は単純化した台形で、史料の通常規模1.8mという一般説明とは区別する。'),
'nm-passage':('通路','虎口・接続通路候補','南東に土塁の開口と2m低い入口側からの連続勾配を仮設計。虎口の位置、形、段差と道路中心線の証拠は不足している。西櫓の東南虎口に関する記述を西ノ丸の確定位置へ転用していない。門・柵は未制作。'),
'nm-transition':('接続地形','復元地形への接続','曲輪・堀・土塁を一続きの地表で結び、外周を現在のAの三角形面へ接続したCの補間部。比較時はA全体をそのまま表示する。形の連続性は歴史的正しさを意味しない。')}
facilities=[]
for record in layout['samples']:
 id=record['id'];short,name,description=names[id];b=record['localBounds'];center={'nm-bailey':[-10,2.5],'nm-moat':[-52,0],'nm-rampart':[-36,0],'nm-passage':[5,-25],'nm-transition':[-70,40]}[id]
 facilities.append({'id':id,'shortLabel':short,'name':name,'category':'C','reconstruction':True,'local':center,'height':shape.elevation(grid,*center),'sourceIds':['plan','mishima-moat','mishima-works'],'accuracy':'位置・寸法の地理参照精度UNKNOWN。対応基準点0、図面残差UNKNOWN。','description':description,'modelVersion':'phase2a-v1','modelObject':id,'crs':'EPSG:6676','localBounds':b,'evidenceParts':[{'part':'西ノ丸西堀が複列の障子堀であるという史料記事','sourceId':'plan','locator':'印刷p66（PDF74頁）表3-7','status':'source-statement; not a georeferenced B shape'},{'part':'位置・平面・高低差・モデル化','category':'C','status':'hypothesis; no measured control points'}],'alternatives':['基準点のある発掘図・測量図で位置と形を置換','1m現況格子を優先し平場の広さと方向を変更'],'articles':[]})
parts={
 'nm-bailey':[{'part':'西ノ丸の位置関係と曲輪としての記述','sourceId':'plan','locator':'印刷p66（PDF74頁）表3-7','status':'article only; no coordinate or footprint proof'}],
 'nm-moat':[{'part':'西ノ丸西堀の複列障子堀という記述','sourceId':'plan','locator':'印刷p66（PDF74頁）表3-7','status':'article only; no registered footprint'},{'part':'発掘断面一例の約35cm・1.8m・約58度','sourceId':'mishima-moat','locator':'本文および写真1の説明','status':'parameter reference; actual mesh simplified, not all sections measured'}],
 'nm-rampart':[{'part':'山中城の土塁の一般構成','sourceId':'mishima-works','locator':'3.発掘調査の成果 / 土塁','status':'general arrangement reference; no Nishinomaru-specific dimensions'}],
 'nm-passage':[{'part':'隣接する西櫓の虎口の記事','sourceId':'plan','locator':'印刷p66（PDF74頁）表3-7','status':'context only; must not transfer to Nishinomaru gate position'}],
 'nm-transition':[{'part':'現在の地形の参照','sourceId':'gsi','locator':'既存castle DEM / Web triangle surface','status':'current reference only, not 1590 ground'}]
}
for f in facilities:
 f['evidenceParts']=parts[f['id']]+[{'part':'位置・平面・高低差・モデル化','category':'C','status':'hypothesis; no measured control points'}]
 f['sourceIds']=list(dict.fromkeys(part['sourceId'] for part in parts[f['id']]))
(root/'public/data/nishinomaru.json').write_text(json.dumps({'version':1,'categoryCounts':{'B':0,'C':5},'origin':layout['origin'],'bounds':layout['bounds'],'facilities':facilities},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
