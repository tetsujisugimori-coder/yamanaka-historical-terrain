"""Independent GLB vertex/scene traversal, no product code or Three.js imports."""
import json,struct,hashlib,pathlib,math,argparse
R=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output-dir',type=pathlib.Path,help='New evidence directory; refuses an existing directory')
args=parser.parse_args()
O=args.output_dir if args.output_dir is not None else R/'evidence/stage3b'
O.mkdir(parents=True,exist_ok=args.output_dir is None)
D=json.loads((R/'public/data/castle-overview.json').read_text(encoding='utf-8'))
def mul(a,b):return [[sum(a[i][k]*b[k][j] for k in range(4))for j in range(4)]for i in range(4)]
def identity():return [[float(i==j)for j in range(4)]for i in range(4)]
def transform(n):
 if 'matrix'in n:return [[n['matrix'][j*4+i]for j in range(4)]for i in range(4)]
 x,y,z,w=n.get('rotation',[0,0,0,1]);s=n.get('scale',[1,1,1]);t=n.get('translation',[0,0,0]);m=[[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w),t[0]],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w),t[1]],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y),t[2]],[0,0,0,1]]
 for i in range(3):
  for j in range(3):m[i][j]*=s[j]
 return m
def decode(p):
 b=p.read_bytes();magic,version,length=struct.unpack_from('<III',b);assert magic==0x46546c67 and version==2 and length==len(b)
 off=12;g=bin=None
 while off<len(b):
  size,kind=struct.unpack_from('<II',b,off);chunk=b[off+8:off+8+size];off+=8+size
  if kind==0x4e4f534a:g=json.loads(chunk)
  elif kind==0x004e4942:bin=chunk
 out={}
 def walk(i,parent):
  n=g['nodes'][i];mat=mul(parent,transform(n));pts=[]
  if 'mesh'in n:
   for prim in g['meshes'][n['mesh']]['primitives']:
    a=g['accessors'][prim['attributes']['POSITION']];v=g['bufferViews'][a['bufferView']];assert a['componentType']==5126 and a['type']=='VEC3'
    for j in range(a['count']):
     p=struct.unpack_from('<fff',bin,v.get('byteOffset',0)+a.get('byteOffset',0)+j*v.get('byteStride',12))+(1,)
     q=[sum(mat[k][l]*p[l]for l in range(4))for k in range(3)];assert all(math.isfinite(x)for x in q);pts.append(q)
   out[n['name']]={'min':[min(p[k]for p in pts)for k in range(3)],'max':[max(p[k]for p in pts)for k in range(3)],'count':len(pts)}
  for c in n.get('children',[]):walk(c,mat)
 for i in g['scenes'][g.get('scene',0)]['nodes']:walk(i,identity())
 return out,hashlib.sha256(b).hexdigest()
cache={};results=[];err=0
for m in D['models']:
 asset=m['sourceAsset'];p=R/'public'/asset
 if asset not in cache:cache[asset]=decode(p)
 meshes,sha=cache[asset];group=[v for k,v in meshes.items()if k==m['id'] or k.startswith(m['id']+'.')];assert group
 lo=[min(x['min'][k]for x in group)for k in range(3)];hi=[max(x['max'][k]for x in group)for k in range(3)];e0,e1=44862.121277226666+lo[0],44862.121277226666+hi[0];n0,n1=-93478.07235405142-hi[2],-93478.07235405142-lo[2]
 expected=[[e0,n0],[e1,n0],[e1,n1],[e0,n1],[e0,n0]];actual=m['geometry']['coordinates'][0];delta=max(abs(x-y)for a,b in zip(expected,actual)for x,y in zip(a,b));err=max(err,delta)
 assert delta<1e-8 and sha==m['sha256'];assert m['vertexCount']==sum(x['count']for x in group)
 assert max(abs(a-b)for a,b in zip(m['center'],[(e0+e1)/2,(n0+n1)/2]))<1e-8
 results.append({'id':m['id'],'vertices':m['vertexCount'],'maxErrorMeters':delta,'sha256':sha})
protected=json.loads((R/'research/stage3b/preserved-inputs.json').read_text(encoding='utf-8'));bad=[]
for f in protected['files']:
 if hashlib.sha256((R/f['path']).read_bytes()).hexdigest()!=f['sha256']:bad.append(f['path'])
assert not bad
report={'models':results,'modelCount':len(results),'maxErrorMeters':err,'protectedFiles':len(protected['files']),'modifiedProtected':bad,'precisionMeaning':'Only computational coordinate consistency; historical placement UNKNOWN','oracle':'Independent Python struct decode and scalar 4x4 matrices, no product generator or Three.js'}
(O/'coordinate-oracle.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:v for k,v in report.items()if k!='models'}))
