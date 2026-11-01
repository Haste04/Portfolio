# Stronger Projects Orbit Perspective V2

Goal: strengthen the existing spatial orbit without changing other sections or Mr. Fresh behavior.
Spec: user's Stronger 3D Perspective V2 brief; implement directly within the approved layout.
Architecture: keep one selected-project owner and finite native animations. Tune continuous angle-based XYZ geometry and projected emphasis; keep a central flat mascot plane. Give captions a readable minimum apparent scale. Add static perspective to the separate decorative SVG ring; page GSAP still owns only its outer wrapper.
Tech: existing Astro/TypeScript/CSS 3D/Web Animations; no new dependencies or Git repository.
Files: project-orbit-layout.ts for pure geometry; project-orbit.ts for pose/caption animation; project-orbit.css for rings/active emphasis; Projects unit/browser tests for measured depth, bounds, continuous movement and hitboxes.
Review focus: projected card/caption bounds at narrow laptop widths; actual preserve-3d ordering; rear labels and touch target sizes; no camera distortion at mascot z=0; no stale animations after rapid changes/Pause/resize.
- [x] Capture running-site baseline and inspect preserve-3d ancestry.
- [x] Add failing tests for stronger projected depth, asymmetric sides, caption readability, continuous spatial movement and safe hit targets.
- [x] Implement stronger capability profiles and smooth geometric emphasis; finite 820ms rotation, restrained ring perspective.
- [x] Build/check and run targeted Projects tests; tune from real browser screenshots and measurements.
- [x] Run all regressions serially and inspect any failure without weakening tests; verify all six widths, Pause/reduced and original hashes.
- [x] Record actual rotation; document before/after and remaining limitations; stop for review.

Final report: docs/project-orbit-perspective-v2.md. All 30 Projects tests passed; full-suite outcome 171/173 with the known gallery failure and intermittent development motion sample explicitly recorded. No claim of a fully green suite.
