"""Independent standard-library reaggregation of preserved original J measurements."""
import gzip, hashlib, json, pathlib, statistics
root = pathlib.Path(__file__).resolve().parents[1] / 'evidence/phase3j-followup/history'
p = json.loads((root / 'provenance.json').read_text())
for item in p['rows']:
    compressed = (root / item['file']).read_bytes()
    assert hashlib.sha256(compressed).hexdigest() == item['archiveSha256']
    assert hashlib.sha256(gzip.decompress(compressed)).hexdigest() == item['expandedSha256']
r = json.loads(gzip.decompress((root / 'comparison-000fd77.json.gz').read_bytes()))
assert len(r['rows']) == 40 and all(x['status'] == 'PASS' for x in r['rows'])
result = {'head': p['originalHead'], 'originalRawUnmodified': True, 'conditions': {}}
for cache in ['cold', 'reload-partial']:
    groups = {v: [x['facilityMs'] for x in r['rows'] if x['cache'] == cache and x['variant'] == v] for v in ['I','J']}
    assert len(groups['I']) == len(groups['J']) == 10
    med = {v: statistics.median(a) for v, a in groups.items()}
    delta = []
    for trial in range(1,11):
        get = lambda v: next(x['facilityMs'] for x in r['rows'] if x['cache'] == cache and x['variant'] == v and x['trial'] == trial)
        delta.append(get('J') - get('I'))
    result['conditions'][cache] = {'I': med['I'], 'J': med['J'], 'changePercent': (med['J']/med['I']-1)*100, 'improvedPairs': sum(x < 0 for x in delta), 'nPairs': 10, 'all': groups}
print(json.dumps(result, indent=2))
