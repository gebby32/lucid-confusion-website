# Two-stage zoom and routing verification — October 17, 2026

Local rollback checkpoints: `c423ad3` before restoring the two-stage flow and
`fd8f7c3` before correcting viewport sizing and floor motion. Implementation branch:
`codex/grounded-cabinet-zoom`. No push or deployment was performed.

The user's small-window failure was reproduced at 1360x600: the old 720px
minimum scene height allowed a 120px page scroll, cutting off the focused cabinet
and leaving its bottom above the visible floor. Earlier tests did not exercise
page scrolling, and world-space floor contact alone did not verify perceived
grounding. Those earlier checks were insufficient.

Updated local headless Microsoft Edge checks passed:

- `two-stage-zoom-check.cjs`: 1360x600, 1520x695, 1920x916, 1440x900,
  390x844, 320x568 and 844x390. Attempts to scroll leave the scene at y=0;
  room/branding/decorations are pixel-identical before/after the first zoom.
  Every sampled animation frame checks forward ring translation, all nine
  projected cabinet bases moving down toward the viewer, unchanged geometry
  scale, zero vertical group movement/tilt and unchanged relative transforms.
  Also checks viewport fit, zero layout shift, two click/tap stages, UI/browser
  history round trips, viewport resizing and all nine cabinet intros/content.
- `viewport-framing-check.cjs`: equivalent 1920x900 physical areas at emulated
  100%, 125% and 150% display scaling have equal normalized cabinet/branding/
  decoration dimensions. Checks scroll attempts, reload without duplicate history,
  legal-link hit targets, resizing during both zoom stages, 4:3 content, reverse
  history and exact bounds of all nine cabinet meshes on desktop/portrait phone.
  Cabinets fill the height unless the viewport is too narrow for their original
  proportions, in which case width limits the fit and the bottom remains aligned.
  Root, intermediate animation and final captures were visually inspected,
  including the previously failing 1360x600 viewport.

- `routing-check.cjs`: About Us, both game cabinets and Links, each history level
  in both directions, controls, desktop and touch/mobile, direct links, refresh,
  no duplicate parent seeding, root exit to a previous document, fullscreen exit
  and iframe disposal. All 30 published game URLs returned HTTP 200.
- `routing-edge-check.cjs`: rapid navigation during animated zooms, duplicate
  prevention, drag isolation in cabinet focus, all non-game cabinet content deep links,
  trailing-slash normalization and navigation during delayed catalog loading.
- `links-check.cjs`: desktop, portrait and landscape phone layouts, six external
  destinations (intercepted test pages), App Store notice, beach return, keyboard
  focus and About Us scrolling.
- `game-return-check.cjs`: both game players on desktop/mobile, fullscreen and
  normal returns, frame disposal after fullscreen exit, game input isolation,
  cabinet/root returns, and unchanged game bounds/button layout.
- `handheld-check.cjs`: all 23 games on desktop/mobile, lazy loading, game assets,
  contained layouts, launch/unload, and cabinet/root return.
- `handheld-controls.cjs`, `handheld-fullscreen.cjs`, and
  `arcade-additions-check.cjs`: native controls, initials entry, Backspace
  exceptions, fullscreen and new-game compatibility.
- `retro-arcade-check.cjs`: all seven games on desktop, phone and tablet, native
  gameplay/input, fullscreen, lazy loading, unload, Coming Soon, asset hashes.
  The typewriter check now samples during typing rather than after the longer
  first zoom has already allowed the unchanged intro to finish.
  One original source image is no longer at its historical location; its
  published copy still matches the recorded SHA-256.
- JavaScript syntax checks and `git diff --check` passed.

No browser exceptions were reported by the passing suites. Cleanup checks
verify game frames are detached, disposing their scripts/audio contexts; they
do not involve listening to physical speakers. Mobile checks use emulation.

Historical scripts targeting deleted carousel buttons/old screen layouts were
not used as current acceptance tests; current controls are covered above.

Earlier live verification exposed GitHub Pages' directory redirect discarding
history state on slashless refreshes. Public routes now retain canonical
trailing slashes, and the local preview reproduces directory redirects so the
refresh regression covers this behavior before deployment.
