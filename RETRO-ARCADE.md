# Retro Arcade

The Retro Arcade cabinet presents an animated terminal prompt first. Opening its CRT fetches the six-entry catalog and title-screen thumbnails. Five entries launch a single same-origin iframe; Grand Theft Sloth is a noninteractive Coming Soon entry. Returning removes the iframe and restores the grid.

The source games and their required Lucid Plumbing files are copied without changes under `assets/retro-arcade/games/`. The original border and Back image are also copied unchanged. Only grid thumbnails are resized. `verification/retro-arcade-source.json` records source paths and SHA-256 hashes. The importer is `tools/import-retro-arcade.cjs` (requires Sharp).

F toggles fullscreen for four games. Slubble Slobble retains F for player-two fire/confirm and F2 for fullscreen, as approved. The host delegates the games' existing Plumbing fullscreen helper to the player container to keep Back accessible. Escape and Backspace are not intercepted. Native game scaling, controls, graphics, audio, and timing remain intact. Touch gameplay is limited to the controls supplied by each original game; no new game controls are added.

## Verification

Run `node verification/retro-arcade-check.cjs` with Playwright available. `PREVIEW_URL` selects the server and `VERIFICATION_OUTPUT` optionally saves screenshots.

The check covers desktop (1440×900), emulated phone (390×844), and tablet (820×1180): animated teaser, deferred catalog/images, five playable links, nonclickable Coming Soon, native menu-to-gameplay entry, proportional centered sizing, keyboard passthrough, the F/F2 exception, true Fullscreen API entry/exit, visible image return button, exit-before-unload, restored grid, isolated requests, and browser errors. Source hashes are checked against originals. Browser-native Escape fullscreen exit is not simulated by the headless keyboard test; Escape passthrough is checked and no host handler intercepts it.

Regression checks cover all existing handheld return controls, About Us story/scrolling, Contact Us validation and mocked success/failure (no real submissions), and original cabinet zoom/back navigation. Privacy and Terms remain unmodified.
