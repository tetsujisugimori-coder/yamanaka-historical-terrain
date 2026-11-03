"""Blender --background --factory-startup --python scripts/build-blender.py.
Measured surfaces and a schematic, source-informed terrain-cutting study are
separate objects. The study placement and 7m cell pitch are NOT archaeological.
"""
import bpy, json, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
regional=json.loads((ROOT/'public/data/regional.json').read_text())
castle=json.loads((ROOT/'public/data/castle.json').read_text())
features=json.loads((ROOT/'public/data/features.json').read_text(encoding='utf-8'))
def mat(name,color):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*color,1); bs.inputs['Roughness'].default_value=.95; return m
earth=mat('Measured terrain — A current GSI surface',(.31,.43,.30))
study=mat('C inferred illustrative cut — not surveyed',(.62,.32,.16))
def mesh(name,verts,faces,material,category):
 m=bpy.data.meshes.new(name); m.from_pydata(verts,[],faces); m.update()
 for poly in m.polygons: poly.use_smooth=True
 ob=bpy.data.objects.new(name,m); bpy.context.collection.objects.link(ob); ob.data.materials.append(material)
 ob['evidenceCategory']=category; ob['horizontalCRS']='EPSG:6676'; ob['originE']=regional['origin'][0]; ob['originN']=regional['origin'][1]; ob['metresPerUnit']=1
 return ob
def terrain(g):
 verts=[(g['bounds'][0]+c*g['step'],g['bounds'][3]-r*g['step'],h) for r,row in enumerate(g['heights']) for c,h in enumerate(row)]
 faces=[]; cols=g['cols']
 for r in range(g['rows']-1):
  for c in range(cols-1):
   a=r*cols+c; faces.extend([(a,a+cols,a+1),(a+1,a+cols,a+cols+1)])
 ob=mesh('A_'+g['name']+'_current',verts,faces,earth,'A'); ob['source']=g['source']; ob['gridStepMetres']=g['step']; return ob
wide=terrain(regional); core=terrain(castle)
def height(e,n):
 c=(e-castle['bounds'][0])/5; r=(castle['bounds'][3]-n)/5; c0,r0=int(c),int(r); u,v=c-c0,r-r0; a=castle['heights']
 return (1-v)*((1-u)*a[r0][c0]+u*a[r0][c0+1])+v*((1-u)*a[r0+1][c0]+u*a[r0+1][c0+1])
# Study patch has the same geospatial frame, but its approximate placement is
# educational. No facility footprint has been georeferenced from a survey plan.
anchor=next(f for f in features if f['id']=='west')['local']; cx=round(anchor[0]/5)*5; cy=round(anchor[1]/5)*5
half=15; spacing=.125; count=int(half*2/spacing)+1
def lowering(x,y):
 # Rounded 0.35m crest and 58deg flanks; depth 1.8m per cited observation.
 # Repetition/pitch/length invented for teaching, category C throughout.
 d=min(abs((x+3.5)%7-3.5),abs((y+3.5)%7-3.5))
 if d<=.175: drop=.06*(1-math.cos(d/.175*math.pi/2))
 else: drop=min(1.8,.06+(d-.175)*math.tan(math.radians(58)))
 feather=min(1,max(0,(half-max(abs(x),abs(y)))/2))
 return drop*feather
verts=[]; faces=[]; drops=[]
for r in range(count):
 y=-half+r*spacing
 for c in range(count):
  x=-half+c*spacing; d=lowering(x,y); drops.append(d); verts.append((cx+x,cy+y,height(cx+x,cy+y)-d))
for r in range(count-1):
 for c in range(count-1):
  a=r*count+c; faces.extend([(a,a+1,a+count),(a+1,a+count+1,a+count)])
cut=mesh('C_source_informed_moat_study',verts,faces,study,'C')
cut['sourceURL']='https://www.city.mishima.shizuoka.jp/site/kyoudoshiryoukan/36489.html'
cut['sourceScope']='Observed excavation example: 0.35m rounded crest, 1.8m depth, approximately 58deg slope; NOT every moat'
cut['unknowns']='Actual footprint, pitch, orientation, extent, 1590 ground level UNKNOWN. 7m pitch and placement are illustrative.'
# An alternative castle terrain with a real hole, not a moat sitting above an
# uncut measured surface. The immutable A_current object is always retained.
verts=[tuple(v.co) for v in core.data.vertices]; faces=[]
for p in core.data.polygons:
 center=sum((core.data.vertices[i].co for i in p.vertices),Vector())/len(p.vertices)
 if not (cx-half<center.x<cx+half and cy-half<center.y<cy+half): faces.append(tuple(p.vertices))
interpreted=mesh('C_castle_with_study_cutout',verts,faces,earth,'C'); interpreted['note']='A current DEM except for 30x30m schematic study opening. Not a historical castle restoration.'
def export(name,objects):
 bpy.ops.object.select_all(action='DESELECT')
 for ob in objects: ob.select_set(True)
 bpy.context.view_layer.objects.active=objects[0]
 bpy.ops.export_scene.gltf(filepath=str(ROOT/f'public/data/{name}.glb'),export_format='GLB',use_selection=True,export_extras=True,export_yup=True,export_materials='EXPORT')
export('regional',[wide]); export('castle',[core]); export('moat-study',[interpreted,cut])
# Production file preserves all alternatives, with explanatory scene properties.
wide.hide_set(True); interpreted.hide_set(True); cut.hide_set(True)
bpy.context.scene['coordinateContract']='Blender X east, Y north, Z orthometric height; glTF X east, Y height, Z south. Origin at E44862.121277 N-93478.072354 EPSG:6676, vertical origin=0m.'
bpy.context.scene['historicalStatus']='Current surface A; study C with some source-informed parameters; no entire castle reconstruction, no B footprint claimed.'
bpy.context.scene.unit_settings.system='METRIC'; bpy.context.scene.unit_settings.scale_length=1
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'production/yamanaka.blend'))
alignment=[]
for i in [0,len(cut.data.vertices)//2,len(cut.data.vertices)-1]:
 v=cut.data.vertices[i].co; alignment.append({'x':v.x,'north':v.y,'z':v.z,'referenceHeight':height(v.x,v.y),'cutDepth':height(v.x,v.y)-v.z})
result={'blenderVersion':bpy.app.version_string,'objects':[{ 'name':ob.name,'category':ob['evidenceCategory'],'vertices':len(ob.data.vertices),'triangles':len(ob.data.polygons)} for ob in [wide,core,interpreted,cut]],'study':{'center':[cx,cy],'bounds':[cx-half,cy-half,cx+half,cy+half],'minDepth':min(drops),'maxDepth':max(drops),'pitch':7,'placementAccuracy':'UNKNOWN; illustrative anchor, not surveyed','samples':alignment},'files':{p.name:p.stat().st_size for p in (ROOT/'public/data').glob('*.glb')}}
(ROOT/'evidence/blender-build.json').write_text(json.dumps(result,indent=2),encoding='utf-8'); print(json.dumps(result),flush=True)
(ROOT/'public/data/study.json').write_text(json.dumps(result['study'],indent=2),encoding='utf-8')
