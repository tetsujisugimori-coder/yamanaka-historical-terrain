"""Add editable placement/observation points to existing phase2A QGIS project."""
import os,json,gc
os.environ['QT_QPA_PLATFORM']='offscreen'
from pathlib import Path
from qgis.core import QgsApplication,QgsProject,QgsVectorLayer,QgsField,QgsFeature,QgsGeometry,QgsPointXY,Qgis
from qgis.PyQt.QtCore import QVariant
ROOT=Path(__file__).resolve().parents[1]
r=json.loads((ROOT/'production/landscape/recipe.json').read_text(encoding='utf8'));E,N=r['origin'][:2]
app=QgsApplication([],False);app.initQgis();p=QgsProject.instance();assert p.read(str(ROOT/'production/yamanaka-phase2a.qgz'))
old={l.id():l.source() for l in p.mapLayers().values()};assert p.crs().authid()=='EPSG:6676'
for kind,items in [('elements',r['elements']),('stations',r['stations'])]:
 features=[]
 for e in items:
  x,y=e.get('local',e.get('eye'));features.append(dict(type='Feature',geometry=dict(type='Point',coordinates=[E+x,N+y]),properties=dict(id=e['id'],category=e.get('category','C'),name=e['name'],accuracy='UNKNOWN; hypothetical placement; not historical route',ledger='public/data/landscape.json#'+e['id'])))
 path=ROOT/f'production/landscape/{kind}.geojson';path.write_text(json.dumps(dict(type='FeatureCollection',crs=dict(type='name',properties=dict(name='EPSG:6676')),features=features),ensure_ascii=False,indent=2),encoding='utf8')
 l=QgsVectorLayer(str(path),'1590 '+kind+' / C-D hypotheses','ogr');assert l.isValid();p.addMapLayer(l)
p.setFilePathStorage(Qgis.FilePathType.Relative);p.setTitle('1590 scenery C/D hypotheses; measured A unchanged');assert p.write(str(ROOT/'production/yamanaka-1590.qgz'))
assert all(p.mapLayer(id).source()==source for id,source in old.items())
count=len(p.mapLayers());p.clear();assert p.read(str(ROOT/'production/yamanaka-1590.qgz'));assert len(p.mapLayers())==count
assert all(l.isValid() for l in p.mapLayers().values());assert p.crs().authid()=='EPSG:6676'
result=dict(status='PASS',layers=count,preservedLayers=len(old),crs=p.crs().authid(),reread=True)
p.clear();p=None;gc.collect();app.exitQgis();app=None;gc.collect()
(ROOT/'evidence/landscape/gis-build.json').write_text(json.dumps(result,indent=2),encoding='utf8')
