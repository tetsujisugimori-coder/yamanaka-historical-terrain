# Independent A/D artifact review (partial)

## Scope and provenance
Reviewed extracted artifact `42125216853/ad-separation`, supplied by parent. ZIP digest supplied by parent: `c78f02f90fb86fb8cc80153c7940da7adea48e6cef3a6e638f71b7d49aa2d29e`. ZIP is not present in this reviewer's accessible artifact directory, so its digest was not independently recomputed here.

Green and negative JSON record execution HEAD `5fbbfeb937c8bc224456187cec118d076cb023f1`; red records `5fca33c5f1bf7be66e8b44e33b057b2fea4c5c31`. Parent checked the job checkout log and identified green HEAD as the PR14 synthetic merge, not old PR12 evidence. At this review step these objects were not locally available and JSON does not contain source hashes. Exact product/source equivalence was initially PENDING. Follow-up verification after fetching the synthetic merge independently confirmed its tree `045d123847c692e160b24edf56ff13505a88d2db`; `git diff` against current submission for `src`, `public`, and `index.html` is empty. Individual executed-vs-working SHA-256 matches for nine key sources/assets are saved in `ad-source-equivalence.json`. This resolves the provenance/source-equivalence hold for this A/D evidence scope.

## Independently executed image checks
Decoded all 48 on/off PNG pairs using Pillow and counted pixels where any RGB channel differs. Saved machine-readable results in `ad-artifact-independent-pixels.json`, including input PNG SHA-256 and dimensions.

- Green: 16/16 pairs have exactly 0 different RGB pixels; all 16 pairs also have identical PNG bytes.
- Red: 16/16 pairs differ, from 153,424 to 518,823 RGB pixels.
- Negative: 16/16 pairs have 0 different RGB pixels despite the injected state defect. Thus zero image difference alone is insufficient to certify D isolation. The supplied runtime results record 48 state failures in negative (16 rows), compared with 80 failures in red and 0 in green. This reviewer has not independently rerun those runtime operations.

Exact pixel equality applies only within each same-browser, same-width on/off pair. It is not required between Chromium and WebKit or between viewport sizes.

## Actual visual inspection
Viewed a four-image contact sheet for Chromium/WebKit at 390/1280, reduced motion. Additionally opened original-resolution Chromium-390 and WebKit-1280 green on-images. These are real A terrain screenshots, not blank captures: terrain relief, pale green base material, A/1590 disclaimer, scale bar and zoom/north/reset controls are visible. No obvious D grass/soil/wood texture or scenery remains in these representative A captures. Some very thin/dotted mesh-edge lines and modest contrast are visible, especially Chromium; these are observations on existing A terrain, not a demonstrated new Phase3C regression. Labels and buttons are not clipped in the inspected viewport captures. These are canvas/viewport captures, not full-page accessibility evidence.

## Result and limits
PARTIAL overall; narrow A/D artifact image and source-equivalence review PASS. Image-pair zero-difference check is independently verified for supplied green artifact. Representative A screenshot visual review is complete. No new P1/P2 identified in this narrow image inspection; no claim of comprehensive P1/P2 absence.

NOT_TESTED in this evidence set: new eight guided viewpoints, bridge/koguchi/lookout visual coherence, actual support discontinuities, new-station obstructions, current final-HEAD UI operation, actual hardware Safari/touch, VoiceOver, sustained FPS, GPU memory, field correspondence. Final browser/visual PASS and merge recommendation remain withheld pending new independent CI and source/hash equivalence verification.
