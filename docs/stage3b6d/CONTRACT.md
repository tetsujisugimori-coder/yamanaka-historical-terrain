# Stage 3-B6d: distinguishable Vary control and safe diagnostic errors

Baseline implementation HEAD: 47415546aa0f2e75c94cb139fb9738e57f4ee0ac. Review-only parent: 7ec0c67d4e0e4b3e9aaaaea3b934582ea2eb8f7d. Scope is the synthetic HTTP diagnostic and tests. Production observer, captureErrors/status200/build-byte gates, dependencies, workflow, 212 originals, 22 models and 230 protected paths are unchanged. B6c evidence and failed results remain historical facts.

## Fixed Vary contrast

At the same asset URL and in the same context with routing OFF, actual request `Accept: application/x-diagnostic-first` selects first/ETag `"first"`/96 bytes/SHA256 c495c10fd7913af8b611f9dd2163475c7814de1aceeeaefd7b6e496c821d5f59. `Accept: application/x-diagnostic-second` selects second/ETag `"second"`/97 bytes/SHA256 febcff4301f3ca6ab202ea51efd046defa88d40b4e33c1d6e3f9b7d85e1f0c07. Selection depends on the actual header, not navigation phase; an unsupported value receives 406 without a marker. This is a bounded two-value fixture, not a general Accept negotiation implementation.

The fixed browser contrast is first200 -> second200, with `Vary: Accept` on both. The server records actual safe request headers, selected representation id/ETag/SHA/bytes/selection basis, raw status, and actual wire body SHA/bytes. Evaluation requires the exact actual Accept pair, first/second selection, corresponding validators and distinct entity hashes, and second marker. Resource capture is separately compared with the actual server entry. Missing selection evidence or an unrealized HTTP contrast is UNKNOWN; contradictory selection/validator/entity/function evidence is FAIL. Neither case is upgraded to success through API-normalized status. Unit controls additionally test phase-independent selection, same-variant conditional304, wrong old validator, unsupported Accept, and corrupted selection evidence.

The nine diagnostic rows, two navigation phases, production matrix and normal cache settings remain unchanged. The Vary fixture correction supersedes the B6c same-entity fixture as a new test design; old B6c raw304 does not become a browser defect. Other synthetic controls retain their previous predicates. Routing ON and service-worker blocking remain explicit diagnostic conditions, not equivalence with production.

## Error record schema 2

The runner records a fixed operation label at context/page creation, routing, header application, navigation, evaluation, marker text, and capture settlement. Exceptions include observer-local phase, wall/monotonic observation time, fixed error class/code, response/request ids where available, acquisition versus preservation operation, and pending capture ids at a deadline. Raw exception messages, stacks, URLs, credentials and header values are not copied into these new error records. Codes distinguish DIAGNOSTIC_DEADLINE, BROWSER_TIMEOUT, known body-unavailable classification, capture/preservation classification and OPERATION_FAILED. A generic code does not infer the underlying native cause.

The primary runError is retained; cleanup and post-close settlement failures are appended without replacing it. A capture deadline remains UNKNOWN/incomplete even when closing the context later settles the pending request. Completion failure and resource byte mismatch are not waived. The missing404 control is not repaired or accepted merely because the failing operation is now identifiable.

## Separate 304 acceptance review

No new production 304 contract is adopted here. After the new formal results, evaluate three distinct propositions: (R) selected/used resource integrity; (F) required function/display behavior; (O) observation completeness/provenance. Record the outcome in a separate PR review/comment anchored to the implementation SHA without advancing HEAD merely to report CI results.

Vary correctness or a synthetic marker proves neither production-used JS/CSS/GLB byte identity nor complete production behavior. A candidate304 alternative must independently establish unique prior complete entity/build identity; actual request/selected representation/validator/Vary consistency; the scope of evidence for the representation actually used; all required functional checks; effective missing/corrupt/mismatch rejection; and complete relevant observations. Evidence absent or contradictory remains UNKNOWN/FAIL. In particular the original body acquisition errors and normal WebKit failures are not silently suppressed, relabeled PASS or replaced by routed successes. Timing observations do not become a realized before/after intervention.

References: [RFC9110 If-None-Match](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.2), [RFC9110 304](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.4.5), [RFC9111 Vary](https://www.rfc-editor.org/rfc/rfc9111.html#section-4.1).

## Capacity and execution boundary

Initial clone 651381165 bytes; after dependencies/build/baseline object retrieval approximately 787324678 bytes. Filesystem free 61974085632 bytes; 4164478 free inodes at initial check. Local evidence budget128MiB, formal originals plus readback6GiB, retain2GiB free. Dedicated .work/b6d/tmp is a path on the same filesystem, not a physical quota. No cleanup of old evidence or other tasks. Existing automatic push/PR CI only; no manual dispatch/retry, workflow/dependency/product changes, merge, Draft release or publication. Current billing usage was not reverified in this task; existing configured account limit is not changed. Formal results are measured, never inferred from local success.
