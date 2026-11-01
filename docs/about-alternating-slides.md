# About pronounced alternating entrances

The existing four photo panels now enter RIGHT, LEFT, RIGHT, LEFT. Whole articles move as one unit; photographs, crops, text, dimensions, spacing and final centered positions remain unchanged. No other section receives parallax.

## Choreography

- Desktop (1024px and wider): 62% of the panel's own width; the low-resource tier uses 55%.
- Tablet: 36% of panel width, capped at 32vw.
- Mobile: 24% of panel width, capped at 22vw.
- Each ScrollTrigger range starts when the panel top reaches the viewport bottom and completes when it reaches 55% of viewport height.
- Linear progress, no smoothing lag, pinning, scale or artificial scroll length. Opacity moves moderately from 0.35 to 1. Scrolling upward reverses exactly.
- Stable measurement slots preserve the final layout. Section-local horizontal clipping prevents page scrollbars while retaining vertical content.

## Implementation

Changed existing application files:
- `src/components/sections/About.astro`: stable per-panel slots and local bootstrap.
- `src/styles/about.css`: local horizontal clipping, slot geometry and reduced-motion fallback.

Created:
- `src/scripts/about-slides/controller.ts`: one lazy About lifecycle controller and finite native-input frame batches.
- `src/scripts/about-slides/engine.ts`: four GSAP timelines using ScrollTrigger-measured scrub ranges.
- `src/scripts/about-slides/services.ts`: symmetric cleanup for the pinned plugin's media registrations.

ScrollTrigger measures each range; native input batches feed exact progress to its paused GSAP animation. Global plugin background services are stopped between construction passes, avoiding a perpetual repaint chain or maintenance interval while resting. Registration methods are temporarily scoped only during synchronous construction and restored immediately.

Pause and reduced motion restore fully visible static panels. Hidden tabs and theme reveals suspend updates. Resume, resize and restoration reconcile actual geometry. Range endpoints are recomputed from actual innerHeight, avoiding the pinned plugin's parked viewport-height cache. Failed loading/setup leaves static readable content. Teardown removes listeners, observers, frames and timeline ownership. Living Canvas and the mascot keep their own transforms and controller.

Updated tests retire only the superseded About-static expectations: About browser coverage, the shared ownership guard, motion-source scope, and the Home test's obsolete prohibition on loading ScrollTrigger anywhere. Home still has no parallax and all other section isolation checks remain.

## Measured browser movement

Actual development browser, 1366 x 900, normal motion:

| Panel | Direction | Before | Midpoint | Settled |
| --- | --- | --- | --- | --- |
| The Learner | Right | +775.5px | +390.6px | 0px |
| The Builder | Left | -775.5px | -390.6px | 0px |

These values are horizontal transforms, not ordinary document scrolling. The corresponding opacity values are 0.3532, 0.6742 and 1. Explorer and Beyond Code repeat the right/left directions. Final panel width is unchanged at 1256.71875px in this viewport.

## Visual evidence

[Open actual slow-scroll frame playback and comparisons](../.cache/about-slides/visual/review.html).

26 screenshots and 398 actual browser frames (197 dark, 201 light) cover all four panels and upward reversal. The artifact is an HTML frame player rather than an encoded video; both playback buttons were verified in a browser. All frame files exist, timestamps are chronological, and captures contain no JavaScript errors.

Representative images:
- [Learner midpoint, dark](../.cache/about-slides/visual/dark-1-midpoint.png)
- [Builder midpoint, light](../.cache/about-slides/visual/light-2-midpoint.png)
- [Explorer midpoint, dark](../.cache/about-slides/visual/dark-3-midpoint.png)
- [Beyond Code settled, light](../.cache/about-slides/visual/light-4-settled.png)
- [Mobile settled](../.cache/about-slides/visual/light-mobile-settled.png)

These screenshots were visually inspected, alongside the running-browser slow-wheel capture.

## Verification

- Production build: passed.
- Astro/TypeScript: 98 files, zero errors, warnings or hints.
- Final production validation: 11/11 passed (eight About motion cases and three source/content checks).
- Development acceptance checks passed for both themes, all six widths, reverse travel, Pause/reduced motion, no JavaScript, cleanup, injected setup failure and resize/theme progress.
- Source-scope and verbatim-story data checks: 3/3 passed.
- Full regression run: 286/288 passed, before adding the height-only resize regression. The Contact ripple test sampled a native animation with null startTime after a fixed 70ms delay. Its setup now waits for an actual numeric animation start; cooldown/duration assertions remain unchanged, and its targeted rerun passed. The low-resource Orbit check hit an 8-second click timeout in the full run, then passed unchanged in two isolated runs. No Orbit application/test behavior was changed. The full batch was not repeated after the focused fixes.

Widths: 1920, 1366, 1024, 768, 390 and 320px. No horizontal overflow or final panel size changes in tested configurations.

Review caught accumulating plugin orientation callbacks and partial transforms after setup failure. Both were reproduced with failing browser cases and corrected; those cases now pass. Initial development assertions also needed to await the actual lazy initialization rather than a fixed cold-compilation delay; displacement tolerances were retained.

## Integrity and limits

All 126 tracked original image/PDF assets remain unchanged. Only About.astro and about.css differ among pre-existing application source files; other section components, data, mascot, Living Canvas and interaction modules retain their source hashes. No dependencies, Git repository or deployment were added.

Browser verification uses Edge/Chromium 156. Safari, Firefox and physical older laptops were not tested. The media/force-refresh adapter targets installed GSAP 3.15; dependency upgrades should retain its lifecycle tests. Future additional scroll sections must coordinate global ScrollTrigger service ownership; this task does not add them.

### Final follow-up

A height-only 900px-to-700px viewport resize exposed stale percentage bounds while plugin background services were parked (202px actual versus 532px expected travel). The new regression failed first; explicit viewport-derived endpoints corrected it. That test, all seven other About motion tests, and the three source/content checks pass against the final production build.

The intermittent low-resource Orbit click timeout remains a test-suite limitation; its exact root cause was not established. Contact and Projects application files remain unchanged. Full-run and rerun logs are under `.cache/about-slides/`. All original resource hashes were rechecked after validation.
