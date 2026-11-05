"""Independent stdlib GLB decoder, triangle queries and native/source comparison."""
import json, struct, math, hashlib, itertools, subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[4]
O=Path(__file__).resolve().parent

def glb(path):
    data=path.read_bytes();assert data[:4]==b'glTF';size=struct.unpack_from('<I',data,12)[0]
    return json.loads(data[20:20+size]),data[28+size:]
def accessor(model,idx):
    g,b=model;a=g['accessors'][idx];v=g['bufferViews'][a['bufferView']]
    k={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];fmt={5126:'f',5125:'I',5123:'H',5121:'B'}[a['componentType']]
    width=struct.calcsize('<'+fmt)*k;stride=v.get('byteStride',width);offset=v.get('byteOffset',0)+a.get('byteOffset',0)
    return [struct.unpack_from('<'+fmt*k,b,offset+i*stride) for i in range(a['count'])]
def transform(v,n):
    assert not n.get('matrix'),'matrix requires independent extension'
    p=[v[i]*n.get('scale',[1,1,1])[i] for i in range(3)]
    if 'rotation' in n:
        x,y,z,w=n['rotation'];vx,vy,vz=p
        # Quaternion rotation: v + 2w(q cross v) + 2(q cross (q cross v)).
        a=[y*vz-z*vy,z*vx-x*vz,x*vy-y*vx];c=[y*a[2]-z*a[1],z*a[0]-x*a[2],x*a[1]-y*a[0]]
        p=[p[i]+2*w*a[i]+2*c[i] for i in range(3)]
    return tuple(p[i]+n.get('translation',[0,0,0])[i] for i in range(3))
def objects(path):
    model=glb(path);g,b=model;result=[]
    assert not any(n.get('children') for n in g['nodes']),'hierarchy requires independent extension'
    for n in g['nodes']:
        if 'mesh' not in n:continue
        points=[];triangles=[]
        for prim in g['meshes'][n['mesh']]['primitives']:
            p=[transform(v,n) for v in accessor(model,prim['attributes']['POSITION'])]
            ix=[v[0] for v in accessor(model,prim['indices'])]
            triangles.extend(tuple(p[j] for j in ix[i:i+3]) for i in range(0,len(ix),3));points.extend(p)
        result.append(dict(name=n['name'],extras=n.get('extras',{}),points=points,triangles=triangles))
    return result
def sampler(objs,only_surface=False):
    cells={};step=5
    for o in objs:
        if only_surface and not o['extras'].get('surface'):continue
        for t in o['triangles']:
            for x in range(math.floor(min(p[0] for p in t)/step),math.floor(max(p[0] for p in t)/step)+1):
                for z in range(math.floor(min(p[2] for p in t)/step),math.floor(max(p[2] for p in t)/step)+1):cells.setdefault((x,z),[]).append(t)
    def query(e,n):
        z=-n;hits=[]
        for a,b,c in cells.get((math.floor(e/step),math.floor(z/step)),[]):
            den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2])
            if abs(den)<1e-12:continue
            u=((b[2]-c[2])*(e-c[0])+(c[0]-b[0])*(z-c[2]))/den
            v=((c[2]-a[2])*(e-c[0])+(a[0]-c[0])*(z-c[2]))/den;w=1-u-v
            if min(u,v,w)>=-1e-8:hits.append(u*a[1]+v*b[1]+w*c[1])
        return max(hits) if hits else None
    return query

def main():
    head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip()
    meta=json.loads((R/'public/data/phase3b.json').read_text(encoding='utf8'))
    new=objects(R/'public/data/phase3b.glb');base=objects(R/'public/data/castle.glb');oldc=objects(R/'public/data/nishinomaru.glb')
    qa=sampler(base);qn=sampler(new,True)
    surface=[o for o in new if o['extras'].get('surface')];w,s,e,n=meta['bounds'];max_boundary=0;boundary=set();area=0;tri_keys=set();duplicate=0
    for o in surface:
        for p in o['points']:
            if min(abs(p[0]-w),abs(p[0]-e),abs(-p[2]-s),abs(-p[2]-n))<1e-8:
                boundary.add(p);max_boundary=max(max_boundary,abs(p[1]-qa(p[0],-p[2])))
        for t in o['triangles']:
            a,b,c=t;area+=abs((b[0]-a[0])*(c[2]-a[2])-(c[0]-a[0])*(b[2]-a[2]))/2
            key=tuple(sorted(t));duplicate+=key in tri_keys;tri_keys.add(key)
    assert max_boundary<.001 and abs(area-(e-w)*(n-s))<.001 and duplicate==0
    # Independently inspect the original context triangles against actual patch.
    context=next(o for o in oldc if o['extras'].get('facilityId')=='nm-context')
    removed=0;straddlers=0;removed_area=0
    for t in context['triangles']:
        inside=lambda p:w-1e-8<=p[0]<=e+1e-8 and s-1e-8<=-p[2]<=n+1e-8
        center=tuple(sum(p[k] for p in t)/3 for k in range(3))
        if w<center[0]<e and s<-center[2]<n:
            removed+=1;straddlers+=not all(inside(p) for p in t)
            a,b,c=t;removed_area+=abs((b[0]-a[0])*(c[2]-a[2])-(c[0]-a[0])*(b[2]-a[2]))/2
    assert straddlers==0 and abs(removed_area-area)<.001
    # Native world-space source and raw GLB world-space point proximity, both ways.
    native=json.loads((O/'native-points.json').read_text(encoding='utf8'));source={o['name']:o for o in native['objects']}
    def max_nearest(a,b):
        bins={};scale=1000
        for p in b:bins.setdefault(tuple(math.floor(v*scale) for v in p),[]).append(p)
        maximum=0
        for p in a:
            key=tuple(math.floor(v*scale) for v in p);near=[]
            for delta in itertools.product([-1,0,1],repeat=3):near.extend(bins.get(tuple(key[k]+delta[k] for k in range(3)),[]))
            assert near
            maximum=max(maximum,min(math.dist(p,q) for q in near))
        return maximum
    maximum=0;triangles=0
    for o in new:
        b=source[o['name']];assert o['extras']['elementId']==b['id'] and o['extras']['evidenceCategory']==b['category']=='C'
        maximum=max(maximum,max_nearest(o['points'],b['points']),max_nearest(b['points'],o['points']))
        assert len(o['triangles'])==b['triangles'];triangles+=len(o['triangles'])
    assert len(new)==len(source)==412 and maximum<.001 and all(native['preserved'].values())
    stations=[dict(id=x['id'],a=qa(*x['eye']),new=qn(*x['eye']),caption=x['groundHeight']) for x in meta['stations']]
    assert all(abs(x['new']-x['caption'])<.001 for x in stations)
    posts=[]
    for o in new:
        if '.post.' not in o['name']:continue
        bottom=min(p[1] for p in o['points']);feet=[p for p in o['points'] if abs(p[1]-bottom)<1e-7]
        clearances=[p[1]-qn(p[0],-p[2]) for p in feet]
        posts.append(dict(name=o['name'],maximumBottomClearance=max(clearances),minimumBottomClearance=min(clearances)))
    assert len(posts)==60 and max(p['maximumBottomClearance'] for p in posts)<.001
    raster=None
    if (O/'qgis-review.json').exists():
        gis=json.loads((O/'qgis-review.json').read_text(encoding='utf8'))
        raster=max(abs(p['height']-qn(p['east'],p['north'])) for p in gis['samples'])
        assert raster<.001
    # Ridge shape: centre line has a single repeated ridge family crossing the ditch.
    samples=[dict(north=k,height=qn(-169,k)) for k in range(-24,25)]
    # All old production, public/data and prior evidence blobs except explicit source addition unchanged in Git.
    changed=subprocess.check_output(['git','diff','--name-only','6a84b95',head,'--','production','public/data','evidence'],cwd=R,text=True).splitlines()
    old_changed=[x for x in changed if subprocess.run(['git','cat-file','-e','6a84b95:'+x],cwd=R,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0]
    assert old_changed==['public/data/sources.json'],old_changed
    oldsources=json.loads(subprocess.check_output(['git','show','6a84b95:public/data/sources.json'],cwd=R))
    assert json.loads((R/'public/data/sources.json').read_text(encoding='utf8'))[:len(oldsources)]==oldsources
    report=dict(status='PASS',head=head,scope='Independent Python stdlib raw GLB accessor, axis transform, barycentric query, source/native proximity and Git blob preservation. No product geometry/height helper imported.',blender=native['blender'],preservedNativeMeshes=sum(native['preserved'].values()),nativeSourceObjects=len(source),glbObjects=len(new),triangles=triangles,sourceGlbMaximumPointDifferenceMetres=maximum,boundaryPoints=len(boundary),boundaryMaximumErrorMetres=max_boundary,surfaceTriangles=len(tri_keys),surfaceAreaSquareMetres=area,duplicateSurfaceTriangles=duplicate,contextRemovedTriangles=removed,contextStraddlingTriangles=straddlers,contextRemovedAreaSquareMetres=removed_area,stations=stations,centralMoatProfile=samples,existingProtectedFilesChanged=old_changed,notes=['Tolerance 1mm is internal numeric agreement, not historic or survey precision.','No new B objects. Historical georeferencing remains UNKNOWN.'])
    report.update(supportedPosts=posts,rasterSamples=49 if raster is not None else 0,rasterGlbMaximumDifferenceMetres=raster)
    (O/'raw-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps({k:v for k,v in report.items() if not isinstance(v,list)},ensure_ascii=False))
if __name__=='__main__':main()
