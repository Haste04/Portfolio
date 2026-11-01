# Global Parallax Reset ? audit and implementation plan

**Goal:** Remove decorative scrolling and entrance choreography without changing the approved seven designs, verified content, resources, or user-triggered and mascot interactions.
**Architecture:** Disconnect the page-motion bootstrap and remove its GSAP engine, timelines, and typography reveal helpers. Preserve the small shared interaction capability policy; keep the installed GSAP package available for later authorized work, with no browser import.
**Execution:** Continue directly under the user's reset authorization. No Git initialization, commits, deployment, mascot overhaul, or new animation system.

## Audit before implementation

| Class | Owner / effect | Action |
|---|---|---|
| A ? decorative | BaseLayout page-motion bootstrap, controller.ts, engine.ts: lazy engine, GSAP contexts, ScrollTrigger driver/listeners, resize/disclosure observers, refresh timers, initialization RAF | Remove |
| A | shared.ts: all heading masks, word reveals, section numbers/hairlines, generic scroll drift/reveal | Remove; restore ordinary visible heading markup |
| A | hero.ts: name/title exits, atmosphere/grid translations, rotations, scales, editorial drift, initial typography entrance | Remove; mascot entrance belongs to C |
| A | About: already no scroll owner | Preserve four complete photographic stories; update historical tests requiring motion elsewhere |
| A | timelines.ts: Education grid opacity; Experience information/map depth and contribution reveals | Remove; preserve map/detail user interactions |
| A | projects.ts: background ring and details drift | Remove; preserve interactive spatial icon transforms |
| A | technology.ts: editorial/contour drift, separator progression, header entrances | Remove; retain static gallery composition |
| A | contact.ts: heading/background motion, contact link drift | Remove; preserve centered Contact and all links |
| A | CSS: obsolete page-motion status hooks, project shutters, reveal-only masks, unused cinematic timing variables | Remove if unreferenced; keep static borders, geometry and responsive layout rules |
| B ? functional | education-camera.ts / education.ts: selection-driven SVG camera and connectors, chapter changes, panel fade | Preserve algorithms and handlers; remove only redundant old pageMotion pause condition; CSS reads existing mascot Pause/state |
| B | project-orbit.ts: finite Web Animations angular X/Y/Z orbit, selection/detail transitions, swipe and keyboard | Preserve; remove obsolete observation of global pageMotion attribute |
| B | technologies.ts: bounded FLIP-style focus/return, direct switching, focus restoration, project relationships | Preserve unchanged |
| B | experience.ts: finite map/gallery and photo transitions, thumbnails, native contributions | Preserve unchanged |
| C ? mascot | mascot/controller, transitions, gestures, physics, state, idle, capabilities: entrance, reactions, toss, breath, sleep, bedtime, single section docking | Preserve all source files byte-for-byte |
| D ? navigation/accessibility | navigation.ts: section IntersectionObserver, anchors, shrink state, finite hide/show; CSS focus/hover, reduced motion and native scrolling | Preserve; remove only redundant global pageMotion pause condition |

No CSS scroll-timeline or animation-timeline was found. Native interaction animations are finite; mascot breathing is deliberately preserved. Static scene rings use fixed CSS transforms that are artwork, not scrolling effects.

## Implementation steps

- [x] Record source/resource SHA-256 snapshot and inspect the current Git state without creating a repository.
- [x] Add reset tests which fail against the current decorative motion driver.
- [x] Disconnect BaseLayout; remove the eight decorative modules, reveal-only MotionWords and mask styles, and unused timing variables.
- [x] Keep interaction policy and all functional handlers. Replace stale pause CSS dependencies with existing Pause/mascot state selectors.
- [x] Update historical parallax tests to assert stable transforms, document-relative coordinates, visibility, zero ScrollTrigger/network/maintenance work, rapid/reverse scrolling and reload.
- [x] Preserve valid functional/branding assertions; migrate only obsolete pageMotion waits to actual Pause/mascot readiness.
- [x] Build and type-check; run the complete suite serially. Investigate failures individually without weakening unrelated assertions.
- [x] Verify normal-motion development browser, reduced motion, Pause, six widths, no-JS, representative screenshots and original asset hashes.
- [x] Record measured stability, actual results and limitations for user review.

## Review focus

- Pause must continue to settle finite interaction transitions even without the global driver.
- Static artwork transforms must be compared against their own baseline, not incorrectly forced to identity.
- Scroll selection of the single mascot remains intentional and must not be misclassified as parallax.
- Removed heading masks must not change words, hierarchy, accessible names, or expose clipped content.
- Layout-expanding disclosures and focused views must retain natural scrolling with no stale refresh work.
