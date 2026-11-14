# Limited-view race supplement

This supplement separates normal-user UI reachability from asynchronous controller boundaries. It does not replace the fixed 16-condition production acceptance and does not establish all five requested races as passing.

| Requested path | Actual application control/resource | Current evidence |
|---|---|---|
| Close during overview acquisition/switch | Initial overview JSON acquisition has disabled open, hidden close. Opening an already available overview requests regional, whose promise is cached from initial app setup. | Browser verifies unavailable close during held initial JSON. Delayed switching race NOT_TESTED; no forced hidden click or synthetic network request. |
| New model details before old details finish | Inner detail awaits phase3i-inner.glb, while western model detail uses an independent resource. Model list remains operable. | Hold inner or connected GLB in separate cases, select western model, wait new detail terminal, then release inner GLB, wait old detail terminal, compare actual state/camera/viewport and usable controls. |
| Older retry response after newer retry | Retry is hidden and disabled while pending. No normal UI can start a second request concurrently. | 503, explicit retry held, disabled/hidden retry and exact request count observed. Reverse-response retry race NOT_TESTED. |
| New action during old restore | Captured view/variant was loaded before capture; getModel caches its promise. The restore await is a microtask boundary, not an independently holdable resource. | NOT_TESTED. A deferred binding would be an isolated controller test, not proof of an ordinary user race. |
| Response after dispose | No ordinary user dispose control. Renderer failure/context loss calls teardownTerrain. | Separate real-browser fault injection: WEBGL_lose_context native extension, then teardown/error, then release held inner GLB and observe terminal with no resurrection. Ordinary UI dispose remains unavailable. |

## Fixed execution

`scripts/stage3b-races-browser.mjs` runs five observed checks per engine at 390×900, with 180 seconds maximum per check and no automatic retry. Fresh browser context per check. No fixed sleeps are used to claim request completion. Both engines are intended; inability to launch is BLOCKED. Four normal-UI requested-coverage rows per engine remain NOT_TESTED (dispose fault injection is reported separately) and the report remains PARTIAL even when observed checks pass.

Set `TEST_URL` to an existing server and `EVIDENCE_DIR` to a new, nonexistent directory. The same script can target dev or production; record which was used and do not combine those results. `BROWSER_FILTER` is only a labelled local subset, not acceptance. Trace, full diagnostics, state comparisons, PNGs, identity, source hashes and capacity are preserved in the evidence directory. Final-head CI must rerun it. Source hashes distinguish preliminary uncommitted runs.

The image comparison uses the same post-new-action viewport before/after releasing the held old request, alongside state and selected-ID comparisons. A late optional resource that changes visible geometry must not be excused solely because camera values are unchanged.
