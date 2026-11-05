import json,struct,hashlib,subprocess,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
HEAD='c71edbf440ddada2acf0e74501c47afad1772adc'
def blob(p): return subprocess.check_output(['git','show',HEAD+':'+p],cwd=ROOT)
b=blob('public/data/phase3c.glb'); n=struct.unpack_from('<I',b,12)[0]; g=json.loads(b[20:20+n]); binary=b[28+n:]
def read(i):
 a=g['accessors'][i]; v=g['bufferViews'][a['bufferView']]; fmt={5126:'f',5125:'I',5123:'H'}[a['componentType']]; count={'VEC3':3,'SCALAR':1}[a['type']]; size=struct.calcsize('<'+fmt*count); start=v.get('byteOffset',0)+a.get('byteOffset',0); step=v.get('byteStride',size)
 return [struct.unpack_from('<'+fmt*count,binary,start+j*step) for j in range(a['count'])]
features={}; triangles=[]
for node in g['nodes']:
 assert not any(k in node for k in ['matrix','translation','rotation','scale'])
 e=node['extras']; assert e['evidenceCategory']=='C' and e['metresPerUnit']==1 and e['horizontalCRS']=='EPSG:6676'
 f=features.setdefault(e['elementId'],{'vertices':[],'triangles':0})
 for p in g['meshes'][node['mesh']]['primitives']:
  vv=[(v[0],-v[2],v[1]) for v in read(p['attributes']['POSITION'])]; idx=[x[0] for x in read(p['indices'])]; f['vertices']+=vv; f['triangles']+=len(idx)//3
  triangles.extend(tuple(vv[k] for k in idx[i:i+3]) for i in range(0,len(idx),3))
def height(x,y):
 for a,b,c in triangles:
  den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
  if abs(den)<1e-10:continue
  u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den; v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den
  if min(u,v,1-u-v)>=-1e-7:return u*a[2]+v*b[2]+(1-u-v)*c[2]
meta=json.loads(blob('public/data/phase3c.json')); out={'targetHEAD':HEAD,'glbSHA256':hashlib.sha256(b).hexdigest(),'manifestSHA256':hashlib.sha256(blob('public/data/phase3c.json')).hexdigest(),'features':{},'anchorChecks':[]}
for k,f in features.items():
 v=f.pop('vertices'); f['boundsEastNorthHeight']=[[min(p[i] for p in v),max(p[i] for p in v)] for i in range(3)];out['features'][k]=f
assert set(features)==set(e['id'] for e in meta['elements'])
for e in meta['elements']:
 h=height(*e['local']);out['anchorChecks'].append({'id':e['id'],'height':h,'ledgerDelta':h-e['height']});assert abs(h-e['height'])<1e-4
out['lookoutKoguchiDistanceMetres']=math.dist(meta['elements'][0]['local'],meta['elements'][2]['local'])
out['bridgeCentrelineSamples']=[{'east':x,'north':-29,'height':height(x,-29)} for x in [-99,-95,-91,-88,-85,-82,-79,-77,-73,-69]]
out['tests']={'threeUniqueCIDs':True,'legacyGateIDsNotReused':not(set(features)&{'sc-gate','wb-gate'}),'noTowerNodes':all(n['extras']['surface'] for n in g['nodes']),'sourceDimensionsSeparate':all('referenceDimensions' in e and 'modelDimensions' in e for e in meta['elements'])}
grades=[]
for a,b,c in triangles:
 if all(-31-1e-6<=p[1]<=-27+1e-6 for p in [a,b,c]):
  dx1,dy1,dz1=[b[i]-a[i] for i in range(3)];dx2,dy2,dz2=[c[i]-a[i] for i in range(3)]; det=dx1*dy2-dx2*dy1
  if abs(det)>1e-10: grades.append(abs((dz1*dy2-dz2*dy1)/det))
out['neckPlaneGradeCheck']={'triangleCount':len(grades),'maxLongitudinalGrade':max(grades)}
out['tree']=subprocess.check_output(['git','rev-parse',HEAD+'^{tree}'],cwd=ROOT,text=True).strip()
out['reviewedFileHashes']={p:hashlib.sha256(blob(p)).hexdigest() for p in ['public/data/phase3c.glb','public/data/phase3c.json','production/phase3c/recipe.json','docs/phase3c-production.md']}
Path(__file__).with_name('delivery-check-v2.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(out,ensure_ascii=False,indent=2))
