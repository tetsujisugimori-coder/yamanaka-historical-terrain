# Initial-camera negative-control harness repair

Product source is unchanged from 47b8a80 through b3cd76a. Push CI run42157402906/job127694713944 executed all72 normal initial-load cases successfully, then failed before the mutation matrix: Initial-input mutation did not apply. The previous harness searched an exact whole legacy function body. The product ready/pending optimization changed that loaded-model branch, while preserving the initial no-model adjustment path.

The original normal results were downloaded from artifact13475780331. ZIP SHA256: 3b63c34be5842017ddb279241fb3f6bc72674330b7e8740f8833db8b4c9cc19a. Original artifact: https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42157402906/artifacts/13475780331. The report main/intent/regional GLB hashes match the submitted product. Old summary files bundled alongside fixed.json are not new evidence.

Repair: use the existing Vite AST parser to require exactly one declaration and an actual unmutated initial intents.adjustCamera() path, then replace that function with return beginIntent() to restore the ownership-loss bug. Reject absent, ambiguous, already-mutated, malformed and comment/string/dead-code lookalikes. Unit tests execute current product and legacy fixtures against the real intent controller; initial success and404 completion are discarded only by the mutation.

Independent review also found a pre-existing acceptance weakness:72 arbitrary FAIL rows could pass the negative matrix. The repair additionally requires a completed view, trusted input, no page errors, and the specific initial-completion-loss state (loading, ready=false, modelBounds=null). Missing observations, timeouts and unrelated failures are not accepted as expected rejection.

The original72 fixed /72 mutation case counts and ordinary assertions remain. New browser execution is required before closing this harness issue. The old failed run is retained and not relabelled as a product or negative-control PASS. Original GLB/native/source evidence is not changed; the existing harness is an explicitly documented code-edit exception in the final preservation audit.
