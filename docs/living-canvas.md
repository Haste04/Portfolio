# Phase 4.6 - Living Canvas
One shared ambient controller and seven section-specific decorative layers. No scroll parallax, content changes, new dependencies, or mascot-controller changes.

## Ownership audit
- Static scenery: reused only as an ambient background owner (Hero ring markers).
- Functional transitions: Education zoom, project selection, toolkit focus and Experience photos unchanged.
- Mascot: one existing controller, unchanged actor transforms, gestures, physics, idle, docking and bedtime.
- Navigation, theme reveal and accessibility: existing controls remain authoritative.
IntersectionObserver controls only suspension; there is no scroll listener or scroll-progress timeline.

## Files
- src/components/LivingCanvas.astro: small inert SVG/CSS backgrounds, one per section.
- src/components/SectionFrame.astro: inserts the shared decorative layer.
- src/components/CinematicScene.astro: marks existing Hero rings for reuse.
- src/scripts/living-canvas/controller.ts: one pointer listener, visibility/lifecycle management, cached geometry and finite input-driven frames.
- src/scripts/living-canvas/proximity.ts: bounded proximity and segment/ellipse geometry.
- src/styles/living-canvas.css: semantic ambient colors, native idle motion, spring-back and responsive simplification.
- tests/living-canvas*.test.mjs: geometry, browser reactions, lifecycle, native touch, responsive layout and interaction preservation.
- docs/superpowers/plans/2026-10-31-living-canvas.md: implementation plan and ownership classification.

## Seven effects
1. Hero: existing rings breathe subtly; nearby rendered outlines attract by up to 18px and brighten; 650ms return. Rotated outlines are sampled using their actual static transform.
2. About: delayed warm illumination behind the opaque photo panels, visible in surrounding space; no photograph/text overlay.
3. Education: faint blueprint grid, breathing background and 15 nearby intersection highlights.
4. Projects: three sparse, slowly traveling dashed signals along independent curved paths; proximity brightens signals.
5. Tech: 12 decorative nodes and 11 connections behind the existing chamber layout; proximity lights nodes and links.
6. Experience: five decorative contours behind the panels; nearby paths brighten and shift by at most 4px.
7. Contact: three very slow resting ellipses and a finite 1200ms outward ripple with an 1800ms cooldown.

## Motion and themes
Existing theme tokens feed ambient ink, with a Warm Paper copper adaptation. Both themes share exactly one engine. Existing circular logo/paw reveal freezes ambient motion while browser snapshots are active.
Native CSS handles idle clocks and spring-back. Pause freezes in-flight decorative CSS transitions too. Reduced motion leaves static backgrounds. Offscreen, hidden and restored-page paths are explicitly managed; no touch cursor is synthesized.
Existing capability policy combines viewport, pointer capability, memory/cores and save-data hints. Light tier removes network/contour breathing and slows signals.

## Performance
No idle JavaScript frame chain or intervals. Pointer events coalesce into one finite frame; calculations use cached section coordinates and path samples. Layout reads occur during initialization/ResizeObserver batches, not pointer frames. Signals use three SVG stroke-dash animations; native CSS can still incur painting/compositing work. This is lightweight design, not a hardware benchmark.

## Validation
Production build: passed (one static route). Astro/TypeScript: 93 files, zero errors/warnings/hints.
Resource integrity: 126 image/PDF hashes unchanged, original 27-resource library baseline passed, original/download resume SHA-256 identical.
Final regression and review results are recorded below.

## Evidence
See ../.cache/living-canvas/review.html and browser/ for dark/light, desktop/mobile idle/reactive captures.
See ../.cache/living-canvas/browser/results.json for actual proximity/opacity/displacement measurements.
Desktop Hero probe: proximity 0.972, rendered translation -17.5px; heading stays fixed.

## Limitations
Browser validation uses installed Microsoft Edge/Chromium. Safari/Firefox and physical older-laptop hardware are not yet verified. Capability hints are heuristic. Photographic backgrounds and foreground interactive surfaces intentionally mask decorative layers; effects remain visible in surrounding negative space.

## Final validation ledger
| Check | Actual result |
| --- | --- |
| Final production build | Passed; one static page |
| Final Astro and TypeScript checks | 93 files; 0 errors, warnings or hints |
| Initial complete `npm test` | 277 tests: 272 passed, 5 failed |
| Living Canvas runtime/dual-theme responsive cases within that full run | 12/12 passed |
| Final geometry and lifecycle tests | 9/9 passed |
| Final rebuilt-production motion and theme tests | 24/24 passed |
| Original dark-style baseline and signature-sequence reruns | Both passed unchanged |
| Isolated preview/publication and corrected Escape-setup reruns | 2/2 passed |
| Final SHA-256 verification | 126 image/PDF resources unchanged; original 27-resource baseline passed |
| Original, public and production resume PDF | Byte-identical SHA-256 |
| Recorded browser frames | 49 dark + 63 light; player verified |
| Normal development browser console | No page errors, console errors or warnings captured |

The full suite was not repeated as a single batch after the final fixes. The five original failures were investigated individually:
- Dark static baseline: the Pause button never stabilized for the automated click; comparison itself was not reached. The unchanged test passed on rerun.
- Living Canvas resume: a paused reaction could retain stale proximity after the pointer moved away. One finite reconciliation update fixes this, while preserving the last performance tier during Pause.
- Isolated local-preview startup: the auxiliary server twice missed its existing 60-second HTTP-readiness deadline. Better HTTP/error diagnostics and response-body consumption were added; the subsequent test passed with all source-denial, local-only preview and production-publication assertions intact. The deadline was not increased.
- Toolkit Escape: test setup focused an offscreen technology while native smooth focus-scrolling was still moving the page; this tripped the existing scroll-away safety guard. Setup now puts the section in view and waits for docking before activation. Immediate Escape, focus restoration and zoom-layer cleanup assertions remain. The toolkit controller is unchanged.
- Signature-theme sequence: a phase-sensitive assertion failed once; the unchanged rerun passed. Both incoming-theme pixel comparisons and the full final 13-case reveal suite passed.

Additional review-driven defects were caught and fixed: offscreen resets launching transitions, Contact's native ripple finishing offscreen, rotated-ellipse proximity, freezing an in-flight spring, and CSS clocks failing to resume after restoration. Final tests check actual animation clocks and native touch scrolling, not just flags. Independent read-only review found no remaining critical or important defects.

## Responsive and visual evidence
All seven sections were checked in both themes at 1920, 1366, 1024, 768, 390 and 320 pixels. No horizontal overflow was found. Existing maps, project selection, toolkit focus, gallery controls, contact links, keyboard interactions, native disclosures and the single mascot remain operational in the executed tests.
- [All seven sections: 28 idle/reactive screenshot pairs](../.cache/living-canvas/review.html)
- [Actual timestamped Hero browser recording in both palettes](../.cache/living-canvas/recording.html)
- [Full dark Contact resting view](../.cache/living-canvas/capture/dark-contact-resting.png)
- [Full light Contact resting view](../.cache/living-canvas/capture/light-contact-resting.png)
- [Measured runtime responses](../.cache/living-canvas/browser/results.json)
- [Initial complete test log](../.cache/living-canvas/full-tests.log)
- [Final production tests](../.cache/living-canvas/final-production-tests.log)
- [Final geometry/lifecycle tests](../.cache/living-canvas/final-lifecycle.log)
- [Resource integrity](../.cache/living-canvas/integrity-after.json)

Recorded playback uses real CDP JPEG frames, sorted by capture timestamp; it is not an encoded MP4. Actual browser inspection observed seven layers, 74 decorative elements in total, and one mascot in both themes. Living Canvas JavaScript is 6,274 bytes minified / 2,504 bytes gzip in the final build.

## Final scope and remaining limitations
Two existing test files also changed: `tests/navigation.test.mjs` for readiness diagnostics, and `tests/technology-gallery-browser.test.mjs` for settled Escape-test setup. No existing functional controller, asset, content data, dependency or route changed. No Git repository was created; no deployment or new parallax was performed.
The isolated-preview startup remains close to its existing deadline and may be sensitive to machine load. Browser verification is Edge 156; physical older laptops, Safari and Firefox remain untested. Capability tiers are hints, not a hardware benchmark. Native SVG dash movement still incurs some paint work, restricted to visible sections.
Ready for user visual review; no later phase has started.
