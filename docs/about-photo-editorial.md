# About photo-editorial redesign

> Current update: the user subsequently authorized About-only alternating panel entrances. See [the About motion report](about-alternating-slides.md). Other sections retain the scroll reset.

## Result
The About section now contains four always-visible photographic articles. MORE THAN JUST CODE. and its continuous supporting paragraph are unchanged. Every existing story title, label, teaser and full paragraph is preserved verbatim, checked against tests/fixtures/about-stories.json captured before editing.
There are no About disclosures, plus controls or hidden story paragraphs. All content works without JavaScript.

## Verified photographs and assignments
Originals under public/about-section/:
| Story | Original file | Dimensions |
| --- | --- | --- |
| The Learner | The Learner.jpg | 1080 x 1080, JPEG |
| The Builder | The Builder.jpg | 2048 x 1536, JPEG |
| The Explorer | The Explorer.jpg | 1152 x 2048, JPEG |
| Beyond Code | Beyond Code.jpg | 1152 x 2048, JPEG |

Each has its own desktop/mobile object-position. Learner and Explorer place their photography on the right; Builder and Beyond Code place it on the left on desktop. Subjects and faces remain visible in the reviewed screenshots. No stock/generated replacements, heavy blur or blanket nearly-black photo overlay was used.
App-owned JPEG copies under src/assets/about/ are byte-identical to originals. scripts/prepare-about.mjs refreshes copies on predev/prebuild. Astro Image generates 12 responsive WebP variants, capped at 1200px/source width, with lazy loading and intrinsic dimensions. Browsers select variants through srcset/sizes; original public photographs are never requested by the panel markup.

## Layout and accessibility
Content-width panels share their border treatment, width and spacing. Desktop panels have a 340px minimum height with directional charcoal gradients protecting text. Under 900px, photography occupies a dedicated upper area and complete text follows on solid charcoal. Panels can grow to fit every paragraph; no truncation or internal scrolling.
Photos have neutral descriptive alt text. Articles use h3 titles and aria-labelledby, without unnecessary interactive roles. The existing About mascot dock remains unchanged and outside the story reading area.

## Removed About animation
Deleted src/scripts/motion/about.ts. Removed its import/dispatch and added an About-only exclusion before GSAP context creation in engine.ts. This prevents shared heading and atmospheric setup from animating About too; no other section's animation function, parameters or transforms changed.
Removed obsolete About disclosure CSS and updated only tests that genuinely depended on the old cards or About motion. Shared project/Experience disclosures and global motion lifecycle remain intact.

## Additional supplied Lifewood assets
Found public/lifewood/Lifewood Picture #1.jpg (1600 x 1200 JPEG), Lifewood Picture #2.jpg (2048 x 1536 JPEG), Lifewood Logo Dark Mode.png (2170 x 725 PNG) and Lifewood Logo Light Mode.png (546 x 125 PNG).
The supplied dark-mode logo is used through an unchanged copy at public/company-logos/lifewood-logo.png. The existing Experience company-row implementation is reused; no Experience layout or mascot changes were made.
The two actual photograph filenames and neutral alt text are registered in src/data/lifewood-photos.json. They are pending because public-use confirmation requested through the existing gallery approval rule has not arrived. No pending photograph or raw original is exposed in production or through the dev source guard.
The existing filename validator now supports the supplied spaces/# without renaming originals, while generated public URLs use a normalized safe stem. A synthetic-fixture regression confirms acceptance, safe URLs and unchanged originals; traversal/unsafe-name and approval tests remain intact.
Once the user confirms both photographs are cleared for public display, change only their publication fields to approved, rebuild and verify the real gallery/filmstrip. No privacy approval is inferred from elapsed time.

## Files
Created:
- src/data/about.ts
- src/assets/about/learner.jpg, builder.jpg, explorer.jpg, beyond-code.jpg
- scripts/prepare-about.mjs
- tests/about-data.test.mjs
- tests/fixtures/about-stories.json
- public/company-logos/lifewood-logo.png
- docs/about-photo-editorial.md

Modified:
- src/components/sections/About.astro
- src/styles/about.css
- src/styles/portfolio.css (removed only obsolete About summary selector)
- src/scripts/motion/engine.ts (About-only exclusion)
- scripts/prepare-assets.mjs (prepare About source copies)
- tests/about-browser.test.mjs
- tests/motion-browser.test.mjs (removed two obsolete About disclosure interactions)
- tests/navigation.test.mjs (About no-JavaScript expectation)
- tests/parallax-runtime.test.mjs (removed obsolete About motion case)
- scripts/lifewood-media.mjs (actual filename support and safe URL stems)
- src/data/lifewood-photos.json
- tests/experience-media.test.mjs
- tests/experience-browser.test.mjs (explicit missing-logo fixture and actual uploaded-asset/publication check)
- public/company-logos/README.md

Deleted:
- src/scripts/motion/about.ts (obsolete About-only animation module)

## Validation
- Final npm run build: exit 0, one static route, 12 optimized About image variants.
- Astro/TypeScript: 81 files; zero errors, warnings or hints.
- 27 unit/data checks passed: exact story copy, photo mapping, actual filename handling, approval safety, mascot states/gestures/physics/inactivity/assets and motion policy.
- 32 targeted browser regressions passed: all six About widths; no-JavaScript visibility; zero About scroll transforms; other section motion; real company logo loading and pending photo withholding; missing/error logo fallback; synthetic gallery selection; mascot entrance/petting/toss/section behavior; navigation, project fallback and resume integrity.
- Two additional development/production runtime parallax checks passed for Education, Tech Stack, Experience and Contact.
- Total final targeted checks: 61 passed, zero failures. This was a focused regression run, not a rerun of the complete 205-case suite.
- All six widths verified: 1920, 1366, 1024, 768, 390, 320. No horizontal overflow or story clipping.
- An initial bounds test incorrectly required short inline labels to be wider than 100px; corrected to require positive label width while retaining full paragraph-width/clipping checks.
- One asset-preparation attempt reported a Windows write error for a generated dizzy-960.webp file. Sequential retry succeeded; its valid existing content and all original resources remained intact.
- Original SHA-256 baseline: all 27 established art/screenshot/resume resources match. Additional checkpoint comparison: 43 source-resource entries unchanged, including all four About photographs, both Lifewood photos, both supplied company logos, school logos and original libraries. App-owned photo and logo copies are byte-identical.
- No mascot modules, other section components, verified project content, contact details, fonts, navigation implementation or original assets were modified.

## Evidence and limitations
Desktop: .cache/about-photo/about-photo-1366.png
Mobile: .cache/about-photo/about-photo-390.png
Browser log: .cache/about-photo/regressions.tap; summary: regressions-summary.json
Resource proof: .cache/about-photo/integrity.json

Visuals were inspected in Edge/Chromium automation. Firefox/Safari and physical hardware were not tested. The four subject-specific crops remain subject to the user's visual review.
The Lifewood photos are configured but intentionally withheld pending public-display confirmation; gallery integration is not reported as published.
No deployment, unrelated redesign, mascot overhaul or Phase 5 work was performed.
