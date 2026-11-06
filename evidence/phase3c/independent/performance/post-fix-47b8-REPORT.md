# Independent post-fix 47b8 performance review (harness v2)

## Binding and scope

Candidate47b8a80d2f7f08a50a0e0cfe9b4d89d7b2d07700; artifact synthetic merge c239f2b36f9aa119b7c4eaf156bf47d7aa16a2e7; exact tree5e44d4b1a310a45c9de1176939c6c60fb16b76d1. Run42152881096, artifact13473804018. Raw results SHA256 2db950f48c1c583e30ac0be69eadb70dbd5110478500d9d08d4d1db440fe005c. ZIP SHA256 reported verified by parent: e5425c90db8fe4ceb50c6eb3754a409f6b8db920a06765d66eb6ba48a3576ef0. Original artifact: https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42152881096/artifacts/13473804018. Raw JSON/PNGs remain in original extracted artifact; not copied into Git.

Metadata version2 uses fixed base-first order and does not measure page startup. Untracked worktree entries at collection are generated appearance results/images, not product edits. All recorded product hashes match inspected corrective product files; performance-script hash describes version2, not the pending version3 modification.

72 runs completed. Every matched pair has identical initial camera/target/canvas; all FOV38 and recorded quality matches selected quality. Fixed quality shadow policy holds. Same-pose comparison is valid within this run. Candidate includes optional inner geometry; this measures full product before/after, not isolated patch cost.

| Engine/width/quality | Median input+2RAF ms base→fixed | Change | Landscape-entry ms base→fixed |
|---|---:|---:|---:|
| chromium/390/balanced | 1250.0 → 483.3 | -61.3% | 3879 → 4410 |
| chromium/390/light | 1250.0 → 483.3 | -61.3% | 3827 → 4411 |
| chromium/390/high | 1716.5 → 630.3 | -63.3% | 3838 → 4389 |
| chromium/1280/balanced | 2607.2 → 941.6 | -63.9% | 5781 → 6476 |
| chromium/1280/light | 1917.2 → 732.5 | -61.8% | 5684 → 6428 |
| chromium/1280/high | 2582.2 → 941.8 | -63.5% | 5700 → 6397 |
| webkit/390/balanced | 570.5 → 293.0 | -48.6% | 2565 → 3251 |
| webkit/390/light | 572.0 → 292.0 | -49.0% | 2584 → 3230 |
| webkit/390/high | 684.5 → 326.0 | -52.4% | 2563 → 3248 |
| webkit/1280/balanced | 1091.5 → 508.0 | -53.5% | 3236 → 4168 |
| webkit/1280/light | 918.5 → 457.0 | -50.2% | 3220 → 4198 |
| webkit/1280/high | 1094.5 → 507.0 | -53.7% | 3254 → 4193 |

Medians use24 input samples per condition (3contexts×8keys). All12 conditions improve48.6–63.9% versus baseline in this same run. In particular WebKit1280 improves50.2–53.7%, reversing the previous within-run30–36% regression. Do not compare these absolute milliseconds directly with run42125592154: this run baseline itself is substantially slower, demonstrating runner/environment variation.

## Residual costs and findings

- Landscape-entry readiness is still higher, e.g.WebKit1280 ~3.22–3.25s→4.17–4.20s (+28–30%). This includes candidate extra inner-load click, parse and presentation; it is not page startup and must not be reported as such. Pure navigation startup remains unmeasured until harnessv3.
- WebKit1280 quality-switch+2RAF remains ~361–413ms→827–858ms. Camera-key fix does not optimize explicit presentation/quality changes. Keep this as a disclosed P3 optimization follow-up, not a claimed performance gain. No automatic responsiveness threshold was specified by user.
- Capacity and geometry unchanged: extra507,052byte GLB (+1.686% over three existing landscape model files); final submitted triangles485332→450462 at390 and503836→470898 at1280; draw calls22→24 and31→38.
- Independently viewed new WebKit1280-balanced and Chromium1280-balanced same-pose screenshots. Previously black foreground patch now has visible grass/earth color in both. This closes the specific observed black-patch symptom in those views; broader image/fault-reinsertion acceptance remains with browser reviewer.

## P2 closure recommendation

The measured same-view Arrow-key responsiveness regression P2 is no longer reproduced; this72-case run supports closing that specific regression. Independent code/state review already established intent cancellation preservation and proper color-attribute gating. Causal claim that the response improvement is specifically due to reducing3renders to1 still awaits the separate24-case diagnosis with old-handler reinsertion; do not report that measurement as completed. Keep overall completion conditional on that diagnosis and separate browser negative controls.

No new P1/P2 was found in this artifact analysis. Persistent high absolute software-renderer times, landscape-entry and quality-switch costs remain honestly documented; not extrapolated to real-device performance. Synthetic dispatch+2RAF is not physical input latency or sustained FPS. GPU memory and real Safari remain NOT_TESTED. Harnessv3 alternating-order/startup results must be reported separately.

### Mobile-width residual-cost classification

At390px, Chromium landscape entry is ~3.83–3.88s→4.39–4.41s (additional0.51–0.58s); quality switching444–959ms→959–1466ms (additional~0.51s). WebKit entry2.56–2.58s→3.23–3.25s (additional0.65–0.69s); quality switching241–315ms→514–587ms (additional~0.27s). Repeated inputs meanwhile improve61–63% in Chromium and49–52% in WebKit.

Reviewer classification: keep low-frequency entry/quality costs as P3 optimization follow-up and overall performance acceptance limited/PARTIAL, rather than require another P2 product fix on current evidence. Reasons: no numeric user budget; no timeouts/errors in72cases; repeated interaction regression reversed; optional-inner load is designed to retain existing view and controls while pending. This is not proof that all devices find these delays acceptable. In particular the390px emulation does not represent mobile GPU/CPU pressure; real-phone profiling remains NOT_TESTED. The measured facts are time deltas. Attribution among extra optional loading, synchronous parsing, presentation traversal, texture/material setup and rendering is still unmeasured; code-path explanations are hypotheses until separately timed. Do not describe these residual costs as diagnosed or optimized.

Correction note: the first generated version of this report accidentally used the pre-fix analyzer's default input for its table/aggregate JSON, while prose referred to this post-fix run. It is superseded by this explicitly bound recalculation. The reviewer noted the failure mode and changed the post-fix analyzer to require an explicit input path and reject mismatched expected HEAD, tree or raw SHA before writing. All24 group/version summaries and12 table rows were independently compared with this artifact; wrong-old-artifact injection is rejected without modifying any report. The original pre-fix report and analysis were not changed. See post-fix-47b8-integrity-check.json.
