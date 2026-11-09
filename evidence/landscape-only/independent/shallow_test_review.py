import tempfile,subprocess,pathlib,shutil,json,hashlib,sys
root=pathlib.Path(sys.argv[1]).resolve();out=pathlib.Path(sys.argv[2]);out.mkdir(exist_ok=True,parents=True);rows=[]
a=subprocess.check_output(['git','show','42ed7bbe:src/main.js'],cwd=root);b=(root/'evidence/phase3i/baseline-H-main.js').read_bytes();assert a==b
for mode in ['oldNoGit','newNoGit','corruptBaseline']:
 with tempfile.TemporaryDirectory() as t:
  p=pathlib.Path(t)
  for f in ['src/main.js','evidence/phase3i/baseline-H-main.js','tests/landscape-only-separation.test.mjs','tests/phase3h-evidence.test.mjs']:
   q=p/f;q.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/f,q)
  if mode=='oldNoGit':(p/'tests/landscape-only-separation.test.mjs').write_bytes(subprocess.check_output(['git','show','86871fa:tests/landscape-only-separation.test.mjs'],cwd=root))
  if mode=='corruptBaseline':(p/'evidence/phase3i/baseline-H-main.js').write_bytes(b+b'\n')
  r=subprocess.run(['node','--test','tests/landscape-only-separation.test.mjs'],cwd=p,capture_output=True,text=True);(out/f'{mode}.log').write_text(r.stdout+r.stderr);rows.append({'mode':mode,'exit':r.returncode})
assert [r['exit'] for r in rows]==[1,0,1],rows
(out/'shallow-review.json').write_text(json.dumps({'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'tree':subprocess.check_output(['git','rev-parse','HEAD^{tree}'],cwd=root,text=True).strip(),'baselineByteMatchesGitMain':True,'baselineSha256':hashlib.sha256(b).hexdigest(),'runs':rows,'reviewHarnessFailure':'First reviewer harness omitted the existing phase3h test file; its ENOENT logs are retained separately, not attributed to product.'},indent=2)+'\n');print(rows)
