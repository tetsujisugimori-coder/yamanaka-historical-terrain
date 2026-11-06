"""Read existing QGIS project; add hypothesis footprint and observation layers."""
import os,json,gc,importlib.util
os.environ['QT_QPA_PLATFORM']='offscreen'
from pathlib import Path
from qgis.core import QgsApplication,QgsProject,QgsVectorLayer,QgsRasterLayer,Qgis
from osgeo import gdal,osr
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
r=json.loads((ROOT/'production/phase3c/recipe.json').read_text(encoding='utf8'))
E,N=r['origin'][:2];out=ROOT/'production/phase3c'
app=QgsApplication([],False);app.initQgis();p=QgsProject.instance()
assert p.read(str(ROOT/'production/yamanaka-phase3b.qgz'))
old={l.id():l.source() for l in p.mapLayers().values()}
assert p.crs().authid()=='EPSG:6676'
layers=[]
# A separate C raster gives editors the model heights, without replacing the
# original measured DEM. Pixel centres are the exact Blender grid nodes.
spec=importlib.util.spec_from_file_location('shape',ROOT/'scripts/phase3c-recipe.py')
s=importlib.util.module_from_spec(spec);spec.loader.exec_module(s)
b=r['bounds'];values=np.array([[s.f32(s.surface_height(b[0]+c*.25,b[3]-j*.25)) for c in range(129)] for j in range(381)],dtype=np.float32)
path=out/'surface-candidate-025m.tif'
ds=gdal.GetDriverByName('GTiff').Create(str(path),129,381,1,gdal.GDT_Float32,options=['COMPRESS=DEFLATE'])
ds.SetGeoTransform((E+b[0]-.125,.25,0,N+b[3]+.125,0,-.25))
crs=osr.SpatialReference();crs.ImportFromEPSG(6676);ds.SetProjection(crs.ExportToWkt())
ds.GetRasterBand(1).WriteArray(values);ds.FlushCache();ds=None
layer=QgsRasterLayer(str(path),'Phase3C C candidate heights / NOT measured DEM')
assert layer.isValid();p.addMapLayer(layer);layers.append(layer.id())
for kind,items in [('elements',r['elements']),('stations',r['stations'])]:
    features=[]
    for e in items:
        x,y=e.get('local',e.get('eye'))
        properties=dict(id=e['id'],name=e['name'],category='C',modelHeight=(e['height'] if 'height' in e else e['groundHeight']),accuracy='UNKNOWN; conceptual placement, no control points',ledger='public/data/phase3c.json#'+e['id'])
        if kind=='stations':
            properties.update(elementId=e['elementId'],lookEast=e['look'][0],lookNorth=e['look'][1],lookDown=e['lookDown'],fov=e.get('fov',38),eyeHeight=e.get('eyeHeight',1.7),lookTargetHeight=e.get('lookTargetHeight'),lookHeightOffset=e.get('lookHeightOffset'))
        features.append(dict(type='Feature',geometry=dict(type='Point',coordinates=[E+x,N+y]),properties=properties))
    path=out/(kind+'.geojson')
    path.write_text(json.dumps(dict(type='FeatureCollection',crs=dict(type='name',properties=dict(name='EPSG:6676')),features=features),ensure_ascii=False,indent=2),encoding='utf8')
    layer=QgsVectorLayer(str(path),'Phase3C C '+kind+' hypotheses','ogr');assert layer.isValid();p.addMapLayer(layer);layers.append(layer.id())
# Original virtual sightlines are editable research/display objects, not field lines.
stations={x['id']:x for x in r['stations']};features=[]
for i,test in enumerate(r.get('sightlineTests',[])):
    st=stations[test['stationId']];ex,ny=st['eye'];tx,ty=test['target']
    coords=[[E+ex,N+ny,st['groundHeight']+st['eyeHeight']],[E+tx,N+ty,s.surface_height(tx,ty)+test['targetOffset']]]
    features.append(dict(type='Feature',geometry=dict(type='LineString',coordinates=coords),properties=dict(id='ic-sightline-'+str(i),category='C',stationId=st['id'],expected=test['expected'],scope='virtual model ray, not archaeological visibility evidence')))
path=out/'sightlines.geojson';path.write_text(json.dumps(dict(type='FeatureCollection',crs=dict(type='name',properties=dict(name='EPSG:6676')),features=features),ensure_ascii=False,indent=2))
layer=QgsVectorLayer(str(path),'Phase3C C virtual observation sightlines','ogr');assert layer.isValid();p.addMapLayer(layer);layers.append(layer.id())
b=r['bounds'];ring=[[E+b[0],N+b[1]],[E+b[2],N+b[1]],[E+b[2],N+b[3]],[E+b[0],N+b[3]],[E+b[0],N+b[1]]]
path=out/'footprint.geojson';path.write_text(json.dumps(dict(type='FeatureCollection',crs=dict(type='name',properties=dict(name='EPSG:6676')),features=[dict(type='Feature',geometry=dict(type='Polygon',coordinates=[ring]),properties=dict(id='phase3c-surface',category='C',accuracy='UNKNOWN: candidate footprint, not surveyed'))]),indent=2),encoding='utf8')
l=QgsVectorLayer(str(path),'Phase3C C terrain footprint / not surveyed','ogr');assert l.isValid();p.addMapLayer(l);layers.append(l.id())
p.setFilePathStorage(Qgis.FilePathType.Relative);p.setTitle('Phase3C inner defences C; historical placement UNKNOWN')
assert all(p.mapLayer(id).source()==value for id,value in old.items())
assert p.write(str(ROOT/'production/yamanaka-phase3c.qgz')),p.error()
count=len(p.mapLayers());p.clear();assert p.read(str(ROOT/'production/yamanaka-phase3c.qgz'))
assert len(p.mapLayers())==count;assert p.crs().authid()=='EPSG:6676'
assert all(x.isValid() for x in p.mapLayers().values())
assert all(p.mapLayer(id).source()==value for id,value in old.items())
# Compare real native paths above, then publish only repository-relative sources.
safe_sources={id:value.replace(str(ROOT).replace('\\','/'),'[workspace]').replace(str(ROOT),'[workspace]') for id,value in old.items()}
report=dict(status='PASS',preservedLayers=len(old),layers=count,crs=p.crs().authid(),reread=True,
    oldSources=safe_sources,newLayers=layers,positionAccuracy='UNKNOWN; no map control point registration')
p.clear();p=None;gc.collect();app.exitQgis();app=None;gc.collect()
(ROOT/'evidence/phase3c/native/gis-build.json').write_text(json.dumps(report,indent=2),encoding='utf8')
