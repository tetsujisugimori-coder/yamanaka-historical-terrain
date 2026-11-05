from qgis.core import QgsApplication,QgsProject
import json,os
from pathlib import Path
app=QgsApplication([],False);app.initQgis();out=[]
for name in ['yamanaka-phase3b.qgz','yamanaka-phase3c.qgz']:
 p=QgsProject();ok=p.read('production/'+name);layers=[]
 for l in p.mapLayers().values():
  layers.append({'name':l.name(),'valid':l.isValid(),'crs':l.crs().authid(),'source':l.source(),'features':l.featureCount() if hasattr(l,'featureCount')else None})
 out.append({'file':name,'read':ok,'crs':p.crs().authid(),'layers':layers})
Path('evidence/phase3c/independent/technical/qgis.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
print(json.dumps([{'file':x['file'],'read':x['read'],'layers':len(x['layers']),'invalid':[l['name']for l in x['layers']if not l['valid']]}for x in out]))
