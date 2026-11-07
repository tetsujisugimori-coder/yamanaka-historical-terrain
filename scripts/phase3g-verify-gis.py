import gzip
"""Separate installed QGIS process: reopen project and inspect actual stored layers."""
import os,json,gc,hashlib
os.environ['QT_QPA_PLATFORM']='offscreen'
from pathlib import Path
from qgis.core import QgsApplication,QgsProject,Qgis,QgsMapSettings,QgsMapRendererParallelJob
from qgis.PyQt.QtCore import QSize
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'production/phase3g'
p=json.loads((OUT/'parameters.json').read_text());E,N=p['origin'][:2]
app=QgsApplication([],False);app.initQgis();project=QgsProject.instance()
assert project.read(str(OUT/'yamanaka-phase3g.qgz'));layers={l.name():l for l in project.mapLayers().values()}
assert set(layers)=={'C_changed_triangles','C_edit_bounds','C_actual_mesh_sections'}
assert project.crs().authid()=='EPSG:6676'
for layer in layers.values():assert layer.isValid() and layer.crs().authid()=='EPSG:6676'
source={(x['object'],x['face']):x for x in json.loads(gzip.decompress((OUT/'changed-triangles.json.gz').read_bytes()))};maxerr=0
for f in layers['C_changed_triangles'].getFeatures():
 x=source.pop((f['object'],f['face']));vertices=list(f.geometry().vertices())[:3]
 for v,w in zip(vertices,x['vertices']):maxerr=max(maxerr,abs(v.x()-E-w[0]),abs(v.y()-N-w[1]),abs(v.z()-w[2]))
 assert f['category']=='C'
assert not source and maxerr<1e-8
settings=QgsMapSettings();settings.setLayers([layers['C_actual_mesh_sections'],layers['C_edit_bounds'],layers['C_changed_triangles']]);settings.setDestinationCrs(project.crs());settings.setExtent(layers['C_edit_bounds'].extent());settings.setOutputSize(QSize(1600,1000))
job=QgsMapRendererParallelJob(settings);job.start();job.waitForFinished();assert job.renderedImage().save(str(OUT/'phase3g-qgis-map.png'))
report={'status':'PASS','qgis':Qgis.QGIS_VERSION,'execution':'separate offscreen QGIS process reopened .qgz and GeoPackage','triangleFeatures':layers['C_changed_triangles'].featureCount(),'maxAbsoluteCoordinateError':maxerr,'render':'phase3g-qgis-map.png, native QGIS map export, NOT GUI screenshot','layerValidity':True,'gpkgSha256':hashlib.sha256((OUT/'phase3g-editable.gpkg').read_bytes()).hexdigest()}
(OUT/'gis-reload.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report));project.clear();gc.collect();app.exitQgis()
