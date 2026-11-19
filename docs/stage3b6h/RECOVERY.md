# B6g recovery provenance

Read-only comparison at fixed HEAD16e26b3381763269dfc9d2360670b57726db996d. Current GitHub API still reports run44071325311 and44071333914 failed. Push WebKit job133998000707 contracts step failed; browser skipped; inventory/upload succeeded. The other three dedicated jobs reached browser and failed there. These different failure stages must not be conflated.

Four local original ZIPs, also previously preserved via Library, revalidated this session:
- 14321924744:744571 bytes, fcfad6fbdf5bf5da1b4fd5bc5938ea1a982a21a3fbc03e0caca0966a72a22cc3
- 14323502043:356342202 bytes,742d83ad2a4f2d945cb8ee61650be38e1b978f4f1925335a37314364542c20f1
- 14323621969:371659139 bytes,656ea0d1a80efc1458b474c2c92b192e70ecb3e798c2db90f9dce867fdb7da36
- 14322887811:353763089 bytes,85e76ae0e8abee919528430d79e7da5c34189c79191e64a4564df082b4097e47

Current official metadata agrees; CRC and each manifest's exact set/size/SHA were rechecked. This is local-original verification, not this session's Library retrieval. These provenance gates are reported independently.

All four ZIPs omit `.work/stage3b6g`. The priority failed ZIP has no case stdout/stderr, worker-result, supervisor-result, trial-ledger, assertions, PID/birth, kill/residual audit or first-failure checkpoint. Its source-before files and unit.log are available and explain the known throw-before-save and missing workflow collection paths. They do not reveal the actual supervisor phase or descendants. Current job log was obtained through the official GitHub connector; no rerun.

No authorized endpoint exposes the discarded hosted runner's private working directory. Missing official runtime evidence is NOT_RECOVERABLE within the inspected sources; other retained sources remain UNKNOWN until located. Local prior controls are not replacements for this official evidence. No fabricated reconstruction or old FAIL removal.

Priority original 14321924744 was additionally re-downloaded from GitHub through the connected artifact-download operation at 2026-11-17T20:34:20Z into a new case-specific path: 744571 bytes, SHA-256 fcfad6fbdf5bf5da1b4fd5bc5938ea1a982a21a3fbc03e0caca0966a72a22cc3, 344 ZIP entries with valid CRC, full bytes equal to the saved original. This fresh GitHub retrieval is not a Library readback.

At 2026-11-17T20:34:53Z a separate custody reviewer independently retrieved the old priority ZIP from Library into a separate path and checked full bytes against the saved original, size744571, the same SHA-256, CRC344, and manifest343 exact set/size/SHA. This newly completed limited custody check does not recover the missing runtime files, prove Library-wide ACL/retention, or cover new formal artifacts.
