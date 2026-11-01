# Living Canvas Implementation Plan
> For agentic workers: use superpowers:executing-plans task by task.
**Goal:** Seven subtle ambient, clearly cursor-reactive backgrounds, preserving every foreground interaction.
**Architecture:** One pointer/visibility controller, cached geometry, finite input-driven animation frames. CSS/SVG owns idle movement and spring-back; separate decorative transform owners. Existing capability policy and motion controls govern all sections.
**Tech Stack:** Astro, TypeScript, CSS, SVG, native Web Animations; no dependencies.
**Spec:** User Phase 4.6 Living Canvas brief in this session.
## Constraints and motion audit
A: Original decorative scroll motion was removed; keep it removed. Static scenery may host ambient effects.
B: Education camera, Projects Orbit, toolkit focus, gallery, disclosures remain functional and unchanged.
C: Mascot controller owns actor transforms, physics, idle, docking and bedtime; do not modify.
D: Navigation, theme reveal, active sections and Pause remain authoritative and unchanged.
No Git repository, deployment, source asset modifications, content changes, scroll handlers or parallax.
## Tasks
- [x] 1. Record source resource hashes. Add failing geometry and Hero browser tests.
- [x] 2. Implement geometry helpers, shared controller, Hero ring reuse. Verify Hero proximity, spring-back and motion controls in browser.
- [x] 3. Add remaining six section-local SVG/CSS effects. Verify actual visual changes and cooldown.
- [x] 4. Verify theme, hidden/offscreen suspension, touch, cleanup, foreground regressions and six widths.
- [x] 5. Run build/check/regressions, independent review, capture evidence, verify integrity and report limitations.
## Files
LivingCanvas.astro renders only decorative layers. controller.ts coordinates shared input/lifecycle. proximity.ts holds pure geometry. living-canvas.css contains theme-aware ambient/pointer styling. SectionFrame inserts one layer; CinematicScene marks existing Hero rings. Tests cover geometry, runtime effects, suspension and preservation.
