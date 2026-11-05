"""Project-original western defence hypothesis; no historic map tracing.

Existing measured/reference geometry is read-only. Boundary samples use the
same float32 heights and triangles as castle.glb; interior changes are C.
"""
import json, math, struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOUNDS = [-205, -55, -80, 55]
STEP = 1.0
G = json.loads((ROOT/'public/data/castle.json').read_text(encoding='utf8'))

def f32(x): return struct.unpack('<f', struct.pack('<f', x))[0]
def clamp(x): return max(0, min(1, x))
def smooth(x):
    t = clamp(x)
    return t*t*(3-2*t)
def reference(e, n):
    c = (e-G['bounds'][0])/G['step']; r = (G['bounds'][3]-n)/G['step']
    c0 = min(G['cols']-2, max(0, math.floor(c))); r0 = min(G['rows']-2, max(0, math.floor(r)))
    u,v = c-c0,r-r0
    h00,h10,h01,h11 = [f32(x) for x in [G['heights'][r0][c0],G['heights'][r0][c0+1],G['heights'][r0+1][c0],G['heights'][r0+1][c0+1]]]
    return h00+u*(h10-h00)+v*(h01-h00) if u+v<=1 else h11+(1-u)*(h01-h11)+(1-v)*(h10-h11)
def rect(e,n,b,feather): return smooth(min(e-b[0],b[2]-e,n-b[1],b[3]-n)/feather)
def segment(e,n,a,b):
    dx,dy=b[0]-a[0],b[1]-a[1]
    t=clamp(((e-a[0])*dx+(n-a[1])*dy)/(dx*dx+dy*dy))
    return math.hypot(e-a[0]-t*dx,n-a[1]-t*dy)

def elevation(e,n):
    ref = reference(e,n)
    # Entire footprint and terrace levels are hypothetical, not surveyed.
    w = rect(e,n,BOUNDS,10)
    base = ref*(1-w)+(553+.07*(e+135)+.012*n)*w
    # Bailey, with a gentle drainage fall; shoulders remain gradual.
    pw = rect(e,n,[-157,-23,-103,33],8)
    base = base*(1-pw)+(553+.012*n)*pw
    # Soil ramparts. Deliberate 6m-wide southern entrance, no stone walls.
    d = min(segment(e,n,(-151,25),(-108,25)),segment(e,n,(-108,-15),(-108,25)))
    base += 2.1*clamp((4-d)/3)
    # One north-south ditch with transverse, unpaired ridges. Historical
    # descriptions distinguish Nishinomaru's alternating two-column moat;
    # the existing C model simplifies that feature to an aligned grid.
    mw = rect(e,n,[-180,-30,-158,34],3)
    cross = smooth(min(e+180,-158-e)/5.0)
    end = smooth(min(n+30,34-n)/5.0)
    # Seven standard cells plus one short southern connection cell: eight
    # actual model cells. Dimensions intentionally differ from city values.
    ridge_distance = min(abs(n-v) for v in [-24,-16,-8,0,8,16,24,32])
    ridge = 1.6*clamp(1-ridge_distance/1.5)
    base -= (6.5-ridge)*cross*end*mw
    return base

def component(e,n):
    if -180<=e<=-158 and -30<=n<=34: return 'wb-moat'
    if n<-25 or e<-184: return 'wb-gate'
    return 'wb-bailey'

def surface_height(e,n):
    # Interpolate exactly the 1m exported grid, not the continuous recipe.
    x0=math.floor(e);n0=math.floor(n);u=e-x0;v=n-n0
    a,b,c,d=[f32(elevation(x,y)) for x,y in [(x0,n0),(x0+1,n0),(x0,n0+1),(x0+1,n0+1)]]
    # Blender faces (a,b,d),(a,d,c): NE-SW diagonal in E/N.
    return a+(u-v)*(b-a)+v*(d-a) if u>=v else a+u*(d-a)+(v-u)*(c-a)

def produce():
    out=ROOT/'production/phase3b';out.mkdir(parents=True,exist_ok=True)
    common=dict(category='C',landscape=True,reconstruction=True,modelVersion='phase3b-v1',
        editor='production/yamanaka-phase3b.blend / production/phase3b/recipe.json',
        accuracy='UNKNOWN：史料図と地形の対応点未登録。位置・縮尺・向きは制作上の仮定。',
        direction='土の色むら、木材の経年、侵食模様はD相当の外観演出。形状Cの根拠とは別。')
    def element(id,name,local,role,assumptions,unknown):
        return dict(common,id=id,name=name,shortLabel=name,local=local,height=surface_height(*local),
            modelObject=id,sourceIds=['mishima-western'],role=role,description=role,
            assumptions=assumptions,unknown=unknown)
    elements=[
        element('wb-bailey','西櫓の曲輪・土塁・板塀',[-132,8],
            '西方の曲輪と土塁上の木造防御を推定模型で観察する。西櫓は曲輪の名称であり、建築の姿を確定しない。',
            '曲輪45×40m程度、土塁高2.1m、板塀高1.8mのC候補。市の柱穴・板塀推定を背景参照した独自配置。',
            '曲輪の実測対応、1590年の地表高、塀の全形・寸法・接合方法はUNKNOWN。'),
        element('wb-gate','西木戸口の門候補',[-191,-35],
            '城域西端の入口で、門柱・横木・扉・木柵による通路の絞りを理解する。既存西ノ丸の冠木門sc-gateとは別施設。',
            '幅4.2m、高3.6mの簡素な門と部分開放の扉をCで仮置き。南側通路を西櫓曲輪へ接続する。',
            '門の正確な位置・向き・構法・寸法・年代はUNKNOWN。'),
        element('wb-moat','西櫓堀の単列畝堀候補',[-169,5],
            '深い一本の溝を横切る畝が移動を妨げる。史料上の西ノ丸複列は左右交互の畝。既存C模型は格子状に簡略化しており、本候補の単列畝堀とは区別する。',
            '長さ64m、上面幅22m、最大切下げ6.5m、畝高1.6m、8mピッチの中央の標準7区画と南端接続部1区画（計8）。実測復元ではなく地形接続に合わせたC模型。',
            '実際の範囲・区画位置・深さ・方位・侵食履歴・1590年の表土はUNKNOWN。'),
        element('wb-building','西櫓の建物候補（上部構造未確定）',[-131,7],
            '掘立柱建物跡1棟という発掘成果を背景参照した、交換可能な木造上部構造のC候補。櫓の階数や屋根の確定復元ではない。',
            '8×6m、棟高5.8m、一層の切妻屋根を仮定。柱、梁、床、屋根を独立部材として保存し全体を個別に非表示にできる。',
            '柱穴の実測配置、階数、高さ、屋根形式、材種、用途、接合方法はUNKNOWN。')]
    stations=[
        dict(id='wb-bailey',elementId='wb-bailey',name='西櫓の曲輪上',eye=[-143,2],look=[-131,7],lookDown=.15),
        dict(id='wb-gate',elementId='wb-gate',name='西木戸口を正面から',eye=[-197,-35],look=[-191,-35],lookDown=-1.15,fov=60),
        dict(id='wb-moat',elementId='wb-moat',name='西櫓堀を見下ろす',eye=[-154,5],look=[-169,5],lookDown=6),
        dict(id='wb-earth',elementId='wb-moat',name='赤土と畝の近景',eye=[-156,-10],look=[-170,-10],lookDown=4),
        dict(id='wb-wood',elementId='wb-gate',name='西木戸口の木組み',eye=[-195,-32],look=[-192,-35],lookDown=-.2)]
    for station in stations:
        station['groundHeight']=surface_height(*station['eye'])
    recipe=dict(version=1,crs='EPSG:6676',origin=G['origin'],units='metres',bounds=BOUNDS,
        axes='Blender east,north,up; glTF east,up,south',license='MIT project-original primitives; no external textures or models',
        placement='C conceptual western extension; no control-point georeferencing; not a surveyed layout',
        referenceDimensions=dict(sourceId='mishima-western',scope='三島市1301の一般説明。模型の確定寸法や地理位置ではない。',
            ridgeHeightMetres=1.8,cells=10,cellTopMetres='8–9',cellBottomWidthMetres=2,cellBottomLengthMetres=5,slopeDegrees=55,depthMetres='9以上'),
        modelDimensions=dict(moatTopWidth=22,moatLength=64,maximumCut=6.5,ridgeHeight=1.6,ridgePitch=8,cells=8,
            cellCounting=dict(standardCells=7,southernConnectionCells=1,totalCells=8,
                definition='畝で分かれる中央の標準7区画と南端の短い接続部1区画を別に数える。参考史料の10区画とは別の模型寸法。'),
            baileyApprox=[45,40],rampartHeight=2.1,palisadeHeight=1.8,palisadePostTop=1.93,
            buildingPlan=[8,6],buildingRoofPlaneRidgeHeight=5.8,buildingOverallHeight=5.94,
            gateOpening=4.2,gateNominalHeight=3.6,gateOverallHeight=3.62),
        ground=dict(bounds=BOUNDS,step=STEP,cols=126,rows=111,order='rows south to north; vertices E,N,H; diagonal SW-NE'),
        elements=elements,stations=stations,overview=dict(target=[-142,553,0],eye=[-235,635,105]))
    (out/'recipe.json').write_text(json.dumps(recipe,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    (ROOT/'public/data/phase3b.json').write_text(json.dumps(recipe,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    return recipe

if __name__=='__main__': produce()
