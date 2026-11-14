# Stage 3-B preservation and local validation recovery

## Preservation

Starting local HEAD 39f5201ac00331aa8cd7d73e197162ae412b842a, tree 2f5bddebf30e4924fb62bf11e7eafb34bbf9c5ea. Tracked tree clean at entry; node_modules was an untracked symlink. The main prerequisite remains 842d5378bb1fad648f225b79933763b8e87b6afa, independently re-read from GitHub. The remote work branch is still 5adb7156; no submission was retried.

A Git bundle and binary patch were preserved. Applying the patch with --index to a separate checkout of the prerequisite produced the exact starting tree. Private persistent copies were saved, including 55 prior failure files whose copied SHA256 values matched originals. No source, prior trace, or screenshot was deleted. The manifest identifies the preserved subset; it is not a claim to have archived every prior experiment.

An actual workspace restart was NOT performed: its persistence contract is not verified, and risking the sole working environment would contradict preservation. Recovery from the saved patch is verified; survival of arbitrary workspace restart remains NOT_TESTED. The incremental bundle needs the named public base commit. Dependencies and browser packages are not included in that bundle.

## Distinct findings

- Work filesystem had roughly 23 GB free. A different /tmp tmpfs was 4.9 GB full, with about 14 MB free. A browser run produced an actual ENOSPC during evidence write. Inodes were not exhausted.
- Memory availability was about 2.9 GB at the observation; file limit 16384 and process limit 39792. These snapshots do not prove historical memory/process exhaustion or exclude transient load.
- Chromium prior traces recorded ERR_INSUFFICIENT_RESOURCES on terrain JSON fetches, then initial-ready timeout. File sizes are only hundreds of KB. Disk/tmp exhaustion is a concrete competing explanation; the message alone does not prove network or server failure.
- WebKit package preflight detects dynamically opened libraries using the system ldconfig listing, not just LD_LIBRARY_PATH. The existing local libGLESv2 was independently loadable with ctypes.CDLL.
- The official MiniBrowser wrapper overwrites LD_LIBRARY_PATH with bundled paths, dropping local dependencies. A separate local launcher keeps bundled paths and the already installed dependency directory, invoking the same official binary. Browser package files and global settings remain unchanged; no dependency-check or assertion was disabled.

## Recovery method

New browser profiles, trace staging and evidence output use the working filesystem via TMPDIR, rather than the saturated /tmp. Existing /tmp evidence is retained. `scripts/stage3b-local-browser.sh` documents this opt-in local invocation with BROWSER_ROOT, WEBKIT_LIB_DIR and STAGE3B_RUNTIME. It performs no installation or deletion. Run against a separately served, verified build. An unavailable dependency fails normally.

The runner awaits completion of the adopted B0 initial CAD load before separating startup asset fetches from overview-triggered fetches. This is a state predicate, not a fixed sleep or assertion relaxation. Each formal matrix condition gets a fresh browser process. Smoke/subset selectors are explicit and must not be reported as the full matrix.

## Historical evidence

Additional original-source review confirms a 100 m bar and orientation symbol on printed p61 figure 3-32, whose purpose is management/designation/restoration coverage. It does not establish the 1590 boundary. The statement of unverified scale applies specifically to p65 figure 3-35. Original 1972 survey sheets and 2019 UAV survey data are further leads, not acquired evidence. Eleven region positions and transform errors remain null/UNKNOWN. Existing model positions are unchanged.

## Submission

Prior create_tree publication refusal remains unresolved. No retry, alternate publishing route, PR, merge or Pages deployment was performed. Formal CI is unavailable until an authorized submission is possible. Local review and local testing cannot replace that missing CI.

## Recovered browser result

Chromium 141.0.7390.37 and WebKit 26.0: all 16 formal width/motion conditions PASS; four additional missing-data/bad-coordinate recovery conditions PASS. Run start/end HEAD39f5201 matched and captured source hashes were unchanged. A startup-CAD readiness predicate was added to the runner before the run; the worktree was intentionally marked dirty and exact source/build hashes identify the tested content. The application source itself was unchanged from d37.

The recovered environment changed temporary storage and WebKit dependency resolution, not product assertions. This strongly supports temporary-space exhaustion as the practical Chromium blocker in this experiment, but does not prove that every previous failure had exactly one cause. No unsupported network, RAM or GPU root-cause certification is made.

Region selection, layers, opacity control presence, detail navigation, normal/reduced-motion, prior-view return, close focus, narrow layout and explicit unknown-state messaging were exercised. Independent controller tests cover old responses and duplicate build disposal. Continuous free-walk behavior, real iPhone Safari, historical georeferencing and every browser-history interaction are not established by this matrix.

Historic 11 regions remain unplaced, source-controlled coordinate transformation is not completed, and formal CI/submission remain unavailable. Overall PARTIAL and limited merge recommendation NO until those acceptance gaps and authorized submission are resolved.

Final local full regression: 389/389 PASS. Protected inputs: 212/212 unchanged, generated data verification PASS. Final rebuild reproduces every recorded tested build hash. Independent raw-evidence audit confirmed 16 trace archives, context conditions, PNG sizes and source/build hashes. Captured JSON/CSS bodies match build bytes; some JS bodies are not stored by trace. Four fault results have JSON/runner verification, not dedicated fault traces. These limits remain explicit.
