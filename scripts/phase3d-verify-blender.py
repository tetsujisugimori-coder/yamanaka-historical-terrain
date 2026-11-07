"""Native editable-source reopen and actual glTF roundtrip comparison."""
import bpy,json,hashlib,struct,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'production/phase3d';r=json.loads((OUT/'recipe.json').read_text());assert Path(bpy.data.filepath).name=='yamanaka-phase3d.blend'
objects=[o for o in bpy.data.objects if o.type=='MESH'];assert len(objects)==len(r['parts'])==63
for o in objects:
 assert o.get('evidenceCategory')=='C' and o.get('materialRole')=='wood'
 assert len(o.data.vertices)==8 and len(o.data.polygons)==6
 assert not o.modifiers and not o.data.shape_keys
assert bpy.context.scene.unit_settings.scale_length==1
for p,h in r['immutableInputs'].items():assert hashlib.sha256((ROOT/p).read_bytes()).hexdigest()==h
bpy.ops.object.select_all(action='SELECT');tmp=Path(tempfile.gettempdir())/'phase3d-native-roundtrip.glb';bpy.ops.export_scene.gltf(filepath=str(tmp),export_format='GLB',use_selection=True,export_extras=True,export_yup=True)
def positions(path):
 b=path.read_bytes();n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);data=b[28+n:];result={}
 for node in g['nodes']:
  if 'mesh' not in node:continue
  a=g['accessors'][g['meshes'][node['mesh']]['primitives'][0]['attributes']['POSITION']];v=g['bufferViews'][a['bufferView']];off=v.get('byteOffset',0)+a.get('byteOffset',0);result[node['name']]=hashlib.sha256(data[off:off+a['count']*12]).hexdigest()
 return result
assert positions(tmp)==positions(ROOT/'public/data/phase3d.glb')
(OUT/'native-report.json').write_text(json.dumps(dict(status='PASS',reopened=True,editableMeshes=len(objects),blender=bpy.app.version_string,roundtripPositionHashes=positions(tmp),immutableInputsPreserved=True),indent=2)+'\n')
