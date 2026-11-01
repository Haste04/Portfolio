# Phase 3 — Mr. Fresh implementation
User's approved Phase 3 brief is the specification. Execute locally in the existing Portfolio directory, without deployment or Phase 4/5 work.

## Integration
One movable character button, two reusable image layers and one TypeScript controller. Existing Hero stage owns the initial static/no-JS container. Small reserved section docks keep all artwork clear of content. Project docks identify the currently visible project. Contact uses its existing resting area.
Stage-local coordinates bound dragging, rotation and tossing; scrolling selects a pending dock then exits/re-enters without document-wide travel. No navigation rewrite.
22 originals mapped explicitly to typed manifest; optimized 512/960 WebP derivatives, existing container URLs retained. Per-asset framing profiles align ground line and comparable head size without stretching.

## Implementation order and verification
1. Record original/resource baseline and inspect contact sheet. Add unit tests for state cancellation, priority, gestures, velocity/physics and idle clocks; run red.
2. Implement pure state/lifecycle, gesture, physics, idle, asset metadata and adaptive policy modules. Fake clocks exercise timers, unit tests cover priority denial, stale callbacks, three-click annoyance, swipe cooldown, touch vs drag, multi-stroke petting, bounded damped bounces and maximum duration.
3. Add shared component, docks, accessible reaction/pet/reset/pause controls, renderer and controller. Native click/keyboard fallback; touch-action pan-y. Scoped CSS only; no new dependencies.
4. Browser checks: hero entry and reaction/petting, full toss/settle/return/Escape, rapid/reverse scrolling, contact cancellation/waking, 30/45/60 schedule, pause/hidden tab/reduced-motion/touch. All existing portfolio tests stay.
5. Build/type check/full browser suite at six widths, visual captures, source SHA verification, review and final report.

## Decisions and limitations
- Touch gets tap and keyboard-equivalent Pet controls; unrestricted dragging only on fine mouse/pen pointers in tiers A/B.
- CSS breathing only when visible, active and unpaused; no idle JS frame loop.
- Portraits are deliberate brief reaction portraits, aligned for comparable head size; no invented layers, blinking or independent pupils.
- Container exit is a short dip/conceal/reveal into sitting/jump artwork, not a rigged extraction.
- Runtime tier starts from reduced-motion, save-data, hardware and pointer capabilities, then only downgrades from observed active-frame cost. Width determines fit, not capability.
- PhilCHAN publication gate remains unchanged.

## Execution record
- Inspection: existing Astro static app, seven sections, accepted navigation and browser suite. 27 originals pass baseline SHA-256 verification.

- Browser regression: Phase 2 image count assumed one static img; updated to one shared actor / one visible layer, retaining project dimension checks. Six-width regression passed.
- Found and reproduced reduced-motion transition bug: a delayed return could restart RAF after policy changed. Policy changes now invalidate the whole action; return also rechecks motion permission.
- Actual emulated touch scroll, browser idle deadlines and hidden-visibility handler checks pass. Headless hidden-tab test uses a controlled visibility signal.
- Reproduced navigation integration bug at 768px: mascot data-section entered the existing primary-section observer and could clear active navigation. Renamed it data-current-section and added an observer-contract regression. Original navigation code remains unchanged.
- Independent review reproduced sleep loss after tab suspension and section changes preempting visible physics. Preserved inactivity stage and completed Contact sleep; queued all physical-state destinations until completion, with explicit offscreen cancellation. Both received failing browser regressions before fixes.
- Review follow-up: technology-triggered reactions now reset inactivity when accepted, before any completion timer. Added failing-then-fixed suspend-during-wake regression.

- Resume audit: all interaction modules present; latest root-transition pause CSS fixed the recorded pause test. Confirmed targeted pause and technology wake tests pass.
- Reproduced parallel browser contention: navigation image test hit a 4-second page.goto/networkidle timeout alongside the mascot browser process, then passed alone at six widths. Test files now run serially; no assertions removed or timeouts relaxed.
- Source-only resume checkpoint saved in .cache/phase3-resume-checkpoint; Git is absent and was not initialized.
- Final validation: production build passed (one page); Astro/TypeScript check passed (37 files, zero diagnostics); complete serial suite passed 60/60 with no failures or skips. Original-resource SHA checks passed after tests. Visual evidence and full report saved in docs/phase-3-validation.md. Phase 3 complete; no Phase 4/5 work or deployment.
