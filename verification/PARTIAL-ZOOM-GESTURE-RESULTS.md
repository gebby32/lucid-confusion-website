# Partial-zoom navigation verification

Tested locally on October 21, 2026. Not deployed.

## Behavior

- In the first cabinet zoom stage, double-clicking or double-tapping the monitor, cabinet, or background invokes the existing Back-to-Arcade navigation.
- A single monitor click/tap advances into CRT content after a 400 ms double-interaction window. A single cabinet/background click remains a no-op. Keyboard Enter remains immediate.
- A matching second press cancels the queued single before release, preventing an accidental second zoom. Dragging, cancellation, leaving the page, Back, Escape, and browser history traversal also clear pending interactions.
- `touch-action: manipulation` applies to the partial-zoom surface, preventing browser double-tap magnification while retaining pinch gestures.
- The new shortcut is limited to the partial-zoom stage. Existing CRT and active-game interactions remain unchanged.

## Passed

- `partial-zoom-gestures.cjs`: all nine cabinets at 1440×900 desktop, 390×844 touch portrait, and 844×390 touch landscape. Monitor, cabinet-body, and background doubles return directly to the carousel without any intermediate CRT view or new history entry. Forward restores the same partial view. Single monitor interactions advance exactly once; background singles do nothing.
- Browser viewport scale stays unchanged after mobile double-taps.
- Pending-single cancellation, a second press spanning the single-click deadline, pointer cancellation, drag rejection, keyboard activation, and animated transitions pass.
- Double interactions in full CRT backgrounds and active Retro Arcade, handheld, and Demo Arcade game iframes do not invoke this shortcut. Fullscreen entry/Escape and the original game documents survive the regression checks.
- `two-stage-zoom-check.cjs`: original carousel/cabinet framing, camera and background invariants, both zoom stages, Back/Forward, resizing, and all nine cabinets pass at seven desktop/mobile viewport sizes.
- `routing-edge-check.cjs`: rapid animated Back/Forward, no duplicate history entries, CRT drag isolation, all cabinet deep links, and delayed-catalog cancellation pass.
- JavaScript syntax checks and `git diff --check` pass.
- SHA-256 comparisons confirm no changes during this task to `game-fullscreen.js`, `game-fullscreen.css`, `handheld.js`, `retro-arcade.js`, `index.html`, `router.js`, or `routes.js`.

Testing used local desktop Edge and its mobile/touch emulation. Physical phones/tablets and Safari were not tested.

## Reproduce

With Playwright and Edge available, start `node verification/serve.cjs`, set `PREVIEW_URL` to its local URL, and run `node verification/partial-zoom-gestures.cjs`. The existing zoom regression uses the same environment variable.
