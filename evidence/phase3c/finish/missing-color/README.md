# Missing vertex color P2

Actual browser images exposed the black new patch. The earlier tests checked ownership but not a shader attribute precondition. All seven inner GLB meshes lack COLOR_0. In the previous western GLB, 399 wood, eight endgrain and two roof meshes also lack COLOR_0; only three terrain meshes have it. An appearance provenance label does not establish a color attribute.

The old code enabled material.vertexColors solely from that label. The correction enables it only when the actual geometry supplies color, preserving the base material and existing authored colors. No GLB or native source is changed. Real-GLB unit checks verify all new/prior meshes and C restoration. Old source and deliberate reintroduction fail with VERTEX_COLOR_WITHOUT_ATTRIBUTE; the corrected source passes. Browser negative control is independently authored in scripts/phase3c-independent-browser.mjs (INDEPENDENT_MUTATION=missing-color).

These unit results do not close the visual P2 alone. Corrected live browser attribute checks, deliberate fault rejection and actual screenshot inspection are still required.
