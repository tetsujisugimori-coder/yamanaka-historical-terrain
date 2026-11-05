"""Editable, deterministic primitive recipe. All assets are project-original MIT."""
import json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
elements=[
 dict(id='sc-palisade',name='土塁上の木柵候補',category='C',role='防御境界と見通しを示す。',sourceIds=['mishima-works'],assumptions='土塁天端に高さ1.8m、約2m間隔の丸太と横木を仮配置。柱穴の証拠は未確認。',unknown='1590年の木柵の有無、位置、材、寸法はUNKNOWN。',direction='形を読みやすくする木色。',local=[-36,12]),
 dict(id='sc-gate',name='虎口の門候補',category='C',role='曲輪への入口と防御境界を示す。',sourceIds=['plan'],assumptions='既存C通路の開口に幅5mの簡素な冠木門を仮配置。隣接曲輪の史料を位置証拠にしない。',unknown='門の実在、位置、構法、年代はUNKNOWN。',direction='屋根や史実未確認の装飾は加えない。',local=[5,-22]),
 dict(id='sc-vegetation',name='周辺の樹木と低木',category='C',role='山城の外縁と開けた曲輪の対比を示す。',sourceIds=['gsi'],assumptions='現況地形を足場に樹木を外周へ疎配置。防御施設の近くを開ける景観仮説。',unknown='1590年の樹種、密度、伐採範囲はUNKNOWN。現況植生の復元ではない。',direction='独自の簡略樹冠、季節は初春の常緑を想定。',local=[-74,35]),
 dict(id='sc-flags',name='旗の創作演出',category='D',role='風向きと人の活動を感じるための目印。',sourceIds=[],assumptions='位置、枚数、無地の生成りと朱色の布は創作。所属や家紋を示さない。',unknown='1590年当日の旗の色、意匠、位置はUNKNOWN。',direction='静止した布のふくらみを表現。連続アニメーションなし。',local=[-28,18]),
 dict(id='sc-people',name='人物の創作演出',category='D',role='身長を手がかりに地形と施設の大きさを読む。',sourceIds=[],assumptions='身長約1.65mの簡略人物を曲輪と入口へ配置。',unknown='実在人物、人数、装束、行動はUNKNOWN。',direction='特定の人物や戦闘場面を再現しない静止シルエット。',local=[-15,4]),
]
for e in elements:
 e.update(shortLabel=e['name'],landscape=True,reconstruction=True,height=575.17,description=e['role'],accuracy=e['unknown'],modelObject=e['id'],modelVersion='landscape-v1',editor='production/yamanaka-1590.blend / production/landscape/recipe.json')
parts=[]
def part(id,kind,at,size,color,rotation=0):parts.append(dict(element=id,kind=kind,at=at,size=size,color=color,rotation=rotation))
wood='#65503a'; lightwood='#a0875b'
# Perimeter follows the existing hypothetical C earthwork; no surface edits.
for e,n,along in [(-36,n,False) for n in range(-19,30,2)]+[(e,28,True) for e in range(-34,13,2)]+[(e,-23,True) for e in range(-34,1,2)]:
 part('sc-palisade','cylinder',[e,n,0],[.14,1.8,.14],wood)
 if along:part('sc-palisade','box',[e+1,n,.6],[2.1,.14,.14],lightwood)
 else:part('sc-palisade','box',[e,n+1,.6],[.14,.14,2.1],lightwood)
for e in [2.2,7.8]:part('sc-gate','cylinder',[e,-22,0],[.24,3.6,.24],wood)
part('sc-gate','box',[5,-22,3.15],[6.5,.45,.5],wood)
for e in [2.2,7.8]:part('sc-gate','box',[e,-22,.5],[.18,2.7,1.2],lightwood)
for i in range(54):
 a=i*2.399963; r=70+(i%5)*4;e=-22+math.cos(a)*r;n=4+math.sin(a)*r
 # Avoid the inferred plateau/moat and the observation area.
 if -68<e<24 and -40<n<40:continue
 height=5+(i%4)*1.2
 part('sc-vegetation','cylinder',[e,n,0],[.22,height*.7,.22],wood)
 part('sc-vegetation','cone',[e,n,height*.28],[2.5+(i%3)*.4,height,2.5+(i%3)*.4],['#3e5840','#536947','#657451'][i%3])
for e,n in [(-28,18),(-29,-12),(8,21),(0,-18)]:
 part('sc-flags','cylinder',[e,n,0],[.07,5,.07],wood)
 part('sc-flags','flag',[e+.65,n,2.3],[1.2,2.3,.1],'#c7b990' if n>0 else '#a24b32')
for e,n in [(-15,4),(-12,6),(3,-16),(8,-28)]:
 part('sc-people','cone',[e,n,.5],[.32,.85,.26],'#4b5150')
 part('sc-people','sphere',[e,n,1.3],[.17,.18,.17],'#ac8b68')
 for dx in [-.13,.13]:part('sc-people','cylinder',[e+dx,n,0],[.07,.6,.07],wood)
recipe=dict(version=1,crs='EPSG:6676',origin=[44862.121277226666,-93478.07235405142,0],units='metres',axes='recipe east,north,base offset up; Blender east,north,up; glTF east,up,south',license='MIT; original primitives; no external images/models',elements=elements,parts=parts,stations=[dict(id='bailey',name='曲輪に立つ',eye=[-18,5],look=[5,-22],lookDown=.3),dict(id='bank',name='土塁の内側',eye=[-28,12],look=[-36,15],lookDown=.3),dict(id='moat',name='障子堀を見下ろす',eye=[-39,-10],look=[-56,-10],lookDown=3.2),dict(id='passage',name='虎口の通路',eye=[5,-30],look=[5,-18],lookDown=.3)])
recipe['surfaceCaptions']={id:dict(role=role,assumptions=assumption,unknown='1590年の地表材、植被、摩耗状態はUNKNOWN。現況Aや史料Bの表面を再現したものではない。',direction='土色と草色を斜面・施設・仮の踏み跡で塗り分け。頂点位置と断面数値は既存Cのまま。外部テクスチャなし。',editor='既存production/yamanaka-phase2a.blend / src/landscape.js') for id,role,assumption in [('nm-bailey','平場での活動空間を示す。','草地と裸地、南北の踏み跡はCの表面表現。'),('nm-moat','格子状の畝と堀底の高低差を示す。','畝の側面を土、堀底を草色に表す。実際の1590年の植生は未確認。'),('nm-rampart','曲輪を囲う土の防御線。','法面を土、天端を草色とする推定。'),('nm-passage','入口と曲輪をつなぐ候補地形。','摩耗した裸地と仮定。史実の通行経路ではない。'),('nm-transition','推定区域と外周の地形をつなぐ。','外周の植被は便宜的な草色。現在の地形を1590年の確定景観としない。')]}
(ROOT/'production/landscape').mkdir(exist_ok=True)
(ROOT/'production/landscape/recipe.json').write_text(json.dumps(recipe,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(ROOT/'public/data/landscape.json').write_text(json.dumps({k:v for k,v in recipe.items() if k!='parts'},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
