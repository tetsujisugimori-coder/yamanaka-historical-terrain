import bpy
from pathlib import Path
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.data.objects:
 if str(o.get('elementId','')).startswith('ic-'):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(Path('evidence/phase3c/independent/technical/v2-reexport.glb').resolve()),export_format='GLB',use_selection=True,export_extras=True,export_yup=True)
