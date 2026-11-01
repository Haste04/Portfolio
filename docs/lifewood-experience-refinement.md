# Lifewood Experience visual refinement

Experience-only update; no other section, navigation, project data, mascot controller, original asset or dependency was changed.

## Presentation
- Retained LEARNING BY BUILDING., its supporting paragraph, the verified role/company/dates/location/overview and all five native contribution disclosures.
- Added a 56px company identity area (48px on mobile), with object-fit containment and adjacent readable company name. A neutral office symbol is the missing/error fallback; it is not substitute branding.
- Added public/company-logos/README.md. No actual Lifewood logo was found. Recommended name: lifewood-logo.png. The build-time helper also detects lifewood or lifewood-data-technology, case-insensitively, in SVG, PNG, WebP, JPG/JPEG or AVIF format.
- Refined contribution spacing, title weight, separators and restrained amber open-state border. Original contribution text is unchanged.
- Increased the Cebu map's visual prominence through a bounded SVG viewBox (90 70 480 530) while retaining the existing Cebu/Bantayan/Camotes paths and city-level coordinates. Stronger static marker rings, clearer callout text and softer grid lines add emphasis without a perpetual animation or invented office address.
- Added a photo icon and amber direction cue to View My Experience.

## Gallery and motion
At most three approved-photo previews appear beneath the map. They open the existing gallery at the corresponding photo and restore focus to that preview on return. There are no empty thumbnail boxes when the approved catalog is empty.
The existing controller remains authoritative; its photo decode generation guards and cancellation are preserved. Photo transitions now take 320ms; the existing 560ms map/gallery transition remains. Gallery transitions continue to use inner wrappers separate from GSAP's unchanged outer scroll targets.
Reduced motion, Pause and hidden-tab handling remain intact. The city highlight is static, so it needs no new animation loop. No new framework or animation dependency was added.
No-JavaScript fallback keeps the internship, location, native disclosures and gallery content meaningful.

## Assets and publication
No internship photographs or Lifewood company logo were supplied. The production gallery remains the truthful empty state. Photo navigation and logo-loaded/error cases were tested using explicitly synthetic browser fixtures, not fabricated internship imagery.
The existing source guard and approved-only build pipeline were unchanged: only manifest entries with publication set to approved produce optimized public derivatives. Private/pending/unlisted originals remain withheld; raw public/lifewood files are blocked in development and removed from generated production copies. Original files are never edited.
To populate the section, add a real logo under public/company-logos/ and original photos under public/lifewood/. Add verified photo filenames, alt text and optional captions to src/data/lifewood-photos.json, marking only cleared images approved, then rebuild/reload.

## Changed files
Modified:
- src/components/sections/Experience.astro
- src/styles/experience.css
- src/scripts/experience.ts
- tests/experience-browser.test.mjs (new cases only; existing assertions preserved)

Created:
- scripts/company-logos.mjs
- public/company-logos/README.md
- tests/experience-brand.test.mjs
- docs/lifewood-experience-refinement.md

## Validation
- Production build: exit 0, one static route.
- Astro/TypeScript: 79 files, zero errors/warnings/hints.
- Experience: all 32 tests passed in the complete run (25 browser, seven logo/data/media cases).
- All six widths checked: 1920, 1366, 1024, 768, 390, 320. Both empty and synthetic-photo states fit without horizontal overflow. Keyboard, disclosures, exact preview selection, Back focus, rapid navigation, reduced motion, Pause, hidden tabs and no-JavaScript coverage passed.
- Complete serial suite: 202 passed, three failed, 205 total; no skipped/cancelled tests. Log: .cache/experience-refinement/full-tests.tap.
- Unchanged isolated rerun: navigation slide and Tech Stack deferred-Back cases passed. The secondary localhost preview startup/readiness test still failed. Its server logs ready but root HTTP fetches do not complete within the test/probe window. This remains unresolved; no unrelated implementation or assertion was weakened to force a pass.
- Normal development motion diagnostic: active/balanced, no failed requests or runtime errors.
- Original resource SHA-256 verification passed all 27 baseline resources (22 illustrations, four screenshots, original resume). Separate workspace baseline comparison confirms existing public assets, original logos, other sections, mascot modules, package files and contact/project data remain byte-identical.

## Evidence and limits
Current screenshots/recording are stored under .cache/experience-refinement/. Synthetic gallery and filmstrip screenshots are explicitly named *-fixture-*.png and contain colored test patterns, not real photos.
Browser validation used Microsoft Edge/Chromium automation. Safari, Firefox and physical older-device performance were not tested. A real company logo and approved internship photographs still need to be supplied and visually reviewed.
No deployment, mascot overhaul, unrelated redesign or Phase 5 work was performed.

## 2026-10-30 ? photographs enabled and company-first heading

The user requested both supplied internship photographs be displayed. Their two manifest entries are now approved; future/unlisted photographs remain withheld. Both original files are unchanged. The company logo and Lifewood Data Technology name are now the primary card heading, above the smaller Software Engineering Intern. role. No other section or mascot implementation changed.

Validation: Astro production build and Astro/TypeScript checks passed (82 files, zero errors/warnings/hints). All 26 Experience browser tests and eight data/media/photo checks passed, including six widths. Empty-gallery tests now explicitly simulate an empty catalog; no unrelated assertions were weakened. The long-running development server still had stale media middleware and returned 404 while the SSR catalog listed both photos. A config mtime reload was insufficient; restarting the tracked Astro server at the same URL resolved the mismatch. Direct requests for both optimized photo URLs now return 200 image/webp; raw originals remain 403. Current visual evidence and final integrity details: .cache/lifewood-photo-fix/.

## 2026-10-30 ? branding and preserved thumbnail refinement

The supplied Lifewood logo now renders at 128px wide on desktop/tablet and 96px on mobile, with original proportions/colors and a cohesive horizontal company-name row. Company typography is responsive; the role, dates, location and contribution content are unchanged.
Removed View My Experience and its exclusive CSS. Balanced footer padding preserves the prior map/thumbnail footprint instead of enlarging the flexible SVG. The original two thumbnail boxes, numbering, borders and cover-image treatment are unchanged. Both approved photos are visible.
SSR/controller preview limits now agree on two. The existing enlargement, navigation and event-handler source is byte-identical after normalizing only those preview-count constants; no gallery system or mascot/parallax implementation was rewritten.

Verification: production build passed; Astro/TypeScript reported 82 files with zero errors/warnings/hints. All 26 Experience browser cases and nine data/media checks passed. Six-width before/after comparison confirms identical map SVG markup, map/marker geometry, thumbnail geometry and map page positions at 1920, 1366, 1024, 768, 390 and 320px. No horizontal overflow. Original photos, logos and libraries remain unchanged.
A live-site smoke check encountered stale Vite GSAP dependency responses (504 Outdated Optimize Dep); refreshing the local Astro server cleared them without source changes. Live normal motion is active, both photos enlarge correctly, and no browser errors were reported.
Desktop/mobile evidence: .cache/experience-branding-refinement/after-1366.png and after-390.png. Full geometry, scope and live results: final-validation.json in that directory.
