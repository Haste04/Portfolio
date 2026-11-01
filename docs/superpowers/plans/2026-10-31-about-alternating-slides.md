# About alternating slides implementation plan
> Execution: superpowers:executing-plans, inline; final independent read-only review.
Goal: pronounced right/left/right/left entrances for the existing four whole photo panels, preserving final layout and all content.
Spec: current user About pronounced alternating slides brief.
Architecture: stable per-panel measurement slots; one lazy About engine with four GSAP ScrollTrigger scrub timelines. Controller owns visibility, Pause, reduced motion, theme freeze and lifecycle. Living Canvas and mascot transforms remain independent.
Constraints: no pinning, added scroll distance, source asset edits, Hero animation, other-section parallax, dependencies, Git creation or deployment.
- [x] Capture source checkpoint; add and observe failing real-browser alternating-displacement assertions.
- [x] Add slots and clipping, 62% desktop entrances (1024px+), responsive tablet/mobile distances, linear scrub from top 100% to top 55%.
- [x] Integrate Pause/reduced static fallback, hidden/offscreen suspension, theme freeze, resize and teardown.
- [x] Update superseded About-static expectations only; retain other-section/mascot isolation.
- [x] Build, type check, relevant regressions and full suite; visually inspect slow wheel scrolling in both themes; capture evidence; review and verify hashes.
Review focus: final dimensions/text unchanged; no sideways page overflow; early completion before reading zone; reverse/resize/theme stability; hidden/Pause cleanup and fallback readability.
Ruling: proceed from the user's explicit, detailed implementation authorization; do not insert another design approval gate. No repository exists, and creation is prohibited.

Implementation ruling: the pinned plugin re-enables media services asymmetrically. Finite input batches use its measured scrub ranges, with scoped registration cleanup, instead of leaving a global repaint/maintenance loop active. Actual displacement and reversal are unchanged; lifecycle/browser tests cover the adapter.
