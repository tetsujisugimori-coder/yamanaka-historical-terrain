import os,json
os.environ['QT_QPA_PLATFORM']='offscreen'
from pathlib import Path
from osgeo import gdal
import numpy as np
root=Path(__file__).resolve().parents[1]
for p in (root/'production/gis').glob('*.tif'):
 d=gdal.Open(str(p)); a=d.ReadAsArray(); good=a!=-9999
 print(p.name,d.GetGeoTransform(),a.shape,int((~good).sum()),float(a[good].min()),float(a[good].max()))
for p in (root/'data/raw').glob('dem5a*.png'):
 a=gdal.Open(str(p)).ReadAsArray(); u=a[0].astype(int)*65536+a[1].astype(int)*256+a[2].astype(int); missing=int((u==8388608).sum())
 if missing: print(p.name,'missing',missing)
