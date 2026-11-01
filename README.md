# Haggai Estavilla - Portfolio

A static Astro portfolio with seven continuous sections and one shared, interactive Mr. Fresh character.
Decorative page parallax has been reset. The accepted designs, functional transitions and mascot remain intact. New section-by-section scrolling, mascot refinements and Phase 5 require approval. Nothing is deployed.

## Develop and verify

Requires Node >=22.22.0 (verified with 24.11.1). On PowerShell use npm.cmd if npm.ps1 is blocked.

- npm install
- npm run dev
- npm run build
- npm run check
- npm test
- npm run verify:assets
- npm run check:publication

Development binds to 127.0.0.1. predev/prebuild generate optimized image copies and copy the
provided resume unchanged. Build output is dist/. Build before browser tests.
The tests use installed Microsoft Edge through playwright-core, with no browser download.
Test files run serially to avoid browser-process contention on slower machines.
Portfolio regression artifacts are in .cache/verification/; mascot artifacts in .cache/phase3-verification/.
Current reset screenshots/results are in .cache/global-parallax-reset/. Historical Phase 4 artifacts remain preserved.
Fonts are self-hosted with their upstream OFL licenses; normal builds need no network access.

## Publication status: blocked

PhilCHAN Cebu client-media permission is unconfirmed. Do not deploy until permission or a user-approved
omission has been resolved. check:publication intentionally exits 1 while this is pending.
Production contains a neutral withheld-media panel and no outbound PhilCHAN demo/source links.
The restricted screenshot derivative exists only in .cache/local-media, outside public and dist.
Development middleware serves it only on loopback; direct source/cache paths are denied.
No permission override was added.

## Source structure

- src/pages/index.astro: the only route and seven-section composition.
- src/layouts/BaseLayout.astro: metadata, global styles, fonts, skip link.
- src/components/FloatingNav.astro and src/scripts/navigation.ts: accepted navigation.
- src/components/sections/: the seven portfolio sections.
- src/components/ProjectShowcase.astro: verified contributions, screenshots and native case studies.
- src/data/: typed portfolio, project and technology content.
- src/components/MrFresh.astro: one movable character and native buttons.
- src/components/MascotDock.astro: reserved stages, with no separate controllers or images.
- src/scripts/mascot/controller.ts: authoritative state, section routing and lifecycle.
- src/scripts/mascot/state.ts: priorities, legal physical transitions and cancellable timer epochs.
- src/scripts/mascot/assets.ts: all 22 verified sources, typed IDs and explicit framing profiles.
- src/scripts/mascot/transitions.ts: two reusable image layers, pose changes and bounded decode cache.
- src/scripts/mascot/gestures.ts: click escalation, drag threshold and intentional stroke recognition.
- src/scripts/mascot/physics.ts: trajectory velocity, bounded damped collisions and spring return.
- src/scripts/mascot/idle.ts: 30/45/60-second inactivity with pausable scheduling.
- src/scripts/mascot/capabilities.ts: capability/preferences-based A/B/C tiers.
- src/styles/tokens.css, global.css and portfolio.css: accepted design foundation.
- src/styles/mascot.css: scoped character framing, stages, controls and subtle breathing.
- src/scripts/motion/policy.ts: shared capability/preferences policy for finite user-triggered transitions; no page-motion engine.
- src/styles/cinematic.css: static scenery, editorial composition and functional focus/hover styles.
- src/components/CinematicScene.astro: static decorative geometry; headings use ordinary visible text.
- scripts/prepare-assets.mjs: Sharp derivatives and byte-identical PDF copy.
- scripts/verify-source-assets.mjs and docs/source-assets.json: all 27 immutable resource baselines.
- tests/navigation.test.mjs: foundation, content, navigation, image, permission and download regressions.
- tests/mascot-unit.test.mjs: state, gestures, physics, clocks, capability and asset verification.
- tests/mascot-browser.test.mjs: real DOM interactions, lifecycle, touch, responsive and visual evidence.

## Mr. Fresh controls and behavior

Click or press Enter/Space to say hello. Three clicks within two seconds produce annoyance;
continued clicking prompts a paw swipe and a 1.5-second cooldown. Pet is a keyboard/touch alternative
to repeated gentle cursor strokes. A hover or single pass is not petting.

Mouse/pen dragging starts after eight pixels. Release velocity uses recent trajectory samples.
Tossing is confined to the reserved stage, loses bounce energy, settles, waits one second, and returns
with a short spring. Escape or Reset returns the character safely. Touch swipes keep native scrolling;
touch does not start unrestricted tossing.

Pause travels with Mr. Fresh, persists when storage is available, and cancels active movement.
Reduced motion disables physical tossing and continuous decorative movement while retaining manual
pose reactions. Capability hints are approximate; slower active frames can reduce the tier further.
There is no idle JavaScript frame loop. Hidden/offscreen activity is suspended and listeners,
observers, frames and timers are cleaned up on page teardown.

The Hero uses a brief whole-image container-to-arrival transition. Other sections use reserved docks;
the Projects section chooses a visible project dock. Contact has its own walking, stretching,
yawning and sleeping sequence, cancelled by interaction or leaving the section.

## Artwork and loading

mr-fresh/, project-assets/, and Estavilla Resume.pdf are immutable.
public/assets/mr-fresh contains 44 transparent WebP derivatives: 512/960 widths for all 22 sources.
Only the current and near-term poses load initially. The renderer retains at most eight cached pose
promises/images, plus its display layers. Portrait, sitting, wide, container, extended, action, peeking
and base framing preserve aspect ratios; portraits use a subtle CSS edge mask.
Six public project derivatives and the private local PhilCHAN derivative remain as before.
public/downloads/Estavilla Resume.pdf is byte-identical to the original.
Sharp runs only at build time. GSAP 3.15.0 remains installed for later authorized work but is not imported or fetched by the application. Functional components use native browser animations. No React hydration or game engine.

## Content and accessibility

The user brief governs contribution wording where the resume is broader. Lifevent covers login UI/UX
and rate limiting; its screenshot is labeled platform context. FuelWatch remains excluded.
Native anchors/disclosures, contact links and the resume remain usable without animation JavaScript.
Without JavaScript Mr. Fresh is a static illustration. Technology links retain their native fragment fallback.
All mascot controls are native buttons with visible focus and at least 44px touch targets.
Physical gestures have the Pet, Say hello and Reset keyboard alternatives.

## Limits and later phases

The illustrations are flattened. Entrance and portrait changes are whole-image approximations;
there is no independently rigged eye, head, paw or tail. True blinking stays deferred.
Tosses stay inside reserved stages to keep navigation, screenshots and CTAs clear.
Safari/Firefox, physical touch hardware and old-laptop performance still require device testing.
See docs/phase-3-validation.md for the Phase 3 baseline and docs/phase-4-validation.md for Phase 4 validation.
The mascot overhaul, Phase 5 and deployment still require explicit approval.

## Global parallax reset

See [docs/global-parallax-reset.md](docs/global-parallax-reset.md) for the audit, removal inventory, tests, measured static scrolling and visual evidence. No decorative scroll animations run. The existing Pause control still governs mascot and applicable interactive transitions.

The runtime suite verifies zero decorative displacement on http://127.0.0.1:4321/ and the production build, including reload and reverse scrolling. Build before running npm test. Evidence is in .cache/global-parallax-reset/.

## Historical motion and branding references

[The original live-runtime report](docs/phase-4-parallax-debug.md) and [Phase 4 V2 report](docs/phase-4-v2-validation.md) describe the earlier scrolling system, which has now been removed. Their screenshots and recordings remain preserved in the existing cache folders.

Dark-mode branding uses the white public/assets/brand/Portfolio-Dark Mode.png artwork; light-mode branding uses the supplied transparent dark-lettered public/assets/brand/portfolio-logo.png derivative. The favicon independently uses the dark-lettered public/assets/brand/portfolio-favicon.png (light-mode artwork), as requested. Earlier variants remain preserved. Dark/light themes now select the corresponding supplied transparent HE variant; the favicon remains the approved dark-lettered artwork. src/data/branding.json records their approved hashes; scripts/prepare-brand.mjs writes separate optimized WebP and 64px PNG outputs with transparent backgrounds. Versioned URLs refresh browser caches.

## Signature dark/light themes

Midnight and Warm Paper follow the system preference until an explicit choice is saved in localStorage (`portfolio-theme`). A prepaint head script prevents an incorrect-theme flash. The Sun/Moon button remains available beside the navigation hide/show control.

Theme switching uses a viewport-centered native View Transition reveal of the actual incoming page: white HE for dark, geometric amber paw for light. Reduced motion, Pause, interruption or an unsupported API settle instantly. Mr. Fresh and all functional components retain their existing controllers; the global parallax reset remains intact.

See [docs/signature-theme.md](docs/signature-theme.md) for architecture, files, tests, visual captures, playback recordings and browser limitations. Theme evidence is in `.cache/theme-signature/`. No deployment has been performed.

## Warm Paper V2

Light-mode surface hierarchy, borders, labels and selected states are refined without changing Midnight styling or component structure. A measured typography-induced theme-switch jump is corrected by preserving the visible section during the existing native reveal. See [docs/light-mode-v2.md](docs/light-mode-v2.md) for the exact scope, validation and before/after gallery.
