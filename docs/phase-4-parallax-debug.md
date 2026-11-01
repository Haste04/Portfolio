# Phase 4: live-runtime parallax correction

Status: correction validated; Phase 4 remains awaiting visual review. No Phase 4.5, Phase 5 or deployment.

## 1. Reproduced root cause

The earlier completion report was too broad for its evidence. The original 14 motion tests served
the production build, simulated eight-core/eight-GB capabilities, and accepted small translation
deltas. They did not establish a noticeable experience in a normal live development session.

I inspected the existing server at http://127.0.0.1:4321 in Microsoft Edge, at 1366 x 768, with
normal motion, Pause off, and browser-reported capabilities: four logical processors / eight GB. No capability spoofing
was used. The session had no stored `fresh-paused` value and did not request reduced motion.

The animations were **initializing and updating, but their visible effect was underpowered**:
- The balanced desktop tier multiplied travel by 0.55.
- The name's trigger began only when the padded Hero section reached the top. It remained at zero
  additional translation through the first 180px of scrolling.
- The outline background word began at y=952.8px in a 768px viewport, so it was initially invisible.
- The grid moved vertically along its vertical lines, making most of its translation visually invariant.
- Project travel and the very low decorative contrast further weakened the perceived depth.

Measured in that live session:

| Native scrollY | Halo translateY | Background type translateY | Name translateY |
| --- | --- | --- | --- |
| 0 | -11.52 | 26.41 | 0 |
| 180 | 1.88 | 7.42 | 0 |
| 360 | 15.28 | -11.56 | -9.63 |

Thus the name moved only 9.63px and the halo 26.80px beyond normal document scrolling over 360px.
This reproduces the reported visually static result without inventing an initialization failure.
The original diagnostic is preserved in `.cache/parallax-debug/before-live-runtime.json`.

I cannot read the user's personal browser profile. The observed clean session was not disabled by a
preference; an independently stored Pause or OS reduced-motion setting remains respected.

## 2. Initialization and runtime findings

GSAP and ScrollTrigger modules returned HTTP 200 in development. The lazy engine initialized,
scrubbed transforms changed with native scrolling and restored on reverse scrolling, and no
mascot-transform ownership conflict was found. ES-module GSAP does not require `window.gsap`;
its absence is not evidence of failed initialization.

The recording session directly inspected the loaded modules: GSAP 3.15.0, ScrollTrigger 3.15.0,
registered together, 69 triggers enabled, `data-page-motion=active`, balanced tier, reduced motion false,
and no stored Pause. Its runtime/error record is in `recording-metrics.json`.

No engine registration, IntersectionObserver or lazy-loading rewrite was needed. The existing
section observations and seven reserved mascot anchors remain unchanged. Development-only error
logging now identifies initialization/refresh exceptions instead of silently hiding their cause
behind the static fallback. Production still falls back to readable content.

## 3. Changes and scope

| Files | Reason |
| --- | --- |
| `src/scripts/motion/hero.ts` | Start depth at the first scroll, increase opposing ring/type/foreground travel, move the grid across its lines, and animate independent horizon details |
| `policy.ts` | Keep reduced/Pause/hidden gates; use 0.8 travel for balanced desktop and 0.45 for tablet rather than 0.55 / 0.32 |
| `about.ts`, `shared.ts` | Sustain staggered card movement through the visible scroll range; strengthen independent editorial-number depth |
| `projects.ts` | Increase frame, screenshot and background-type separation while retaining distinct transform wrappers |
| `timelines.ts`, `technology.ts` | More recognizable institution/activity movement, constellation depth and opposing center movement |
| `contact.ts` | Opposing closing-ring and type movement |
| `controller.ts` | Add DEV-only error diagnostics; lifecycle and preference behavior otherwise retained |
| `src/styles/cinematic.css` | Put background lettering within visible compositions, improve restrained line contrast, reserve project-stage room, and contain moving visuals |
| `tests/parallax-runtime.test.mjs` | Add real-capability wheel-input tests for both the live development server and production build |
| Documentation | Mark the earlier controlled-build report as superseded and record the actual correction/evidence |

Review found that clipping the project stage also clipped its bottom progress indicator.
A new paint-boundary assertion reproduced that issue. The line now sits inside the padding edge.
The assertion uses fractional bounding geometry rather than rounded clientHeight.

Mr. Fresh's modules, components, CSS, gestures, physics and bedtime were not edited.
GSAP only targets independent page scenery, text, cards, SVG and screenshot/frame wrappers.
No dependency was added. No original resource, project contribution, contact detail or resume was edited.

## 4. Measured corrected movement

Live development measurements at 1366 x 768, normal motion, balanced tier:

| Effect | Native wheel distance | Layer A transform change | Layer B transform change |
| --- | --- | --- | --- |
| Hero | 360px | Halo +125.95px | Background type -87.20px |
| Anthea | 420px | Frame -69.82px | Screenshot +27.93px |
| About | 360px | Builder card -71.41px | Editorial number -53.70px |
| Education | 360px | Institution -30.17px | Editorial number -62.68px |
| Tech Stack | 360px | Constellation -39.78px | Center +22.19px |
| Experience | 360px | Heading -23.47px | Editorial number -59.41px |
| Contact | 360px | Ring +56.29px | Type -62.54px |

The Hero name now moves **-54.58px**, compared with -9.63px before.
The halo/type differential is **213.15px** over the same 360px wheel scroll.
Its background word begins at y=553.5px rather than y=952.8px, making it initially visible.

Anthea's background type moves -105.79px, giving three distinct planes.
Its frame/screenshot differential is **97.75px** over 420px of wheel scrolling.
The academic progress rule grows by 247.80 rendered pixels and the experience rule by 266.15px;
the constellation connection dash changes by 1206 units.

Production records the same Hero and Anthea transform deltas at this viewport.
At 1920 x 1080 with the same browser-reported capabilities, the Hero halo moves +121.66px,
type -84.22px and name -52.96px. Both desktop sizes pass reverse and reload checks.

These are changes in each layer's own transform, beyond ordinary document scrolling.
The tests also record viewport and document bounding positions at multiple wheel steps, compare
different layer rates, scroll backward to the starting transforms, and repeat Hero checks after reload.

## 5. Visual evidence and recordings

All screenshots are captured from the actual running site, not rendered substitutes.

- [Hero initial](../.cache/parallax-runtime/development-hero-initial.png)
- [Hero after wheel scrolling](../.cache/parallax-runtime/development-hero-scroll.png)
- [1920px Hero initial](../.cache/parallax-runtime/development-hero-wide-initial.png)
- [1920px Hero during scroll](../.cache/parallax-runtime/development-hero-wide-scroll.png)
- [Anthea entering](../.cache/parallax-runtime/development-anthea-entering.png)
- [Anthea mid-scroll](../.cache/parallax-runtime/development-anthea-middle.png)
- [About during scroll](../.cache/parallax-runtime/development-about-scroll.png)
- [Contact during scroll](../.cache/parallax-runtime/development-contact-scroll.png)
- [Earlier live Hero](../.cache/parallax-debug/before-hero.png)

Playable evidence:
- [Hero forward/reverse wheel recording](../.cache/parallax-runtime/hero-wheel.webm)
- [Anthea forward/reverse wheel recording](../.cache/parallax-runtime/anthea-wheel.webm)
- [Recording gallery](../.cache/parallax-runtime/recordings.html)

The recordings use real Chrome DevTools browser frames from a 1920 x 1080 normal-motion session,
captured at 1600 x 900. Native wheel events move the page forward and backward.
The frames are encoded with the browser's native VP9 MediaRecorder, preserving their timing.
Both resulting WebM files were decoded and played in the browser; no recording dependency was installed.
They do not animate a screenshot or reconstruct motion from transform numbers.

## 6. Validation and preferences

| Verification | Result |
| --- | --- |
| `npm.cmd run build` | Passed; one static route; 51 image derivatives and an unchanged PDF copy prepared |
| `npm.cmd run check` | Passed; 52 files, zero errors/warnings/hints; TypeScript no-emit passed |
| `npm.cmd test` | **84 passed, 0 failed, 0 skipped/cancelled**, 483.663 seconds |
| Existing tests | All 74 passed, including 24 mascot browser, 15 mascot unit/asset, 21 portfolio and 14 motion tests |
| New live-runtime tests | All 10 passed: five development and five production tests, with multiple layers/projects/sections per case |
| Desktop | 1366 x 768 and 1920 x 1080 measured with ordinary wheel input and browser-reported capabilities |
| Responsive | Existing six-width checks passed at 1920, 1366, 1024, 768, 390 and 320px; new development/production mobile checks also passed |
| Lifecycle | Rapid/reverse scrolling, reload, saved Pause/Resume, reduced motion and hidden-tab suspension passed |
| Functionality | Navigation, disclosures, tech relationships, contact links, resume download and mascot regressions passed |
| Browser diagnostics | New runtime test error/warning arrays empty; final recording runtime issues array empty |
| Publication guard | Expected exit 1; PhilCHAN permission remains unconfirmed and restricted production content remains withheld |

Evidence is saved in `.cache/parallax-runtime/results.json`, `recording-metrics.json`
and `final-validation.json`. A read-only review's progress-line finding was reproduced and corrected.
No existing test was deleted, weakened or skipped.

The new tests do not replace or weaken the existing tests. They run on both development and production,
without mocked hardware capabilities, and use ordinary wheel increments. Hero thresholds require
at least 35px foreground movement, 65px halo movement, 45px type movement and 100px differential
over 360px of scrolling. They also require initially visible background type and grid motion across lines.
Project thresholds require independent frame/type/image movement; other sections verify travel,
visible timeline progression, connection drawing and reversal.

Saved Pause is explicitly tested across reload, then resumed through the existing control.
Reduced motion remains static. Mobile retains the lightweight tier. No preference is cleared or
overridden in the application to make the demonstration work. If a personal browser reports
`data-page-motion=paused`, the existing Resume control is the intentional way to enable motion;
`reduced` means the browser/OS accessibility preference is active.

## 7. Integrity, limitations and review

All **27 original resources** match their SHA-256 baselines: 22 character illustrations,
four project screenshots and the resume. Library counts remain unchanged.
The 20 protected mascot/content/navigation/foundation files also match the pre-debug checkpoint.
All original and existing project screenshots were preserved.

Original, public and production resume copies share SHA-256:
`57f8a234762463324da1b48c782771695943181836a8eed4ff6aaf5932e6e6da`.
The browser download regression also verified the downloaded bytes.
The full integrity record is in `.cache/parallax-runtime/final-validation.json`.

Motion tests constrain meaningful movement and visibility, but cannot judge artistic preference.
The videos and screenshots are included for that review. Safari/Firefox, physical trackpad/touch hardware,
screen-reader sessions and physical-device FPS/Core Web Vitals measurements were not performed.
The increased motion remains transform-based and uses the existing lifecycle safeguards;
no extra continuous application loop, scroll pinning, hijacking, React or 3D was introduced.

The existing PhilCHAN permission gate remains in force. Production withholds restricted screenshots
and external links. Development access stays local-only. Nothing was deployed.

Phase 4 remains pending the user's review of the now-observable effects.
