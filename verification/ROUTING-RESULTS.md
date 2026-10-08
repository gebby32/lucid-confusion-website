# Routing verification — October 7, 2026

Local headless Microsoft Edge checks passed:

- `routing-check.cjs`: About Us, both game cabinets and Links, each history level
  in both directions, controls, desktop and touch/mobile, direct links, refresh,
  no duplicate parent seeding, root exit to a previous document, fullscreen exit
  and iframe disposal. All 30 published game URLs returned HTTP 200.
- `routing-edge-check.cjs`: rapid navigation during animated zooms, duplicate
  prevention, drag out of cabinet focus, all non-game cabinet content deep links,
  trailing-slash normalization and navigation during delayed catalog loading.
- `links-check.cjs`: desktop, portrait and landscape phone layouts, six external
  destinations (intercepted test pages), App Store notice, beach return, keyboard
  focus and About Us scrolling.
- `game-return-check.cjs`: both game players on desktop/mobile, fullscreen and
  normal returns, frame disposal after fullscreen exit, every cabinet's mouse
  double-click and touch double-tap return, unchanged game bounds/button layout.
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

Initial live verification exposed GitHub Pages' directory redirect discarding
history state on slashless refreshes. Public routes now retain canonical
trailing slashes, and the local preview reproduces directory redirects so the
refresh regression covers this behavior before deployment.
