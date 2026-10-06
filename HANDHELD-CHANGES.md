# Retro Handheld Arcade changes

Retro Handheld Arcade implementation and verification inventory. Original game folders were read only.

## Behavior

The first cabinet zoom shows the unaltered frame and only RETRO GAMES / < CLICK TO VIEW >. Activating the monitor opens the selection grid in the full CRT view. The catalog and thumbnails load only then. Only the selected game gets an iframe. Gameplay fills the browser content area, hiding the arcade frame, with the original game's proportional scaling intact. Back to Arcade exits fullscreen before destroying the iframe, stopping its audio and runtime, and restores the selection position. F toggles game-container fullscreen. Backspace returns except during text/initials entry and in Sewer Halo and The Nudibranch, whose Backspace controls remain reserved. Escape and double-clicks inside games are left to the original games; neither returns to the arcade.

All 20 portable builds are copied byte-for-byte. Titles come from their HTML titles; thumbnails match their embedded console art. Thumbnail payload totals 965 KiB. Pink Rampage retains its existing Three.js CDN dependency, loaded only on selection. No game mechanics, controls, graphics, music, audio, or internal scaling code was edited.

## Verification

- All 20 games launched and returned successfully on desktop and emulated touch/mobile.
- Request monitoring confirmed no catalog, thumbnails, or game resources before prompt activation; no game HTML before that specific selection.
- Correct game titles, decoded images, initialized canvases, and Pink Rampage 3D initialization checked.
- Frame aspect ratio, contained grid scrolling, no horizontal overflow, and unobstructed frame checked.
- Active-game resize checked at widths 320, 768, 844, and 1440.
- Button/Backspace return, fullscreen exit, iframe unloading, text-entry protection, double-click pass-through, and untouched game Escape checked.
- About Us, Contact Us (mocked submissions only), and original zoom/navigation desktop/touch regressions passed.
- No browser errors in those checks.
- About/Contact HTML sections, their styles and form code, Privacy and Terms are unchanged.
- Supplied frame and portable game bytes verified against source.

## Files changed (3)

- `arcade.js` — handheld-only screen, navigation, and focus integration.
- `.gitattributes` — preserve portable game bytes without line-ending conversion.
- `index.html` — handheld stylesheet and empty panel/frame containers.

## Files added (50)

- `HANDHELD-CHANGES.md`
- `HANDHELD-IMPORT.md`
- `handheld.css`
- `handheld.js`
- `tools/import-handhelds.cjs`
- `verification/handheld-check.cjs`
- `verification/handheld-controls.cjs`
- `verification/handheld-fullscreen.cjs`
- `assets/arcade/art/Retro Handheld Arcade.png`
- `assets/handhelds/catalog.json`
- `assets/handhelds/bungee-pug/index.html`
- `assets/handhelds/bungee-pug/thumbnail.webp`
- `assets/handhelds/chrome-possum/index.html`
- `assets/handhelds/chrome-possum/thumbnail.webp`
- `assets/handhelds/colonel-pool-noodle/index.html`
- `assets/handhelds/colonel-pool-noodle/thumbnail.webp`
- `assets/handhelds/dont-get-caught/index.html`
- `assets/handhelds/dont-get-caught/thumbnail.webp`
- `assets/handhelds/fructose/index.html`
- `assets/handhelds/fructose/thumbnail.webp`
- `assets/handhelds/gravy-knuckles/index.html`
- `assets/handhelds/gravy-knuckles/thumbnail.webp`
- `assets/handhelds/gutter-comet/index.html`
- `assets/handhelds/gutter-comet/thumbnail.webp`
- `assets/handhelds/lint-trap/index.html`
- `assets/handhelds/lint-trap/thumbnail.webp`
- `assets/handhelds/macrame/index.html`
- `assets/handhelds/macrame/thumbnail.webp`
- `assets/handhelds/night-pickle/index.html`
- `assets/handhelds/night-pickle/thumbnail.webp`
- `assets/handhelds/sewer-halo/index.html`
- `assets/handhelds/sewer-halo/thumbnail.webp`
- `assets/handhelds/slothman/index.html`
- `assets/handhelds/slothman/thumbnail.webp`
- `assets/handhelds/static-weasel/index.html`
- `assets/handhelds/static-weasel/thumbnail.webp`
- `assets/handhelds/super-sloth-man-2/index.html`
- `assets/handhelds/super-sloth-man-2/thumbnail.webp`
- `assets/handhelds/super-speed-sloth/index.html`
- `assets/handhelds/super-speed-sloth/thumbnail.webp`
- `assets/handhelds/tectonic-terry/index.html`
- `assets/handhelds/tectonic-terry/thumbnail.webp`
- `assets/handhelds/the-caulker/index.html`
- `assets/handhelds/the-caulker/thumbnail.webp`
- `assets/handhelds/the-circus/index.html`
- `assets/handhelds/the-circus/thumbnail.webp`
- `assets/handhelds/the-moss-hammer/index.html`
- `assets/handhelds/the-moss-hammer/thumbnail.webp`
- `assets/handhelds/the-nudibranch/index.html`
- `assets/handhelds/the-nudibranch/thumbnail.webp`

## Import maintenance

With Node.js and sharp available, run `node tools/import-handhelds.cjs <source-directory>` to scan finished portable builds and regenerate the catalog, thumbnails, and source-hash inventory. Original source files are never written. The website uses relative URLs and requires no build server. Run `node verification/serve.cjs`, then `node verification/handheld-check.cjs <optional-screenshot-directory>` with Playwright available to repeat local checks.
