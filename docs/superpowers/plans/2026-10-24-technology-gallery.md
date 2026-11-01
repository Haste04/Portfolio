# Interactive Technology Gallery Implementation Plan

Goal: Redesign Tech Stack only as four logo-led editorial categories with contained zoom, a focused information region, direct switching and a reversible return.
Spec: The user's approved Interactive Technology Gallery brief in this conversation.
Architecture: Keep the existing 24-technology dataset and project IDs unchanged. Add a typed neutral-description supplement and local icon manifest/assets with provenance. Astro renders semantic logo buttons, one reusable focused region and native static details. One small TypeScript gallery controller owns selection, finite zoom animations, focus and a shared mascot dock's presentation anchors. GSAP owns only separate decorative/entrance wrappers.
Stack: Existing Astro, TypeScript, CSS, GSAP/ScrollTrigger and native Web Animations; no new runtime dependency.

Constraints: Seven sections, no other redesign, no changes to mascot controller/physics/gestures/timers. No original artwork/screenshots/logos/resume edits, no deployment, no Git initialization. Preserve PhilCHAN production restrictions. No invented experience/proficiency.
Source audit: 24 technologies with names/categories only, no existing descriptions. Add concise technical definitions with official-documentation links, never personal claims. No existing technology logos found. Preserve canonical dataset bytes.
Mascot ruling: One existing dock id tech-stack is physically reparented between two always-rendered footer anchors. The footer remains clear of interactive content. The dock/companion are never cloned. Defer movement while physical or section-transition states are active; existing ResizeObserver sees the changed dock dimensions. No behavior-controller edit.
Zoom ruling: Decorative, aria-hidden category background and selected-logo FLIP proxies animate from actual category/logo rectangles to the focus region/logo. Only these proxies own scale/translate; actual logo proportions remain intact. Back reverses into the selected category. No modal or viewport zoom.

1. [ ] Source icon assets/descriptions independently: new src/data/technology-icons.json, src/data/technology-details.ts, public/technology-icons/, provenance/license files and optional download script. Use pinned primary sources, color metadata, genuine SVGs or honest text fallback, no installed icon library.
2. [ ] Write failing browser/data tests for default categories, all 24 names/icons, project associations, focus selection, zoom geometry, switching, Back/Escape, focus restoration, no-JS and six responsive widths.
3. [ ] Update TechStack.astro; add technology-gallery.css. Use existing SectionFrame headerMascot=false only here. Four/two category columns; one shared tech-stack dock in overview footer, second empty focus footer anchor. Native fallback exposes all definitions/project links without enhancement.
4. [ ] Replace technologies.ts controller with an authoritative overview/focus state, finite cancellable 540ms FLIP, direct select navigation, live announcements, focus restoration, source-image fallback, project data-related highlighting, reduced/Pause/hidden/resize/lifecycle cleanup. Reparent the same mascot dock only when safe. Existing data-technology hooks preserve current mascot reactions.
5. [ ] Retarget motion/technology.ts only. Remove constellation targets; animate independent decoration, separator/entrance planes. Keep interactive camera, gallery zoom and mascot out of GSAP transform ownership.
6. [ ] Adapt only obsolete technology tests in navigation, mascot, motion, parallax-runtime and project-orbit suites. Keep all other assertions. Run production build/type checks, new suite and all regressions serially; fix actual failures.
7. [ ] Capture overview/focus/back/mascot desktop/mobile evidence, verify original SHA-256 and scope, conduct review, report sources, tests and limitations; stop for user review.

Review focus:
- Native no-JS and failed-init fallback must retain all names, categories and descriptions.
- Fast selection / Back / Pause / pagehide cannot leave stale proxies, effects, hidden content or misplaced focus.
- Reparenting one existing mascot dock must respect ongoing physical actions and never duplicate a controller.
- Logo asset provenance / missing logo / dark monochrome contrast must be handled honestly.
- Project links must still open the matching Project Orbit detail, and no restricted external destinations enter serialized gallery data.

Rulings: This detailed design is explicitly authorized; proceed without additional design approval. Local snapshot and hashes replace Git checkpointing; do not initialize a repository.
\nValidation caveat: both full suites were 161/162 with different existing motion-test timing failures. Rendered-frame synchronization and context cleanup preserve all assertions; final motion file is 11/11 and gallery is 22/22. No third combined full run after final test-only cleanup. See docs/technology-gallery.md.\n