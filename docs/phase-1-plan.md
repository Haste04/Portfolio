# Phase 1 foundation
Status: authorized; implement in the existing Portfolio directory.

## Scope
- Static Astro and strict TypeScript; Tailwind via its Vite plugin.
- Single index route, seven ordered sections: home, about, education, projects, tech-stack, experience, contact.
- Charcoal, warm white, amber; Space Grotesk display and Inter body; fluid typography and 1280px content limit.
- Floating navigation, native mobile disclosure, active section tracking, reduced-motion-aware anchor scrolling, skip link, focus styles.
- No content showcases, mascot implementation, animation libraries, source-media copies, deployment, or extra routes.

## Tasks
1. Verify and hash all 27 original resources; configure minimal toolchain and local fonts.
2. Build the layout, reusable section structure, typed section data, responsive tokens and navigation markup.
3. Verify navigation behavior in a real browser before enhancing it; add TypeScript active section and menu management.
4. Check production build and types; test six requested widths, keyboard, no-JS, reduced motion and source integrity; independent read-only review.
5. Record results, stop at Phase 1.

## Decisions
- Work in place: the user explicitly requires the existing directory; no Git repository exists.
- Native details/summary provides mobile disclosure even without JavaScript; TypeScript adds destination closing and Escape handling.
- All original resources stay outside public and src; the Phase 1 page must not request them.
- Self-host only Latin normal variable font files, with upstream licenses; no external font request at runtime.
- Tests use Node's test runner and playwright-core with installed Edge; no browser download or UI runtime.
- Desktop active navigation uses IntersectionObserver plus explicit anchor/hash handling; no continuous scroll listeners.

## Future mascot decisions (document only)
One primary TypeScript controller, asset manifest, gesture and physics modules, and lifecycle management.
Priorities: dragging > toss > section transition > click/petting > sleep/wake > idle.
Separate framing profiles for portraits, full bodies, container, and differently sized special poses.
True blinking deferred; do not substitute unrelated expressions.
Later scope: attention/tilt, click escalation, strokes, bounded medium toss, 30/45/60s inactivity, section poses, Contact bedtime.
Respect reduced motion, user pause, offscreen suspension, hidden tabs, touch scrolling, and older laptops.

## Content deferred
Anthea, Lifevent, Seek First Books, PhilCHAN Cebu only; FuelWatch is excluded.
Lifevent screenshot is its homepage, not the login contribution: obtain a login screenshot before its detailed case study.
PhilCHAN screenshot includes branding and identifiable people; public-use permission remains unconfirmed.
The supplied r?sum? is present and must be copied byte-for-byte only in the content phase.

## Execution log
- Follow-up inspection: 22 original character PNGs unchanged from initial audit, four new project PNGs, one PDF.
- No application, dependencies, configuration, or local Git repository existed at start.
- Registry verified: Astro 7.4.0 requires Node >=22.22.0; installed Node 24.11.1 satisfies that range.
- Dependency ruling: TypeScript 6.0.3 selected because checker 0.9.10 declares ^5 or ^6; TypeScript 7 failed npm resolution. No forced peer overrides.
- Browser RED: 4/9 passed; active section, mobile close, Escape and resize enhancements failed as expected before TypeScript. Responsive check initially measured the h1 wrapper rather than visible display text; corrected the test to measure the styled name span.
- Visual review caught Windows pipe substitution of em dashes. Corrected Unicode title test failed first; source now uses preserved Unicode / HTML entity. Added no-focus-trap and computed contrast checks.
- Independent review: important gradual-scroll active-state defect reproduced in Edge with a failing small-step browser test. Observer now selects from actual intersections in a pixel band and refreshes on viewport-height changes; no scroll event listener. Punctuation report was already addressed.
- Final: build PASS, check 0 errors/warnings/hints, 12/12 Edge tests PASS, six widths verified, all 27 source hashes unchanged. Independent review corrected; no deferred findings. Phase 1 complete; stop before Phase 2.
