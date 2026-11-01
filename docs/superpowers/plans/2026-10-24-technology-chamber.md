# Technology Chamber Layout Implementation Plan

> Execute inline using superpowers:executing-plans. The user's exact Tech Stack Layout Revision is the approved spec.

Goal: Four matching rectangular technology chambers with Frontend/Backend above, Languages/Tools at bottom edges, and the one shared Mr. Fresh centered between the bottom chambers.

Architecture: Presentation-only ordering in TechStack.astro, with a twelve-track two-row desktop grid. Top chambers are inset symmetrically; bottom chambers occupy outer edges. A sibling footer grid reserves the same bottom-center area for the existing dock, remaining outside the hidden/inert zoom views. Focused layout retains its existing footer. Below 1024px use two equal category columns with the mascot below. Native zoom, selection, GSAP and mascot modules remain unchanged.

Stack: Existing Astro, CSS Grid, TypeScript, native Web Animations and GSAP. No dependencies, Git initialization or deployment.

- [x] Add meaningful geometry assertions to the existing six-width gallery tests: category order, equal sizes, exact desktop row arrangement, centered isolated dock, no overlap/overflow and unclipped contents. Reproduce failure.
- [x] Update only the section markup and its CSS: presentation order, matching chambers, reserved mascot slot and responsive/focused overrides.
- [x] Build/check, run the complete gallery/data suite and relevant navigation/mascot/motion regressions serially. Inspect desktop/mobile screenshots and verify original and unrelated-file hashes.
- [x] Record results/limitations and stop for review.

Review: Reused dock must never enter inert zoom views or compete with GSAP transforms. Category zoom must still measure genuine source rectangles. Focus/Back must retain geometry and keyboard behavior. Physical action deferral must remain authoritative. Four chambers must grow equally if typography/content wraps.

Results: watched the new geometry assertion fail against the old order, then pass at all six widths. Production build passes (one route); Astro/TypeScript 71 files, zero errors/warnings/hints. Gallery/data 22/22 and relevant navigation/mascot/motion regressions 10/10. Source review: no material findings. Original-resource and local icon verification pass. Of 214 checkpointed files, only the two Tech Stack product files and gallery test changed; other 211 unchanged.

Ruling: The old scroll-away test asserted constant absolute scrollY. Measured document and scroll offsets both shrink 93px on focus, while Contact remains fixed within 0.016px. Assert the visible Contact position and matching layout-height compensation instead, retaining the no-focus-stealing check.

Screenshots and exact card geometry: .cache/technology-chamber/. No full-suite rerun or deployment for this focused layout revision.
