"""Read-only native QGIS inspection. No invented georeferencing/warping."""
import os,json,hashlib,pathlib
os.environ.setdefault('QT_QPA_PLATFORM','offscreen')
from qgis.core import QgsApplication,QgsProject,Qgis,QgsVectorLayer
root=pathlib.Path(__file__).resolve().parents[1]; app=QgsApplication([],False);app.initQgis()
source=root/'production/yamanaka.qgz';before=hashlib.sha256(source.read_bytes()).hexdigest()
p=QgsProject();assert p.read(str(source));assert p.crs().authid()=='EPSG:6676'
rows=[dict(name=l.name(),valid=l.isValid(),crs=l.crs().authid()) for l in p.mapLayers().values()]
v=QgsVectorLayer(str(root/'research/stage3b2/unplaced.geojson'),'unplaced','ogr');assert v.isValid();assert v.featureCount()==2;assert all(not f.hasGeometry() for f in v.getFeatures())
assert hashlib.sha256(source.read_bytes()).hexdigest()==before
print(json.dumps(dict(qgis=Qgis.QGIS_VERSION,projectRead=True,projectUnchanged=True,sha256=before,layers=rows,nullGeometryFeatures=2,transform='NOT_TESTED: no accepted paired controls',rmse=None),ensure_ascii=False))
