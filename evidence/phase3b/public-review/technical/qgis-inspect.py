import os,json,gc
os.environ['QT_QPA_PLATFORM']='offscreen'
from pathlib import Path
from qgis.core import QgsApplication,QgsProject
from osgeo import gdal
R=Path(__file__).resolve().parents[4];O=Path(__file__).resolve().parent
app=QgsApplication([],False);app.initQgis();project=QgsProject.instance()
assert project.read(str(R/'production/yamanaka-1590.qgz'))
original={x.id():x.source() for x in project.mapLayers().values()}
project.clear();assert project.read(str(R/'production/yamanaka-phase3b.qgz'))
layers=[dict(id=x.id(),name=x.name(),crs=x.crs().authid(),valid=x.isValid(),source=x.source().replace(str(R).replace('\\','/'),'[workspace]').replace(str(R),'[workspace]')) for x in project.mapLayers().values()]
preserved=all(project.mapLayer(k) and project.mapLayer(k).source()==v for k,v in original.items())
assert len(layers)==16 and len(original)==12 and preserved and all(x['valid'] for x in layers)
assert project.crs().authid()=='EPSG:6676'
ds=gdal.Open(str(R/'production/phase3b/surface-candidate-1m.tif'));gt=ds.GetGeoTransform();a=ds.ReadAsArray();values=[]
meta=json.loads((R/'public/data/phase3b.json').read_text(encoding='utf8'));E,N=meta['origin'][:2]
station_layer=next(x for x in project.mapLayers().values() if x.source().replace('\\','/').endswith('/phase3b/stations.geojson'))
station_values={f['id']:f for f in station_layer.getFeatures()}
station_checks=[]
for station in meta['stations']:
    feature=station_values[station['id']];xy=feature.geometry().asPoint()
    assert abs(xy.x()-E-station['eye'][0])<1e-7 and abs(xy.y()-N-station['eye'][1])<1e-7
    assert feature['elementId']==station['elementId'] and feature['lookDown']==station['lookDown'] and feature['fov']==station.get('fov',38)
    station_checks.append(dict(id=station['id'],localEast=xy.x()-E,localNorth=xy.y()-N,elementId=feature['elementId'],fov=feature['fov'],lookDown=feature['lookDown']))
for row in [0,1,20,55,90,109,110]:
    for col in [0,1,25,60,100,124,125]:
        values.append(dict(east=gt[0]+(col+.5)*gt[1]-E,north=gt[3]+(row+.5)*gt[5]-N,height=float(a[row,col])))
ds=None
result=dict(status='PASS',scope='Independent native QGIS read-only old/new reread and GDAL raster extraction.',layers=layers,oldLayers=len(original),oldSourcesPreserved=preserved,projectCRS=project.crs().authid(),samples=values,stationChecks=station_checks)
project.clear();project=None;gc.collect();app.exitQgis();app=None;gc.collect()
(O/'qgis-review.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print('INDEPENDENT_QGIS_COMPLETE',len(layers),len(original))
