# Hero cinematic departure - Phase 4.7 (reverted)

> Historical report: the user subsequently requested removal of Hero parallax. The engine, wrappers and coordinate bridge described below have been removed. Home is static with Living Canvas and mascot interactions preserved.

Implemented and verified locally. Scope is Hero only; ready for visual review. No deployment or Git repository creation.

## Behavior and architecture

The initial Hero composition matches the pre-change baseline at all six requested widths in both themes. Native scrolling drives one bounded, reversible departure without pinning, added scroll height, or About choreography.

- Main heading, job title, introduction and CTAs move upward together. Opacity remains full for the first 42% of departure, then fades gradually.
- Oversized background lettering travels more slowly and scales to 1.035.
- Orbital scenery rotates and expands on a new outer wrapper. Living Canvas retains its existing ring transforms and cursor reactions.
- Scroll to Explore fades early. Keyboard focus restores its visibility; focusing Hero content restores text readability.
- The outer mascot stage moves subtly. An independent countertranslated interaction plane keeps Mr. Fresh's actual screen coordinates and hit testing unchanged. No mascot-owned transforms or controller modules were edited.
- Narrow/touch or capability-constrained configurations use smaller distances. Both theme palettes and the circular theme reveal remain intact.

The engine uses installed GSAP and ScrollTrigger. ScrollTrigger measures the Hero bounds; a paused GSAP timeline renders through finite batches scheduled by native input events. Its instance and global background services are parked between guarded geometry refreshes when Hero is their only owner. There is no new continuously running idle JavaScript frame chain or maintenance interval.

The lifecycle controller handles resize, visibility, reduced motion, Pause, theme transitions, teardown and back/forward cache restoration. Pausing freezes departure and restores content opacity. Returning to the page top while paused restores the initial composition. Reduced motion reverts to static layout. Failed loading leaves readable, usable content. Theme reveals temporarily freeze departure and retain progress/scroll position.

The small Living Canvas change inverse-projects Hero pointer coordinates through the scroll-owned rotation/scale. It writes no scroll transforms and preserves the shared ambient controller.

## Application files

Created:
- `src/scripts/hero-depth/controller.ts`: lifecycle and finite scheduling.
- `src/scripts/hero-depth/engine.ts`: scoped GSAP timeline and ScrollTrigger bounds.
- `src/scripts/hero-depth/geometry.ts`: bounded profiles/progress and pointer projection.
- `src/styles/hero-depth.css`: layout-neutral ownership wrappers, focus and motion fallbacks.

Modified:
- `src/components/sections/Hero.astro`: separate scroll and interaction planes; local bootstrap.
- `src/components/SectionFrame.astro`: Hero-only content wrapper.
- `src/components/CinematicScene.astro`: Hero-only background/ring wrappers.
- `src/scripts/living-canvas/controller.ts`: Hero coordinate-projection bridge.

Created `tests/hero-depth-unit.test.mjs`, `tests/hero-depth-browser.test.mjs`, and `tests/fixtures/hero-depth-baseline.json`. Updated only superseded Hero-static expectations in `tests/helpers/scroll-reset.mjs`, `tests/motion-source.test.mjs`, `tests/motion-browser.test.mjs`, `tests/parallax-runtime.test.mjs` and `tests/parallax-v2.test.mjs`. Other-section isolation assertions remain strict.

## Actual browser measurements

Development server: http://127.0.0.1:4321/, normal motion, Edge/Chromium 156, dark theme, 1366 x 900. Y values below are transforms relative to initial layout, excluding ordinary document scrolling.

| Scroll Y | Departure | Main copy Y | Background lettering Y | Copy opacity | Rings |
| --- | --- | --- | --- | --- | --- |
| 0 | 0% | 0px | 0px | 1.00 | 0 degrees / 1.00 |
| 360 | 18.6% | -42.8px | -15.8px | 1.00 | 1.86 degrees / 1.022 |
| 657 | 50.1% | -115.1px | -42.5px | 0.87 | 5.01 degrees / 1.060 |
| 1129 | 100% | -230px | -85px | 0.08 | 10 degrees / 1.120 |

At midpoint the layers differ by about 72.6px, rather than merely changing by a few pixels. The About document top stays 1188.71875px throughout. The net additional transform on the mascot interaction plane stays zero. Upward scrolling restores the original transforms.

## Visual evidence

[Open the motion review and screenshot gallery](../.cache/hero-depth/review.html).

This contains actual browser-frame playback from ordinary mouse-wheel scrolling down and back up: 83 dark frames and 80 light frames. It is an HTML playback artifact, not an encoded MP4. Both playback directions/themes were checked; all frame files exist and timestamps are chronological.

Thirty screenshots cover five scroll positions in dark/light at 1366, 1920 and 390px. Representative comparisons:

- [Dark initial](../.cache/hero-depth/visual/dark-1366-initial.png)
- [Dark midpoint](../.cache/hero-depth/visual/dark-1366-midpoint.png)
- [Dark departure / natural About entry](../.cache/hero-depth/visual/dark-1366-departure.png)
- [Light midpoint](../.cache/hero-depth/visual/light-1366-midpoint.png)
- [Light mobile initial](../.cache/hero-depth/visual/light-390-initial.png)
- [Light mobile midpoint](../.cache/hero-depth/visual/light-390-midpoint.png)

The captured page and playback inspection reported no JavaScript console errors. Desktop initial/early/departure, light desktop midpoint and mobile compositions were also visually inspected.

## Validation results

- Astro production build: passed, one static page.
- Astro/TypeScript check: 98 files, zero errors, warnings or hints.
- Final Hero geometry/browser/source scope run: 16/16 passed.
- Supporting motion, mascot-unit and theme-reveal checks: 39 passed.
- Navigation, actual Hero CTA activation, Living Canvas and legacy development/production Hero regression run: 13/13 passed.
- Native mobile touch-scroll preservation: 1/1 passed.

These are 69 distinct relevant passing checks across focused runs, not a claim that the entire repository test suite was executed. New browser coverage includes actual differential/reverse motion, all six responsive widths, both themes, mascot drag and petting, transformed ring proximity, Pause/reduced motion, theme reveal mid-departure, resize, hidden tab, bfcache, reload, zero idle frames/maintenance interval, failed script loading, no-JavaScript fallback and accessible CTA/cue behavior.

An initial production run had 54/55 pass because the newly added fixture compared production geometry against a development capture. Investigation reproduced the same Projects height difference in the original unmodified composition: development 1379.875px versus production 1375.515625px at 1920px. A verification-only isolated build reconstructed the original markup with in-memory source overlays, without reverting workspace files. The fixture now contains matching immutable development and production captures; strict geometry/font/color tolerances were retained. The corrected 16-test run passed.

Independent code review found a duplicate ScrollTrigger-enable service leak and an invisible focused scroll cue; both were reproduced, corrected and covered. Import-cancellation and paused-resize lifecycle handling were also hardened. Final review reported no remaining critical or important findings.

Responsive coverage: 1920, 1366, 1024, 768, 390 and 320px. No horizontal overflow, added scroll gaps, About layout change or blocked Hero CTAs was observed in the tested configurations.

## Resource and scope integrity

SHA-256 comparison: all 126 tracked original image/PDF resources unchanged. Fourteen protected source files (the other six section components and mascot modules) are unchanged. The original and production resume hashes both equal:

`57f8a234762463324da1b48c782771695943181836a8eed4ff6aaf5932e6e6da`

School logos, approved photographs, original illustrations/project screenshots and portfolio branding were not edited. Publication restrictions remain in place. No dependencies were added.

## Limitations / future integration

Visual/browser verification used Edge/Chromium 156 on this machine. Safari, Firefox and physical older laptops were not tested. Capability hints remain heuristics rather than a hardware benchmark. Mobile uses intentionally restrained departure.

The parked ScrollTrigger adapter is appropriate to the current single Hero owner. Future section-by-section GSAP work must explicitly coordinate global service ownership before adding independent triggers. This task adds no About, Education, Projects, Tech Stack, Experience or Contact parallax.

Stop here for user review.
