#!/usr/bin/env bash
# B5 authorizes isolated UI additions, not changes to preserved inputs.
# Older checkouts without this tracked contract retain their original checks.
set -eu
if git ls-files --error-unmatch research/stage3b5/preservation-baseline.json scripts/stage3b5-preservation.mjs >/dev/null 2>&1; then
  node scripts/stage3b5-preservation.mjs
else
  git diff --exit-code "$@"
fi
