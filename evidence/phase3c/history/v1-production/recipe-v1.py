"""Project-original C inner defence terrain, never a surveyed reconstruction."""
import json,math,struct,runpy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
G=json.loads((ROOT/'public/data/castle.json').read_text())
wb=runpy.run_path(str(ROOT/'scripts/phase3b-recipe.py'))
nm=runpy.run_path(str(ROOT/'scripts/phase2a-shape.py'))
BOUNDS=[-100,-45,-68,50];STEP=1.0
f32=wb['f32'];clamp=wb['clamp'];smooth=wb['smooth']
def old_height(e,n):
    if e<=-80:return wb['surface_height'](e,n)
    x=math.floor(e*4)/4;y=math.floor(n*4)/4;u=(e-x)*4;v=(n-y)*4
    a,b,c,d=[f32(nm['elevation'](G,xx,yy)) for xx,yy in [(x,y),(x+.25,y),(x,y+.25),(x+.25,y+.25)]]
    return a+(u-v)*(b-a)+v*(d-a) if u>=v else a+u*(d-a)+(v-u)*(c-a)
def elevation(e,n):
    h=old_height(e,n);w=wb['rect'](e,n,BOUNDS,4)
    # Two cuttings leave a continuous east-west earth neck, no floating floor.
    cut=max(smooth(1-abs(n+41)/3),smooth(1-abs(n+29)/3))*smooth(min(e+96,-70-e)/4)
    h-=3*cut*w
    # Narrow flanking banks form an opening; not the existing sc-gate or wb-gate.
    banks=max(0,1-abs(e+77)/3)*max(smooth(1-abs(n+39)/2),smooth(1-abs(n+31)/2))
    h+=2.3*banks*w
    # The lookout is an earth high point, NOT evidence of a tower building.
    rw=smooth(1-math.hypot((e+76)/6,(n-36)/8))
    h=h*(1-rw)+(old_height(-76,36)+2.5)*rw
    return h

def surface_height(e,n):
    x=min(BOUNDS[2]-1,max(BOUNDS[0],math.floor(e)));y=min(BOUNDS[3]-1,max(BOUNDS[1],math.floor(n)))
    if x in [BOUNDS[0],BOUNDS[2]-1] or y in [BOUNDS[1],BOUNDS[3]-1]:
        corners=[(x,y),(x+1,y),(x+1,y+1),(x,y+1)];ring=[]
        for k,a in enumerate(corners):
            z=corners[(k+1)%4]
            edge=(a[0]==z[0] and a[0] in [BOUNDS[0],BOUNDS[2]]) or (a[1]==z[1] and a[1] in [BOUNDS[1],BOUNDS[3]])
            div=4 if edge else 1
            for j in range(div):ring.append((a[0]+(z[0]-a[0])*j/div,a[1]+(z[1]-a[1])*j/div))
        a=(x+.5,y+.5)
        for k,c in enumerate(ring):
            d=ring[(k+1)%len(ring)];den=(c[0]-a[0])*(d[1]-a[1])-(d[0]-a[0])*(c[1]-a[1])
            u=((e-a[0])*(d[1]-a[1])-(d[0]-a[0])*(n-a[1]))/den;v=((c[0]-a[0])*(n-a[1])-(e-a[0])*(c[1]-a[1]))/den
            if u>=-1e-8 and v>=-1e-8 and u+v<=1+1e-8:
                h0,h1,h2=[f32(elevation(*p)) for p in [a,c,d]];return h0+u*(h1-h0)+v*(h2-h0)
        raise ValueError('point outside patch')
    u=(e-x)/STEP;v=(n-y)/STEP
    a,b,c,d=[f32(elevation(xx,yy)) for xx,yy in [(x,y),(x+STEP,y),(x,y+STEP),(x+STEP,y+STEP)]]
    return a+(u-v)*(b-a)+v*(d-a) if u>=v else a+u*(d-a)+(v-u)*(c-a)
def component(e,n):
    return 'ic-lookout' if n>15 else 'ic-koguchi' if e>-82 and n<-23 else 'ic-bridge'
def produce():
    out=ROOT/'production/phase3c';out.mkdir(parents=True,exist_ok=True)
    common=dict(category='C',landscape=True,reconstruction=True,modelVersion='phase3c-v1',editor='production/yamanaka-phase3c.blend / production/phase3c/recipe.json',sourceIds=['mishima-inner','plan'],accuracy='UNKNOWN：基準点0。現地位置・向き・年代別形状を確定していない。',direction='形状C。土色・草・凹凸・光影Dは別管理。',unknown='実測座標、1590年の断面・勾配・材質・寸法、現地との図面対応はUNKNOWN。',referenceDimensions={'widthMetres':'UNKNOWN','heightMetres':'UNKNOWN','slopeDegrees':'UNKNOWN'},supportScope='1301の調査対象名称は存在・調査履歴の根拠。具体的な位置・形状・西櫓との接続形式の証明ではない。',sourcePage='1301 HTML 発掘調査年度表; 保存活用計画 印刷p102（木橋接続不明）',dating='昭和50・51年度調査対象として確認。個別形状の1590年帰属はUNKNOWN。')
    specs=[('ic-lookout','西ノ丸見張台の高所候補',[-76,36],'高所と周囲の斜面が見通しを変える。見張台という名から櫓建物を置かない。','既存C余白に幅12m・奥行16m・中心追加高2.5mの土の高所を仮置き。',{'footprint':[12,16],'centreAddedHeight':2.5}),('ic-bridge','西ノ丸・西櫓方面の土橋候補',[-88,-35],'両側の切下げに挟まれた土の通路を観察する。西櫓への接続形式は確定していない。','西方への比較用通路候補。中心線N=-35m、模型上の平坦な通路幅6m、両側最大切下げ3m。東西の旧C高低差を維持。',{'cutLength':26,'clearNeckWidth':6,'maximumCut':3,'axis':'east-west'}),('ic-koguchi','見張台側虎口の候補',[-77,-35],'土塁で視線が狭まる入口を外側・内側から比べる。既存冠木門・西木戸口とは別の候補。','模型の土橋東側に4m幅の開口と高さ最大2.3mの土塁を仮置き。位置・方向は史料で確定せず。',{'clearOpening':4,'maximumBankAddition':2.3})]
    elements=[]
    for id,name,local,role,assumptions,dims in specs:elements.append(dict(common,id=id,name=name,shortLabel=name,modelObject=id,local=local,height=surface_height(*local),role=role,description=role,assumptions=assumptions,modelDimensions=dims))
    stations=[]
    for id,eid,name,eye,look,note in [('ic-lookout','ic-lookout','見張台の土の高所',[-76,36],[-88,30],'高所の縁と西側の低地を見比べる。櫓の存在は未確定。'),('ic-bridge','ic-bridge','土橋の西側',[-91,-35],[-72,-35],'両側の堀と狭い土の道。通行可能性は研究・戦闘データではない。'),('ic-koguchi','ic-koguchi','虎口の外側',[-79,-35],[-76,-35],'両脇の土塁による見通しの絞りを見る。'),('ic-koguchi-inside','ic-koguchi','虎口の内側',[-73,-35],[-89,-35],'外側と逆向きに見て土塁の遮り方を比べる。')]:
        stations.append(dict(id=id,elementId=eid,name=name,eye=eye,look=look,lookDown=0,eyeHeight=1.7,fov=60,groundHeight=surface_height(*eye),direction=note,category='C',support='actual phase3c triangle mesh; selected eye slope checked separately',transition='instant observation relocation; NOT a continuous walk or historic navigability claim'))
    for id,eid,name,eye,look,note in [('ic-station-nishinomaru','nm-bailey','西ノ丸の曲輪',[-20,5],[-36,15],'曲輪から土塁と堀の向こうを見比べる。'),('ic-station-western','wb-bailey','西櫓の曲輪',[-143,2],[-131,7],'曲輪内から土塁と木造候補を観察する。'),('ic-station-westgate','wb-gate','西木戸口',[-195,-35],[-191,-35],'西端の門候補による道幅の絞りを見る。'),('ic-station-westmoat','wb-moat','西櫓堀の外縁',[-154,5],[-169,5],'単列の畝と堀底の高低差を見る。')]:
        height=wb['surface_height'](*eye) if eye[0]<-80 else old_height(*eye)
        st=dict(id=id,elementId=eid,name=name,eye=eye,look=look,lookDown=4 if eid=='wb-moat' else 0,eyeHeight=1.7,fov=60,groundHeight=height,direction=note,category='C',support='actual previous C surface; not new geometry',transition='instant relocation, not walking')
        if eid=='nm-bailey':stations.insert(0,st)
        else:stations.append(st)
    source=dict(id='mishima-inner' ,title='三島市：山中城跡環境整備事業（西ノ丸見張台・土橋・見張台虎口の調査履歴）',url='https://www.city.mishima.shizuoka.jp/page/1301.html',year='更新2026-02-05 / 閲覧2026-11-05 UTC',use='昭和50年度に見張台・土橋、51年度に見張台虎口が調査対象。名称と調査履歴のみを根拠にする。',terms='事実の独自要約とリンクのみ。本文・写真・図面・PDFは再配布しない。',accuracy='個別寸法、方位、接続形式、基準点対応はUNKNOWN。名称から上部建物を推定しない。')
    recipe=dict(version=1,crs='EPSG:6676',origin=G['origin'],units='metres',axes='Blender east,north,up; glTF east,up,south',bounds=BOUNDS,license='MIT project-original primitives; no external assets',placement='C conceptual alternative on existing transition margins, no surveyed control points',ground=dict(bounds=BOUNDS,step=STEP,cols=33,rows=96,rasterStep=.25,boundaryStep=.25,triangulation='1m interior SW-NE; boundary cell centre fans with .25m external segments',order='south to north; diagonal SW-NE',replaces=['wb surface transition margin','nm-transition']),elements=elements,stations=stations,sources=[source],overview=dict(target=[-84,570,0],eye=[-145,625,65]),simulation={'exported':False,'navigability':'UNKNOWN; observation supports are not walkability evidence'},sourceCautions=['保存活用計画p102：西ノ丸・西櫓の木橋接続は橋脚柱穴未検出により不明。土橋名をこの接続形式の証拠にしない。','見張台は高所名称。櫓建物は追加しない。','保存活用計画p102では現地の見張台上・土塁は立入禁止。仮想観察は現地通行案内ではない。'],referenceDimensions={'all':'UNKNOWN; no dimension extracted for these three features'},modelDimensions={x['id']:x['modelDimensions'] for x in elements})
    for path in [out/'recipe.json',ROOT/'public/data/phase3c.json']:path.write_text(json.dumps(recipe,ensure_ascii=False,indent=2)+'\n')
    return recipe
if __name__=='__main__':produce()
