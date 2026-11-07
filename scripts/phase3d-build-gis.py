"""Portable editable GIS footprints; no terrain replacement. Use system QGIS Python."""
import os,json,gc
os.environ['QT_QPA_PLATFORM']='offscreen'
from pathlib import Path
from qgis.core import QgsApplication,QgsProject,QgsVectorLayer,QgsCoordinateReferenceSystem,Qgis,QgsReferencedRectangle
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'production/phase3d';r=json.loads((OUT/'recipe.json').read_text());E,N=r['origin'][:2]
app=QgsApplication([],False);app.initQgis();p=QgsProject.instance();p.setCrs(QgsCoordinateReferenceSystem('EPSG:6676'))
def polygon(b):
 x0,y0,x1,y1=b
 return dict(type='Polygon',coordinates=[[[E+x0,N+y0],[E+x1,N+y0],[E+x1,N+y1],[E+x0,N+y1],[E+x0,N+y0]]])
def layer(name,features):
 file=OUT/(name+'.geojson');file.write_text(json.dumps(dict(type='FeatureCollection',crs=dict(type='name',properties=dict(name='EPSG:6676')),features=features),ensure_ascii=False,indent=2)+'\n');l=QgsVectorLayer(str(file),name+' / C hypotheses; historical layout UNKNOWN','ogr');assert l.isValid();p.addMapLayer(l);return l
layer('parts',[dict(type='Feature',geometry=polygon(x['footprint']),properties=dict(name=x['name'],elementId=x['elementId'],role=x['role'],category='C',minimumBottom=min(x['bottom']),maximumTop=max(x['top']),historicalDimensions='UNKNOWN')) for x in r['parts']])
l=layer('route',[dict(type='Feature',geometry=polygon(r['route']['bounds']),properties=dict(id='dc-model-route',clearHeight=r['route']['clearHeight'],category='C',scope=r['route']['scope']))])
layer('elements',[dict(type='Feature',geometry=dict(type='Point',coordinates=[E+x['local'][0],N+x['local'][1],x['height']]),properties=dict(id=x['id'],name=x['name'],category='C',historicalDimensions='UNKNOWN')) for x in r['elements']])
p.setFilePathStorage(Qgis.FilePathType.Relative);p.setTitle('Phase3D C timber candidates; historical layout UNKNOWN');p.viewSettings().setDefaultViewExtent(QgsReferencedRectangle(l.extent(),p.crs()));assert p.write(str(OUT/'yamanaka-phase3d.qgz'))
p.clear();assert p.read(str(OUT/'yamanaka-phase3d.qgz'));assert p.crs().authid()=='EPSG:6676';assert len(p.mapLayers())==3;assert all(l.isValid() for l in p.mapLayers().values())
report=dict(status='PASS',qgis=Qgis.QGIS_VERSION,crs=p.crs().authid(),layers=[dict(name=l.name(),features=l.featureCount(),source=Path(l.source()).name) for l in p.mapLayers().values()],reopened=True,terrainAltered=False)
(OUT/'gis-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report));p.clear();p=None;gc.collect();app.exitQgis()
