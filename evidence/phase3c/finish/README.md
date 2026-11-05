# Shared geometry / UV negative control

Baseline: ed22133f766aa1a2256dcebbb0413ec11d479106 (merged PR #12).

The exact same final oracle runs against the old module, new module, and new module with only geometry ownership deliberately removed. Old and injected fault exit 1; fixed exits 0. The old first mesh writes a D UV attribute into source geometry before a second mesh captures it. This confirms the previously synthetic sharing concern; it does not claim current imported GLBs previously shared geometry.

Each mesh now owns a stable display-only BufferGeometry container. Position/normal/index arrays are read-only shared attributes; per-mesh index, color and UV references are replaced on this container only. The imported geometry and UV bytes never change. The saved UV reference (including absence) and original material/shadow flags are restored when D is disabled. Terrain patch clipping still works because the private geometry container remains stable through all mode changes. The extra ownership container does not copy large position/index arrays.

Old initial failure log is preserved. The final oracle also checks private container identity in the restored state. No old production artifact or evidence was changed. Texture quality is assessed by paired browser images, not this unit oracle.
