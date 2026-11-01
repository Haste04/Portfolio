# Lifewood Experience implementation plan

User brief is the approved spec: Experience only, two panels, verified contributions, Cebu City-level map, contained gallery, default-empty photography.
Architecture: typed Experience data and derived regional Natural Earth SVG; native accessible disclosures and static fallback; one finite view/photo controller; Experience-specific GSAP outer wrappers; single unchanged header mascot dock. No new dependencies.
Photo policy: public/lifewood is a protected original library. An empty JSON manifest allows explicit approved/private/pending entries; only approved existing safe files become optimized cache derivatives. A small Astro integration blocks raw sources in dev and removes raw copied sources from generated production output, then emits only current approved derivatives. No photo references or captions are invented.
Map: derive a Cebu regional view from existing 50m Natural Earth country coastline (public domain); city-level point from UNGEGN/NAMRIA at 123.901716666667E, 10.2929861111111N, never an office address.
Files: Experience.astro, data/experience.ts, data/cebu-map.json, data/lifewood-photos.json, styles/experience.css, scripts/experience.ts, scripts/lifewood-media.mjs and astro.config.mjs integration registration; only Experience targets in motion/timelines.ts and Experience assertions in parallax-runtime. Remove obsolete Experience-only CSS selectors, preserve every unrelated rule.
Review: raw public-copy leakage, stale/revoked approved derivatives, path traversal/symlinks, image decode races, no focus theft after scrolling, Pause/hidden/reduced cleanup, SVG marker touch alignment, six widths, no duplicate mascot.
- [x] Write failing data/media/browser checks and record baseline.
- [x] Implement typed content, source-derived map and fail-closed photo processing/integration; unit tests.
- [x] Build two-panel component and scoped styles; preserve native disclosures and header mascot.
- [x] Implement finite map/gallery/photo transitions, focus and lifecycle handling, correct empty/no-JS state.
- [x] Adapt Experience GSAP targets and old Experience-specific assertions; no unrelated choreography edits.
- [x] Build/check, targeted browser/media tests, all regressions, six widths, original hashes.
- [x] Fresh read-only review; capture desktop/mobile/empty and actual transition recording; report exact limits/results.

Final report: docs/lifewood-experience.md. Experience22/22 passed; full193/195, transient logo test passed rerun, known unrelated Tech Stack Back assertion remains. No claim of a fully green suite. Stopped for review without deployment or another phase.
