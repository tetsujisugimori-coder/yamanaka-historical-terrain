# H regression target repair

Baseline af38855b4b5d26812aab06334f2459bc240f6f0f, tree 21a5c4c21c5bc10266b92bf8fc48de8b5f8576bc.
The unchanged original runner bytes remain retrievable at that commit. Historical evidence and G geometry were not edited.

## Independent diagnosis
- G oracle at moat [-39,-10]: 575.65234375 m; H: 575.6891479492188 m. The 0.03680419921875 m difference exactly matches the old fixed-controls failure.
- Product loads H while several old runners routed G. Missing-support modified C and G metadata, leaving H unchanged, causing an earlier metadata mismatch rather than exercising missing support.
- Original independent artifact 13594833703 from run 42424584002: 45 files, SHA256 3a98d5ae22f961584a7ff26add4227b9f27dcf367a62d61c556df021763b2399. Independent reviewer fetched and recomputed its digest. Normal 16 passed, asset404/webgl each 2 passed; missing-support both engines timed out. Later missing-color was NOT_TESTED.

## Change boundaries
Only active regression oracles/routes/fingerprints change. No product geometry, tolerance, timeout, assertion weakening, or historical source/evidence replacement. Active loader selection is parsed from actual syntax using the lock-pinned Rollup parser already installed by Vite. An independent comment-decoy counterexample exposed a draft includes-based check; the AST contract rejects it.

## Local limits
Chromium 141.0.7390.37 launched. Playwright WebKit installed but OS libraries are missing. The official install-deps command could not gain system privileges (su: System error; exit 1); no credentials supplied or system setting changed. WebKit local execution is NOT_TESTED. GitHub's existing --with-deps CI is needed for complete automated matrix. Physical iPhone Safari remains NOT_TESTED.
