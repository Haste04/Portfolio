# Global parallax reset ? completion report

> Current update: the user subsequently authorized About-only alternating panel entrances. See [the About motion report](about-alternating-slides.md). Other sections retain the scroll reset.

Completed 2026-10-30. Scope: remove decorative scrolling and entrance animation only. No redesign, new parallax, mascot overhaul, Phase 5, Git initialization, or deployment.

## Audit and removal

The pre-change classification and implementation plan are in [the motion audit](superpowers/plans/2026-10-30-global-parallax-reset.md).

- **A ? removed:** GSAP page bootstrap, lazy engine, ScrollTrigger registration/driver, contexts/timelines, heading reveal masks, typography entrance/exit, section atmosphere drift, Hero depth choreography, Education grid opacity progression, Projects background/detail movement, Tech gallery separator/header/atmosphere progression, Experience card/map drift, and Contact heading/background/link choreography.
- **B ? preserved:** Education selection-driven camera/panel transitions; native angular CSS 3D Project Orbit; technology FLIP-style focus/return/switching; Experience map/photo transitions; disclosures and photo selection.
- **C ? preserved:** every mascot source module and stylesheet, Hero container entrance, attention, click/pet reactions, bounded toss/bounce/spring, inactivity, sleep/wake, Contact bedtime, and single-character section docking.
- **D ? preserved:** section tracking, floating/mobile navigation, hide/show, anchors, smooth native scrolling, keyboard focus, Back to Top, reduced motion, and Pause.

No CSS scroll-timeline or animation-timeline was present. The two remaining CSS keyframe families are mascot breathing and the functional Education detail-panel fade. Static ring tilts, scene geometry, grids, section numbers, gradients and responsive compositions remain as artwork.

## Files removed

- src/scripts/motion/controller.ts
- src/scripts/motion/engine.ts
- src/scripts/motion/shared.ts
- src/scripts/motion/hero.ts
- src/scripts/motion/projects.ts
- src/scripts/motion/timelines.ts
- src/scripts/motion/technology.ts
- src/scripts/motion/contact.ts
- src/components/MotionWords.astro

## Files updated

- **src/layouts/BaseLayout.astro:** removed global motion initialization and pageshow bootstrap.
- **src/components/SectionFrame.astro:** ordinary visible heading text; removed reveal-only Hero wrappers, preserving name lines, title, punctuation, headings and accessible labels.
- **src/scripts/motion/policy.ts:** retained the existing shared interaction capability/preferences policy; removed the unused decorative distance field. Its tier/mode decisions are unchanged.
- **src/scripts/project-orbit.ts:** removed the unused global page-motion attribute observer. Orbital geometry, animations, gestures, selection and details are unchanged.
- **src/scripts/education-camera.ts / navigation.ts:** removed redundant checks of the deleted page-motion status; retained their own Pause, visibility and reduced-motion checks.
- **src/styles/cinematic.css:** retained static artwork/layout and functional focus/hover styles; removed reveal masks, obsolete shutters and unused former stacked-stage choreography styles.
- **src/styles/education.css / project-orbit.css / technology-gallery.css:** Pause CSS reads the existing Pause button/mascot state directly; no replacement global driver.
- **src/styles/tokens.css:** removed unused cinematic/standard duration and easing tokens; kept the used interaction timing.
- **README.md:** current architecture and reset documentation; historical motion reports remain available.
- **Tests:** motion-browser, parallax-runtime and parallax-v2 now assert scroll stability instead of deliberate motion. Existing branding/selection/functional assertions remain. About, Education, Orbit, Tech and navigation tests wait on their actual component/Pause state rather than a removed driver.
- **New tests:** tests/motion-source.test.mjs and tests/helpers/scroll-reset.mjs.
- **Documentation:** this report and the pre-change audit/plan.

The seven section components, content/data, Contact layout, photography, logos, mascot implementation, project information, and media-publication configuration were not rewritten.

## Validation results

| Check | Actual result |
|---|---|
| Astro production build | Passed; one static route |
| npm run check | 76 files; 0 errors, 0 warnings, 0 hints |
| npm test | **214 passed, 0 failed, 0 skipped** |
| Source reset checks | No GSAP imports, ScrollTrigger owner, page-motion bootstrap/status, CSS scroll animation, or reveal-only heading masks in application source |
| Idle/paused frame instrumentation | No continuous JavaScript RAF chain; zero former 250ms ScrollTrigger maintenance intervals |
| Native interaction regressions | Map zoom/pan, chapters, 3D Orbit, swipe/keyboard selection, toolkit category zoom/return, photo gallery, disclosures, navigation and download passed |
| Mascot regressions | Entire existing browser/unit coverage passed, including gestures, physics, sleep, lifecycle, docking, bedtime and Pause |
| No JavaScript | Core content, stories, project information/disclosures, location and contact links remain accessible |
| Resource integrity | All 27 original baseline resources pass SHA-256 verification; extended pre/post comparison confirms 166 protected asset/data files unchanged |
| Publication restrictions | PhilCHAN production media/outbound links remain withheld; approved-photo-only behavior passed |

The initial new source checks failed against the old system and then passed after removal. A responsive measurement was corrected for intentionally display:none decorative layers: an empty rectangle has no document-space position. Visible-layer motion/visibility assertions were retained.

### Responsive and live browser verification

Microsoft Edge 156.0.4314.50 through Playwright, with normal motion and native page scrolling.

- **Production:** 1920, 1366, 1024, 768, 390 and 320px. All seven sections have stable decorative transforms/opacity/document coordinates, readable headings, and no horizontal overflow.
- **Live development:** http://127.0.0.1:4321/ at 1366 and 1920px plus 390/320px mobile checks. Existing background dev server reused.
- Ordinary wheel scrolling, reverse scrolling, rapid navigation, reload, resize, reduced-motion changes, saved Pause, hidden tabs and page restoration passed.
- Live development/production runtime evidence: **zero JavaScript errors and zero console warnings**.
- Screenshot-only capture hides floating navigation/skip link overlays; separate navigation regressions exercise the real controls.

### Measured zero-parallax evidence

Development browser, 1366px. Document positions include scrollY, so ordinary document scrolling changes viewport position without changing these values.

| Layer | Scroll positions | Document top before ? after | Decorative displacement |
|---|---|---|---|
| Hero name | 0 ? 360 | 384.640625 ? 384.640625px | 0px |
| Hero role | 0 ? 360 | 651.390625 ? 651.390625px | 0px |
| Hero atmospheric halo | 0 ? 360 | 224.1875 ? 224.1875px | 0px |
| Hero background lettering | 0 ? 360 | 505.5 ? 505.5px | 0px |
| Anthea background ring | 4699 ? 5059 | 4958.796875 ? 4958.796875px | 0px |
| Anthea details wrapper | 4699 ? 5059 | 4866.8125 ? 4866.8125px | 0px |

All listed transforms remained none. Other static artwork retains its intentional fixed CSS transform. All measured sections also preserve opacity and reverse to the same coordinates.

## Evidence

- Full suite output: .cache/global-parallax-reset/full-suite.log
- Development/production measurements and console results: .cache/global-parallax-reset/runtime/results.json
- Six-width browser checks: .cache/global-parallax-reset/browser/results.json
- Pre-change hashes and final integrity summary: .cache/global-parallax-reset/before-hashes.json and integrity.json
- Desktop development Hero: .cache/global-parallax-reset/runtime/development-hero-desktop.png
- Mobile development Contact: .cache/global-parallax-reset/runtime/development-contact-390.png
- Desktop Projects: .cache/global-parallax-reset/browser/projects-1366.png
- Additional mobile/desktop section captures are in the same browser/runtime folders.

Screenshots were inspected, alongside browser-reported movement measurements. No new video was recorded; the JSON measurements provide the scroll evidence.

## Remaining dependencies and limits

GSAP 3.15.0 remains installed for later authorized work, but is not imported or fetched by the application. No ScrollTrigger instance, ticker, maintenance timer, lazy animation engine, or decorative scroll observer remains.

Functional finite animations and mascot breathing/section transitions deliberately remain. Idle-frame assertions refer to JavaScript callbacks, not the browser compositor performing the preserved CSS breathing.

Firefox/Safari, physical touch hardware, and older-laptop hardware were not tested. Automated touch and keyboard tests ran in Edge. No performance scores or frame-rate guarantees are claimed.

The accepted layouts are now a static baseline ready for a future, explicitly approved section-by-section scrolling redesign. No new parallax, Phase 5 work, mascot overhaul, or deployment was performed.
