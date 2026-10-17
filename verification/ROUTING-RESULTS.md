# Two-stage zoom and routing verification — October 17, 2026

Local rollback checkpoint: `c423ad3`. Implementation branch:
`codex/grounded-cabinet-zoom`. No push or deployment was performed.

Local headless Microsoft Edge checks passed:

- `two-stage-zoom-check.cjs`: animated desktop, portrait phone, small phone and
  landscape phone transitions; pixel-identical room/branding/decorations before
  and after the first zoom; fixed first-stage camera, uniform group scaling,
  zero vertical group movement and unchanged per-cabinet transforms; viewport
  fit without clipping, zero layout shift, two click/tap stages, UI and browser
  history round trips, viewport resizing and all nine cabinet intros/content.

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
