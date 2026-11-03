"""Independent editable hypothesis parameters. No report image tracing.
Coordinates are local E/N metres; absolute EPSG:6676 origin is in castle.json.
The shared analytic surface is sampled by QGIS and meshed by Blender.
"""
import math, struct
SHIFT = (130,-50) # C placement alternative: DEM shoulder, not old flank anchor.
def shifted(b): return [b[0]+SHIFT[0],b[1]+SHIFT[1],b[2]+SHIFT[0],b[3]+SHIFT[1]]
BOUNDS = shifted([-210, 0, -100, 105])
PLATEAU = shifted([-160, 30, -120, 75])
LOCAL_MOAT = [-192, 24, -172, 82]
MOAT = shifted(LOCAL_MOAT)
PITCH = 7.0  # Hypothesis, not a measured Yamanaka cell pitch.

def f32(x): return struct.unpack('f',struct.pack('f',x))[0]
def clamp(x): return max(0,min(1,x))
def smooth(x):
 t=clamp(x); return t*t*(3-2*t)
def triangle_height(g,e,n):
 c=(e-g['bounds'][0])/g['step']; r=(g['bounds'][3]-n)/g['step']
 c0=min(g['cols']-2,max(0,math.floor(c))); r0=min(g['rows']-2,max(0,math.floor(r)))
 u,v=c-c0,r-r0; a=g['heights']; h00,h10,h01,h11=[f32(x) for x in [a[r0][c0],a[r0][c0+1],a[r0+1][c0],a[r0+1][c0+1]]]
 return h00+u*(h10-h00)+v*(h01-h00) if u+v<=1 else h11+(1-u)*(h01-h11)+(1-v)*(h10-h11)
def rect_weight(e,n,b,feather):
 return smooth(min(e-b[0],b[2]-e,n-b[1],b[3]-n)/feather)
def point_segment(e,n,a,b):
 dx,dy=b[0]-a[0],b[1]-a[1]; t=clamp(((e-a[0])*dx+(n-a[1])*dy)/(dx*dx+dy*dy))
 return math.hypot(e-a[0]-t*dx,n-a[1]-t*dy)
def elevation(g,e,n):
 ref=triangle_height(g,e,n)
 e-=SHIFT[0];n-=SHIFT[1]
 # Gently sloped working platform and a lower access apron, both C.
 level=triangle_height(g,-145+SHIFT[0],50+SHIFT[1])
 w=rect_weight(e,n,[-200,10,-105,95],8)
 base=ref*(1-w)+(level+.008*(n-50))*w
 # The south-east passage rises 2m over 15m to the platform.
 pathw=rect_weight(e,n,[-134,10,-110,40],4)
 base-=2*(1-smooth((n-12)/20))*pathw
 d=min(point_segment(e,n,(-166,28),(-166,78)),point_segment(e,n,(-166,78),(-118,78)),point_segment(e,n,(-166,28),(-140,28)))
 bank=2.5*clamp((4-d)/3) # assumed 8m base / 2m crest / 2.5m high
 mw=rect_weight(e,n,LOCAL_MOAT,2)
 ridge=min(abs((e+189+3.5)%PITCH-3.5),abs((n-25+3.5)%PITCH-3.5))
 drop=.06*(1-math.cos(ridge/.175*math.pi/2)) if ridge<=.175 else min(1.8,.06+(ridge-.175)*math.tan(math.radians(58)))
 return base+bank-drop*mw
def component(e,n):
 if MOAT[0]<=e<=MOAT[2] and MOAT[1]<=n<=MOAT[3]: return 'nm-moat'
 if PLATEAU[0]<=e<=PLATEAU[2] and PLATEAU[1]<=n<=PLATEAU[3]:
  if not(-134+SHIFT[0]<=e<=-110+SHIFT[0] and 10+SHIFT[1]<=n<=40+SHIFT[1]):return 'nm-bailey'
 e-=SHIFT[0];n-=SHIFT[1]
 if min(point_segment(e,n,(-166,28),(-166,78)),point_segment(e,n,(-166,78),(-118,78)),point_segment(e,n,(-166,28),(-140,28)))<4.5: return 'nm-rampart'
 if -134<=e<=-110 and 10<=n<=40: return 'nm-passage'
 return 'nm-transition'
