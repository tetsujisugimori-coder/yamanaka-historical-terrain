import {execFileSync} from 'node:child_process';
import {readFile,mkdir} from 'node:fs/promises';
const base='7465eebc6667d471e35c1d2b37a0782ad654f18a';
await mkdir('.cache',{recursive:true});await mkdir('evidence/landscape',{recursive:true});
execFileSync('git',['archive','--format=tar','--output=.cache/landscape-base.tar',base,'production','public/data','evidence']);
const code=`import tarfile,hashlib,json,datetime\nfrom pathlib import Path\nrows=[]\nwith tarfile.open('.cache/landscape-base.tar') as tar:\n for m in tar.getmembers():\n  if not m.isfile():continue\n  expected=hashlib.sha256(tar.extractfile(m).read()).hexdigest();actual=hashlib.sha256(Path(m.name).read_bytes()).hexdigest();rows.append(dict(file=m.name,actual=actual,expected=expected,unchanged=actual==expected))\nresult=dict(base='${base}',utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Raw byte preservation of all prior production/public-data/evidence files; no normalization.',status='PASS' if all(r['unchanged'] for r in rows) else 'FAIL',files=len(rows),rows=rows)\nPath('evidence/landscape/preservation.json').write_text(json.dumps(result,indent=2),encoding='utf8')\nprint(result['status'],len(rows))\nraise SystemExit(0 if result['status']=='PASS' else 1)`;
execFileSync('python',['-c',code],{stdio:'inherit'});
