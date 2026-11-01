# Signature dark/light themes

Status: both theme stages implemented and verified; awaiting visual review. See the exact split-run test results and remaining validation limitation below.

## A. Architecture and tokens

The existing seven-section static Astro page now supports Midnight and Warm Paper through semantic CSS custom properties. No route, content dataset or mascot controller was replaced.

- `src/styles/tokens.css`: background, surfaces, inset/raised/input panels, main/secondary/muted ink, accent/hover/focus, borders/dividers, shadows, geography and fixed photographic-canvas roles.
- `src/scripts/theme-preference.ts`: pure preference resolution and a self-contained head bootstrap.
- `src/scripts/theme.ts`: one lifecycle-managed theme controller.
- `ThemeToggle.astro`: a semantic Sun/Moon button beside the existing navigation visibility control, outside the hideable navigation.
- `ThemeEmblem.astro`: a body-level, decorative, inert symbol. Keeping it outside the transformed floating navigation makes its fixed position truly viewport-centered.

Midnight retains #101114 / #24262C / #F3F1ED / #D88A46. Warm Paper uses #F5F1E9, white raised surfaces, #24262C ink and #55504A secondary ink. Its accent is #A45826: the suggested #AA602B measured only 4.22:1 against the paper background; the adjusted shade measures 4.66:1. This is a token-level accessibility adjustment.

## B. Files created or modified

New:
- `src/scripts/theme-preference.ts`, `src/scripts/theme.ts`
- `src/components/ThemeToggle.astro`, `src/components/ThemeEmblem.astro`
- `src/styles/theme.css`
- `scripts/prepare-theme-assets.mjs`
- `tests/theme-preference.test.mjs`, `tests/theme-styling.test.mjs`, `tests/theme-reveal.test.mjs`, `tests/theme-interactions.test.mjs`

Integration:
- `BaseLayout.astro`: prepaint bootstrap, global theme CSS and body-level emblem.
- `FloatingNav.astro` and `src/pages/index.astro`: control and supplied light/dark branding sources.
- Education/Experience components: tokenized SVG grid strokes; Experience also selects the supplied company logo variant.
- Existing global, portfolio, cinematic, About, Contact, Education, Experience, Project Orbit, Technology Gallery and token styles: semantic colors, retaining their accepted structures.
- `scripts/prepare-assets.mjs`: invokes the separate derivative generator.
- Legacy browser test contexts explicitly request the approved Midnight baseline. Experience logo fixtures describe both new theme sources; navigation assertions include the new keyboard-accessible control.
- README and this report document usage, validation and limits.

No dependency was installed. Functional component controllers, mascot code/styles, typed content, map data and original assets remain unchanged.

## C. Site-wide styling

Hero typography, CTA surfaces and static geometry follow the theme. About photographs retain their original dark directional overlay and ivory story copy in both themes. Education and Cebu maps use readable land, grid, marker and label tokens. Project Orbit depth and selection remain intact; frames, details, tags and case studies adapt to the palette. Technology logos retain brand colors; the white GitHub, Next.js and Vercel marks receive a scoped contrast treatment in light mode. Experience uses the actual supplied light/dark Lifewood identities. Contact, navigation, focus rings and controls follow the same semantic roles.

The favicon remains the approved dark-lettered/light-mode asset. It was not regenerated or replaced for theme switching.

## D. Logo and paw assets

- Incoming dark symbol and existing dark branding: `public/assets/brand/portfolio-logo.webp`, the optimized white HE derived from the supplied `Portfolio-Dark Mode.png`.
- Light branding: new `public/assets/brand/portfolio-logo-light.webp` (264 x 101, 8,766 bytes), derived from the supplied transparent dark-lettered `public/assets/brand/portfolio-logo.png`.
- Light Lifewood identity: new `public/company-logos/lifewood-logo-light.webp` (440px wide, 15,414 bytes), from `public/lifewood/Lifewood Logo Light Mode.png`.
- Incoming light symbol: an original small inline SVG paw made from four elliptical toes and one pad. It is separate from Mr. Fresh's artwork and controller.

The logo retains its proportions and colors. The transition symbol remains within a 108px circular stage; the HE itself is 84px wide and the paw is 66px. Only the reveal circle grows.

## E. Signature reveal

1. Predecode the emblem and only branding currently visible in the viewport.
2. Show the requested theme's symbol at viewport center with a 200ms anticipation.
3. Capture browser-managed old/new root views. Apply the incoming theme to the existing live DOM in the native update callback.
4. Animate `::view-transition-new(root)` from `circle(0px at 50% 50%)` to `ceil(hypot(width/2,height/2))+3px` over 820ms.
5. Keep the incoming snapshot above the outgoing one and disable the UA crossfade. Fade the symbol's separate named snapshot group without stretching it.
6. Release snapshots, animations, temporary listeners and the busy state.

This reveals actual incoming text, surfaces, logos, borders and components. It does not cover an unchanged page with a flat color. There is no manual page clone or component remount.

During snapshot capture, inherited non-mascot CSS transitions are suppressed so hover-color interpolation cannot contaminate the incoming palette. Mascot-owned transforms remain untouched.

## F. Initialization and persistence

The inline head bootstrap applies `data-theme`, native `color-scheme` and theme-color metadata before visible rendering. `portfolio-theme` stores only an explicit dark/light choice. With no valid stored choice, the site follows `prefers-color-scheme`, including later system changes. After manual selection it retains that choice. Storage exceptions are caught; the current tab remains usable even if persistence is unavailable. A manual choice is retained in module memory across controller/page restoration even when storage remains missing or contains an older value. A fresh reload still cannot recover a choice that storage was unable to save.

The button describes the next mode and a polite status describes the active mode. Reinitialization destroys the previous controller and its listeners.

## G. Compatibility, interruption and accessibility

The animation uses progressive enhancement. Missing/throwing/rejected View Transition support switches directly to the requested theme. Reduced motion, the existing Pause control and a hidden document also take the instant path. The controller verifies that pseudo-element animation is supported before relying on it.

Only one reveal may run. Rapid extra clicks are ignored. Scroll, in-page navigation, Escape, resize, hiding the tab, enabling Pause and page teardown settle safely to the requested theme; they never leave a blocking symbol or partial clip. A finite 2.4-second watchdog covers stalled image/API promises. Lifecycle restoration reinitializes theme ownership without replacing Mr. Fresh.

The control retains keyboard focus, remains available when navigation is hidden, and has a 46px touch target. No focus trap or automatic theme-induced scrolling is introduced. No-JavaScript content retains the static Midnight fallback; the nonfunctional toggle is hidden.

Automated compatibility is limited to installed Microsoft Edge 156. Unsupported and failing API paths are simulated there. Safari, Firefox, physical touch devices and actual older-laptop GPU behavior are not claimed as verified.

## H. Actual validation results

| Check | Actual result |
| --- | --- |
| Production build | Passed; one static route; prebuild also verified all 27 original resource baselines |
| Astro / TypeScript | Passed: 85 files, 0 errors, 0 warnings, 0 hints |
| Latest combined suite | 241/242 passed, 1 integration actionability timeout; no skipped tests |
| Existing regressions in that run | 214/214 passed, including mascot, navigation, maps, Orbit, Toolkit, Experience, publication and scroll-reset checks |
| Final theme suite after test-only setup correction | 28/28 passed, 0 failed, 0 skipped |
| Live development-server checks | 4/4 passed: both directions at 1366px and 390px, preserved scroll and one mascot, no errors/warnings |
| Both palettes / responsive layouts | 1920, 1366, 1024, 768, 390 and 320px; all seven sections; no horizontal overflow |
| Resource integrity | 167 protected files unchanged; 22 original illustrations, 4 project screenshots, logos, photos and original/copy PDF verified |
| Existing functional controllers | All 8 non-mascot controllers and all mascot modules/styles unchanged |
| Publication check | Intentionally exits 1: PhilCHAN permission remains unconfirmed and restricted production media/links stay withheld |

The combined run's only remaining timeout was in the new cross-section theme test clicking Back to Toolkit. It did not reproduce in the isolated integration-file rerun. That test now explicitly waits for the existing mascot's section handoff before testing a normal manual Toolkit interaction, and additionally asserts that the focus view is non-inert and Back is visible. The dedicated tests for selection during physical/docking transitions remain unchanged. All 28 theme tests passed after this test-only correction. No application code changed after the combined run. **The complete combined command was not repeated after the test setup correction; it would be inaccurate to describe that command as a clean 242/242 run.**

The storage-restoration regression was reproduced before the implementation fix, then passed for both missing and stale localStorage. A read-only code review identified this case. Earlier transient mascot-pose and Toolkit timeouts passed on targeted reruns and in the latest combined run; their controllers were not changed.

Theme tests cover first-frame initialization, saved/system preference, storage failure, all seven sections in both palettes, actual incoming/outgoing pixels, both symbol directions, centered full coverage, rapid input, lifecycle/API failures, reduced motion/Pause, scroll preservation, one mascot and held dragging, and functional Education/Orbit/Toolkit/Experience/Contact behavior.

Measured page-background contrast: Midnight main/muted/accent 16.74 / 8.03 / 6.87:1; Warm Paper 13.42 / 5.27 / 4.66:1. These measurements do not constitute a complete WCAG audit of every composite surface or photo.

Logs and machine-readable results:
- `.cache/theme-signature/build-final.log`
- `.cache/theme-signature/type-check-final.log`
- `.cache/theme-signature/full-suite-complete.log`
- `.cache/theme-signature/theme-final.log`
- `.cache/theme-signature/validation-summary.json`
- `.cache/theme-signature/integrity.json`

## I. Visual evidence

Representative screenshots (navigation-visible live captures and full section captures):
- [Dark live desktop](../.cache/theme-signature/final-live/dark-1366.png)
- [Light live desktop](../.cache/theme-signature/final-live/light-1366.png)
- [Dark live mobile](../.cache/theme-signature/final-live/dark-390.png)
- [Light live mobile](../.cache/theme-signature/final-live/light-390.png)
- [Dark desktop](../.cache/theme-signature/styling/dark-home-1366.png)
- [Light desktop](../.cache/theme-signature/styling/light-home-1366.png)
- [Dark mobile](../.cache/theme-signature/styling/dark-home-390.png)
- [Light mobile](../.cache/theme-signature/styling/light-home-390.png)
- [Incoming dark midway](../.cache/theme-signature/reveal/dark-mid.png)
- [Incoming light midway](../.cache/theme-signature/reveal/light-mid.png)
- [Light Education](../.cache/theme-signature/styling/light-education-1366.png)
- [Light Experience mobile](../.cache/theme-signature/styling/light-experience-390.png)

Actual live development-browser recordings:
- [Dark to light playback](../.cache/theme-signature/recordings/light-transition.html)
- [Light to dark playback](../.cache/theme-signature/recordings/dark-transition.html)

These are finite offline HTML players containing captured browser JPEG frames (54 and 59 frames), not an encoded MP4/WebM or a fabricated animation. Captured on 127.0.0.1:4321, with no console errors/warnings. Before/after holds make each recording approximately two seconds long. The page animation itself is approximately 1.02 seconds plus snapshot/decode overhead.

At 1366 x 900 the midpoint radius measured 554.315px and the final radius 821px. Both reveal directions matched the actual incoming screenshot inside the circle and the outgoing screenshot outside it at 100% of sampled pixels within tolerance. 22,311 foreground text pixels changed to the incoming theme, demonstrating more than a solid-color overlay. Tests also measure circle coverage and centered symbol coordinates at all six widths.

## J. Performance and preserved systems

No continuous frame loop, new library, expensive page filter or runtime network asset service was added. All themes share the existing DOM; only the browser briefly creates native snapshots. Logo derivatives are small. Offscreen company logos and photography retain lazy loading. Listeners/timers/animations are bounded and cleaned up.

Native user-triggered map zoom, Project Orbit, technology focus, experience photo enlargement, navigation and Mr. Fresh remain independent owners of their transforms. No decorative scroll driver, ScrollTrigger or new parallax was introduced. GSAP remains installed as before and is not imported by this feature.

PhilCHAN permission remains unconfirmed: its production screenshot and outbound links remain withheld. Approved-photo filtering remains unchanged. The existing publication checker therefore intentionally blocks deployment.

## K. Limits and review

Core palette contrast was measured, but this is not a full WCAG audit of every photograph pixel, logo or composite surface. Native snapshots may be skipped on resource-constrained browsers; the fallback remains a functional instant theme change. Browser frame captures are evidence, not a hardware frame-rate benchmark.

Both stages are ready for visual review, with the split-run verification limitation above recorded explicitly. No deployment, new scroll choreography, mascot overhaul or later phase has been started.

Technical references: [Chrome same-document transitions](https://developer.chrome.com/docs/web-platform/view-transitions/same-document), [MDN startViewTransition](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition).
