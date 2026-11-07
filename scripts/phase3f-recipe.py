"""C-only, local, topology-preserving terrain edits. No new historical claims."""
import json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PARAMETERS={
 'version':'phase3f-v1','category':'C','crs':'EPSG:6676',
 'origin':json.loads((ROOT/'public/data/castle.json').read_text())['origin'],
 'units':'metres','axes':{'native':'east,north,up','glTF':'east,up,south'},
 'patches':[
  {'id':'shoji-moat','model':'phase3f.glb','bounds':[-62,-23,-42,29],'feather':2.5,'pitch':7.0,'ridgeCrownHalfWidth':.3,'slopeRun':1.9,'depth':2.05,'description':'Round ridge shoulders and bowl toes, deepen cell floors locally; retain all grid cells and perimeter heights.'},
  {'id':'rampart','model':'phase3f.glb','bounds':[-41,-21,-31,27],'feather':2.5,'crestHalfWidth':.8,'slopeRun':3.2,'height':2.65,'description':'Round the C rampart crest and toe using continuous zero-slope shoulders; no additional wall sheet.'},
  {'id':'earthbridge','model':'phase3f-inner.glb','bounds':[-96,-39,-72,-20],'feather':3.0,'axisNorth':-29,'halfWidth':2.0,'crownAddition':.24,'sideToeLowering':.35,'description':'Add a slight earth crown and rounded side-toe depression to the existing four-metre C neck; no wood or new access claim.'}],
 'sourceIds':['plan','mishima-moat','mishima-works','mishima-inner'],
 'sourceLedgers':['public/data/nishinomaru-layout.json','public/data/phase3c.json'],
 'provenance':'Project-original C refinements of existing C meshes. Prior source ledgers support names/context only. No new archaeological, measured or historical dimensional evidence introduced.',
 'uncertainty':'All patch placement, crest widths, slopes, crown and depths are C assumptions. True 1590 dimensions, registration and access remain UNKNOWN. B count 0.',
 'appearance':'Geometry is C. Neutral inherited material only; D lighting, vegetation and appearance remain separate.',
 'preservation':'Old files immutable; copied mesh topology and XY unchanged. Vertices outside open patch rectangles and all patch perimeter vertices bit-identical.'}
def clamp(x):return max(0,min(1,x))
def smooth(x):
 t=clamp(x);return t*t*(3-2*t)
def weight(e,n,p):
 b=p['bounds'];return smooth(min(e-b[0],b[2]-e,n-b[1],b[3]-n)/p['feather'])
def displacement(e,n,kind):
 if kind=='nm':
  p,q=PARAMETERS['patches'][:2];w=weight(e,n,p)
  ridge=min(abs((e+59+3.5)%7-3.5),abs((n+25+3.5)%7-3.5))
  old=.06*(1-math.cos(ridge/.175*math.pi/2)) if ridge<=.175 else min(1.8,.06+(ridge-.175)*math.tan(math.radians(58)))
  new=p['depth']*smooth((ridge-p['ridgeCrownHalfWidth'])/p['slopeRun'])
  delta=w*(old-new)
  # In this narrow rectangle the nearest old bank centreline is E=-36.
  d=abs(e+36);old=2.5*clamp((4-d)/3)
  new=q['height']*(1-smooth((d-q['crestHalfWidth'])/q['slopeRun']))
  return delta+weight(e,n,q)*(new-old)
 p=PARAMETERS['patches'][2];d=abs(n-p['axisNorth'])
 crown=p['crownAddition']*(1-smooth(d/p['halfWidth']))
 toe=p['sideToeLowering']*smooth(1-abs(d-5)/2)
 return weight(e,n,p)*(crown-toe)
def inside(e,n,kind):
 ps=PARAMETERS['patches'][:2] if kind=='nm' else PARAMETERS['patches'][2:]
 return any(p['bounds'][0]<e<p['bounds'][2] and p['bounds'][1]<n<p['bounds'][3] for p in ps)
if __name__=='__main__':
 (ROOT/'production/phase3f/parameters.json').write_text(json.dumps(PARAMETERS,ensure_ascii=False,indent=2)+'\n')
