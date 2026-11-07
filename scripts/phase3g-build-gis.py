import gzip
"""Installed QGIS/GDAL authoring: exact edited triangles, not an invented DEM."""
import os,json,gc
os.environ['QT_QPA_PLATFORM']='offscreen'
from pathlib import Path
from osgeo import ogr,osr
from qgis.core import QgsApplication,QgsProject,QgsVectorLayer,QgsCoordinateReferenceSystem,QgsRectangle,Qgis
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'production/phase3g'
p=json.loads((OUT/'parameters.json').read_text());E,N=p['origin'][:2]
path=OUT/'phase3g-editable.gpkg'
if path.exists():path.unlink() # only this reproducible new phase3g artifact
store=ogr.GetDriverByName('GPKG').CreateDataSource(str(path));crs=osr.SpatialReference();crs.ImportFromEPSG(6676)
tri=store.CreateLayer('C_changed_triangles',crs,ogr.wkbPolygon25D,options=['SPATIAL_INDEX=NO'])
for name,kind in [('object',ogr.OFTString),('model',ogr.OFTString),('face',ogr.OFTInteger),('category',ogr.OFTString),('max_delta',ogr.OFTReal)]:tri.CreateField(ogr.FieldDefn(name,kind))
tri.StartTransaction();count=0
for item in json.loads(gzip.decompress((OUT/'changed-triangles.json.gz').read_bytes())):
 ring=ogr.Geometry(ogr.wkbLinearRing)
 for x,y,z in item['vertices']+[item['vertices'][0]]:ring.AddPoint(E+x,N+y,z)
 polygon=ogr.Geometry(ogr.wkbPolygon25D);polygon.AddGeometry(ring)
 f=ogr.Feature(tri.GetLayerDefn());f.SetGeometry(polygon)
 for key in ['object','model','face']:f.SetField(key,item[key])
 f.SetField('category','C');f.SetField('max_delta',max(abs(v[2]-o[2]) for v,o in zip(item['vertices'],item['old'])))
 assert tri.CreateFeature(f)==0;count+=1
tri.CommitTransaction()
patch=store.CreateLayer('C_edit_bounds',crs,ogr.wkbPolygon)
for name in ['id','category','assumption']:patch.CreateField(ogr.FieldDefn(name,ogr.OFTString))
for spec in p['patches']:
 a,b,c,d=spec['bounds'];ring=ogr.Geometry(ogr.wkbLinearRing)
 for x,y in [(a,b),(c,b),(c,d),(a,d),(a,b)]:ring.AddPoint_2D(E+x,N+y)
 poly=ogr.Geometry(ogr.wkbPolygon);poly.AddGeometry(ring);f=ogr.Feature(patch.GetLayerDefn());f.SetGeometry(poly)
 for k,v in [('id',spec['id']),('category','C'),('assumption',spec['description'])]:f.SetField(k,v)
 patch.CreateFeature(f)
sections=store.CreateLayer('C_actual_mesh_sections',crs,ogr.wkbLineString25D)
sections.CreateField(ogr.FieldDefn('id',ogr.OFTString));sections.CreateField(ogr.FieldDefn('category',ogr.OFTString))
metadata=json.loads((ROOT/'public/data/phase3g.json').read_text())
for section in metadata['sections']:
 line=ogr.Geometry(ogr.wkbLineString25D)
 for v in section['samples']:line.AddPoint(E+v['e'],N+v['n'],v['height'])
 f=ogr.Feature(sections.GetLayerDefn());f.SetGeometry(line);f.SetField('id',section['id']);f.SetField('category','C');sections.CreateFeature(f)
store=None
app=QgsApplication([],False);app.initQgis();project=QgsProject.instance()
# Native independent project; linked immutable historical masters are documented,
# rather than copying or mutating previous GIS or A raster layers.
project.setCrs(QgsCoordinateReferenceSystem('EPSG:6676'))
for name in ['C_changed_triangles','C_edit_bounds','C_actual_mesh_sections']:
 layer=QgsVectorLayer(str(path)+'|layername='+name,name,'ogr');assert layer.isValid();project.addMapLayer(layer)
 if name=='C_edit_bounds':
  from qgis.core import QgsFillSymbol
  layer.renderer().setSymbol(QgsFillSymbol.createSimple({'color':'0,0,0,0','outline_color':'230,120,30,255','outline_width':'.6'}))
project.viewSettings().setDefaultViewExtent(__import__('qgis.core',fromlist=['QgsReferencedRectangle']).QgsReferencedRectangle(QgsRectangle(E-105,N-45,E-25,N+35),project.crs()))
project.setTitle('Phase3G C terrain assumptions / not measured historic surface')
project.setFileName(str(OUT/'yamanaka-phase3g.qgz'));assert project.write()
project.clear();assert project.read(str(OUT/'yamanaka-phase3g.qgz'));assert len(project.mapLayers())==3
for layer in project.mapLayers().values():assert layer.isValid() and layer.crs().authid()=='EPSG:6676'
report=dict(status='PASS',qgis=Qgis.QGIS_VERSION,execution='installed QGIS Python bindings, offscreen/headless; no GUI claim',editableTriangleFeatures=count,layers={l.name():l.featureCount() for l in project.mapLayers().values()},crs=project.crs().authid(),reopened=True,origin=[E,N],vertical='copied native mesh model Z, metres; no new vertical datum claim',A='not loaded or modified; standalone editable C overlay project')
(OUT/'gis-build.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
project.clear();project=None;gc.collect();app.exitQgis()
