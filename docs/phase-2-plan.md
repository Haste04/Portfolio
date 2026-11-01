# Phase 2 - Core portfolio
Scope explicitly approved by the user. Extend the accepted Astro foundation in place.

## Implementation
1. Verify resume and public project manifests; preserve all 27 original source resources.
2. Add typed project and technology data, static optimized media, and a byte-identical resume copy.
3. Fill seven existing sections with distinct editorial layouts and accessible native disclosures.
4. Add SVG technology connections with lightweight keyboard/click/focus enhancement and no-JS links.
5. Run production build, checks, existing and new browser tests, six viewport checks, media/download integrity, local preview verification, and one independent review.
6. Record actual results and stop before Phase 3.

## Decisions and evidence
- The user's contribution limits override broader resume wording, especially Lifevent dashboard ownership and outdated Anthea automatic-send behavior. Do not reproduce those claims.
- Resume inspected locally using a temporary parser under .cache/research; no PDF changes.
- Public package manifests fetched successfully:
  https://raw.githubusercontent.com/Haste04/Anthea/master/package.json
  https://raw.githubusercontent.com/Haste04/Bookkeeping-Landing-Page/main/package.json
  https://raw.githubusercontent.com/Haste04/Philchan-Cebu/main/package.json
- Lifevent stack supported by the resume; live page also exposes Next.js assets.
- All four user-provided Vercel URLs returned HTTP 200 during the read-only check.
- No private repositories, credentials, or environment values were requested.
- Only the container pose is optimized for the static Hero. No mascot controller, gestures, idle motion, or physics.
- Reuse installed sharp 0.35.5 as an explicit build-only dependency.
- All project screenshots retain proportions; WebP derivatives are generated from original PNGs.
- PhilCHAN permission is unconfirmed. Its optimized screenshot lives only in .cache/local-media.
  A Vite development middleware serves it only when bound to loopback. Production outputs a neutral withheld-media panel and no outbound demo/source links.
  Publication is blocked by an explicit check:publication script until permission is resolved.
- Native details handle About, project case studies and experience. Technology links have CSS :target fallback.
- Keep the Phase 1 navigation controller unchanged unless content integration reveals a concrete defect.
- No React, GSAP, Motion, Lenis, WebGL, extra Astro routes, deployment, or later-phase mascot work.

## Planned files
- src/data/projects.ts and technologies.ts
- src/components/sections/{Hero,About,Education,Projects,TechStack,Experience,Contact}.astro
- src/components/ProjectShowcase.astro, src/scripts/technologies.ts
- src/styles/portfolio.css
- Extend SectionFrame slots, index composition, base stylesheet import, existing test selectors.
- scripts/prepare-assets.mjs and check-publication.mjs; local-media Vite plugin.
- public/assets (permitted derivative images), public/downloads (unchanged PDF).
- docs/phase-2-validation.md and README updates.

## Log
- Source integrity baseline passes for all 27 originals.
- RED confirmed: no Phase 2 projects in the Phase 1 build. After static composition, technology highlight test failed as expected; added optional TypeScript enhancement.
- Asset pipeline produces 8 public derivatives plus one restricted local-only derivative; resume copy hash matches.
- Review findings reproduced RED in real browser: Enter could not reach selected project links; direct restricted source URL returned 200. Fixed keyboard Enter to focus the selected connection and denied original/cache paths plus non-loopback development requests globally.
- Image measurement corrected to exclude CSS borders; lazy-image tests wait for load completion before decode.
- Back to Top regression reproduced a 52px residual scroll. Increased only the Home scroll offset so native Home anchors include the masthead and reach document zero.
- Pointer-selection scroll measurement now begins at pointerdown, excluding Playwright pre-click scrolling from the application assertion.
- Final verification: build PASS, check 25 files with 0 errors/warnings/hints, browser suite 21/21 PASS (96.6s), six viewport sizes and local client preview verified, all 27 source hashes and actual resume download unchanged.
- Phase 2 complete. Publication remains blocked pending PhilCHAN permission. Stop before Phase 3.
