# Projects spatial orbit enhancement

## Scope and implementation

Product changes:
- src/components/sections/Projects.astro: dedicated perspective camera around the existing mascot plane and icon wrapper; removes the orbit title's forced line break; adds one restrained arc to the existing SVG rings.
- src/styles/project-orbit.css: preserve-3d camera/bridge, upright billboard controls, fluid title, and small center-stage clearance adjustment.
- src/scripts/project-orbit-layout.ts: pure depth profiles and projection-safe geometry.
- src/scripts/project-orbit.ts: existing selected-project owner extended with finite x/y/z, scale, opacity and depth-rank poses.

Tests changed: project-orbit-unit.test.mjs and project-orbit-browser.test.mjs. Existing project data, ProjectShowcase content, other section components, mascot modules and GSAP modules remain unchanged. No dependency or route was added.

The existing component title reads Mr. Fresh's Project Orbit. on one line when its container has room, with the original amber span. Mobile wraps naturally. The primary editorial section heading and introduction are preserved.

## Actual depth, not a perspective flag

For an icon's relative angle a, x = sin(a) times the horizontal radius; y = cos(a) times the vertical radius; z = cos(a) times the depth amplitude. Selected a=0 sits in front; opposite a=pi sits behind. Small continuous scale modulation accompanies native CSS perspective, rather than substituting for real z translation. Opacity ranges from .8 to 1 to keep rear labels readable. Integer depth ranks support ordering; the shared CSS 3D context performs spatial sorting.

The radius calculation accounts for projected billboard dimensions using P/(P-z), including worst-case scale. No clipping, blur or opacity is applied to the preserve-3d camera/bridge. Opacity belongs to leaf planes. The buttons never rotate around X/Y; labels stay upright.

Profiles:
| Profile | Perspective | Depth amplitude | Rotation |
| --- | --- | --- | --- |
| Capable wide desktop | 1000px | 160px | 740ms / 32 segments |
| Small laptop or balanced capability hints | 1100px | 125px | 740ms / 32 segments |
| Tablet | 1200px | 70px | 740ms / 32 segments |
| Mobile or low-resource hints | none | 0px | 620ms / 16 segments |

Static geometry remains stable when motion is paused or reduced. Movement still uses the existing motion policy: Pause, hidden tab and reduced motion settle immediately. Capability hints include cores, memory and Save-Data, not width alone; these are conservative hints, not hardware benchmarks.

The existing native Web Animations implementation precomputes a finite set of poses and stops when navigation ends. There is no idle orbital requestAnimationFrame loop. Rapid selection uses the current visual turn and the existing generation/cancellation guard. Logical offsetWidth/offsetHeight measurements avoid feeding projected sizes back into layout. Resize updates the profile and settles the selected pose. All listeners, observers, hash frames and animation handles retain explicit cleanup.

## Mascot and page parallax isolation

Mr. Fresh remains a flat central plane at z=0. No mascot transform, physics, gesture, click, pet, inactivity or bedtime code is edited. The center wrapper changes from 44% to 40% with a 112px minimum width to reserve safe orbital space; his controller still owns his internal position and appearance.

The camera and icon bridge have pointer events disabled; genuine buttons and the existing dock opt back in. Background items can recede behind the character's plane without covering his hitbox. Existing mascot controls remain below the trajectories. Browser checks exercise the real pointer target and drag displacement while icon rotation is held mid-flight.

Existing GSAP ScrollTrigger choreography owns the separate decorative ring/word and detail-depth wrapper. It never owns camera, icon-pose or mascot transforms. The orbit's manual selection remains independent of scroll progress.

## Content, access and restrictions

One authoritative selected-project state still synchronizes pressed buttons, indicator, live announcement and active details. Previous/Next cycle; direct selection chooses an exact project; arrow/Home/End keys and horizontal swipes remain supported. Native vertical scrolling, visible focus, native case studies and the no-JavaScript four-project fallback remain intact.

Project contributions, technologies, screenshots, links and resume bytes are preserved. FuelWatch remains absent. Production withholds PhilCHAN client-owned media/outbound destinations. The evidence recording uses a production static server.

## Measured evidence

A normal-motion full-capability browser test measured:
- Front Anthea: z=160px, width=128.7618px.
- Rear Seek First Books: z=-160px, width=86.0690px.
- Side items: z=0px, width=104px.
- Foreground/rear apparent-size ratio: approximately 1.496.

Tests also sample actual matrices and projected bounds at multiple animation times, require meaningful incoming enlargement, verify upright labels, and compare current versus retargeted positions. A real drag during an intermediate pose preserves a 20px horizontal pointer displacement.

The recording profile explicitly supplies 8-core/8GiB capability hints to exercise the full configuration; this is a test setting, not a physical-device performance claim. Normal balanced hints were separately verified at plus/minus 125px depth.

Local evidence: .cache/project-orbit-3d/ contains orbit-initial.png, orbit-mid-rotation.png, selection-*.png, six projects-final-*.png layouts, project-orbit-rotation.webm, recording.json, recorded-midpoint.json, results.json and the full-test log. The WebM is assembled from actual Chromium CDP frames using native MediaRecorder; no FFmpeg or rendering dependency was installed.

## Validation and limits

Production build: one static route, PASS. Astro/TypeScript: 71 files, zero errors/warnings/hints. Initial project suite: 24/24 before the added capability case; final full-depth/low-resource/Resume targeted run: 5/5. Final combined regression results are appended after completion.

Fresh source review reported no material findings. Original-resource and broader unchanged-file hashes are checked separately. Firefox, Safari, physical low-powered devices and field FPS/LCP/INP were not benchmarked. Flat PNG artwork is not a rigged 3D character. No other phase or deployment is included.

## References

CSS perspective and preserve-3d behavior were checked against primary browser documentation:
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/perspective
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-style

## Final verification (2026-10-29)

- Final production build exited 0: one static page. Final Astro/TypeScript check exited 0: 71 files, zero errors/warnings/hints.
- All 168 distinct test cases now have a passing result across the interrupted serial run, continuation and explicit reruns. This was **not one uninterrupted green run**.
- Interrupted serial run: 119 pass / 1 fail before the server restart stopped execution. It included two V2 tests subsequently repeated.
- Continuation (V2, all Projects and gallery suites): 49 pass / 1 fail out of 50. All 25 Projects browser/unit cases passed, including six responsive widths.
- Restricted local development preview passed its dedicated unmodified rerun (1/1, 69.4 seconds). The original detailed assertion was not retained before restart, so its original cause is unconfirmed.
- Deferred gallery Back viewport assertion passed an isolated unmodified rerun (1/1), then the complete gallery browser/data rerun passed 22/22. No gallery/navigation implementation or assertions were edited. Intermittent regression timing remains a known limitation.
- Earlier completed suites cover Education, About, branding, navigation, all mascot interactions/state/physics, motion policy and browser parallax. See full-tests.log and validation.json for the execution breakdown.
- Final original-resource check passed all 27 SHA-256 baselines. Of 214 existing checkpoint files, only the four Projects product files and two Projects tests changed; the other 208 remain identical. School/brand logos, mascot modules, other sections, page GSAP modules, project data and packages are unchanged.
- Original and downloadable resume both hash to 57f8a234762463324da1b48c782771695943181836a8eed4ff6aaf5932e6e6da.
- Six widths passed no-overflow, heading, target-size, shared-mascot and selection checks: 1920, 1366, 1024, 768, 390 and 320px.
- Recording: 71 real CDP frames over 6275ms, encoded as project-orbit-rotation.webm. Capture sampling is not a measured application FPS benchmark.
- Synchronized intermediate screenshot holds the orbit at 160ms while the selected Lifevent panel is visible: Lifevent z=135.042px / width=124.296px; Anthea z=85.722px / width=116.188px. Settled Lifevent reaches z=160px and width=128.762px, from side z=0 / width=104px.
- Visual review inspected desktop, mobile and intermediate screenshots. Edge was tested; Safari/Firefox, physical older laptops and field performance were not tested. No deployment or later-phase work was performed.
