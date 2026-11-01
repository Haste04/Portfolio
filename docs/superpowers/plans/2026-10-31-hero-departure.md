# Hero Cinematic Departure Implementation Plan
> For agentic workers: use superpowers:executing-plans task by task.
**Goal:** Visible, reversible Hero-only depth; unchanged initial composition and all interactive functionality.
**Spec:** User Phase 4.7 brief in this session.
**Architecture:** One lazy Hero GSAP timeline and ScrollTrigger, separate copy, lettering, ring and stage owners. Input-driven updates park ScrollTrigger background services and keep the timeline paused between events. No pinning. Stage scenery translates; a countertranslated independent interaction plane keeps mascot geometry unchanged.
**Tech Stack:** Existing Astro, TypeScript, GSAP 3.15 / ScrollTrigger, CSS; no dependencies.
## Choices and constraints
Use installed GSAP, not CSS scroll timelines (browser support and lifecycle requirements). A bounded native-event adapter avoids the installed plugin's perpetual repaint RAF and maintenance interval. All present GSAP owners are Hero-only; document this adapter before future sections add owners.
Living Canvas gets only a Hero coordinate-projection bridge; it retains its own transforms and existing controller. No mascot code changes. All other section layouts/content/motion remain unchanged. No Git repo, deployment, asset edits or later phases.
Pause freezes decorative departure and restores text readability; at page top paused state returns to initial composition. Reduced motion uses fully static layout. Theme reveal freezes departure without resetting progress or scrolling. Keyboard focus keeps copy legible.
## Files
Modify SectionFrame Hero branch, Hero.astro, CinematicScene Hero branch, Living Canvas Hero geometry, and obsolete global-reset test expectations only.
Create src/scripts/hero-depth/{geometry,controller,engine}.ts, src/styles/hero-depth.css, tests/hero-depth*.test.mjs, documentation/evidence.
## Execution
- [x] 1. Capture initial six-width/two-theme geometry, screenshots and resource hashes; write and observe failing pure/runtime tests.
- [x] 2. Implement isolated wrappers, timeline, finite lifecycle adapter, projection bridge. Test actual differential motion and reverse.
- [x] 3. Verify mascot drag/click, Living Canvas, both themes, Pause/reduced, reload/resize, other-section isolation; adapt obsolete Hero-static checks without relaxing other-section assertions.
- [x] 4. Build, type-check, relevant regressions, independent review; capture before/mid/departure and recorded motion, verify hashes and report.
## Review focus
1. Countertranslation must preserve pointer coordinates during scroll and drag.
2. Ring proximity must follow the scroll-rotated/scaled outline without per-frame layout reads.
3. Theme changes during mid-departure must retain scroll/progress.
4. Pause/reduced/load failure must preserve readable/focusable CTAs.
5. Teardown/restore/rapid resize must leave one Hero trigger and no idle JS frame chain.

## Verification rulings
- Development and production require separate immutable layout fixtures. The original production Projects height at 1920px is 1375.515625px; original development is 1379.875px. The initial cross-runtime comparison was invalid. Original production was verified with source overlays in an isolated .cache build; workspace source was never reverted. Both runtimes retain the same strict geometry/color/font assertions.
- ScrollTrigger remains disabled between guarded geometry refreshes. Its bounds drive the paused GSAP timeline through a finite native input scheduler; this prevents plugin intervals/resize callbacks from bypassing Pause.
