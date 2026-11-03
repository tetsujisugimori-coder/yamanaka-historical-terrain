import os,json,zipfile,shutil,datetime
from pathlib import Path
os.environ['QT_QPA_PLATFORM']='offscreen'
from qgis.core import QgsApplication,QgsProject,QgsRasterLayer
from osgeo import gdal
import numpy as np
root=Path(__file__).resolve().parents[1]
app=QgsApplication([],False);app.initQgis()
relocated=root/'.cache/relocation-check';relocated.mkdir(parents=True,exist_ok=True)
shutil.copy2(root/'production/yamanaka.qgz',relocated/'yamanaka.qgz');shutil.copytree(root/'production/gis',relocated/'gis',dirs_exist_ok=True)
p=QgsProject();assert p.read(str(relocated/'yamanaka.qgz'))
layers=[]
for layer in p.mapLayers().values():
 assert layer.isValid(),layer.name(); assert str(relocated).replace('\\','/') in layer.source().replace('\\','/'),layer.source()
 layers.append({'name':layer.name(),'valid':layer.isValid(),'relocated':True,'crs':layer.crs().authid()})
assert p.crs().authid()=='EPSG:6676'
mask=gdal.Open(str(root/'production/gis/regional-source-mask.tif')).ReadAsArray();assert set(np.unique(mask))=={5,10};assert int((mask==10).sum())==31
no_data={}
for filename in ['regional-dem-20m.tif','castle-dem-1m.tif']:
 ds=gdal.Open(str(root/f'production/gis/{filename}'));a=ds.ReadAsArray();assert ds.GetProjection();assert int((a==-9999).sum())==0;no_data[filename]=0
with zipfile.ZipFile(root/'production/yamanaka.qgz') as z:
 qgs=z.read(next(name for name in z.namelist() if name.endswith('.qgs'))).decode('utf8')
 assert 'C:/Users/' not in qgs and 'C:\\Users\\' not in qgs,'local user path leaked into project'
result={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'PASS','relocation':'project copied with gis folder to a new path; all layers valid','layers':layers,'fallbackCells':31,'noData':no_data,'projectContainsAbsoluteUserPath':False,'scope':'internal file/CRS integrity; not field survey or historical registration'}
(root/'evidence/qgis-project-check.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(result,ensure_ascii=False));p.clear();app.exitQgis()
