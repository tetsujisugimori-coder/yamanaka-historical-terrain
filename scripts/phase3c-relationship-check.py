"""Experience geometry: exact GLB triangle/segment intersections, not recipe heights."""
import runpy,json,math,copy,hashlib
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
s=runpy.run_path(str(ROOT/'scripts/phase3c-geometry-check.py'))
read,height=s['read'],s['height'];nodes=s['new'];r=s['r'];b=r['bounds']
def ray_clearance(nodes,start,end):
    # Barycentric clipping of the projected ray into every actual triangle.
    # Height minus its planar surface is affine in t: extrema are at interval ends.
    tri=np.concatenate([x['tri'] for x in nodes]);a=tri[:,0,:2];c=tri[:,1,:2]-a;d=tri[:,2,:2]-a
    begin=np.array(start);delta=np.array(end)-begin;q=begin[:2]-a
    det=c[:,0]*d[:,1]-d[:,0]*c[:,1]
    u0=(q[:,0]*d[:,1]-d[:,0]*q[:,1])/det;v0=(c[:,0]*q[:,1]-q[:,0]*c[:,1])/det
    du=(delta[0]*d[:,1]-d[:,0]*delta[1])/det;dv=(c[:,0]*delta[1]-delta[0]*c[:,1])/det
    lo=np.zeros(len(tri));hi=np.ones(len(tri));valid=np.ones(len(tri),dtype=bool)
    for c0,k in [(u0,du),(v0,dv),(1-u0-v0,-du-dv)]:
        pos=k>1e-12;neg=k<-1e-12;zero=~(pos|neg)
        lo[pos]=np.maximum(lo[pos],-c0[pos]/k[pos]);hi[neg]=np.minimum(hi[neg],-c0[neg]/k[neg]);valid[zero&(c0<-1e-8)]=False
    valid&=lo<=hi+1e-8;valid&=(hi>=0)&(lo<=1)
    lo=np.clip(lo[valid],0,1);hi=np.clip(hi[valid],0,1);tt=tri[valid]
    h0=tt[:,0,2]+u0[valid]*(tt[:,1,2]-tt[:,0,2])+v0[valid]*(tt[:,2,2]-tt[:,0,2])
    dh=du[valid]*(tt[:,1,2]-tt[:,0,2])+dv[valid]*(tt[:,2,2]-tt[:,0,2])
    clo=begin[2]+lo*delta[2]-(h0+lo*dh);chi=begin[2]+hi*delta[2]-(h0+hi*dh)
    clearance=np.minimum(clo,chi);j=int(np.argmin(clearance));t=float(lo[j] if clo[j]<=chi[j] else hi[j])
    return dict(minimumVerticalClearance=float(clearance[j]),atFraction=t,visible=bool(clearance.min()>0),triangleIntervals=int(valid.sum()))
def bridge_grade(nodes,north):
    profiles=[]
    for n in [north-2,north-1,north,north+1,north+2]:
        es=np.arange(b[0],b[2]+.125,.25);hs=[height(nodes,e,n) for e in es];grades=np.abs(np.diff(hs)/.25)
        profiles.append(dict(north=n,maxLongitudinalGrade=float(grades.max()),rise=float(hs[-1]-hs[0]),length=float(es[-1]-es[0])))
    return profiles
stations={x['id']:x for x in r['stations']}
def eye(id):
 st=stations[id];e,n=st['eye'];return [e,n,height(nodes,e,n)+st['eyeHeight']]
def ray(id,target):
 target=[*target,height(nodes,*target)+.2]
 return dict(fromStation=id,target=target,**ray_clearance(nodes,eye(id),target))
grade=bridge_grade(nodes,-29);assert max(x['maxLongitudinalGrade'] for x in grade)<=.5001
tri=np.concatenate([x['tri'] for x in nodes]);neck=tri[(tri[:,:,1].min(1)>=-31)&(tri[:,:,1].max(1)<=-27)]
a=neck[:,1]-neck[:,0];d=neck[:,2]-neck[:,0];longitudinal=(a[:,2]*d[:,1]-d[:,2]*a[:,1])/(a[:,0]*d[:,1]-d[:,0]*a[:,1])
maximum_triangle_grade=float(np.abs(longitudinal).max());assert maximum_triangle_grade<=.5001

lookout=stations['ic-lookout']['eye'];gate=next(x['local'] for x in r['elements'] if x['id']=='ic-koguchi');distance=math.dist(lookout,gate);assert distance<20
rays=[ray('ic-lookout',q) for q in [(-77,-29),(-85,-29),(-92,-29)]]
assert all(x['minimumVerticalClearance']>=.19 for x in rays)
# Opposite sides of the SAME gateway differ in visibility of the same lower point.
contrast=[ray('ic-koguchi',(-75,-35)),ray('ic-koguchi-inside',(-75,-35))]
assert contrast[0]['minimumVerticalClearance']<-.1 and contrast[1]['minimumVerticalClearance']>.19
# Camera framing is measured in angular terms, not claimed as screenshot evidence.
look=stations['ic-lookout'];origin=np.array(eye('ic-lookout'));target=np.array([*look['look'],origin[2]-look['lookDown']]);forward=target-origin;forward/=np.linalg.norm(forward)
up=np.array([0.,0.,1.]);right=np.cross(forward,up);right/=np.linalg.norm(right);up=np.cross(right,forward)
framing=[]
for rayinfo in rays:
 v=np.array(rayinfo['target'])-origin;front=float(v@forward);horizontal=math.degrees(math.atan2(float(v@right),front));vertical=math.degrees(math.atan2(float(v@up),front))
 framing.append(dict(target=rayinfo['target'],horizontalAngle=horizontal,verticalAngle=vertical))
# Accept nominal375x520 viewport with70deg vertical FOV; actual responsive browser still required.
half_horizontal=math.degrees(math.atan(math.tan(math.radians(look['fov']/2))*375/520))
assert all(abs(x['horizontalAngle'])<half_horizontal and abs(x['verticalAngle'])<look['fov']/2 for x in framing)
bridge_ray=ray('ic-bridge',(-77,-29));assert bridge_ray['minimumVerticalClearance']>=.19
# The gateway and bank-back point are in each opposing station's initial frame.
# This checks direction/framing only: the attacker point must remain occluded.
gateway_framing=[]
for stid in ['ic-koguchi','ic-koguchi-inside']:
    st=stations[stid]
    for scale in [1,2]:
        e,n=st['eye'];origin=np.array([e,n,height(nodes,e,n)*scale+st['eyeHeight']])
        target_y=(st['lookTargetHeight']-st['lookHeightOffset'])*scale+st['lookHeightOffset']
        target=np.array([*st['look'],target_y]);f=target-origin;f/=np.linalg.norm(f);right=np.cross(f,np.array([0.,0.,1.]));right/=np.linalg.norm(right);up=np.cross(right,f)
        half_h=math.degrees(math.atan(math.tan(math.radians(st['fov']/2))*375/520));angles=[]
        for tx,ty in [(-77,-29),(-75,-35)]:
            v=np.array([tx,ty,height(nodes,tx,ty)*scale+.2])-origin;front=float(v@f);ha=math.degrees(math.atan2(float(v@right),front));va=math.degrees(math.atan2(float(v@up),front));angles.append(dict(target=[tx,ty],horizontal=ha,vertical=va))
            assert front>0 and abs(ha)<half_h and abs(va)<st['fov']/2,('gateway initial frame',stid,scale,ha,va)
        gateway_framing.append(dict(station=stid,scale=scale,targets=angles))
# Repeat exact clearances with visual2x height, fixed1.7m eye and0.2m target offset.
scaled=copy.deepcopy(nodes)
for node in scaled:node['tri'][:,:,2]*=2
rays2=[]
for rayinfo in rays:
    st=stations[rayinfo['fromStation']];e,n=st['eye'];tx,ty,_=rayinfo['target']
    start=[e,n,height(scaled,e,n)+st['eyeHeight']];end=[tx,ty,height(scaled,tx,ty)+.2]
    result2=ray_clearance(scaled,start,end);assert result2['minimumVerticalClearance']>=.05
    rays2.append(dict(fromStation=st['id'],target=end,**result2))
contrast2=[]
for stid in ['ic-koguchi','ic-koguchi-inside']:
    st=stations[stid];e,n=st['eye'];result2=ray_clearance(scaled,[e,n,height(scaled,e,n)+st['eyeHeight']],[-75,-35,height(scaled,-75,-35)+.2]);contrast2.append(dict(fromStation=stid,**result2))
assert not contrast2[0]['visible'] and contrast2[1]['visible']
old=read(str(ROOT/'evidence/phase3c/history/v1-production/phase3c.glb'));old_r=json.loads((ROOT/'evidence/phase3c/history/v1-production/phase3c.json').read_text())
old_grade=bridge_grade(old,-35);old_distance=math.dist(next(x['eye'] for x in old_r['stations'] if x['id']=='ic-lookout'),next(x['local'] for x in old_r['elements'] if x['id']=='ic-koguchi'))
assert old_distance>20 and max(x['maxLongitudinalGrade'] for x in old_grade)>.5
# Reintroduce the old steep surface under the new gate: grade check must reject.
negative_grade=max(x['maxLongitudinalGrade'] for x in bridge_grade(old,-29))>.5;assert negative_grade
# A deliberately lowered lookout eye must not pass the required bridge sightline.
low=eye('ic-lookout');low[2]-=10;blocked=ray_clearance(nodes,low,rays[0]['target']);assert not blocked['visible']
report=dict(status='PASS',modelVersion='phase3c-v2',scope='model-only relation and visual geometry, not historical walkability or quantified military effectiveness',lookoutStationGateHorizontalDistance=distance,lookoutFeatureGateHorizontalDistance=math.dist(next(x['local'] for x in r['elements'] if x['id']=='ic-lookout'),gate),bridgeProfiles=grade,entireBridgeNeckTriangleGradient=dict(triangles=len(neck),maximumLongitudinalGrade=maximum_triangle_grade),lookoutSightlines=rays,bridgeToGateSightline=bridge_ray,gatewayInitialFraming=gateway_framing,opposingGatewaySightlines=contrast,twoTimesExaggeration=dict(lookoutSightlines=rays2,opposingGatewaySightlines=contrast2),framing=dict(nominalViewport=[375,520],verticalFov=look['fov'],horizontalHalfFov=half_horizontal,targets=framing),oldRed=dict(status='REJECTED',reason='v1 experience defects, not historical truth error',lookoutGateDistance=old_distance,bridgeProfiles=old_grade),newGreen=True,reintroducedFaults=dict(oldCliffRejected=negative_grade,loweredLookoutRejected=not blocked['visible']),glbSha256=hashlib.sha256((ROOT/'public/data/phase3c.glb').read_bytes()).hexdigest())
(ROOT/'evidence/phase3c/geometry/relationships.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2))
