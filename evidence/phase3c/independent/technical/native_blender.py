import bpy, json,hashlib,struct,sys
from pathlib import Path
out={}
for o in bpy.data.objects:
 if o.type!='MESH':continue
 h=hashlib.sha256()
 h.update(bytes(str(list(o.matrix_world)),encoding='utf8'))
 for v in o.data.vertices:h.update(struct.pack('<3d',*v.co))
 for p in o.data.polygons:h.update(struct.pack('<'+'I'*len(p.vertices),*p.vertices))
 out[o.name]={'sha256':h.hexdigest(),'vertices':len(o.data.vertices),'polygons':len(o.data.polygons),'category':o.get('evidenceCategory'),'id':o.get('elementId')}
path=sys.argv[sys.argv.index('--')+1];Path(path).write_text(json.dumps({'input':bpy.data.filepath,'units':bpy.context.scene.unit_settings.scale_length,'meshes':out},indent=2))
