"""Re-export exact existing native terrain without redundant NM normal attributes."""
import bpy,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'production/phase3f'
assert Path(bpy.data.filepath)==OUT/'yamanaka-phase3f.blend'
path=ROOT/'public/data/phase3f.glb';before={'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.data.objects:
 if o.type=='MESH' and o.name.startswith('nm-'):o.hide_set(False);o.select_set(True)
bpy.context.view_layer.objects.active=bpy.data.objects['nm-moat']
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_extras=True,export_yup=True,export_normals=False)
r={'status':'EXPORTED_REVERIFY_REQUIRED','blender':bpy.app.version_string,'before':before,'after':{'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()},'geometry':'unchanged native vertices/faces; omit redundant NORMAL attribute only; no quantization','inner':'unchanged; keep normals for landscapeModel loader','nativeMaster':'not modified or re-saved'}
(OUT/'compact-export.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r))
