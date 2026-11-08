"""Bounded H expansion from immutable G native meshes. All dimensions are C hypotheses."""
import json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PARAMETERS={
 'version':'phase3h-v1','category':'C','crs':'EPSG:6676',
 'origin':json.loads((ROOT/'public/data/castle.json').read_text())['origin'],
 'units':'metres','axes':{'native':'east,north,up','glTF':'east,up,south'},
 'base':{'commit':'3b08613682c794f50d90ef81b8a41170f40f8476','native':'production/phase3g/yamanaka-phase3g.blend','glb':['public/data/phase3g.glb','public/data/phase3g-inner.glb']},
 'patches':[
 {'id':'moat-expanded-shoulders','model':'phase3h.glb','bounds':[-66,-27,-40,33],'feather':3,'description':'C expanded ridge shoulder and toe joins beyond G bounds; inherited 7m grid and defensive step remain. Not measured dimensions.'},
 {'id':'rampart-expanded-toes','model':'phase3h.glb','bounds':[-43,-25,-29,31],'feather':3,'description':'C slightly wider slope-to-ground blend extending G bank extremities, preserving crest and moat relief.'},
 {'id':'bridge-bailey-koguchi-link','model':'phase3h-inner.glb','bounds':[-99,-43,-69,5],'feather':3,'description':'C continuous extension from bridge to inner approach: eased shoulders and bounded low crown, no new route or gate created.'}],
 'sourceIds':['plan','mishima-moat','mishima-works','mishima-inner'],
 'sourceLedgers':['public/data/nishinomaru-layout.json','public/data/phase3c.json'],
 'provenance':'Project-original bounded extension of G hypotheses. Source references are context, not evidence of newly chosen dimensions.',
 'uncertainty':'1590 shape, dimension, vegetation and real-site route remain UNKNOWN. No B promotion.',
 'appearance':'Separate H procedural D surface/low vegetation recipe; native C geometry has inherited neutral material.',
 'preservation':'All A/G originals immutable. XY and topology fixed. Only Z inside open rectangles changes. Fence supports near E=-20,N=0 outside edits. Continuous existing coverage; no invented pathway.'}
def clamp(t):return max(0,min(1,t))
def smooth(t):
 t=clamp(t);return t*t*t*(t*(t*6-15)+10)
def weight(e,n,p):
 a,b,c,d=p['bounds'];return smooth(min(e-a,c-e,n-b,d-n)/p['feather'])
def displacement(e,n,kind):
 if kind=='nm':
  p,q=PARAMETERS['patches'][:2]
  ridge=min(abs((e+59+3.5)%7-3.5),abs((n+25+3.5)%7-3.5))
  shoulder=.11*smooth(1-abs(ridge-1.05)/.75)-.045*smooth((ridge-1.8)/1.2)
  bank=.10*smooth(1-abs(abs(e+36)-3.8)/1.4)
  return weight(e,n,p)*shoulder+weight(e,n,q)*bank
 p=PARAMETERS['patches'][2]
 # Smooth low crown along an existing approach, with zero displacement at all patch edges.
 lateral=smooth(1-abs(e+84)/11)
 along=smooth((n+40)/8)*(1-smooth((n-0)/5))
 bridgeToe=.07*smooth(1-abs(abs(n+29)-4.2)/2)
 return weight(e,n,p)*(.12*lateral*along+bridgeToe)
def inside(e,n,kind):
 ps=PARAMETERS['patches'][:2] if kind=='nm' else PARAMETERS['patches'][2:]
 return any(p['bounds'][0]<e<p['bounds'][2] and p['bounds'][1]<n<p['bounds'][3] for p in ps)
