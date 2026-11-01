# Phase 4 implementation and validation

Status: historical controlled-build report; superseded by the live-runtime correction described in [phase-4-parallax-debug.md](phase-4-parallax-debug.md). Phase 4 is awaiting visual review.
Scope: Phase 4 only. No mascot overhaul, Phase 5, or deployment.

## Existing work preserved

The existing Astro application, single route, seven section order, floating navigation, four projects,
native disclosures, technology relationships, education, experience, contact links and resume were retained.
The checkpoint is in `.cache/phase4-baseline/`; before screenshots are in `.cache/phase4-before/`.
No Git repository was initialized and no commits, resets or deletions were performed.

The mascot implementation remains unchanged: all eight modules, MrFresh.astro, MascotDock.astro
and mascot.css are byte-identical to the checkpoint. Navigation/technology controllers, typed content,
tokens, global/portfolio CSS and index.astro are also unchanged (20 protected files in total).

## Cinematic features

| Section | Implemented treatment |
| --- | --- |
| Hero | Masked, staggered name entrance; independent foreground name/role, outlined background type, grid and halo depth; native scroll cue; stronger desktop typography |
| About | Kinetic word reveal, differently offset story cards, restrained rotation/depth, asymmetric composition and native expandable stories |
| Education | Reversible amber timeline progress, staggered institution movement, achievement underline progress and section outline number |
| Projects | Large colored presentation stages; separate frame, screenshot and outline-type parallax; alternating frame rotation and stronger Anthea travel; progress rules and hover/focus borders |
| Tech Stack | SVG entrance, independent orbit/center depth, reversible connection-line drawing and refined selected nodes; native keyboard relationships retained |
| Experience | Restrained heading/timeline progress and staggered professional content; warmer hierarchy and elevated activity panel |
| Contact | Oversized word reveal, independent closing rings/type, restrained contact entrance and link feedback; existing bedtime area remains independent |

The three approved screenshots stay real, lazy-loaded, proportionate and readable.
PhilCHAN uses its existing withheld-media treatment in production. Its restricted local preview remains
loopback-only; no production demo/source link or screenshot was exposed.

## Architecture and ownership

Only `gsap@3.15.0` was added. There is no React, Lenis, Three.js, WebGL, pinning, scroll normalization,
forced scroll sequence, or game engine.

`src/scripts/motion/controller.ts` coordinates capability policy, lazy loading, preference changes,
visibility, debounced resize/layout refresh, cancellation and restoration. The engine loads only for
eligible motion; reduced-motion startup does not request its bundle.

`engine.ts` owns one GSAP context per section. Section modules implement Hero, About, timelines,
projects, technology and Contact. `shared.ts` rejects any animation target inside a mascot dock or
containing a dock. Stable section/stage wrappers trigger motion; separate image/ink wrappers own transforms.
Neither the mascot's physics transforms nor its state machine are controlled by GSAP.

Active viewport rebuilds revert section contexts while retaining the driver. Pause, hidden tabs,
reduced motion, failure and teardown revert to the readable CSS baseline and suspend driver maintenance.
Resume initializes at the current native scroll position. Pending startup frames, timers, observers
and listeners have explicit cancellation; a generation check rejects stale async initialization.

A narrow compatibility adapter handles GSAP 3.15's repeated global-enable media registrations.
It retains the initial fixed document-lifetime media integration, suppresses duplicate registrations
during synchronous driver setup, and restores the exposed runtime methods in finally. Two cancellable
quiet frames let disabled maintenance callbacks drain before resume. This is version-specific and
should be revalidated on a GSAP upgrade; it does not edit dependency files or private GSAP state.

## Responsive, accessible and performance behavior

Full movement is reserved for capable large layouts. Balanced laptop/tablet settings reduce travel;
mobile, save-data and low-resource hints select light motion and omit SVG depth/line animation.
Reduced motion is static. Hints supplement viewport width and are intentionally approximate.

Static HTML/CSS remains fully readable without animation initialization. Failed imports and controlled
refresh exceptions restore static content. Native anchors, disclosures, menu controls, contact actions,
resume downloads and keyboard technology selection remain available.

Page code adds no continuous custom frame loop. Enabled ScrollTrigger has its normal library maintenance;
that driver stops on pause/hidden/reduced motion. Tests check one active sync interval, none while paused,
no paused decorative frame callbacks after ticker sleep, and no multiplied RAF chain after resume.
No idle mascot physics loop, full-resolution source download, video background or heavy filter was added.
No FPS, Core Web Vitals or old-device performance guarantee is claimed.

## Failures investigated and corrected

- A new pause test rejected SVG identity matrices as different from `none`. It now verifies identity
  transforms and unchanged paused scrolling; it still rejects actual movement or hidden content.
- Hero masks added 9px of horizontal overflow at 1920px. Horizontal mask padding/margins were removed;
  the six-width regression retains its scrollWidth/clientWidth assertion.
- Refresh exceptions now tear down contexts and select a static failure state. The hero entrance flag
  survives BFCache controller recreation. Contact no longer animates the same box used as its heading trigger.
- Driver teardown now stops maintenance; repeated enable cycles no longer add media hooks or RAF chains.
- Extra constellation padding could move the character out of view during node selection. Original
  spacing and all section/dock locations were retained.
- Petting input previously mixed screenshot/hover timing with many protocol round trips. The test now
  resets its sample after capture, sends three gentle native-pointer strokes and asserts the actual
  gesture duration stays below two seconds. Incidental-hover rejection and Happy/Content remain required.
- The restored-controller test could press Enter before visibility triggered its entrance. It explicitly
  scrolls to the actor and waits for visible, default-sitting idle before keyboard activation.
- An existing Astro server blocked the temporary preview server. The harness uses `--ignore-lock`,
  preserving that process and its lock. A measured cold dev response took about 36 seconds, so readiness
  has a bounded 60-second budget; the complete local-preview test allows 120 seconds.
- Initial navigation allows 15 seconds and large full-page capture allows 15 seconds. Behavioral wait
  assertions retain their existing limits. No test, assertion or permission guard was removed or skipped.

## Validation

| Verification | Actual result |
| --- | --- |
| `npm.cmd run build` | Exit 0; 51 derivatives prepared, exact PDF copied, one static route built |
| `npm.cmd run check` | Exit 0; 51 files, zero errors, warnings or hints; TypeScript no-emit passed |
| `npm.cmd test` | 74 passed, 0 failed/cancelled/skipped; 402.174 seconds |
| Existing mascot browser suite | 24/24 passed |
| Existing mascot state/gesture/physics/inactivity/asset unit suite | 15/15 passed |
| Existing portfolio/navigation browser suite | 21/21 passed |
| New motion browser suite | 11/11 passed |
| New motion policy unit suite | 3/3 passed |
| Six responsive widths | All passed with no horizontal overflow or clipped headings |
| Pause/reduced/hidden/failure lifecycle | Passed, including repeated preference and viewport changes |
| Mascot transform isolation | Passed; no GSAP ownership inside or above docks, one shared character |
| Resource integrity | All 27 original hashes/counts unchanged; 20 protected code/content files identical |
| Resume integrity | Original, public copy, production copy and browser download match |
| Publication check | Expected exit 1; permission remains unconfirmed, production remains restricted |

All three browser evidence records contain empty error arrays. A fresh read-only review found no
remaining important motion-lifecycle issue. The enabled driver retains one orientation query and
one sync interval; the paused frame-callback observation is zero. The final lazy motion engine is
117,946 bytes uncompressed and 45,702 bytes with local gzip; the small coordinator bundle is
5,795 bytes / 2,140 gzip. These are file compression estimates, not measured hosting transfers.

Browser: installed Microsoft Edge 155.0.4283.62 through Playwright.
Test widths: 1920, 1366, 1024, 768, 390 and 320 pixels.
Checks cover overflow/heading bounds, native navigation and no-JS functionality, intrinsic image
proportions, links, disclosures, keyboard selection, resume bytes, all mascot interactions, reverse/rapid
scrolling, live preferences, repeated pause/resize cycles, failed initialization/refresh and hidden/BFCache lifecycle.

Measured depth at 1920px: a 360px native scroll moved the Hero halo about +40.6px, background type -57.5px
and foreground name -16.8px. A 340px project scroll moved its frame about -29.0px, screenshot +11.6px and
outline type -44.0px. Tests compare transforms after scrolling backward as well. The academic progress
rule reverses from 0 to 1, and the SVG connection dash draws from approximately 1930 to 0.
These are local browser observations, not hardware performance benchmarks.

## Visual evidence

| View | Before | After |
| --- | --- | --- |
| Desktop Hero | [Before](../.cache/phase4-before/hero-desktop.png) | [After](../.cache/phase4-verification/hero-desktop-top.png) |
| Mobile Hero | [Before](../.cache/phase4-before/hero-mobile.png) | [After](../.cache/phase4-verification/hero-mobile.png) |
| Projects | [Before](../.cache/phase4-before/projects-desktop.png) | [After](../.cache/phase4-verification/projects-desktop.png) |
| Contact | [Before](../.cache/phase4-before/contact-desktop.png) | [After](../.cache/phase4-verification/contact-desktop.png) |

Additional inspected captures: [Contact bedtime](../.cache/phase4-verification/contact-bedtime.png), Hero and Anthea mid-scroll, About, Education, Lifevent, Seek First Books,
Tech Stack, Experience and mobile projects in `.cache/phase4-verification/`.
`results.json` records browser, depth, capability tiers, progress and lifecycle evidence.
Existing regression artifacts remain under `.cache/verification/` and `.cache/phase3-verification/`.

## Resource integrity and publication

All 27 immutable resources match `docs/source-assets.json`: 22 illustrations, four project screenshots
and the original resume. Source-library counts are unchanged.
Original, public-copy and production-copy resume SHA-256:

`57f8a234762463324da1b48c782771695943181836a8eed4ff6aaf5932e6e6da`

The browser download test also compares the actual downloaded PDF bytes.
`npm run check:publication` intentionally exits 1 because PhilCHAN public-use permission remains unconfirmed.
Production excludes its restricted screenshot and outbound links; local-only access guards remain tested.

## Files changed and remaining limits

New: `CinematicScene.astro`, `MotionWords.astro`, ten `src/scripts/motion/` modules, `cinematic.css`,
motion policy/browser tests and Phase 4 documentation.

Modified: BaseLayout, SectionFrame, ProjectShowcase, Hero/About/Education/Experience/Contact section
markup, package/lock files, the two existing browser harnesses, and README.
Changes are motion wrappers, visual styling, dependency setup and targeted test synchronization.
Existing content and original files were not rewritten.

Cross-browser Safari/Firefox, physical touch hardware, a screen-reader session, numerical Core Web Vitals
and physical old-laptop profiling were not performed. Device tiers are heuristics. Mr. Fresh's existing
flattened-art compromises remain; no blinking, rigging or visual behavior overhaul was attempted.

The independent wrappers and ownership guard leave the site ready for a later mascot refinement review.
Phase 4.5, Phase 5 and deployment remain outside this work.
