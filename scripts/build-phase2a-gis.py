"""Actual PyQGIS editing of phase1 project, DEM sampling, new vector/raster data.
Run through run-phase2a-native.mjs: native exit matters as well as assertions.
"""
import os,json,math,gc,importlib.util,datetime,hashlib
from pathlib import Path
os.environ['QT_QPA_PLATFORM']='offscreen'
from qgis.core import (QgsApplication,QgsProject,QgsVectorLayer,QgsRasterLayer,QgsField,QgsFeature,QgsGeometry,QgsPointXY,QgsVectorFileWriter,Qgis,QgsRectangle,QgsReferencedRectangle)
from qgis.PyQt.QtCore import QVariant
from qgis.PyQt.QtGui import QColor
from osgeo import gdal
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('shape',ROOT/'scripts/phase2a-shape.py'); s=importlib.util.module_from_spec(spec); spec.loader.exec_module(s)
g=json.loads((ROOT/'public/data/castle.json').read_text()); E0,N0=g['origin'][:2]
app=QgsApplication([],False);app.initQgis();p=QgsProject.instance()
assert p.read(str(ROOT/'production/yamanaka.qgz')); assert p.crs().authid()=='EPSG:6676'
out=ROOT/'production/phase2a';out.mkdir(exist_ok=True)
features=[('nm-bailey','西ノ丸 曲輪候補',s.PLATEAU),('nm-moat','西ノ丸 障子堀候補',s.MOAT),('nm-rampart','西ノ丸 土塁候補',s.shifted([-170,24,-114,82])),('nm-passage','虎口・通路候補',s.shifted([-134,10,-110,40])),('nm-transition','復元地形への接続',s.BOUNDS)]
vl=QgsVectorLayer('Polygon?crs=EPSG:6676','C hypothesis footprints (overlapping envelopes, not surveyed)','memory'); pr=vl.dataProvider()
pr.addAttributes([QgsField('facility_id',QVariant.String),QgsField('name',QVariant.String),QgsField('category',QVariant.String),QgsField('accuracy',QVariant.String),QgsField('a_min_m',QVariant.Double),QgsField('a_max_m',QVariant.Double),QgsField('c_center_m',QVariant.Double),QgsField('source_ids',QVariant.String)]);vl.updateFields();samples=[]
dem=next(l for l in p.mapLayers().values() if l.source().replace('\\','/').endswith('castle-dem-1m.tif'))
for id,name,b in features:
 corners=[(b[0],b[1]),(b[2],b[1]),(b[2],b[3]),(b[0],b[3]),(b[0],b[1])]
 vals=[]
 for e,n in corners[:-1]:
  h,ok=dem.dataProvider().sample(QgsPointXY(E0+e,N0+n),1);assert ok; vals.append(h)
 center=[(b[0]+b[2])/2,(b[1]+b[3])/2]
 f=QgsFeature(vl.fields());f.setGeometry(QgsGeometry.fromPolygonXY([[QgsPointXY(E0+e,N0+n) for e,n in corners]])); f.setAttributes([id,name,'C','UNKNOWN',min(vals),max(vals),s.elevation(g,*center),'plan,mishima-moat,mishima-works']);assert pr.addFeatures([f])[0]
 samples.append({'id':id,'localBounds':b,'measured1mCornerMin':min(vals),'measured1mCornerMax':max(vals),'hypothesisCenterHeight':s.elevation(g,*center)})
opts=QgsVectorFileWriter.SaveVectorOptions();opts.driverName='GPKG';opts.layerName='facility_envelopes'
gpkg=out/'facilities.gpkg'
if gpkg.exists(): gpkg.unlink()
result=QgsVectorFileWriter.writeAsVectorFormatV3(vl,str(gpkg),p.transformContext(),opts);assert result[0]==QgsVectorFileWriter.NoError,result
layer=QgsVectorLayer(str(gpkg),'C 仮定配置範囲 / accuracy UNKNOWN','ogr');assert layer.isValid();layer.renderer().symbol().setColor(QColor('#ad7148'));layer.setOpacity(.45);p.addMapLayer(layer)
# New inferred height raster; never overwrite measured GeoTIFFs.
b=s.BOUNDS;res=.5;cols=int((b[2]-b[0])/res);rows=int((b[3]-b[1])/res)
a=np.array([[s.elevation(g,b[0]+(c+.5)*res,b[3]-(r+.5)*res) for c in range(cols)] for r in range(rows)],dtype='float32')
path=out/'inferred-surface-50cm.tif';ds=gdal.GetDriverByName('GTiff').Create(str(path),cols,rows,1,gdal.GDT_Float32,options=['COMPRESS=DEFLATE']);ds.SetGeoTransform((E0+b[0],res,0,N0+b[3],0,-res));ds.SetProjection(dem.crs().toWkt());ds.GetRasterBand(1).WriteArray(a);ds=None
rl=QgsRasterLayer(str(path),'C 推定地表 0.5m計算格子 / 実測精度ではない');assert rl.isValid();p.addMapLayer(rl)
# Two cross sections saved as new data, with current and hypothesized heights.
profile=[]
for n in [40+s.SHIFT[1],65+s.SHIFT[1]]:
 for e in range(b[0],b[2]+1):
  actual,ok=dem.dataProvider().sample(QgsPointXY(E0+e,N0+n),1);assert ok
  profile.append({'localE':e,'localN':n,'A_1m':actual,'A_webTriangle':s.triangle_height(g,e,n),'C':s.elevation(g,e,n)})
(out/'profiles.json').write_text(json.dumps(profile,indent=2),encoding='utf8')
for l in p.mapLayers().values(): p.layerTreeRoot().findLayer(l.id()).setItemVisibilityChecked(l.id() in [layer.id(),rl.id()])
p.setTitle('Phase2A Nishinomaru C hypothesis / current A preserved');p.setFilePathStorage(Qgis.FilePathType.Relative);p.setPresetHomePath('.')
p.viewSettings().setDefaultViewExtent(QgsReferencedRectangle(QgsRectangle(E0+b[0]-15,N0+b[1]-15,E0+b[2]+15,N0+b[3]+15),p.crs()))
assert p.write(str(ROOT/'production/yamanaka-phase2a.qgz'))
meta={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'qgis':QgsApplication.qgisVersion() if hasattr(QgsApplication,'qgisVersion') else Qgis.QGIS_VERSION,'crs':'EPSG:6676','origin':[E0,N0],'bounds':b,'samples':samples,'rasterResolution':res,'controlPoints':0,'georeferenceResidual':'UNKNOWN; no measured common control points. C placement revised to DEM shoulder; old flank anchor is not survey evidence.','scope':'C hypothesis envelopes and derived surface, not survey polygons; raster resolution is computational','profileSamples':len(profile)}
(ROOT/'public/data/nishinomaru-layout.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf8')
vl=None;pr=None;layer=None;rl=None;l=None;dem=None;ds=None;p.clear();p=None;gc.collect();app.exitQgis();app=None;gc.collect()
meta['workerStatus']='CHECKS_AND_TEARDOWN_RETURNED'
Path(os.environ['PHASE2A_WORKER_OUTPUT']).write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf8')
print('QGIS phase2a data created; external runner must inspect actual exit',flush=True)
