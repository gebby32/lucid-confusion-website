# Browser fullscreen verification

Verified locally on October 21, 2026. Not deployed.

## Behavior

- Both running-game players use `assets/demo-arcade/full-screen.png` at the upper right, opposite the existing Back button. Selection screens and the carousel hide the button.
- Retro Arcade maximizes the playable monitor. Desktop handhelds maximize only the live LCD, with console artwork clipped away. Touch devices retain the original handheld console and touch regions.
- Fullscreen is a presentation change within the browser viewport. The iframe stays in place; no document reload, new game, route change, history entry, or native Fullscreen API request occurs.
- Escape and the Full Screen toggle restore the normal view. Pointer clicks on the toggle retain iframe focus so games do not auto-pause on blur. Existing Back navigation still unloads the game normally.
- No individual game sources, CRT presentation, carousel, cabinet zoom code, or Demo Arcade implementation changed.

## Passed

- `browser-fullscreen-check.cjs`: all 8 Retro Arcade and 25 handheld games at 1440×900 desktop, 390×844 touch portrait, and 844×390 touch landscape. Tests cover button visibility/placement, expansion/collapse, Escape, proportional screen fitting, original console fitting on touch devices, keyboard delivery, original Plumbing touch controls, iframe/document/canvas/state identity, no document reloads, Back/unload, and browser history. Additional resizing covers 320×700 and 820×1180.
- Active Sloth Invaders and Bungee-Pug sessions preserve the original player object, score, level/wave, simulation frame, and gameplay state through toggling; simulation continues afterward.
- `retro-arcade-check.cjs`: every Retro Arcade game starts gameplay at desktop, phone, and tablet sizes; directional controls and the existing F/F2 exceptions work. Published game source hashes match.
- `game-return-check.cjs`: both sections retain original normal-view geometry, Back artwork/placement, F toggling, return navigation, and unloading on desktop and touch.
- `handheld-fullscreen.cjs`: F toggle, Escape, keyboard controls, resize, aspect ratio, and return pass.
- `routing-edge-check.cjs`: rapid Back/Forward, history entries, deep links, CRT drag isolation, and delayed catalog cancellation pass.
- `two-stage-zoom-check.cjs`: carousel and both cabinet zoom stages pass across seven desktop/mobile viewport sizes and all nine cabinets.
- All three Demo Arcade games retain their existing fullscreen/collapse behavior and the same iframe document.
- JavaScript syntax checks and `git diff --check` pass. Representative screenshots were visually inspected.

The full matrix was run in desktop Edge with mobile/touch emulation. Physical phones/tablets, Safari/WebKit, and physical gamepads were not tested. The tests respect original transparent-artwork crops in games such as Static Weasel and The Nudibranch.

## Reproduce

With Playwright and Edge available, start `node verification/serve.cjs`, set `PREVIEW_URL` to its local URL, then run `node verification/browser-fullscreen-check.cjs`. `VERIFICATION_OUTPUT` optionally saves screenshots; `TEST_WIDTH` optionally selects one matrix width. The existing regression scripts above use the same `PREVIEW_URL`.
