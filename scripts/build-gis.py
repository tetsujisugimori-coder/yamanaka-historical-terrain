"""Run with installed QGIS Python. Downloads immutable GSI PNG cache, executes
QGIS Processing reprojection/derivatives and saves a portable editable project.
No survey/report images are redistributed. Network retrieval has no fallback.
"""
import os, sys, json, math, hashlib, urllib.request, concurrent.futures, datetime
from pathlib import Path
os.environ['QT_QPA_PLATFORM']='offscreen'
from qgis.core import (QgsApplication,QgsProject,QgsCoordinateReferenceSystem,
 QgsCoordinateTransform,QgsPointXY,QgsRasterLayer,QgsVectorLayer,QgsFeature,
 QgsGeometry,QgsField,QgsMarkerSymbol,QgsSingleSymbolRenderer,QgsColorRampShader,QgsRasterShader,QgsSingleBandPseudoColorRenderer)
from qgis.PyQt.QtCore import QVariant
from qgis.PyQt.QtGui import QColor,QPainter
from osgeo import gdal, osr
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
for d in ['data/raw','production/gis','public/data','evidence']: (ROOT/d).mkdir(parents=True,exist_ok=True)
app=QgsApplication([],False); app.initQgis()
sys.path.append(str(Path(QgsApplication.prefixPath())/'python/plugins'))
import processing
from processing.core.Processing import Processing
Processing.initialize()
project=QgsProject.instance(); target=QgsCoordinateReferenceSystem('EPSG:6676'); project.setCrs(target)
ll=QgsCoordinateReferenceSystem('EPSG:4326')
forward=QgsCoordinateTransform(ll,target,project); reverse=QgsCoordinateTransform(target,ll,project)
ORIGIN=(138.99242,35.15640); origin=forward.transform(QgsPointXY(*ORIGIN)); E0,N0=origin.x(),origin.y()
ledger=[]
def tile_xy(lon,lat,z):
 n=2**z; return int((lon+180)/360*n),int((1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n)
def tile(spec):
 layer,z,x,y=spec; url=f'https://cyberjapandata.gsi.go.jp/xyz/{layer}/{z}/{x}/{y}.png'
 path=ROOT/f'data/raw/{layer}-{z}-{x}-{y}.png'
 if not path.exists(): raise FileNotFoundError(f'Run node scripts/fetch-data.mjs first: {path}')
 ds=gdal.Open(str(path)); rgb=ds.ReadAsArray()[:3].astype(np.int32); u=rgb[0]*65536+rgb[1]*256+rgb[2]
 valid=u!=8388608; a=np.where(valid,np.where(u<8388608,u,u-16777216)*.01,-9999).astype('float32')
 rec={'url':url,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size,'valid':int(valid.sum()),'total':65536}
 return spec,a,rec
def mosaic(layer,z,bbox,name):
 west,south,east,north=bbox; x0,y0=tile_xy(west,north,z); x1,y1=tile_xy(east,south,z)
 specs=[(layer,z,x,y) for y in range(y0,y1+1) for x in range(x0,x1+1)]
 a=np.full(((y1-y0+1)*256,(x1-x0+1)*256),-9999,dtype='float32')
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  for (l,zz,x,y),b,rec in pool.map(tile,specs):
   a[(y-y0)*256:(y-y0+1)*256,(x-x0)*256:(x-x0+1)*256]=b; ledger.append(rec)
 span=40075016.68557849/2**z; res=span/256
 out=ROOT/f'data/raw/{name}-mercator.tif'
 ds=gdal.GetDriverByName('GTiff').Create(str(out),a.shape[1],a.shape[0],1,gdal.GDT_Float32,options=['COMPRESS=DEFLATE'])
 ds.SetGeoTransform((-20037508.342789244+x0*span,res,0,20037508.342789244-y0*span,0,-res))
 s=osr.SpatialReference(); s.ImportFromEPSG(3857); ds.SetProjection(s.ExportToWkt()); ds.GetRasterBand(1).SetNoDataValue(-9999); ds.GetRasterBand(1).WriteArray(a); ds=None
 print(name,len(specs),'tiles',flush=True); return out,len(specs)
wide,wide_tiles=mosaic('dem5a_png',15,[138.968,35.136,139.018,35.176],'regional-5a')
detail,detail_tiles=mosaic('dem1a_png',17,[138.988,35.150,139.000,35.161],'castle-1a')
alternative,alternative_tiles=mosaic('dem_png',14,[138.968,35.136,139.018,35.176],'regional-10b')
# Explicit 10m alternative availability probe; not silently mixed into 5A/1A.
probe=tile(('dem_png',14,*tile_xy(*ORIGIN,14)))
def warp(src,name,bounds,res):
 out=ROOT/f'production/gis/{name}.tif'
 extent=f'{E0+bounds[0]},{E0+bounds[2]},{N0+bounds[1]},{N0+bounds[3]} [EPSG:6676]'
 result=processing.run('gdal:warpreproject',{'INPUT':str(src),'SOURCE_CRS':QgsCoordinateReferenceSystem('EPSG:3857'),'TARGET_CRS':target,'RESAMPLING':1,'NODATA':-9999,'TARGET_RESOLUTION':res,'OPTIONS':'COMPRESS=DEFLATE','DATA_TYPE':6,'TARGET_EXTENT':extent,'TARGET_EXTENT_CRS':target,'MULTITHREADING':False,'EXTRA':'','OUTPUT':str(out)})
 layer=QgsRasterLayer(str(out),name); assert layer.isValid(); project.addMapLayer(layer)
 return out
primary=warp(wide,'regional-5a-20m',[-2000,-2000,2000,2000],20)
fallback=warp(alternative,'regional-10b-20m',[-2000,-2000,2000,2000],20)
src=gdal.Open(str(primary)); a=src.ReadAsArray(); b=gdal.Open(str(fallback)).ReadAsArray(); missing=a==-9999
assert np.all(b[missing]!=-9999),'No invented replacement heights'
regional=ROOT/'production/gis/regional-dem-20m.tif'
out=gdal.GetDriverByName('GTiff').CreateCopy(str(regional),src,options=['COMPRESS=DEFLATE']); out.GetRasterBand(1).WriteArray(np.where(missing,b,a)); out=None
mask_path=ROOT/'production/gis/regional-source-mask.tif'; out=gdal.GetDriverByName('GTiff').Create(str(mask_path),a.shape[1],a.shape[0],1,gdal.GDT_Byte,options=['COMPRESS=DEFLATE']); out.SetGeoTransform(src.GetGeoTransform()); out.SetProjection(src.GetProjection()); out.GetRasterBand(1).WriteArray(np.where(missing,10,5)); out=None; src=None
project.addMapLayer(QgsRasterLayer(str(regional),'Regional DEM: 5A + explicitly masked 10B gaps'))
project.addMapLayer(QgsRasterLayer(str(mask_path),'Source provenance: 5=DEM5A, 10=DEM10B'))
castle=warp(detail,'castle-dem-1m',[-350,-650,650,450],1)
hill=ROOT/'production/gis/hillshade.tif'; slope=ROOT/'production/gis/slope-degrees.tif'
processing.run('gdal:hillshade',{'INPUT':str(regional),'BAND':1,'Z_FACTOR':1,'SCALE':1,'AZIMUTH':315,'ALTITUDE':45,'COMPUTE_EDGES':True,'ZEVENBERGEN':False,'MULTIDIRECTIONAL':False,'OPTIONS':'COMPRESS=DEFLATE','OUTPUT':str(hill)})
processing.run('gdal:slope',{'INPUT':str(regional),'BAND':1,'SCALE':1,'AS_PERCENT':False,'COMPUTE_EDGES':True,'ZEVENBERGEN':False,'OPTIONS':'COMPRESS=DEFLATE','OUTPUT':str(slope)})
for p in [hill,slope]: project.addMapLayer(QgsRasterLayer(str(p),p.stem))
def grid(path,bounds,step,name):
 ds=gdal.Open(str(path)); gt=ds.GetGeoTransform(); a=ds.ReadAsArray(); rows=[]
 xs=np.arange(bounds[0],bounds[2]+.01,step); ns=np.arange(bounds[3],bounds[1]-.01,-step)
 for n in ns:
  row=[]
  for e in xs:
   c=(E0+e-gt[0])/gt[1]-.5; r=(N0+n-gt[3])/gt[5]-.5
   c=min(max(c,0),a.shape[1]-1); r=min(max(r,0),a.shape[0]-1)
   c0,r0=int(c),int(r); c1,r1=min(c0+1,a.shape[1]-1),min(r0+1,a.shape[0]-1)
   v=a[r0,c0]*(1-c+c0)*(1-r+r0)+a[r0,c1]*(c-c0)*(1-r+r0)+a[r1,c0]*(1-c+c0)*(r-r0)+a[r1,c1]*(c-c0)*(r-r0)
   assert v>-1000,'Missing terrain is not fabricated'; row.append(round(float(v),2))
  rows.append(row)
 result={'name':name,'crs':'EPSG:6676','origin':[E0,N0,0],'bounds':bounds,'step':step,'cols':len(xs),'rows':len(ns),'heights':rows,'min':min(map(min,rows)),'max':max(map(max,rows)),'source':'GSI '+('DEM1A PNG' if name=='castle' else 'DEM5A PNG + DEM10B masked gaps'),'vertical':'GSI published orthometric height, m; no ellipsoid conversion; measurement epoch/individual datum revision UNKNOWN','webAxes':'x=E-E0, y=H, z=-(N-N0)'}
 (ROOT/f'public/data/{name}.json').write_text(json.dumps(result,separators=(',',':')),encoding='utf-8'); return result
wg=grid(regional,[-2000,-2000,2000,2000],20,'regional')
cg=grid(castle,[-350,-650,650,450],5,'castle')
def sample(g,e,n):
 c=min(max(round((e-g['bounds'][0])/g['step']),0),g['cols']-1); r=min(max(round((g['bounds'][3]-n)/g['step']),0),g['rows']-1)
 return g['heights'][r][c]
# Approximate observation anchors, NOT surveyed facility footprints. No invented enclosure geometry.
features=[
 {'id':'castle','name':'山中城の立地','lon':ORIGIN[0],'lat':ORIGIN[1],'category':'A','sourceIds':['gsi','mishima-overview','plan'],'accuracy':'地点案内用の概略位置。遺構境界・測量基準点ではない。','description':'急な谷に挟まれた尾根を使い、箱根越えの道を城内へ取り込む。小田原の西を守る拠点だった。現在の地形で立地を読み、当時の地表との違いを残す。'},
 {'id':'west','name':'西ノ丸・障子堀を読む','lon':138.99085,'lat':35.15685,'category':'C','sourceIds':['mishima-moat','plan'],'accuracy':'概略案内アンカー（位置精度UNKNOWN）。堀の座標復元は未実施。','description':'堀内に掘り残した細い畝が進路を区切る。現在の芝・保護盛土の平たい畝と、発掘直後の細く丸い畝を同一視しない。別表示の断面教材は資料の数値を用い、現地の全形を復元してはいない。'},
 {'id':'south','name':'岱崎出丸方面','lon':138.9944,'lat':35.1521,'category':'C','sourceIds':['mishima-overview','plan'],'accuracy':'概略案内アンカー。形状と境界はUNKNOWN。','description':'南へ延びる尾根と視界を観察する。城の外縁と交通路の関係を読み取る入口。門・柵・兵の配置は証拠が不足するため描いていない。'},
 {'id':'route','name':'箱根越えの交通路','lon':138.9950,'lat':35.1551,'category':'D','sourceIds':['plan'],'accuracy':'方向関係だけを示す模式線。戦国期の道路中心線ではない。','description':'山越えの交通を押さえる位置に城がある。点線は箱根・小田原側と三島側の関係を説明する演出で、現存旧東海道や1590年の道幅・正確な線形を表していない。'}]
for f in features:
 p=forward.transform(QgsPointXY(f['lon'],f['lat'])); f['local']=[round(p.x()-E0,3),round(p.y()-N0,3)]; f['height']=sample(cg if f['id']!='route' else wg,*f['local'])
(ROOT/'public/data/features.json').write_text(json.dumps(features,ensure_ascii=False,indent=2),encoding='utf-8')
vl=QgsVectorLayer('Point?crs=EPSG:6676','Observation anchors — approximate, not surveyed','memory'); pr=vl.dataProvider(); pr.addAttributes([QgsField('id',QVariant.String),QgsField('name',QVariant.String),QgsField('evidence',QVariant.String)]); vl.updateFields()
for f in features:
 feat=QgsFeature(vl.fields()); feat.setGeometry(QgsGeometry.fromPointXY(QgsPointXY(E0+f['local'][0],N0+f['local'][1]))); feat.setAttributes([f['id'],f['name'],f['category']]); pr.addFeatures([feat])
# Save anchors as GeoJSON so project does not depend on memory layers.
from qgis.core import QgsVectorFileWriter
opts=QgsVectorFileWriter.SaveVectorOptions(); opts.driverName='GeoJSON'; anchor_path=str(ROOT/'production/gis/observation-anchors.geojson')
QgsVectorFileWriter.writeAsVectorFormatV3(vl,anchor_path,project.transformContext(),opts); project.addMapLayer(QgsVectorLayer(anchor_path,'Approximate observation anchors','ogr'))
project.viewSettings().setDefaultViewExtent(__import__('qgis.core',fromlist=['QgsReferencedRectangle']).QgsReferencedRectangle(QgsRasterLayer(str(regional),'r').extent(),target))
project.setFilePathStorage(__import__('qgis.core',fromlist=['Qgis']).Qgis.FilePathType.Relative)
project.setTitle('Yamanaka — current GSI terrain / inferred geometry kept separate')
project.setPresetHomePath('.')
for layer in project.mapLayers().values():
 node=project.layerTreeRoot().findLayer(layer.id()); node.setItemVisibilityChecked(layer.source() in [str(regional),anchor_path])
 if isinstance(layer,QgsRasterLayer) and layer.source() in [str(regional),str(castle)]:
  ramp=QgsColorRampShader(); ramp.setColorRampType(QgsColorRampShader.Interpolated); ramp.setColorRampItemList([QgsColorRampShader.ColorRampItem(v,QColor(c),str(v)+' m') for v,c in [(200,'#466449'),(400,'#899d67'),(600,'#b3b580'),(820,'#d9d2a5')]])
  shader=QgsRasterShader(); shader.setRasterShaderFunction(ramp); layer.setRenderer(QgsSingleBandPseudoColorRenderer(layer.dataProvider(),1,shader))
metadata=project.metadata(); metadata.setTitle('Yamanaka current terrain study'); metadata.setAuthor(''); metadata.setAbstract('Current GSI elevation tiles transformed to EPSG:6676. Observation anchors are approximate, not surveyed facility outlines. 5A gaps explicitly replaced by 10B; source-mask values 5/10. Historical surface and individual vertical revision remain UNKNOWN.'); project.setMetadata(metadata)
assert project.write(str(ROOT/'production/yamanaka.qgz'))
roundtrips=[]
for lon,lat in [ORIGIN,(138.988,35.150),(139,35.161),(138.968,35.136),(139.018,35.176)]:
 p=forward.transform(QgsPointXY(lon,lat)); q=reverse.transform(p); err=math.hypot((q.x()-lon)*91000,(q.y()-lat)*111000); roundtrips.append({'lon':lon,'lat':lat,'E':p.x(),'N':p.y(),'roundTripMetres':err})
meta={'generatedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'qgis':'3.44.10','originLonLat':ORIGIN,'originProjected':[E0,N0],'crs':'EPSG:6676','regionalTiles':wide_tiles,'castleTiles':detail_tiles,'alternativeTiles':alternative_tiles,'fallback10BCells':int(missing.sum()),'tiles':ledger,'roundTrips':roundtrips,'grid':{g['name']:{k:g[k] for k in ['min','max','cols','rows','step','bounds']} for g in [wg,cg]},'noDataPixels':{p.name:int((gdal.Open(str(p)).ReadAsArray()==-9999).sum()) for p in [regional,castle]},'accuracy':'PNG encoding is 0.01m, not measurement accuracy. Source measurement epochs and current datum revision UNKNOWN; do not infer archaeological microrelief from interpolation.'}
(ROOT/'evidence/gis-build.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in meta.items() if k!='tiles'},ensure_ascii=False),flush=True)
project.clear(); app.exitQgis()
