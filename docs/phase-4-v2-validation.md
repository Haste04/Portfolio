# Phase 4 V2 ? cinematic choreography and supplied branding

Status: V2 implemented and validated; visual review remains pending. No mascot overhaul, Phase 5, deployment or additional routes.

## Reference study

Both supplied URLs were opened through the web reader:
- https://www.devanshprakash.com/
- https://www.pigeonsmission.com/

The reader exposed page content, but cannot establish animation behavior. Interactive Microsoft Edge visits were attempted separately at 1366 x 768. Devansh failed with ERR_NETWORK_CHANGED; Pigeon's Mission failed with ERR_INTERNET_DISCONNECTED. The exact results are preserved in ../.cache/parallax-v2/references.json.

No reference-site motion observations are claimed. Choreography follows the user's specified foreground/midground/background language, rather than inferred claims about those sites. No reference imagery, source code, typography or branding was imported.

## Visual changes by section

- Hero: preserved staggered name entrance; stronger foreground exit; independent horizontal outline lettering; rotating/scaling ring geometry with visible markers and tilted orbital ellipses; independent horizon lines and editorial caption. The stage and all mascot-controlled transforms remain untouched.
- About: preserved four native disclosures and asymmetric composition; card depth now pairs with independently moving story titles and a large rotating/sliding background panel.
- Education: retained scroll-progressive amber timeline; independently registering institution headings and existing progressive achievement accents; restrained architectural background detail.
- Projects: a separate scrubbed timeline per stage coordinates focus and exit. Anthea has the strongest rotational focus; Lifevent uses horizontal registration; Seek First Books reverses the editorial direction; PhilCHAN stays restrained. Frames grow toward focus, then recede; independent images counter-travel without nonuniform scaling. Background titles move horizontally and vertically; two decorative aperture planes open before focus. Project metadata, links, disclosures and screenshot sources are preserved.
- Tech Stack: the constellation scales into focus; orbits, center, connector drawing and alternating node groups retain independent depths. Skill categories remain separate. Technology selection is unchanged.
- Experience: keeps its calmer timeline and card reveals, with supporting architectural depth. Verified professional content is unchanged.
- Contact: independently shifting oversized heading, horizontal background lettering, rotating/scaling halo and staggered contact links. Bedtime controller and contact destinations are unchanged.

No pinning, added scroll distance, forced wheel control, numeric catch-up scrub or continuous decorative loops.

## Supplied logo

Actual source: public/images/Portfolio Logo.png, PNG, 1254 x 1254, opaque RGB with white background. There was no root assets directory. Source SHA-256:

6dda0c7500b70b870e832584c2810b8c9f2806730fa844200f7a31818e679d34

The original remains untouched. A derivative crops only empty canvas (x=0, y=400, width=1254, height=480); no mark distortion, recoloring or invented transparency:
- public/assets/brand/portfolio-logo.webp: 264 x 101, 4272 bytes.
- public/assets/brand/portfolio-favicon.png: 64 x 64, 2675 bytes, contained mark on its supplied white background.

Desktop pill, mobile menu and existing masthead use the actual mark. The desktop pill mark is an accessible image; the existing masthead remains a labeled Home link. This preserves exactly seven desktop navigation destinations and one active section indicator.

BaseLayout has one PNG favicon declaration. No obsolete favicon declaration remained. Browser checks decode its served bytes and verify navigation rendering at desktop, 390px and 320px. Headless testing cannot inspect the browser's native tab-chrome favicon display.

scripts/prepare-brand.mjs is invoked by the existing asset-preparation workflow. It verifies immediate source preservation and creates both output directories and its cache report directory. A clean-directory regression test exercises preparation without a pre-existing cache.

## Architecture and safeguards

The existing lazy engine, GSAP 3.15 / ScrollTrigger registration, policy controller and lifecycle were retained. Each section still owns a GSAP context; new Hero/project timelines are inside those contexts and revert on pause, reduced motion, hidden tabs, resize rebuild, initialization failure and teardown.

Animation ownership uses the existing own() guard: neither a mascot element/dock nor any ancestor containing a dock may become a page-motion target. Background scenery is a sibling. All eleven mascot implementation/component/style files remain byte-identical to the checkpoint.

Full/balanced/light policies still use reduced motion, stored Pause, visibility, hardware hints and pointer capabilities alongside width. Light mode omits invisible apertures and Hero caption motion. Below 768px, rings/foreground complexity simplify and no essential content is pinned. Static/no-JS styling exposes the original readable content; decorative shutters appear only during active eligible motion.

No dependencies were added. Existing source design tokens, navigation/technology scripts, verified data and original screenshot libraries were preserved.

## Important files created or modified

| Files | Purpose |
| --- | --- |
| src/scripts/motion/{hero,about,projects,technology,timelines,contact}.ts | section-specific choreography, all inside existing contexts |
| src/components/{CinematicScene,SectionFrame,ProjectShowcase}.astro | independent decorative layers and project apertures |
| src/styles/cinematic.css | layered composition and responsive/light fallback styling |
| src/components/FloatingNav.astro, src/pages/index.astro | supplied navigation/mobile/masthead logo |
| src/layouts/BaseLayout.astro | one supplied-logo PNG favicon declaration |
| scripts/prepare-brand.mjs, scripts/prepare-assets.mjs | generated copies and clean-directory-safe preparation |
| tests/parallax-v2.test.mjs, tests/brand-assets.test.mjs | new V2 runtime and clean-build acceptance checks |
| tests/navigation.test.mjs, tests/mascot-browser.test.mjs | corrected test setup and artifact/server isolation; original behavior assertions retained |
| README.md, docs/phase-4-plan.md, this report | current review entry point and evidence |
| public/assets/brand/portfolio-logo.webp, portfolio-favicon.png | optimized supplied branding derivatives |

No Astro project reinitialization, dependency changes, verified-content rewrites or new routes.

## Measurable acceptance

New browser checks supplement rather than replace the previous 84 tests:
- Hero foreground displacement at least 85px but below 200px over 360px ordinary wheel input, ring rotation at least 8 degrees, independent background horizontal travel at least 35px.
- Project focus changes scale by at least 0.025 over 420px; background lettering moves horizontally at least 20px; both aperture planes open, fully clear at focus and reverse; late-stage frame recedes after focus.
- Forward/reverse matrices agree within 1px/degree; Hero matrices stop changing when scrolling stops.
- Existing meaningful vertical displacement and image/frame differential thresholds remain in place.
- Supplied logo renders, favicon loads/decodes, original logo matches its trusted SHA-256.
- Brand preparation succeeds without an existing cache directory.

## Validation

- Final npm run build: PASS, one static route, 51 existing image derivatives plus the brand outputs and byte-identical resume.
- Final npm run check: PASS, 55 files, zero errors/warnings/hints; tsc --noEmit exited successfully.
- Final complete npm test: PASS, 88/88, zero failures/skips/cancellations, 624757.5381ms (10m 24.76s). The suite includes the original 60 navigation/content/mascot tests, 14 initial motion tests, 10 development/production runtime tests and four new V2/branding tests.
- All six widths passed: 1920, 1366, 1024, 768, 390 and 320px. No horizontal overflow; keyboard/mobile navigation, disclosures, technology selection, resume download, reverse/rapid scroll, hidden suspension, reduced motion and Pause/Resume passed. Runtime evidence recorded no page errors or warnings.
- Final consolidated evidence: [final-validation.json](../.cache/parallax-v2/final-validation.json). Build/check/test logs are alongside it.
- Independent read-only review: initial clean-build blocker reproduced and fixed; follow-up found no remaining concrete Important issue. Reviewer did not run browser tests.
- Publication check: expected BLOCKED/exit 1 while PhilCHAN permission remains unconfirmed; production continues withholding media and outbound links.

## Recorded V2 measurements

Actual Edge session, normal motion, balanced tier, browser-reported four logical processors/eight GB, no capability spoofing, Pause unset.

| Layer | Scroll interval | translateY change | translateX change | Other change |
| --- | --- | --- | --- | --- |
| Hero name, 1366 x 768 | 0 to 360px | -104.96px | 0 | foreground exit |
| Hero atmospheric halo | 0 to 360px | +125.95px | 0 | +13.08 degrees, +0.0484 uniform scale |
| Hero background lettering | 0 to 360px | -87.20px | -58.13px | independent editorial plane |
| Hero name, 1920 x 1080 | 0 to 360px | -101.84px | 0 | bounded exit |
| Anthea frame | 420px wheel interval | -69.82px | 0 | +1.24 degrees, +0.0617 scale toward focus |
| Anthea background lettering | same interval | -105.79px | -46.55px | separate trajectory |
| Anthea screenshot plane | same interval | +27.93px | 0 | 97.75px image/frame differential |

Both aperture planes clear by focus; the frame recedes later. The full measured records are in enhancement-results.json and ../parallax-runtime/results.json. Values are additional transforms, not ordinary document scrolling.

## Visual evidence

- [Before/after review gallery](../.cache/parallax-v2/review.html)
- [Hero native wheel recording](../.cache/parallax-v2/hero-wheel.webm)
- [Anthea native wheel recording](../.cache/parallax-v2/anthea-wheel.webm)
- [Hero initial, 1366](../.cache/parallax-v2/hero-1366-initial.png)
- [Hero mid-scroll, 1366](../.cache/parallax-v2/hero-1366-scroll.png)
- [Hero initial, 1920](../.cache/parallax-v2/hero-1920-initial.png)
- [Anthea focus](../.cache/parallax-v2/anthea-middle.png)
- [About mid-scroll](../.cache/parallax-runtime/development-about-scroll.png)
- [Contact mid-scroll](../.cache/parallax-runtime/development-contact-scroll.png)
- [Mobile navigation/logo](../.cache/parallax-v2/mobile-logo.png)

A first Hero WebM failed duration validation and was replaced. Final 960 x 540 VP8 clips are genuine CDP browser captures with native wheel input forward and reverse. Hero duration=3.942s; Anthea=3.800s. Independent video decoding sampled 0.05/1/2/3 seconds and found four distinct frames in each. Playback reported no decoding error. These reduced-resolution recordings demonstrate motion; they are not an FPS benchmark. Full-resolution comparison screenshots are preserved separately.

Recording runtime inspected the actual loaded modules: GSAP 3.15.0 and ScrollTrigger 3.15.0 registered together, 88 triggers enabled, active balanced mode, no reduced-motion or stored Pause, no recorded runtime issues. See recording-metrics.json and video-quality.json.

## Failures investigated during validation

The first complete run finished with 81/87 passing and six failures. None were suppressed:
- A new duplicate desktop Home anchor produced eight navigation destinations and two active Home entries. Corrected the implementation to use an accessible logo image in the pill while retaining the existing masthead Home link. Original seven-link and single-active assertions are unchanged.
- The technology-reaction test auto-centered a lower constellation node, moving the mascot dock out of view. Recorded geometry showed dock bottom=11.5px and visible=false/paused=true at click time; offscreen suspension was correct. Native block:end alignment now keeps both controls visible and waits for eligibility before requiring the same actual click/paw-swipe behavior. No mascot behavior changed.
- One queued-toss case timed out waiting for initial idle under the full run. It passed isolated reruns without a controller change. The final complete run passed this case too; no root cause is invented for the transient timeout.
- A full-page artifact capture exceeded its inherited 4s interaction timeout. Screenshot capture now has an explicit 15s budget; all intrinsic-size/aspect-ratio/layout assertions remain.
- The second test development server reported ready but stalled during dependency bundling while sharing the live server's Vite cache. Its temporary config now uses a separate cache, without changing the application's config or the 60s readiness/security assertions. Astro's installed Windows config resolver required a project-relative --config argument; that setup error was corrected.
- Independent review found brand preparation failed when .cache did not exist. A new clean-directory test reproduced ENOENT, then passed after explicit directory creation.

The reviewer also prompted coverage for both shutters, fully open focus and late frame recession; trusted source-logo hash assertions; and omission of invisible mobile/light decorative tweens.

## Evidence and integrity

Before-source checkpoint: ../.cache/parallax-v2/checkpoint/
Before screenshots/recordings: ../.cache/parallax-v2/before/
V2 measured transforms/screenshots: ../.cache/parallax-v2/enhancement-results.json
Protected source comparisons/PDF hashes: ../.cache/parallax-v2/integrity.json

Original-resource verifier reports all 27 unchanged: 22 Mr. Fresh illustrations, four screenshots and one resume. Root, public and production resume SHA-256 remains:

57f8a234762463324da1b48c782771695943181836a8eed4ff6aaf5932e6e6da

PhilCHAN's production media/links remain withheld. Local-only preview behavior is unchanged. Publication permission is still a separate unresolved gate.

## Limits and next review

This is 2D editorial parallax, not a rigged character or 3D scene. Physical old-laptop FPS, Safari/Firefox and real touch-device performance are unmeasured. Browser capability hints are approximate. Normal desktop Edge is the measured runtime; reduced-motion deliberately shows a quiet/static baseline.

The new opaque logo retains its white background; a transparent source would be needed for a different treatment without altering the supplied branding. Favicon tab chrome needs a manual normal-browser confirmation.

Visual approval remains with the user. No Phase 4.5, Phase 5 or deployment is authorized.

## October 22 branding refresh

The user replaced the application branding PNGs. The earlier opaque-logo subsection and its SHA are historical. Current sources are public/assets/brand/portfolio-logo.png and portfolio-favicon.png: both 1254 x 1254 RGBA, each SHA-256 cf6b4d14171aedf89871fef6dc7d7939955a17a77201d66cf17a793648d6af3d. Their approved paths/hashes are now in src/data/branding.json. The generator reads them without overwriting either source, writes portfolio-logo.webp (264 x 101) and portfolio-favicon-64.png (64 x 64), and preserves alpha. The dark mark retains its original colors and uses a small paper-colored CSS backing in navigation for contrast. Logo/favicon URLs include the source-hash version. Targeted transparency/source-preservation and desktop/mobile/favicon browser tests passed; the Astro production build passed. The previous 88-test run above remains historical, not a claim that the entire suite was rerun for this asset refresh. New browser evidence is .cache/brand-refresh/.

Astro/TypeScript validation also passed: 55 files, zero errors/warnings/hints. Production output references and both original PNG hashes were checked after the build.

## October 22 default dark-theme artwork

The supplied public/assets/brand/Portfolio-Dark Mode.png is now the active source for both the navigation/masthead logo and favicon. It is a 1254 x 1254 transparent white-mark PNG, SHA-256 23e78f657a9d72364362df696dfafb1ce9c8a57b695fbc5e6fad1300498382f0. Both manifest entries select this original; generated copies retain transparency and use new hash-versioned URLs. The light CSS backing was removed. Earlier color variants remain untouched for later theme work. No theme switcher, OS-driven theme selection, or light-mode implementation was added.

Targeted source-preservation/white-mark/transparency tests and desktop/mobile/favicon browser checks passed. Browser evidence is .cache/dark-brand-refresh/. Original 27 resource hashes still match. The prior full-suite result remains historical; this asset-only change received focused checks.

## Favicon selection correction

Per the user, the favicon always uses the light-mode artwork with dark lettering: public/assets/brand/portfolio-favicon.png, SHA-256 cf6b4d14171aedf89871fef6dc7d7939955a17a77201d66cf17a793648d6af3d. The site logo continues using the white dark-mode artwork. Only the favicon manifest entry and its expected tests changed. Generated transparency and all original variants are preserved. The targeted asset/color and desktop/mobile/favicon browser checks passed; the Astro production build passed. Browser evidence: .cache/favicon-light-refresh/. Theme switching remains deferred.
