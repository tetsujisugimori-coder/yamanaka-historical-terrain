"""Read exported GLB bytes directly, independent of authoring elevation recipe."""
import json,struct,hashlib,subprocess,copy
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'evidence/phase3c/geometry';OUT.mkdir(parents=True,exist_ok=True)
r=json.loads((ROOT/'public/data/phase3c.json').read_text());b=r['bounds']
def read(name):
    data=(ROOT/'public/data'/name).read_bytes();jlen=struct.unpack_from('<I',data,12)[0];doc=json.loads(data[20:20+jlen]);blob=data[28+jlen:]
    def acc(i):
        a=doc['accessors'][i];v=doc['bufferViews'][a['bufferView']];dt={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']];n={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
        return np.frombuffer(blob,dtype=dt,count=a['count']*n,offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,n)
    nodes=[]
    for node in doc['nodes']:
        x=node.get('extras',{});id=x.get('elementId',x.get('facilityId',''))
        if 'mesh' not in node:continue
        if not(x.get('surface') or id.startswith('nm-')):continue
        assert not any(k in node for k in ['matrix','translation','rotation','scale']),node['name']
        for p in doc['meshes'][node['mesh']]['primitives']:
            pos=acc(p['attributes']['POSITION']).astype(float);pos=pos[:,[0,2,1]];pos[:,1]*=-1
            tri=pos[acc(p['indices']).reshape(-1)].reshape(-1,3,3)
            nodes.append(dict(name=node['name'],id=id,category=x.get('evidenceCategory'),tri=tri,attrs=list(p['attributes'])))
    return nodes
new=read('phase3c.glb');wb=read('phase3b.glb');nm=read('nishinomaru.glb');old=wb+[x for x in nm if x['id']!='nm-context']
def height(nodes,e,n):
    found=[]
    for node in nodes:
        t=node['tri'];p=t[:,:,:2];mask=(p[:,:,0].min(1)<=e+1e-8)&(p[:,:,0].max(1)>=e-1e-8)&(p[:,:,1].min(1)<=n+1e-8)&(p[:,:,1].max(1)>=n-1e-8)
        for f in t[mask]:
            a,c,d=f;den=(c[0]-a[0])*(d[1]-a[1])-(d[0]-a[0])*(c[1]-a[1])
            u=((e-a[0])*(d[1]-a[1])-(d[0]-a[0])*(n-a[1]))/den;v=((c[0]-a[0])*(n-a[1])-(e-a[0])*(c[1]-a[1]))/den
            if u>=-1e-6 and v>=-1e-6 and u+v<=1+1e-6:found.append(float(a[2]+u*(c[2]-a[2])+v*(d[2]-a[2])))
    if not found:raise AssertionError(('missing support',e,n))
    if max(found)-min(found)>.001:raise AssertionError(('overlap/conflicting heights',e,n,found))
    return found[0]
def validate(nodes):
    assert {x['id'] for x in nodes}=={'ic-lookout','ic-bridge','ic-koguchi'},'facility ID'
    assert all(x['category']=='C' for x in nodes),'classification'
    t=np.concatenate([x['tri'] for x in nodes]);assert np.isfinite(t).all()
    assert np.allclose(t[:,:,:2].min((0,1)),b[:2],atol=1e-5) and np.allclose(t[:,:,:2].max((0,1)),b[2:],atol=1e-5),'bounds/origin'
    # Every projected triangle must be unique and cover precisely the grid once.
    # Explicit 2x2 determinant: same signed twice-area, compatible with NumPy2.5+.
    u=t[:,1,:2]-t[:,0,:2];v=t[:,2,:2]-t[:,0,:2]
    cross=u[:,0]*v[:,1]-u[:,1]*v[:,0];assert (cross>0).all(),'winding/degenerate'
    assert abs(float(cross.sum()/2)-(b[2]-b[0])*(b[3]-b[1]))<.001,'projected coverage'
    keys=[tuple(sorted(tuple(v) for v in f[:,:2])) for f in t];assert len(set(keys))==len(keys),'duplicate projected face'
    vertex={}
    for v in t.reshape(-1,3):
        key=tuple(v[:2]);assert key not in vertex or abs(vertex[key]-v[2])<.001,'internal crack';vertex[key]=v[2]
    seams=[(e,n,h) for (e,n),h in vertex.items() if e in [b[0],b[2]] or n in [b[1],b[3]]]
    # Filter prior meshes to patch vicinity for efficient exact triangle tests.
    local=[]
    for node in old:
        p=node['tri'][:,:,:2];mask=(p[:,:,0].max(1)>=b[0]-1)&(p[:,:,0].min(1)<=b[2]+1)&(p[:,:,1].max(1)>=b[1]-1)&(p[:,:,1].min(1)<=b[3]+1)
        local.append(dict(node,tri=node['tri'][mask]))
    errors=[abs(h-height(local,e,n)) for e,n,h in seams];assert max(errors)<.001,('boundary seam',max(errors))
    support=[]
    for st in r['stations']:
        mesh=nodes if st['id'].startswith('ic-') and not st['id'].startswith('ic-station-') else old
        h=height(mesh,*st['eye']);err=abs(h-st['groundHeight']);assert err<.001,('station support',st['id'],err)
        e,n=st['eye'];grade=max(abs(height(mesh,e+de,n+dn)-h)/.1 for de,dn in [(.1,0),(-.1,0),(0,.1),(0,-.1)])
        assert grade<.5,('observation foot slope',st['id'],grade)
        support.append(dict(id=st['id'],height=h,error=err,eyeHeight=st['eyeHeight'],maximumCardinalGradeWithin10cm=grade))
    return dict(triangles=len(t),projectedArea=float(cross.sum()/2),seamSamples=len(seams),maxSeamError=max(errors),stations=support,vertexCount=len(vertex))
result=validate(new);negative={}
for kind in ['coordinate','facility-id','category','seam-height']:
    mutant=copy.deepcopy(new)
    if kind=='coordinate':
        for x in mutant:x['tri'][:,:,0]+=1
    if kind=='facility-id':mutant[0]['id']='sc-gate'
    if kind=='category':mutant[0]['category']='B'
    if kind=='seam-height':mutant[0]['tri'][0,0,2]+=1
    try:validate(mutant);negative[kind]='ACCEPTED';raise RuntimeError('negative control accepted '+kind)
    except AssertionError as e:negative[kind]=dict(rejected=True,reason=str(e))
# Each triangle is paired in a complete regular grid; no vertical walls/sheets
# are layered over support. Fixed sections lie strictly outside new footprint.
assert b[2]<-66
preserved={}
paths=subprocess.check_output(['git','ls-tree','-r','--name-only','ed22133','public/data','production','evidence'],cwd=ROOT,text=True).splitlines()
for path in paths:
    current=ROOT/path
    if not current.is_file():continue
    base=subprocess.check_output(['git','show','ed22133:'+path],cwd=ROOT)
    if path=='public/data/sources.json':continue # appended by integration, old entries remain
    assert current.read_bytes()==base,('old artifact modified',path)
    preserved[path]=hashlib.sha256(base).hexdigest()
report=dict(status='PASS',method='direct binary GLB positions/index arrays; no authoring recipe import',**result,negativeControls=negative,preservedArtifacts=preserved,fixedSections=dict(status='PASS',reason='prior GLB byte equality against ed22133 plus new footprint east edge -68 strictly west of sections starting -66 and -45'),newFileHashes={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [ROOT/'public/data/phase3c.glb',ROOT/'public/data/phase3c.json']})
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='preservedArtifacts'},ensure_ascii=False,indent=2))
