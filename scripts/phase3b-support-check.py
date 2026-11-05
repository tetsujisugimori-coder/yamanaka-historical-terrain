"""Self-verification of feet and boundary; independent review remains separate."""
import json,runpy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
s=runpy.run_path(str(ROOT/'scripts/phase3b-recipe.py'))
report=json.loads((ROOT/'evidence/phase3b/native/blender-build.json').read_text())
feet=[]
for p in report['parts']:
    if 'post' not in p['object']:continue
    e,n,h=p['at'];ground=s['surface_height'](e,n);bottom=h+p['bottomOffset']
    feet.append(dict(object=p['object'],surfaceHeight=ground,bottom=bottom,embed=ground-bottom))
assert min(p['embed'] for p in feet)>0
b=s['BOUNDS'];points=[(e,n) for e in range(b[0],b[2]+1) for n in [b[1],b[3]]]+[(e,n) for n in range(b[1],b[3]+1) for e in [b[0],b[2]]]
error=max(abs(s['elevation'](e,n)-s['reference'](e,n)) for e,n in points)
assert error<.001
building=[p for p in feet if p['object'].startswith('wb-building')]
result=dict(status='PASS',scope='self-check of actual native part records with grid recipe; not an independent review',
    boundarySamples=len(points),maximumBoundaryError=error,postFeet=len(feet),minimumPostEmbed=min(p['embed'] for p in feet),
    buildingGroundRange=max(p['surfaceHeight'] for p in building)-min(p['surfaceHeight'] for p in building),
    minimumBuildingEmbed=min(p['embed'] for p in building),feet=feet)
(ROOT/'evidence/phase3b/native/support-check.json').write_text(json.dumps(result,indent=2),encoding='utf8')
print(json.dumps({k:v for k,v in result.items() if k!='feet'},indent=2))
