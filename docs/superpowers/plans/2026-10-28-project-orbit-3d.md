# Projects CSS 3D Orbit Implementation Plan

> Execute inline using superpowers:executing-plans; the user's Projects-section 3D Orbit Enhancement is the approved spec.

Goal: A meaningful, reversible perspective-based project orbit using the existing selected-project state, with no mascot behavior changes or heavy dependencies.

Architecture: Retain the existing controller, native finite Web Animations and GSAP page wrappers. Extend pure orbit geometry to x/y/z, small scale modulation, opacity and integer depth rank. A dedicated perspective camera contains a preserve-3d icon wrapper and the existing flat mascot plane. Geometry stays bounded in projected space; labels remain billboards. No animated camera or mascot transform. Existing index/gesture/detail/lifecycle logic remains authoritative.

Heading ruling: Remove the forced break from the existing Mr. Fresh's Project Orbit title, retain its amber span, use fluid component typography and natural mobile wrapping. Preserve the primary editorial section heading and all verified content.

Files: Projects.astro (camera/title); project-orbit.css (camera, upright depth planes and compact center presentation); project-orbit-layout.ts (pure profiles and projection-safe geometry); project-orbit.ts (untransformed measurements and finite 740ms pose keyframes); existing unit/browser tests (depth and interactions); docs/project-orbit-3d.md (results/source notes).

Constraints: Projects only. No Three.js/WebGL/React/new dependency. No Git initialization, deployment, source-art/screenshots/PDF edits or PhilCHAN publication. Mascot modules and GSAP choreography remain byte-identical.

- [x] Write failing unit and browser depth tests, source-frame and heading tests.
- [x] Implement pure geometry/profiles and projection-safe bounds; validate dense samples.
- [x] Add dedicated camera, single-line-capable title and isolated center plane; extend existing pose animation with z/scale/opacity/depth rank. Keep selected state, gestures and cleanup.
- [x] Build/check; run project suites, relevant navigation/mascot/parallax regressions and six widths serially. Verify genuine intermediate z/scale changes, upright labels, hitboxes, rapid selection, Pause and reduced motion.
- [x] Fresh read-only review, screenshots/actual browser recording, SHA-256 scope check, report exact results and limits; stop for review.

Review focus: preserve-3d ancestors must not be flattened by grouping properties; opacity belongs on leaf icon planes. No transformed logical dimensions fed back into measurement. Camera perspective at mascot z=0 must not change physics coordinates. Offscreen/paused/resize work must settle without stale animations. Every project remains discoverable and production restrictions persist.

Execution evidence and intermittent-test caveats: docs/project-orbit-3d.md and .cache/project-orbit-3d/validation.json. No unrelated test was weakened or edited.
