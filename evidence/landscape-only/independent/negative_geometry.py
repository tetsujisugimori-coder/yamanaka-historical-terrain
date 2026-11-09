"""Mutation of copied GLB bytes only; never modify the supplied checkout."""
import sys,tempfile,shutil,struct,json,subprocess
from pathlib import Path
root=Path(sys.argv[1]).resolve(); output=Path(sys.argv[2]); rows=[]
for case in ['outsideHeight','wrongUnit','nanPosition','reversedWinding']:
 with tempfile.TemporaryDirectory() as tmp:
  d=Path(tmp)/'public/data';d.mkdir(parents=True)
  for f in ['phase3h.glb','phase3i.glb','phase3h-inner.glb','phase3i-inner.glb']:shutil.copy2(root/'public/data'/f,d/f)
  p=d/'phase3i.glb';b=bytearray(p.read_bytes());jl=struct.unpack_from('<I',b,12)[0];doc=json.loads(b[20:20+jl]);base=20+jl+8
  prim=doc['meshes'][0]['primitives'][0]
  def offset(a):
   acc=doc['accessors'][a];v=doc['bufferViews'][acc['bufferView']];return base+v.get('byteOffset',0)+acc.get('byteOffset',0),acc
  off,acc=offset(prim['attributes']['POSITION'])
  if case=='outsideHeight':struct.pack_into('<f',b,off+4,struct.unpack_from('<f',b,off+4)[0]+1)
  elif case=='wrongUnit':struct.pack_into('<f',b,off,struct.unpack_from('<f',b,off)[0]*1000)
  elif case=='nanPosition':struct.pack_into('<f',b,off,float('nan'))
  else:
   off,acc=offset(prim['indices']);fmt={5123:'H',5125:'I'}[acc['componentType']];size=struct.calcsize(fmt);a=bytes(b[off:off+size]);b[off:off+size]=b[off+size:off+size*2];b[off+size:off+size*2]=a
  p.write_bytes(b)
  r=subprocess.run([sys.executable,str(Path(__file__).with_name('audit_geometry.py')),tmp,str(Path(tmp)/'out.json')],capture_output=True,text=True)
  rows.append({'case':case,'exit':r.returncode,'stderr':r.stderr});assert r.returncode!=0,case
output.write_text(json.dumps(rows,indent=2)+'\n')
