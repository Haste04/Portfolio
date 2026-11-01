# Phase 4 - Cinematic Parallax & Visual Design
User's approved Phase 4 brief is the specification. Implement in the existing Portfolio workspace.
No mascot overhaul, Phase 5, deployment, source-art changes or content changes.

## Audit and integration boundaries
One Astro route, seven semantic sections, working native navigation/disclosures, 60 serial tests.
Mascot owns its button and image transforms, follows reserved docks, and has its own state/physics.
All mascot source modules, styles, component, docks and original resources will be hash-compared.
Page motion targets must neither contain nor live inside mascot docks. Animate independent scenery,
text ink, cards, project frame/image wrappers, timeline progress and constellation layers.
Observe the existing Pause button's aria-pressed attribute, not the mascot's offscreen policy.
Keep original content links and restricted PhilCHAN conditions exactly as provided.

## Design
Midnight editorial composition, oversized masked typography, restrained amber linework and outlined
background type. Hero foreground moves against slower horizon/halo layers. About keeps all four
stories in staggered asymmetric cards. Education/Experience progress on thin amber timeline rules.
Projects become large stages: three independent depth planes, project-specific entrances, strongest
Anthea emphasis. Tech SVG line drawing and layered orbit/center depth retain native selection.
Contact has a wide atmospheric closing scene; links and bedtime remain accessible.

## Implementation
1. Save source checkpoint and before screenshots. Install only pinned stable gsap.
2. Add failing browser/policy tests for visible multi-rate motion, reverse/rapid scroll, native scroll,
   safe Pause/Resume/reduced motion, failed initialization, mascot isolation, disclosures and sizes.
3. Add motion-only wrappers/decorations and scoped cinematic CSS; content defaults fully visible.
4. Build reusable TS section modules with gsap.context ownership and stable untransformed triggers.
   No pinning, scroll normalization, scroll snapping, React or custom perpetual RAF loop.
5. Coordinator lazily imports the GSAP engine only when eligible; applies capability/layout tiers;
   rebuilds after viewport changes, refreshes after disclosure/layout changes, reverts on Pause,
   hidden tab, reduced motion, teardown or exceptions. Resume initializes at current scroll position.
6. Run build/check, targeted tests and all original 60 tests; inspect desktop/mobile/mid-scroll images;
   verify source assets, resume bytes, publication guard and unchanged mascot code; document evidence.

## Policy and fallback
Full: large capable fine-pointer devices; balanced: constrained hardware or laptop/tablet layouts;
light: mobile/save-data/very limited resources with small travel; off: reduced motion.
User Pause and hidden tab revert to static readable composition. Normal CSS never pre-hides content.
Hero entrance plays at most once per page lifecycle; scrub transitions are reversible.
GSAP cannot target a mascot descendant or any ancestor containing its dock.
A shared guarded target helper enforces this boundary; wrappers keep frame/image transforms separate.

## Validation focus
Actual transform differences prove depth; scroll position/hash prove native scrolling. Test reverse
and fast jumps, pause while mid-scroll, hidden restoration, breakpoint rebuilds, no-JS/failed import,
six-width overflow/heading/control bounds, case-study expansion and progress refresh, all resource
hashes and permission restrictions. Existing tests remain serial to avoid browser contention.

## Completion
Phase 4 implementation and validation complete. Build/check pass; all 74 tests pass with no skips.
See phase-4-validation.md and .cache/phase4-verification for evidence and limits.
Phase 4.5, Phase 5 and deployment remain outside scope.

## Runtime correction after visual review
Manual review rejected the initial visual result. Phase 4 remains open for user review.
The stronger live-runtime correction and its 84-test validation are documented in
[phase-4-parallax-debug.md](phase-4-parallax-debug.md). No later phase has started.

## V2 enhancement

The subsequent user brief authorizes a stronger multi-axis/focus/aperture choreography and supplied-logo integration.
Current implementation and validation evidence: [phase-4-v2-validation.md](phase-4-v2-validation.md).
Earlier completion counts above are historical. V2 remains subject to visual review.
