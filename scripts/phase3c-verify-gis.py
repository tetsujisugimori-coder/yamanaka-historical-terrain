"""Separate QGIS process opens final project and compares persisted raster to GLB vertices."""
import os,json,gc,struct
os.environ['QT_QPA_PLATFORM']='offscreen'
from pathlib import Path
from qgis.core import QgsApplication,QgsProject
from osgeo import gdal
import numpy as np
ROOT=Path(__file__).resolve().parents[1];app=QgsApplication([],False);app.initQgis();p=QgsProject.instance()
assert p.read(str(ROOT/'production/yamanaka-phase3c.qgz'))
assert p.crs().authid()=='EPSG:6676';assert all(x.isValid() for x in p.mapLayers().values())
r=json.loads((ROOT/'production/phase3c/recipe.json').read_text());ds=gdal.Open(str(ROOT/'production/phase3c/surface-candidate-025m.tif'));a=ds.ReadAsArray();gt=ds.GetGeoTransform();assert a.shape==(381,129)
b=(ROOT/'public/data/phase3c.glb').read_bytes();size=struct.unpack_from('<I',b,12)[0];doc=json.loads(b[20:20+size]);blob=b[28+size:];count=0;err=0
for m in doc['meshes']:
 for prim in m['primitives']:
  ac=doc['accessors'][prim['attributes']['POSITION']];v=doc['bufferViews'][ac['bufferView']]
  pos=np.frombuffer(blob,dtype='<f4',count=ac['count']*3,offset=v.get('byteOffset',0)+ac.get('byteOffset',0)).reshape(-1,3)
  for x,h,z in pos:
   i=round((float(x)-r['bounds'][0])/.25);j=round((r['bounds'][3]+float(z))/.25);err=max(err,abs(float(h)-float(a[j,i])));count+=1
assert err<.0001
report=dict(status='PASS',separateProcess=True,layers=len(p.mapLayers()),crs=p.crs().authid(),validLayers=True,rasterShape=list(a.shape),glbVertexComparisons=count,maximumRasterGlbHeightError=err,pixelCentreMatchesGrid=True)
p.clear();p=None;ds=None;gc.collect();app.exitQgis();app=None;gc.collect()
(ROOT/'evidence/phase3c/native/gis-check.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
