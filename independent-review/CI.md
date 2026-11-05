# Independent review execution

Author: independent reviewer, not implementation worker. Run after candidate is committed. No product imports or product acceptance booleans supply the oracle. Instrumentation only reads raw scene/light/terrain material state. Mouse/keyboard operations use Playwright trusted APIs; hardware touch is NOT_TESTED.

Use Ubuntu 24.04, Node22, npm ci, npx playwright install --with-deps chromium webkit. Checkout with fetch-depth:0. In repository root:

```sh
BASE=5fca33c5f1bf7be66e8b44e33b057b2fea4c5c31
REPO="$PWD"
git worktree add --detach /tmp/yamanaka-review-baseline "$BASE"
ln -s "$PWD/node_modules" /tmp/yamanaka-review-baseline/node_modules
(cd /tmp/yamanaka-review-baseline && "$REPO/node_modules/.bin/vite" --host 127.0.0.1 --port 4318 --strictPort) >/tmp/review-old-vite.log 2>&1 &
old_pid=$!
npm run dev -- --port 4317 --strictPort >/tmp/review-new-vite.log 2>&1 &
new_pid=$!
trap 'kill "$old_pid" "$new_pid"' EXIT
# readiness loop for both ports; don't run until curl --fail succeeds
REVIEW_HEAD="$BASE" REVIEW_ROOT=http://127.0.0.1:4318 REVIEW_EXPECT_BAD=1 REVIEW_OUT=evidence/phase3b-p2/independent/red node independent-review/browser-ad.mjs
REVIEW_HEAD="$(git rev-parse HEAD)" REVIEW_ROOT=http://127.0.0.1:4317 REVIEW_OUT=evidence/phase3b-p2/independent/green node independent-review/browser-ad.mjs
REVIEW_HEAD="$(git rev-parse HEAD)" REVIEW_ROOT=http://127.0.0.1:4317 REVIEW_MUTATION=1 REVIEW_EXPECT_BAD=1 REVIEW_OUT=evidence/phase3b-p2/independent/negative node independent-review/browser-ad.mjs
```

Upload evidence/phase3b-p2/independent/ always. Baseline and mutation must each fail intended `A actual plain renderer after C+D` in all 16 configurations; expected-failure runs return0 only after validating that reason. Candidate must have0 failures. Browser version, targetHEAD, input width/motion, raw states, pixels hashes, and screenshots are saved. Exact PNG equality uses same canvas camera and dimensions within one context, tolerance0. Genuine observed renderer states/pixels, not screenshot-exists criterion.
