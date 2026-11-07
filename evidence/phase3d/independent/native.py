import json,sys,hashlib,struct,zipfile
from collections import Counter
from pathlib import Path
ROOT=Path.cwd();OUT=ROOT/'evidence/phase3d/independent'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
if '--blender' in sys.argv:
 import bpy
 objects=[o for o in bpy.data.objects if o.type=='MESH'];assert len(objects)==63
 blob=(ROOT/'public/data/phase3d.glb').read_bytes();n=struct.unpack_from('<I',blob,12)[0];g=json.loads(blob[20:20+n]);data=blob[28+n:]
 rows=[]
 for node in g['nodes']:
  if 'mesh' not in node:continue
  o=bpy.data.objects[node['name']];assert o.type=='MESH' and not o.modifiers and not o.data.shape_keys
  assert o.get('evidenceCategory')=='C';assert o.get('materialRole')=='wood'
  expected=sorted(set(tuple(round(v,5) for v in (p.co.x,p.co.z,-p.co.y)) for p in o.data.vertices))
  a=g['accessors'][g['meshes'][node['mesh']]['primitives'][0]['attributes']['POSITION']];v=g['bufferViews'][a['bufferView']];off=v.get('byteOffset',0)+a.get('byteOffset',0)
  actual=sorted(set(tuple(round(x,5) for x in struct.unpack_from('<3f',data,off+i*v.get('byteStride',12))) for i in range(a['count'])))
  assert expected==actual,node['name']
  edges=Counter(tuple(sorted((p.vertices[i],p.vertices[(i+1)%len(p.vertices)]))) for p in o.data.polygons for i in range(len(p.vertices)))
  assert all(n==2 for n in edges.values()),('NON_MANIFOLD_NATIVE',o.name)
  rows.append(dict(name=o.name,vertices=len(o.data.vertices),faces=len(o.data.polygons),glbUniqueVertices=len(actual),closedMeshEdges=len(edges)))
 assert bpy.context.scene.unit_settings.scale_length==1
 r=dict(status='PASS',version=bpy.app.version_string,file=bpy.data.filepath,sha256=sha(Path(bpy.data.filepath)),method='Separate-process reopen, 63 editable objects compared directly to shipped GLB vertices under E,N,U -> E,U,-N. No producer report reused.',rows=rows)
 (OUT/'native-blender.json').write_text(json.dumps(r,indent=2));print(json.dumps(r))
else:
 from qgis.core import QgsApplication,QgsProject
 app=QgsApplication([],False);app.initQgis();p=QgsProject.instance();path=ROOT/'production/phase3d/yamanaka-phase3d.qgz';assert p.read(str(path));assert p.crs().authid()=='EPSG:6676';layers=list(p.mapLayers().values());assert len(layers)==3
 rows=[]
 for l in layers:
  assert l.isValid() and l.crs().authid()=='EPSG:6676'
  features=list(l.getFeatures());assert all(f['category']=='C' for f in features)
  rows.append(dict(name=l.name(),count=len(features),source=l.source(),crs=l.crs().authid()))
 assert sorted(x['count'] for x in rows)==[1,5,63]
 with zipfile.ZipFile(path) as z:xml=z.read(next(n for n in z.namelist() if n.endswith('.qgs'))).decode();assert all(('<datasource>./'+name+'.geojson</datasource>') in xml for name in ['parts','elements','route'])
 r=dict(status='PASS',method='Separate-process native QGIS reopen; relative sources, CRS, category and feature counts.',sha256=sha(path),rows=rows);(OUT/'native-qgis.json').write_text(json.dumps(r,indent=2));print(json.dumps(r));p.clear();app.exitQgis()
