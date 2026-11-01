# One-time component reveals

User specification: current Phase 4.7 five-section one-time reveal brief. Execute inline using Superpowers planning, TDD, review and verification. The explicit implementation authorization supplies the design; no additional approval gate or Git repository is needed.

Architecture: one IntersectionObserver controller and native Web Animations on 14 existing static outer wrappers. Home starts at initialization; other wrappers start at first viewport entry. Consume each wrapper and unobserve before starting; 850ms, translateY 40px to 0, opacity 0 to 1, smooth ease-out, 150ms stagger. Native animations own only their outer wrapper; existing interactive transforms remain inside. No CSS pre-hide, ScrollTrigger, scroll listener or idle rendering loop.

- [ ] Task 1: Snapshot current sources/assets and production geometry; write and observe a failing real-browser Home reveal test.
- [ ] Task 2: Add scoped target attributes and the shared controller. Cover all five sequences, once-only state, accessible interaction settling, Pause/reduced/hidden/theme interruption, direct anchors and bfcache cleanup with real-browser tests.
- [ ] Task 3: Build/type check, run the project test command, correct legitimate reveal-related expectations while retaining regressions, inspect real desktop/mobile motion in both themes, review once with an independent reader, verify integrity and report.

Review focus: deep links/tall elements must not miss entry; delayed buttons must become visible on focus/press; interrupted/native animation failures must leave no hidden content; theme and bfcache must not replay seen wrappers; mascot/zoom transforms must remain separate. Add matching tests in Task 2.

Restrictions: About and Contact component markup, styles and animations unchanged; no content, asset, layout, mascot or interaction changes; no new dependencies, decorative parallax, deployment or later phases. Save raw evidence and an execution ledger under .cache/component-reveals/.
