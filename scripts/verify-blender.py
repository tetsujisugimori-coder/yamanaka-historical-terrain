import bpy,json,datetime
from pathlib import Path
root=Path(__file__).resolve().parents[1]
assert bpy.data.filepath.endswith('yamanaka.blend')
assert bpy.context.scene.unit_settings.scale_length==1
objects=[]
for ob in bpy.context.scene.objects:
 if ob.type!='MESH':continue
 assert ob['evidenceCategory'] in ['A','C'];assert ob['metresPerUnit']==1
 objects.append({'name':ob.name,'category':ob['evidenceCategory'],'vertices':len(ob.data.vertices),'metresPerUnit':ob['metresPerUnit']})
assert len(objects)==4
assert not [image.filepath for image in bpy.data.images if image.filepath],'no external textures or third-party image links'
assert not [lib for lib in bpy.data.libraries],'no external library dependencies'
result={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'PASS','blenderVersion':bpy.app.version_string,'objects':objects,'externalImages':0,'externalLibraries':0,'scope':'editable production file reopened in Blender; not archaeological accuracy'}
(root/'evidence/blender-project-check.json').write_text(json.dumps(result,indent=2),encoding='utf8');print(json.dumps(result))
