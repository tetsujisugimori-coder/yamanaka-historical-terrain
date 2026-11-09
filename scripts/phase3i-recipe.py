"""Bounded I expansion from immutable H native meshes. All dimensions are C hypotheses."""
import json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PARAMETERS={
 'version':'phase3i-v1','category':'C','crs':'EPSG:6676',
 'origin':json.loads((ROOT/'public/data/castle.json').read_text())['origin'],
 'units':'metres','axes':{'native':'east,north,up','glTF':'east,up,south'},
 'base':{'commit':'42ed7bbe1b1f839535ed66c76c75d1ade2ce2cc8','native':'production/phase3h/yamanaka-phase3h.blend','glb':['public/data/phase3h.glb','public/data/phase3h-inner.glb']},
 'patches':[
 {'id':'moat-expanded-shoulders','model':'phase3i.glb','bounds':[-66,-27,-40,33],'feather':3,'description':'Preserved H moat region; no I displacement. Retained comparison extent, not a new edit.'},
 {'id':'rampart-expanded-toes','model':'phase3i.glb','bounds':[-43,-25,-29,31],'feather':3,'description':'Preserved H rampart region; no I displacement. Retained comparison extent, not a new edit.'},
 {'id':'west-approach-short-extension','model':'phase3i-inner.glb','bounds':[-99,2,-87,23],'feather':3,'description':'C short west-side inner approach beyond H northern edit boundary. Existing mesh only, no claimed historical path.'}],
 'sourceIds':['plan','mishima-moat','mishima-works','mishima-inner'],
 'sourceLedgers':['public/data/nishinomaru-layout.json','public/data/phase3c.json'],
 'provenance':'Project-original bounded extension of H hypotheses. Source references are context, not evidence of newly chosen dimensions.',
 'uncertainty':'1590 shape, dimension, vegetation and real-site route remain UNKNOWN. No B promotion.',
 'appearance':'Separate I procedural D surface/low vegetation recipe; native C geometry has inherited neutral material.',
 'preservation':'All A/H originals immutable. XY and topology fixed. Only Z inside open rectangles changes. Fence supports near E=-20,N=0 outside edits. Continuous existing coverage; no invented pathway.'}
def clamp(t):return max(0,min(1,t))
def smooth(t):
 t=clamp(t);return t*t*t*(t*(t*6-15)+10)
def weight(e,n,p):
 a,b,c,d=p['bounds'];return smooth(min(e-a,c-e,n-b,d-n)/p['feather'])
def displacement(e,n,kind):
 if kind=='nm':return 0
 p=PARAMETERS['patches'][2]
 # Tiny bounded crown in the existing west-side approach; no surveyed value.
 return weight(e,n,p)*(.075*smooth(1-abs(e+93)/5))
def inside(e,n,kind):
 ps=PARAMETERS['patches'][:2] if kind=='nm' else PARAMETERS['patches'][2:]
 return any(p['bounds'][0]<e<p['bounds'][2] and p['bounds'][1]<n<p['bounds'][3] for p in ps)
