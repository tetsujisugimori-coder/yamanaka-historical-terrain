import os,json,gc,shutil,zipfile,xml.etree.ElementTree as ET
from pathlib import Path
os.environ['QT_QPA_PLATFORM']='offscreen'
from qgis.core import QgsApplication,QgsProject,QgsRasterLayer,QgsVectorLayer
ROOT=Path(__file__).resolve().parents[1]
dest=ROOT/'.cache/phase2a-relocation';dest.mkdir(parents=True,exist_ok=True)
shutil.copy2(ROOT/'production/yamanaka-phase2a.qgz',dest/'yamanaka-phase2a.qgz')
for name in ['gis','phase2a']:shutil.copytree(ROOT/'production'/name,dest/name,dirs_exist_ok=True)
app=QgsApplication([],False);app.initQgis();p=QgsProject.instance();assert p.read(str(dest/'yamanaka-phase2a.qgz'))
assert p.crs().authid()=='EPSG:6676';layers=[]
for l in p.mapLayers().values():
 assert l.isValid(),l.name();assert str(dest).replace('\\','/') in l.source().replace('\\','/'),l.source();assert l.crs().authid()=='EPSG:6676'
 layers.append({'name':l.name(),'relocated':True})
 if isinstance(l,QgsVectorLayer) and 'facilities.gpkg' in l.source():
  assert l.featureCount()==5
  for f in l.getFeatures(): assert f['category']=='C' and f['accuracy']=='UNKNOWN'
with zipfile.ZipFile(ROOT/'production/yamanaka.qgz') as z:
 original=ET.fromstring(z.read(next(n for n in z.namelist() if n.endswith('.qgs'))))
assert len(layers)==len(original.findall('./projectlayers/maplayer'))+2,len(layers)
with zipfile.ZipFile(ROOT/'production/yamanaka-phase2a.qgz') as z:
 text=z.read(next(n for n in z.namelist() if n.endswith('.qgs'))).decode('utf8');assert 'C:/Users/' not in text
l=None;f=None;p.clear();p=None;gc.collect();app.exitQgis();app=None;gc.collect()
Path(os.environ['PHASE2A_WORKER_OUTPUT']).write_text(json.dumps({'workerStatus':'CHECKS_AND_TEARDOWN_RETURNED','crs':'EPSG:6676','layers':layers,'scope':'new project relocated, read in QGIS and all references valid'}),encoding='utf8')
