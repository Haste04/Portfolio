# Light mode V2 refinement plan

Authorized scope: light-theme visual styling only. No new parallax, interaction changes, original-resource edits, Git creation or deployment.

- [x] Capture all seven sections before changes in light/dark at desktop/mobile; snapshot source/resource hashes and static computed-style/geometry baselines.
- [x] Inspect Hero top-edge artifact in the actual development browser and compare production.
- [x] Adjust only the light token block for stronger warm neutral borders, secondary surfaces and muted ink. Keep accessible amber text and dark tokens unchanged.
- [x] Add one light-only stylesheet for component typography, surface separation, static decoration hierarchy and interactive-state contrast. Preserve geometry and opacity ownership of the orbit; preserve all interaction controllers.
- [x] Add focused visual/readability checks, compare dark computed styles and About photo / Experience map dimensions, and capture light before/after at all seven sections.
- [x] Run build, types, full existing suite, theme transition and six-width light/dark checks. Investigate failures without weakening unrelated assertions.
- [x] Verify source/resource integrity, publish local evidence/report, and stop for review.

Design decisions: use existing semantic tokens first; scoped visual rules only where component-specific font sizes or static decoration blends require them. Retain #A45826 for small accent text (4.66:1 on paper); use requested #AA602B only as a decorative tone if useful. No logo/image processing is required.

Verified scope exception: measured typography reflow moved the visible Contact section about49px and could interrupt its native reveal. The existing theme controller received a one-shot section-origin correction; all other controllers remain unchanged. Full suite254/255 due pre-page-load Edge I/O suspension; complete reveal rerun13/13. See docs/light-mode-v2.md for exact evidence and limitations.
