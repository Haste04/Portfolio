# Technology Gallery

## Scope and files

Only Tech Stack product code changed:
- src/components/sections/TechStack.astro: static gallery, one focused region, two mascot presentation anchors, native fallback.
- src/styles/technology-gallery.css: section-scoped editorial columns, logo slots, responsive information panel and decorative zoom layers.
- src/scripts/technologies.ts: selection, finite Web Animations, accessibility, presentation queue and lifecycle cleanup.
- src/scripts/motion/technology.ts: Tech Stack decorative GSAP targets only.

Added data/support:
- src/data/technology-details.ts: neutral technical definitions and official-documentation links.
- src/data/technology-icons.json: local image or text-fallback manifest.
- public/technology-icons/: 21 SVGs, one official PNG, pinned provenance and license texts.
- scripts/fetch-technology-icons.mjs and docs/technology-icon-sources.md: reproducible sourcing/offline verification.
- tests/technology-gallery-data.test.mjs and tests/technology-gallery-browser.test.mjs.
- Existing navigation, mascot, page-motion, runtime-parallax and project-orbit browser tests adapted only to the new technology UI and correct local image MIME types.

The canonical technologies.ts and projects.ts files remain unchanged. The original technology data had names/categories but no descriptions; the added definitions describe technologies, never personal proficiency or unverified project work.

## Presentation and interaction

At 1024px and above, four equal rectangular chambers form two rows: Frontend top-left, Backend top-right, Programming Languages bottom-left and Developer Tools bottom-right. The top pair is symmetrically inset; the bottom pair sits at the outer edges. Below 1024px the chambers use a two-column grid. Every one of the 24 technologies has a native named button and caption. Thin separators and logo color carry the overview; descriptions are hidden until selection. The supporting introduction is one paragraph.

One selected entry controls the focused region, category state, select navigation, live announcement and project highlights. Internal project links still select the matching Project Orbit entry. A category-grouped native select permits direct inspection of any technology. Back and Escape return to the overview and restore the selected button, unless the visitor has scrolled away during the transition. Focus alone does not activate a technology.

The 540ms desktop zoom uses aria-hidden category-background and selected-logo FLIP proxies measured at the source and destination. The logo is scaled uniformly. Real controls and images do not share these transforms. Back reverses toward the originating category. Light-tier devices use a 240ms local expansion; reduced motion, Pause and hidden-tab policy settle into usable static content. Direct switching has a finite 180ms content transition. No idle gallery animation loop or physics is introduced.

Each animation is tracked, cancellable and guarded by an epoch. Newer requests supersede older callbacks. Resize and lifecycle cleanup cancel proxies/effects; failed enhancement preserves the server-rendered toolkit. Native disclosure definitions expose all names, categories, documentation and project relationships when JavaScript is unavailable.

## One existing Mr. Fresh

The existing tech-stack dock is reparented, never cloned:
- tech-overview-anchor: centered between the bottom chambers on desktop; beneath the two-column grid on smaller screens.
- tech-focus-anchor: lower-right inside the focused stage.

The footer is outside hidden/inert view regions. In the desktop overview it shares the same twelve-track grid area as the category view, with its dock restricted to the reserved bottom-center space. Its transparent overlay has pointer events disabled except for the dock. The focused view retains the original separate lower-right footer. Layout changes and dock reparenting wait while the existing mascot reports dragging, airborne, bouncing, settling, returning or section transitions. Latest intent wins; the original focus/scroll boundary survives deferred replay. The mascot controller, physics, gestures, sleep and bedtime modules are unchanged. Existing technology attention hooks remain supported. New mascot behaviors remain deferred to the planned overhaul.

## Motion, performance and accessibility

Page-level GSAP owns only decorative typography, contour, separator and category-heading planes; no mascot dock, mascot ancestor, gallery camera or FLIP proxy is a GSAP target. Existing global layout observation refreshes ScrollTrigger when the gallery changes height.

All icon requests are local and lazy in the overview. Runtime icon files total 112,241 bytes; documentation and license files are not fetched by the UI. No runtime dependency was added. SVG/PNG proportions are preserved inside explicitly bounded grid tracks, including portrait NextAuth and Power BI artwork. Missing or failed images show named text alternatives.

Named buttons, grouped selects, visible focus, Escape, focus restoration and polite announcements provide keyboard operation without a focus trap. Mobile uses native vertical scrolling; no touch gesture handler intercepts page swipes.

## Sources and limitations

See [technology-icon-sources.md](technology-icon-sources.md) for exact primary-source URLs, pinned revisions, attribution, hashes and licenses. SQL and Java use honest text fallbacks. NextAuth uses the official PNG because the inspected repository's similarly named SVG is an unrelated documentation mascot.

PhilCHAN permission remains unresolved. Its production media/outbound-link restrictions are preserved; internal project relationships reveal no restricted destination.

Browser verification uses installed Microsoft Edge through Playwright. Physical low-powered hardware, Firefox, Safari and real screen readers were not profiled. No FPS, field-performance or cross-browser guarantee is made. No deployment or later-phase work is included.

## Validation and evidence

- Production build: PASS, one static route.
- Astro/TypeScript: PASS; 71 files, zero errors, warnings or hints.
- New gallery browser/data tests: 22/22 PASS in both complete runs.
- Initial full run: 161/162. One existing reverse-parallax assertion sampled outside its one-pixel tolerance. An isolated rerun passed; eight repeated traces showed zero reverse displacement error. The motion test now awaits rendered frames without changing displacement or tolerance assertions.
- Second full run: 161/162. The reverse assertion passed; an existing six-width motion test timed out awaiting GSAP readiness after seven seconds. Its per-width contexts are now closed immediately, active initialization is explicitly asserted and readiness status is recorded on failure. The timeout was not relaxed.
- After final test-only context cleanup: complete motion file 11/11 PASS, including the six responsive widths. The entire 162-test suite was not rerun a third time; combined green status is therefore not claimed. Intermittent readiness under a long run remains a validation limitation.
- Every gallery width (1920, 1366, 1024, 768, 390, 320) passed geometry, touch-target, single-dock, no-overflow and focus checks.
- Gallery tests include exact data/relationships for all 24 technologies, decoded image bounds/failure fallbacks, FLIP source/reverse geometry, keyboard/Escape/Back, rapid requests, deferred physical-state safety, scroll-away focus protection, native mobile swipe/tap, reduced motion, Pause/Resume, hidden tab, fragments/restoration and no-JavaScript definitions.
- Browser page-error collection: empty in gallery and motion runs.
- Original-source verifier: all 27 originals unchanged (22 illustrations, four screenshots and resume).
- Broader snapshot: 155 protected existing files unchanged, including all eight mascot modules, other section components, school/portfolio logos, canonical datasets and package files.
- Download PDF SHA-256 matches original: 57f8a234762463324da1b48c782771695943181836a8eed4ff6aaf5932e6e6da.
- Local icon verifier: PASS; coverage, source/local hashes, geometry, SVG safety, PNG signature and supporting licenses.
- Publication check remains intentionally BLOCKED for unconfirmed PhilCHAN public-use permission; production restrictions pass browser assertions.

Local evidence in .cache/technology-gallery/:
- overview-1366.png and focus-1366.png: clear production desktop layout/mascot captures with reduced motion.
- overview-final-390.png, focus-final-390.png, return-final-390.png: development mobile overview/focus/return with reduced motion.
- technology-gallery-demo.webm: 68 actual normal-motion browser screencast frames, 2,878ms, encoded with native MediaRecorder; no FFmpeg installation.
- development-evidence.json: one companion, both presentation anchors, restored focus, no overflow and no page errors in development.
- full-tests-initial.log and full-tests-second.log: complete run results including the two intermittent failures.
- parallax-timing.json: eight repeated transform traces.
- integrity.json: unchanged-file and PDF hashes.

The component is ready for visual review. The combined-suite caveat remains explicit; this work does not authorize another component redesign or mascot overhaul.

## Chamber layout revision (2026-10-24)

This presentation-only revision changes TechStack.astro and technology-gallery.css; controllers, verified data, icon assets and other sections remain unchanged. The four rectangular chambers share equal rows and widths. Desktop places Frontend/Backend symmetrically above Languages/Tools, with the single dock in the reserved bottom-center area. Smaller screens use two aligned columns and the dock beneath them.

Validation:
- Production Astro build: PASS, one route.
- Astro/TypeScript: 71 files, zero errors/warnings/hints.
- Complete gallery/data suite: 22/22 PASS.
- Relevant navigation, mascot, Pause, reverse-parallax and six-width motion regressions: 10/10 PASS.
- Widths: 1920, 1366, 1024, 768, 390, 320; matching card sizes, clear mascot space, unclipped content and no horizontal overflow.
- Current icon verifier and original 27-resource SHA-256 verifier: PASS.
- New checkpoint: other 211 existing source/resource files unchanged, including all mascot/gallery/motion controllers and original logos/screenshots/PDF.
- Fresh read-only source review: no material findings.
- Gallery scroll-away test now measures viewport stability through a legitimate height change. It retains the focus-stealing check and asserts matching native scroll compensation; it no longer mistakes scroll anchoring for a viewport jump.

Evidence: .cache/technology-chamber/overview-1366.png, overview-390.png, focus-1366.png, focus-390.png, results.json and integrity.json. Those section screenshots use reduced motion for a settled layout capture; the motion regressions separately exercise normal motion.

The full historical 162-test suite was not rerun for this layout-only revision. Its earlier long-run timing caveat above remains historical; the 32 relevant current checks pass. No browser beyond installed Edge, physical-device profiling, later-phase work or deployment is claimed.
