#!/usr/bin/env bash
set -euo pipefail
# Run one unchanged independent-state/pixel oracle against the fixed pre-review
# source, the submitted source, and a source fault. Never overwrite prior evidence.
old=5fca33c5f1bf7be66e8b44e33b057b2fea4c5c31
root=${SEPARATION_EVIDENCE_ROOT:-evidence/phase3b/p2-separation/ci-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}}
mkdir -p "$root"
backup=$(mktemp -d)
cp src/main.js "$backup/main.js"; cp src/phase3b.js "$backup/phase3b.js"
restore() { cp "$backup/main.js" src/main.js; cp "$backup/phase3b.js" src/phase3b.js; }
trap restore EXIT
# The old source is pinned. Tests and expected states remain the same.
git show "$old:src/main.js" > src/main.js
git show "$old:src/phase3b.js" > src/phase3b.js
SEPARATION_STAGE=red SEPARATION_EVIDENCE="$root/red" node scripts/phase3b-separation-browser.mjs 2>&1 | tee "$root/red.log"
restore
SEPARATION_STAGE=green SEPARATION_EVIDENCE="$root/green" node scripts/phase3b-separation-browser.mjs 2>&1 | tee "$root/green.log"
SEPARATION_STAGE=mutation SEPARATION_EVIDENCE="$root/mutation" node scripts/phase3b-separation-browser.mjs 2>&1 | tee "$root/mutation.log"
