# Signature dark/light theme ? implementation plan
Authorized scope: theme styling, persistence, toggle and centered reveal only. No redesign, parallax, mascot controller changes, original-asset edits, Git creation or deployment.

## Audit
- Current tokens define only Midnight; component CSS includes hardcoded charcoal panels, light borders and map colors.
- About uses photographic gradients and must keep its local dark text canvas in both themes.
- BaseLayout has no page-motion bootstrap after the approved reset. GSAP remains installed but unused; all functional animations use native browser APIs.
- Floating navigation has a separate hide/show button; the theme control must remain outside its hideable content.
- Mr. Fresh owns its transforms, one DOM instance, clocks and section docking. Theme switching must keep that instance.
- Supplied white HE: public/assets/brand/Portfolio-Dark Mode.png and its existing cropped WebP.
- Supplied dark-lettered transparent HE: public/assets/brand/portfolio-logo.png. public/images/Portfolio Logo.png also exists, with a white background; no need to invent artwork.
- Lifewood dark/light originals: public/lifewood/Lifewood Logo Dark Mode.png and Lifewood Logo Light Mode.png. Raw /lifewood/ URLs remain protected; create a distinct company-logo derivative for the light variant.
- No paw-print icon found; create a small original geometric SVG, separate from mascot artwork.
- Photo approval and PhilCHAN production restrictions remain unchanged.

## Stage A ? styling and state
- [x] Save baseline source/resource SHA-256 hashes.
- [x] Add preference/bootstrap tests; verify initial failure.
- [x] Extend semantic tokens for surfaces, text, borders, focus, maps, accents, shadows and static geometry; migrate theme-dependent CSS colors, preserving photographic canvas and masks.
- [x] Add separate optimized light-logo derivatives; preserve every existing asset byte.
- [x] Add prepaint initialization, one theme controller, explicit preference persistence, system-following behavior, metadata and color-scheme updates.
- [x] Add accessible compact navigation toggle, available when nav is hidden.
- [x] Verify both themes without signature animation at six widths, with readable maps, logos and all sections.

## Stage B ? signature reveal
- [x] Show actual HE for incoming dark / geometric amber paw for incoming light before the reveal begins.
- [x] Use native View Transition root snapshots with centered clip-path expansion (hypotenuse radius); isolate the symbol in its own named snapshot group.
- [x] Keep symbol scale bounded; fade symbol during expansion. No solid-color full-page substitute or DOM duplication.
- [x] Add busy guard, hidden-tab/resize/lifecycle cancellation, Pause/reduced-motion instant path, unsupported/rejected API fallback and watchdog cleanup.
- [x] Add browser tests for actual screenshot pixel differences inside/outside the reveal, both directions, full coverage, symbols, interruption, keyboard, storage, scroll and mascot identity.
- [x] Run build/check, full regression suite (pin existing Midnight regressions to an explicit dark browser preference), and new two-theme interaction/responsive tests.
- [x] Inspect desktop/mobile and intermediate reveal captures; record videos where possible.
- [x] Verify original hashes and no parallax reintroduction; report actual results and browser limitations.

Review focus: flash-free initial theme; snapshot incoming/outgoing stacking; preservation of live DOM/state; no blocking symbol/partial view after failure; light-mode text over photographs and original white technology marks.

Final verification: production build and 85-file check passed. The full run passed all 214 existing regressions and 27/28 theme tests; the test-only Toolkit setup correction was then verified by all 28 theme tests. The combined command was not rerun after that correction. All 167 protected files remain unchanged. Full evidence and limits: docs/signature-theme.md.
