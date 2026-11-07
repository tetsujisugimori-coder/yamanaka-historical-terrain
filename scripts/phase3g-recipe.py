"""Versioned C shape edits relative to immutable Phase 3F, not archaeological measurements."""
import json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PARAMETERS={
 'version':'phase3g-v1','category':'C','crs':'EPSG:6676',
 'origin':json.loads((ROOT/'public/data/castle.json').read_text())['origin'],
 'units':'metres','axes':{'native':'east,north,up','glTF':'east,up,south'},
 'base':{'commit':'aee4fd10960a345e169caef381b120f3fe3f3ac8','native':'production/phase3f/yamanaka-phase3f.blend','glb':['public/data/phase3f.glb','public/data/phase3f-inner.glb']},
 'patches':[
  {'id':'shoji-moat','model':'phase3g.glb','bounds':[-62,-23,-42,29],'feather':2.5,'pitch':7.0,'ridgeCrownHalfWidth':.4,'slopeRun':2.1,'depth':2.05,'description':'C2 quintic shoulder/toe profile and broader ridge shoulder; inherited ridge centres, bottom depth and 7m pitch retained. C assumptions, not historic measurements.'},
  {'id':'rampart','model':'phase3g.glb','bounds':[-41,-21,-31,27],'feather':2.5,'crestHalfWidth':1.,'slopeRun':3.,'height':2.65,'description':'C2 quintic crest/flank/toe transitions with 2m flat crown; outer bank footprint and height retained. C design assumption.'},
  {'id':'earthbridge','model':'phase3g-inner.glb','bounds':[-96,-39,-72,-20],'feather':3.,'axisNorth':-29,'halfWidth':2.,'crownAddition':.20,'sideToeLowering':.35,'description':'C2 crown and side-toe joins; earth crown reduced by 0.04m at the axis relative to F. Existing passage width and connection boundaries retained.'}],
 'sourceIds':['plan','mishima-moat','mishima-works','mishima-inner'],
 'sourceLedgers':['public/data/nishinomaru-layout.json','public/data/phase3c.json'],
 'provenance':'Project-original bounded C refinements of the saved F native mesh. Source ledgers support context only, not these new geometric assumptions.',
 'uncertainty':'1590 locations, dimensions, reconstruction fidelity and actual-site walkability remain UNKNOWN. B count 0.',
 'appearance':'Neutral inherited material; D appearance remains separate. C2 refers to analytic target profiles; finite triangle meshes remain piecewise planar.',
 'preservation':'F native and GLB originals immutable. All vertex XY and triangle topology retained; only Z inside open patch bounds changes. Outside and perimeter vertices and outside triangles exact. No global subdivision, no new passage or facilities.'}
def clamp(t): return max(0,min(1,t))
def cubic(t):
 t=clamp(t);return t*t*(3-2*t)
def quintic(t):
 t=clamp(t);return t*t*t*(t*(t*6-15)+10)
def weight(e,n,p):
 a,b,c,d=p['bounds'];return quintic(min(e-a,c-e,n-b,d-n)/p['feather'])
def displacement(e,n,kind):
 if kind=='nm':
  p,q=PARAMETERS['patches'][:2]
  ridge=min(abs((e+59+3.5)%7-3.5),abs((n+25+3.5)%7-3.5))
  before=2.05*cubic((ridge-.3)/1.9)
  after=p['depth']*quintic((ridge-p['ridgeCrownHalfWidth'])/p['slopeRun'])
  delta=weight(e,n,p)*(before-after)
  d=abs(e+36);before=2.65*(1-cubic((d-.8)/3.2))
  after=q['height']*(1-quintic((d-q['crestHalfWidth'])/q['slopeRun']))
  return delta+weight(e,n,q)*(after-before)
 p=PARAMETERS['patches'][2];d=abs(n-p['axisNorth'])
 before=.24*(1-cubic(d/2))-.35*cubic(1-abs(d-5)/2)
 after=p['crownAddition']*(1-quintic(d/p['halfWidth']))-p['sideToeLowering']*quintic(1-abs(d-5)/2)
 return weight(e,n,p)*(after-before)
def inside(e,n,kind):
 ps=PARAMETERS['patches'][:2] if kind=='nm' else PARAMETERS['patches'][2:]
 return any(p['bounds'][0]<e<p['bounds'][2] and p['bounds'][1]<n<p['bounds'][3] for p in ps)
