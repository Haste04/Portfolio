# Lifewood Experience showcase

## Structure and preserved content
Experience only: the existing LEARNING BY BUILDING. heading, one continuous introduction paragraph, dates August 2026 to October 2026, Software Engineering Intern role, Lifewood Data Technology and the verified overview.
A 45/55 desktop split pairs an editorial contribution card with a city-level Cebu map and contained gallery. Five native disclosure groups cover Anthea, Lifevent, Power BI, Prompt Engineering and Text-to-Image/Text-to-Video. Anthea is open initially. The academic-recognition link remains.
The existing Experience header mascot dock remains in place. No mascot state/gesture/physics/timer or other section component was changed.

## Files
Modified: Experience.astro; astro.config.mjs (one media integration); portfolio.css and cinematic.css (remove obsolete Experience-only rules); motion/timelines.ts (Experience targets only); parallax-runtime.test.mjs (replace removed Experience timeline expectation).
Created: data/experience.ts, data/cebu-map.json, data/lifewood-photos.json; styles/experience.css; scripts/experience.ts; scripts/lifewood-media.mjs; public/lifewood/README.md; three Experience test files; this report and implementation plan.

## Geographic source
The existing Natural Earth 1:50m country coastline in src/data/philippines-map.json is unchanged. The derived regional SVG now shows Cebu, Bantayan and Camotes only. Neighboring Negros, Bohol and Leyte outlines and labels were removed in the Cebu-only refinement. The coastline is generalized, not administrative province/city boundaries or a street map.
Natural Earth source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson
Public-domain terms: https://www.naturalearthdata.com/about/terms-of-use/
City marker: longitude 123.901716666667, latitude 10.2929861111111, from UNGEGN's Cebu record credited to NAMRIA. It is a city-level reference, not a Lifewood office location.
Coordinate source: https://ungegn.un.org/dashboard/cities/details?id=3186
Native SVG geometry keeps the keyboard/touch marker, line and label aligned at every size. No mapping framework, map service, building address or API request is introduced.

## Photograph setup and publication
No internship photographs were found. public/lifewood was created with documentation only; the production gallery is a truthful empty ready state. No workplace, coworker, event or caption was fabricated.
Add actual JPG/JPEG, PNG, WebP or AVIF originals under public/lifewood. Recommended names are internship-01.jpg through internship-04.jpg, but the application references only verified filenames in src/data/lifewood-photos.json.
The manifest starts as an empty array. Example after adding an actual file:
    [{ "filename": "internship-01.jpg", "publication": "pending", "alt": "Verified description", "caption": "Optional verified caption" }]
Only change publication to approved after public-use permission and content review, including people and visible documents/screens. Private, pending, unlisted, missing, corrupt, unsafe and ambiguously duplicated entries are withheld. Do not invent descriptions.
The server/build helper creates cache derivatives with orientation correction, maximum widths 1280 and 320 and WebP encoding, preserving originals. Public URLs contain filename/content hashes; only selected/nearby images are decoded/preloaded, thumbnails load lazily and object-fit contain preserves portrait/landscape ratios.
Astro normally copies all public files into dist. The small integration blocks raw photo paths in development and removes generated raw-photo copies at build completion, then emits only currently approved derivatives under dist/experience-media. Revoking approval also removes stale production derivatives. Cleanup is restricted to verified generated output directories and refuses original-source folders.
No private-preview bypass or automatic approval exists. Editing the manifest and reloading/rebuilding updates the catalog.

## Interaction and motion
One Experience presentation controller owns map/gallery/photo state. The marker and View My Experience link enter a stable-height panel over 560ms; Back to Map and Escape restore the map. Finite native Web Animations handle only inner views and photo stage; independent GSAP outer information/map wrappers provide restrained scroll depth. This uses existing dependencies, with no React, mapping library or continuous gallery loop.
Reduced motion, Pause and hidden-tab events settle/cancel decorative movement. AbortController, generation guards and animation cancellation clean up page lifecycle work. Photo selection has a separate decode generation and a single current image animation.
Keyboard return uses each transition's scroll position and focus ownership, so it restores the original trigger without stealing focus moved to contribution content or pulling a visitor back after scrolling away. No focus trap.
Native disclosures preserve all contributions without JS. The static fallback shows essential internship/location information and a gallery-ready state; approved SSR photos also have native image links.

## Validation ledger
Watched new data/media/browser contracts fail before implementation. Six data/media tests pass, including approved-only output, pending/private/unlisted withholding, revocation, unchanged original bytes, raw/encoded URL blocking, other-asset pass-through, ambiguous approval withholding and source-cleanup refusal.
The initial complete Experience browser run passed 12 empty-state/responsive/accessibility cases; two synthetic photo cases exposed test/catalog selector issues. Root state attributes now have separate names from child image/view selectors.
Fresh review found two real interaction defects (focus ownership/return boundary and overlapping photo animations). Three targeted assertions reproduced them; all four targeted photo/focus tests passed after focused corrections. No unrelated controller was altered.
Standard npm build passes: one static route. Astro/TypeScript passes: 77 files, zero errors, warnings or hints.
Production-source resolution was corrected for Astro's rebased prerender import.meta.url.
A first full regression attempt was stopped after About motion failures. Console diagnosis found development Vite 504 Outdated Optimize Dep responses for GSAP/ScrollTrigger. Touching config mtime without changing its bytes refreshed the server. A fresh normal-motion diagnostic now reports active with no failed requests, and the unchanged About regression passed. The failed initial log is preserved as full-tests-stale-vite.tap.
A replacement complete serial regression run is in progress. Append exact results after completion; do not claim the entire suite is green before checking its final totals.

## Responsive and visual evidence
Desktop 1920/1366/1024: two columns. Tablet/mobile 768/390/320: internship content before map/gallery, with touch-safe controls and no page overflow in the targeted checks.
The existing header mascot placement remains separate from all interactive map and contribution elements. Existing mascot regressions are included in the full run.
.cache/experience-showcase contains desktop Experience/map and empty-state screenshots, all six experience-final-*.png layouts, an explicitly synthetic-fixture gallery screenshot and experience-map-gallery.webm.
The recording uses 51 actual CDP browser frames over 4069ms, encoded with native MediaRecorder; capture sampling is not an application FPS benchmark.
Live development verification: gallery opens; raw /lifewood/unknown.jpg returns 403; current photo catalog is [].
Fresh read-only review of the interaction corrections reported no further material findings.

## Integrity and limitations
Final source scope and original SHA-256 checks are recorded separately. No original art, project screenshot, school/portfolio logo or resume is intentionally changed.
No real photography is integrated. Future photographs still require verified descriptions and explicit approval. Contribution-to-photo associations were not invented.
Only Edge automation was available; Safari/Firefox and physical older-device performance were not tested. The map is intentionally generalized. No deployment or later-phase work was performed.

## Final verification

- Complete restarted serial suite: **193 passed / 2 failed / 195 total**, no skipped/cancelled cases.
- All **22 new Experience tests passed**: 16 browser cases plus 6 content/media cases. Existing mascot, Education, Projects, navigation and page-motion regressions passed, including Experience-specific reversible depth.
- Full-suite Tech Stack logo test timed out waiting for scroll stability; its unchanged isolated rerun passed.
- The already-recorded Tech Stack deferred-Back viewport assertion failed both the full run and isolated rerun. It remains unresolved and outside this Experience-only change. The full suite is **not green**; no unrelated assertion was weakened or implementation edited.
- Stale Vite optimizer initialization failures in the initial aborted attempt were resolved by reloading the config without changing its contents. Normal development motion now initializes active with no failed requests, and the unchanged About test plus full restarted About suite passed.
- Final standard production build exited 0: one static route. Astro/TypeScript exited 0: 77 files, zero errors/warnings/hints.
- Six responsive widths passed Experience split/stack, marker target-size, map/gallery, keyboard and no-overflow checks: 1920, 1366, 1024, 768, 390 and 320px.
- Final original-resource verification passed all 27 SHA-256 baselines: 22 character illustrations, 4 screenshots and resume. The source and downloadable resume both hash to 57f8a234762463324da1b48c782771695943181836a8eed4ff6aaf5932e6e6da.
- Of 215 existing checkpoint files, 209 remain identical. Only the six authorized existing files listed above changed. Separate comparison confirms all non-Experience CSS rules remain identical. Original school/portfolio logos, all other section components, mascot modules, verified project data, typography/tokens and package files remain unchanged.
- public/lifewood contains README.md only. The approval manifest is empty; dist/experience-media contains no images. No real internship photos were integrated. Synthetic test patterns remain in cache/test-only routes.
- Actual motion evidence: experience-map-gallery.webm, 51 CDP frames / 4069ms. Desktop default/empty and six final-width screenshots were captured; desktop and mobile visuals reviewed. No app FPS claim is inferred from recording cadence.
- Final read-only review of focus and photo-animation corrections reported no material findings.
- Detailed machine-readable results: .cache/experience-showcase/final-validation.json. Source checkpoint: baseline.json. Raw full suite: full-tests.tap; diagnosed first attempt: full-tests-stale-vite.tap.

## Cebu-only map refinement

Removed Negros, Bohol and Leyte outlines/labels and the visible A chapter in Cebu. heading. Cebu, Bantayan and Camotes remain, with the original city marker geometry and gallery controls. The map region now has a direct accessible name instead of referencing the deleted heading.
Production build and Astro/TypeScript checks passed (77 files, zero errors/warnings/hints). All 22 Experience tests passed, including six responsive widths. The full unrelated regression suite was not rerun for this small cleanup. Current map screenshots are experience-map-1366.png and experience-map-390.png; the earlier transition recording predates this geographic cleanup.
