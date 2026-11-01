# Mr. Fresh's Project Orbit Implementation Plan

Goal: Replace only the four stacked Projects stages with a compact elliptical selector and accessible project details.
Architecture: Astro renders all four entries through the existing typed project data and one reusable detail template. A single lightweight TypeScript controller selects the visible panel, owns deterministic orbital transitions, and preserves native no-JS content and project fragments.
Tech stack: Existing Astro, TypeScript, CSS, Web Animations API and GSAP/ScrollTrigger. No new dependencies.
Spec: User's Projects Orbit redesign brief in this conversation.

Constraints: Seven sections, native scrolling, no deployment or Git initialization, no source asset edits, no verified-content edits. PhilCHAN production media/links remain withheld. Mascot controller, gestures, physics and all other sections remain unchanged.

1. [x] Selection geometry and tests: create src/scripts/project-orbit-layout.ts and tests/project-orbit-unit.test.mjs. Cover cyclic indices, shortest unwrapped rotation, bounded ellipse positions and deliberate horizontal swipe rejection of vertical gestures.
2. [x] SSR presentation: update Projects.astro and ProjectShowcase.astro, add src/styles/project-orbit.css. Add optional SectionFrame headerMascot prop defaulting true; only Projects disables its header dock and adds one project-orbit dock at the center. Keep every project field and native disclosure; render four panels from one template. No-JS exposes all panels. Keep project IDs and data-technologies for Tech Stack.
3. [x] Controller and browser tests: add src/scripts/project-orbit.ts and tests/project-orbit-browser.test.mjs. Default Anthea, cyclic arrows, direct clicks, scoped keyboard navigation, pan-y safe swipes, live status, fragment-driven selection, interruptible 560ms elliptical WAAPI transitions, lifecycle cleanup, pause/reduced/hidden safe settling. No animation loop while idle. ResizeObserver reads geometry only when needed.
4. [x] Scroll integration: replace Projects-specific GSAP targets with independent editorial, orbit SVG and details wrappers. Never transform orbit items or mascot ancestors. Existing main ResizeObserver/toggle refresh handles disclosure changes.
5. [x] Regression contracts: adapt only old stacked-stage/project-dock tests to the new manually selected orbit. Preserve meaningful differential parallax, reverse scrolling, publication and other section assertions.
6. [x] Validate: build, Astro/TS checks, all existing suites and new selection suites serially; six responsive widths, no-JS, real touch scrolling, keyboard, pause/reduced/hidden, rapid selection, source SHA-256 checks and desktop/mobile evidence. Review scoped changes before completion.

Review focus:
- Tech Stack project fragments must reveal previously inactive panels before native scroll/focus.
- Selection, resize, pause and page lifecycle cannot leave stale WAAPI animations or duplicate controllers.
- The shared mascot and orbit hit targets must remain clear of one another, including at 320px.
- Four SSR panels must remain readable if controller initialization fails.
- Restricted PhilCHAN artwork and links must never enter production.

Rulings: User explicitly authorizes implementation of this detailed design; proceed without another design approval. There is no Git repository; use the local source/hash checkpoint instead, do not initialize Git.

Implementation ledger: selection geometry unit tests passed after first failing on the absent module; default-orbit browser acceptance failed on the old stacked build and passed after replacement. At 320px and 1024px, measured companion/control overlap led to reserved orbit height and an external control strip. Swipe fixture was corrected to begin on the dedicated non-button surface; actual horizontal swipe and vertical native scroll then passed. Review reproduced two defects (late detail animation ownership and failed observer initialization); per-animation tracking and transactional cleanup made both new regressions pass. All active tiers now use 560ms, with fewer path samples in light mode. Final build and Astro/TypeScript checks passed. Complete serial regression run is recorded in .cache/project-orbit/full-tests.log; final outcome pending. Source resource and mascot-module hashes match baseline.

Final validation: production build passed (one route); Astro/TypeScript passed (67 files, zero errors/warnings/hints). Complete run: 135/136, including all 117 pre-existing tests. The sole new restoration failure was an immediate rendered-panel expectation during the designed 100ms outgoing transition. No application change was needed; the helper now waits for the selected panel with a 2s bound while retaining immediate selected state and all accessibility assertions. Full new orbit suite rerun: 19/19 passed. The whole combined suite was not repeated after this test-only correction. Six final responsive captures and a 94-frame / 4.8s browser recording were generated from the production build; recording decoding, time progression and changing pixels verified. All baseline differences are confined to the planned four source files and five adapted test files; original resources, typed project data and mascot modules are unchanged. See .cache/project-orbit/validation-summary.json for results and limitations.
