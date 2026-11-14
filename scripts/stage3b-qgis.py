"""Create a derivative GIS project, leaving every existing QGIS project unchanged.
Run with system QGIS Python: QT_QPA_PLATFORM=offscreen /usr/bin/python3 scripts/stage3b-qgis.py
No raw third-party map is embedded or georeferenced without control points.
"""
import os, pathlib, json, hashlib
os.environ.setdefault('QT_QPA_PLATFORM','offscreen')
from qgis.core import QgsApplication,QgsProject,QgsVectorLayer,QgsCoordinateReferenceSystem,QgsFillSymbol
root=pathlib.Path(__file__).resolve().parents[1]
app=QgsApplication([],False);app.initQgis()
source=root/'production/yamanaka.qgz'
before=hashlib.sha256(source.read_bytes()).hexdigest()
p=QgsProject()
if not p.read(str(source)): raise RuntimeError('Base project unreadable')
if p.crs().authid()!='EPSG:6676': raise RuntimeError('Base CRS mismatch')
for filename,title,color in [('model-envelopes.geojson','C/D model envelopes; historical placement UNKNOWN','40,107,181,35'),('historical-regions.geojson','Historical source catalog; all boundaries UNPLACED','200,150,30,35')]:
 layer=QgsVectorLayer(str(root/'production/stage3b'/filename),title,'ogr')
 if not layer.isValid(): raise RuntimeError('Invalid layer '+filename)
 # Projected GeoJSON is explicitly non-RFC7946; assign known source CRS, never transform WGS84.
 layer.setCrs(QgsCoordinateReferenceSystem('EPSG:6676'))
 if layer.crs().authid()!='EPSG:6676': raise RuntimeError('Layer CRS mismatch')
 if layer.geometryType()==2: layer.renderer().setSymbol(QgsFillSymbol.createSimple({'color':color,'outline_color':'40,107,181,255','outline_width':'0.4'}))
 p.addMapLayer(layer)
p.setTitle('Stage 3-B / model audit and unplaced historical catalog (not georeferenced plan)')
target=root/'production/stage3b/yamanaka-stage3b-overview.qgz'
if not p.write(str(target)):raise RuntimeError('Derivative write failed')
q=QgsProject()
if not q.read(str(target)):raise RuntimeError('Derivative read failed')
rows=[{'name':l.name(),'valid':l.isValid(),'crs':l.crs().authid(),'source':l.source().replace(str(root),'$REPO')} for l in q.mapLayers().values()]
if not all(x['valid'] for x in rows):raise RuntimeError('Invalid derivative references')
if hashlib.sha256(source.read_bytes()).hexdigest()!=before:raise RuntimeError('Base changed')
report={'base':'production/yamanaka.qgz','baseSHA256':before,'derivative':'production/stage3b/yamanaka-stage3b-overview.qgz','crs':q.crs().authid(),'layers':rows,'georeference':'BLOCKED: 0 controls, no transform, residual UNKNOWN','rawMapEmbedded':False,'originalUnchanged':True}
(root/'research/stage3b/qgis-derivative-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))
