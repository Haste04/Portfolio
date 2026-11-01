# Mr. Fresh Project Orbit: stronger perspective V2

## Findings from the running site
Before changes, the normal-motion development site at http://127.0.0.1:4321/ correctly initialized the 3D scene. The camera and bridge had preserve-3d, opacity 1, no clipping/filter flattening, and camera perspective 1000px. The leaf project planes intentionally flattened their own icon content.
The weakness was visual: front 128.762px versus rear 86.069px (1.496x), side planes both 104px, rear opacity .8, shallow physical depth plus/minus 160px, and a tall nearly circular ring. Real translateZ existed, but its cues were restrained.

## Focused changes
- src/scripts/project-orbit-layout.ts: continuous XYZ path, stronger capability profiles, projected-space emphasis and bounds, readable caption compensation, rear hitbox clearance.
- src/scripts/project-orbit.ts: 820ms / 40-segment finite native pose and caption transitions; same selected-project state, gestures, epoch cancellation, Pause/hidden/reduced lifecycle. Compact transitions remain 620ms / 16 segments.
- src/styles/project-orbit.css: independently tilted decorative SVG ring, ivory readable captions and selected border/shadow emphasis. Existing outer GSAP transform ownership remains untouched.
- Projects unit/browser tests: projected scale and side asymmetry, dense safe geometry, caption measurements, intermediate paths, real foreground/background paint order.
No component markup, mascot module, project content, package, other section, original resource or route was changed. No dependencies, Git repository or deployment were added.

## Geometry and perceived size
The existing angle still drives sin(angle) horizontal travel, cos(angle) vertical placement and real Z depth. A bounded rear lift proportional to max(0,-cos(angle)) squared reserves the mascot's transparent interactive rectangle. A smooth cosine interpolation between cardinal emphasis values has zero slope at each cardinal position, including the wrap boundary; icons never teleport into slots.

Apparent emphasis is specified after perspective projection. CSS scale compensates by multiplying by (perspective-z)/perspective, so the camera does not accidentally magnify a requested 1.45 into an unbounded value. Captions receive a separate finite scale animation to keep their apparent scale at least .9; icons still recede strongly. Captions remain upright. Rear opacity is .52 to retain ivory-label readability on the midnight background.

| Profile | Perspective | Z amplitude | Front / bright side / rear / quiet side |
| --- | --- | --- | --- |
| Capable wide desktop | 760px | 260px | 1.45 / 1 / .55 / .75 |
| Small laptop or balanced capabilities | 850px | 225px | 1.4 / 1 / .6 / .778 |
| Tablet | 1000px | 130px | 1.22 / 1 / .78 / .878 |
| Mobile or light resource tier | none | 0 | compact emphasis only |

Capability hints include cores, memory and Save-Data; width is not the sole policy. Static geometry stays stable during Pause/reduced motion; selection settles immediately. No orbital JS/physics loop runs while idle.

## Measured normal-motion desktop result
Live development server, Edge at 1920x1080, full-capability test hints (8 cores / 8GiB):
| Position | Actual Z | Projected width | Apparent scale | Opacity |
| --- | --- | --- | --- | --- |
| Foreground Anthea | +260px | 150.800px | 1.45 | 1 |
| Bright side Lifevent | 0 | 104px | 1 | .86 |
| Rear Seek First Books | -260px | 57.200px | .55 | .52 |
| Quiet side PhilCHAN | 0 | 78px | .75 | .68 |

Foreground/rear size ratio increased from 1.496 to 2.636. The same screenshots preserve the existing two-column layout and approved imagery.
At a sampled intermediate rotation (160ms), incoming Lifevent measured Z=209.158px / width=134.287px, while outgoing Anthea measured Z=154.390px / width=103.675px. Actual motion continuously advances XYZ, emphasis and opacity rather than swapping positions.

## Mascot and transform isolation
Mr. Fresh stays on the existing flat Z=0 center plane with his single unchanged controller. Camera and bridge have no grouping properties that collapse the shared 3D context. A controlled browser overlap test aligns a project plane with the mascot: positive Z paints the icon ahead; negative Z paints the mascot ahead. Normal paths reserve the character's hitbox and controls. Existing 20px pointer-offset and interaction regressions remain.
GSAP still owns only the page-level ring/word/detail wrappers; the static ring-sheet tilt, orbital poses, caption transforms and mascot transforms each have separate owners.

## Validation ledger
- Watched new unit and browser depth assertions fail against the original implementation.
- Pure geometry: 7/7 passed after implementation and clearance correction.
- Initial browser pass exposed 4 responsive hitbox overlaps; fixed the rear path instead of weakening the existing overlap assertions.
- Corrected new caption measurement to use subpixel computed height rather than integer offsetHeight (.889 rounding artifact for a .9 apparent scale).
- Corrected new controlled-clock sampling to stay inside the active interval before calling finish(). Paused effects forced beyond their duration disappear from getAnimations() without resolving their paused finished promise; this was a test-harness issue, not natural rotation behavior.
- Corrected responsive/new-depth/intermediate safety run: 8/8 passed. Separate real 3D paint-order test: 1/1 passed.
- npm.cmd run build passed; final static Astro rebuild after rear clearance passed: one static route.
- Astro/TypeScript passed: 71 files, zero errors/warnings/hints.
- Independent read-only review found no additional lifecycle/camera/cleanup issues.
- All 27 original artwork/screenshot/resume resources matched their SHA-256 baseline before and after changes. Baseline scope details: .cache/project-orbit-v2/scope-integrity.json.
- Full serial regression suite is in progress; append exact final results after completion.

## Evidence and limitations
.cache/project-orbit-v2/ contains before-desktop.png and before-measurements.json from the running development site; after-desktop.png and after-measurements.json; orbit-initial.png; orbit-mid-rotation.png; four selection screenshots; six projects-final-*.png layouts; and project-orbit-rotation.webm.
The recording contains 76 actual CDP browser frames over 6606ms, encoded with native MediaRecorder. Capture sampling/encoding is not an application FPS benchmark.
Visual review inspected the real desktop baseline and V2 intermediate scene. No Safari/Firefox or physical older-device benchmark yet. Mr. Fresh remains approved flat PNG artwork, not a rigged 3D character. No later-phase work or deployment was performed.

## Final results

- Complete serial suite: **171 passed / 2 failed / 173 total**, no skipped or cancelled cases. Raw log: .cache/project-orbit-v2/full-tests.tap.
- All **30 Projects browser/unit tests passed** in that full run, including continuous depth, actual paint order, independent mascot dragging, selections/disclosures/links, reduced motion, Pause, hidden/restored lifecycle, low-resource handling, no-JavaScript fallback and six responsive widths.
- Development project-page parallax test failed its first displacement sample (details -4.392px, lettering -13.804px, ring -6.902px); its unchanged isolated rerun passed all four selections. Production counterpart passed on the full run (details -22.496px, lettering -70.703px, ring -35.352px over 420px scroll). Its intermittent initialization/sampling cause is unconfirmed.
- Known gallery deferred-Back viewport assertion failed in the full run and on its unchanged isolated rerun. This was already noted as intermittent in docs/project-orbit-3d.md before V2. Cache-only diagnostic measurements were collected; the underlying issue is unresolved. Gallery implementation and its tests remain byte-identical. **Do not describe the full suite as green.**
- Final Astro/TypeScript check after the rear-clearance correction exited 0: 71 files, zero errors/warnings/hints.
- Final static rebuild after that correction exited 0: one page.
- All six widths passed Projects bounds, non-overlap, readable heading, touch-target and selected-detail assertions: 1920, 1366, 1024, 768, 390 and 320px.
- Final integrity scope: 215 existing checkpoint files, 210 unchanged. Only the three Projects source files and two Projects test files changed. All original character illustrations, project screenshots, school/brand logos, mascot modules, other sections, verified data and package files remain unchanged.
- Resume source and download hashes match: 57f8a234762463324da1b48c782771695943181836a8eed4ff6aaf5932e6e6da.
- Final browser evidence includes the normal-motion running development site at port 4321, a genuine 76-frame / 6606ms rotation recording, all four settled selections and six layout screenshots. Desktop initial/mid-rotation and mobile screenshots were visually reviewed.
- Remaining limitations: existing gallery Back regression, intermittent development page-motion sample, Edge-only automation and no physical-device FPS/field-performance benchmark. No unrelated system or later phase was modified.
