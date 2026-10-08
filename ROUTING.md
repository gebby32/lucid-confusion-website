# Arcade routing

`router.js` owns browser history, parent navigation, route titles and serialized
state restoration. The adapter in `arcade.js` zooms directly from the resting
carousel into the CRT intro, then reuses the original content panels and game
launch/cleanup functions. Only meaningful transitions write history; carousel rotation and animation frames do not.

Routes:

- `/`: main arcade
- `/<cabinet>/`: CRT intro (all nine cabinets; no focused-cabinet pose)
- `/<cabinet>/view/`: existing content/placeholder screen for non-game cabinets
- `/retro-handheld/games/` and `/retro-arcade/games/`: game selection
- `/<game-cabinet>/games/<display-name-slug>/`: a published game
- `/links/view/`: Links battle screen; `/links/beach/`: beach gag

The existing cabinet URLs now show their green intro at the CRT camera pose.
Clicking the CRT opens content without another camera transition. Slugs use
lowercase words, hyphens and normalized accents. The public game links point to site routes; iframe sources remain the
original game files. Modified clicks and copying links retain native behavior.

A fresh deep entry seeds root and its actual ancestors before restoring the
requested view. History state identifies these entries, preventing duplicate
seeding on refresh. Back/Forward restores state without adding history. Site
"Back to Cabinet" controls traverse directly to the existing root entry, retaining
Forward. In-game "Back to Arcade" traverses to game selection. Browser Back
visits the meaningful intro, content, and game states. Root does not intercept
Back. Returning to root restores the resting carousel orientation.

## GitHub Pages

Run `node tools/generate-routes.cjs` when adding published games or changing route
definitions. It reads both game catalogs and generates `routes.js` plus small
`index.html` entry documents for each route. Commit those generated files.
Each entry uses `route-bootstrap.js` to load the single shared homepage shell
in place, preserving its deep URL. The shell's root `<base>` resolves existing
relative resources. Public URLs use a trailing slash to match GitHub Pages'
directory handling. This avoids a redirect on refresh that can discard browser
history state and cause duplicate parent seeding. Slashless shared links still
work through Pages' normal redirect. There is no
404 redirect, query-string state transport, or duplicated application markup.
Unknown routes retain GitHub Pages' normal 404 behavior. Privacy and Terms
remain independent documents.

## Verification

With Playwright available via `NODE_PATH`, serve the repository using
`node verification/serve.cjs`, then run:

```
node verification/direct-crt-check.cjs
node verification/routing-check.cjs
node verification/routing-edge-check.cjs
node verification/links-check.cjs
node verification/game-return-check.cjs
node verification/handheld-check.cjs
node verification/handheld-controls.cjs
node verification/handheld-fullscreen.cjs
node verification/arcade-additions-check.cjs
node verification/retro-arcade-check.cjs
```

Set `PREVIEW_URL` to the server root (or `https://lucidconfusion.gg/`) for tests
that support it. The older Retro Arcade and handheld controls suites default
to port 61863, so set it explicitly when using port 8771.
